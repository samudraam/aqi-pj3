// ParticlesSketch2.tsx
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import p5 from "p5";
import { useCity } from "../../../providers/use-city";

const disableP5FriendlyErrors = () => {
  (p5 as unknown as { disableFriendlyErrors?: boolean }).disableFriendlyErrors =
    true;

  if (typeof window !== "undefined") {
    window.p5 = window.p5 || {};
    window.p5.disableFriendlyErrors = true;
  }
};

disableP5FriendlyErrors();

// Tell TS about the globals we expect after loading MediaPipe scripts
interface FaceMeshConfig {
  locateFile: (file: string) => string;
}

interface FaceMeshOptions {
  maxNumFaces: number;
  refineLandmarks: boolean;
  minDetectionConfidence: number;
  minTrackingConfidence: number;
}

interface FaceLandmark {
  x: number;
  y: number;
  z: number;
}

interface FaceMeshResults {
  multiFaceLandmarks?: FaceLandmark[][];
}

interface FaceMeshInstance {
  setOptions: (options: FaceMeshOptions) => void;
  onResults: (callback: (results: FaceMeshResults) => void) => void;
  send: (data: { image: HTMLVideoElement }) => Promise<void>;
}

interface CameraConfig {
  onFrame: () => Promise<void>;
  width: number;
  height: number;
}

interface CameraInstance {
  start: () => Promise<void>;
  stop?: () => void;
}

declare global {
  interface Window {
    FaceMesh?: new (config: FaceMeshConfig) => FaceMeshInstance;
    Camera?: new (
      video: HTMLVideoElement,
      config: CameraConfig
    ) => CameraInstance;
    p5?: {
      disableFriendlyErrors?: boolean;
    };
  }
}

const POLLUTANT_KEYS = ["o3", "pm2_5", "pm10", "co", "no2"] as const;
type PollutantKey = (typeof POLLUTANT_KEYS)[number];

const POLLUTANT_IMAGE_URLS: Record<PollutantKey, string> = {
  o3: `${import.meta.env.BASE_URL}particles_O3.png`,
  pm2_5: `${import.meta.env.BASE_URL}particles_PM2.5.png`,
  pm10: `${import.meta.env.BASE_URL}particles_PM10.png`,
  co: `${import.meta.env.BASE_URL}particles-C02.png`, // make sure this matches the filename
  no2: `${import.meta.env.BASE_URL}particles-NO2.png`,
};

const POL_COLORS: Record<PollutantKey, string> = {
  o3: "#a3be8c",
  pm2_5: "#ebcb8b",
  pm10: "#e6b8ff",
  co: "#88c0d0",
  no2: "#bf616a",
};

const AQI_PALETTES: Record<number, string[]> = {
  1: ["#7ef9a3", "#66e592", "#4fd380", "#3bbf70", "#2aa65c"],
  2: ["#a6f08e", "#dbf76a", "#a1e87a", "#8bd66a", "#72c15a"],
  3: ["#ffe27a", "#ffd25a", "#ffbf3a", "#f9a825", "#f39c12"],
  4: ["#ffb36b", "#ff8f5a", "#ff7043", "#ff5e57", "#ff4d4d"],
  5: ["#ff8a80", "#ff5252", "#ff1744", "#d50000", "#a30000"],
};

interface MouthState {
  x: number | null;
  y: number | null;
  open: boolean;
  normOpen: number;
  _vx: number | null;
  _vy: number | null;
}

class ParticleShape {
  pos: p5.Vector;
  size: number;
  noiseOffset: p5.Vector;
  pollutant: PollutantKey;
  baseCol: p5.Color;
  alpha: number;
  rot: number;
  rotSpeed: number;

  constructor(
    s: p5,
    x: number,
    y: number,
    size: number,
    pollutantKey: PollutantKey,
    aqiTint: p5.Color,
    polNorm: Record<PollutantKey, number>,
    effectStrength: number
  ) {
    this.pos = s.createVector(x, y);
    this.size = size;
    this.noiseOffset = s.createVector(s.random(1000), s.random(1000));
    this.pollutant = pollutantKey;
    this.baseCol = aqiTint;

    const norm = polNorm[this.pollutant] ?? 0.5;
    this.alpha = 160 + 80 * norm;
    this.rot = s.random(s.TWO_PI);
    this.rotSpeed = s.random(-0.01, 0.01) * (0.4 + effectStrength);
  }

  update(
    s: p5,
    polCenters: Record<PollutantKey, p5.Vector>,
    noiseScale: number,
    effectStrength: number
  ) {
    const noiseX = s.noise(this.noiseOffset.x) * s.TWO_PI * 2;
    const noiseY = s.noise(this.noiseOffset.y) * s.TWO_PI * 2;
    const speed = s.lerp(0.6, 2.2, effectStrength);

    this.pos.x += Math.cos(noiseX) * speed;
    this.pos.y += Math.sin(noiseY) * speed;

    const center = polCenters[this.pollutant];
    if (center) {
      const v = p5.Vector.sub(center, this.pos);
      const distMag = Math.max(1, v.mag());
      v.setMag(
        s.lerp(0.02, 0.18, effectStrength) * (Math.min(300, distMag) / 300)
      );
      this.pos.add(v);
    }

    this.pos.x = (this.pos.x + s.width) % s.width;
    this.pos.y = (this.pos.y + s.height) % s.height;

    this.noiseOffset.x += noiseScale;
    this.noiseOffset.y += noiseScale;

    this.rot += this.rotSpeed;
  }

  display(
    s: p5,
    images: Record<PollutantKey, p5.Image | undefined>,
    effectStrength: number
  ) {
    const n = s.noise(this.noiseOffset.x * 0.7 + this.noiseOffset.y * 0.3);
    const sz = this.size + n * 10 * (0.5 + effectStrength);
    const img = images[this.pollutant];

    if (img) {
      s.push();
      s.translate(this.pos.x, this.pos.y);
      s.rotate(this.rot);
      s.tint(255, this.alpha);
      s.image(img, 0, 0, sz, sz);
      s.pop();
    } else {
      const c = s.color(POL_COLORS[this.pollutant]);
      s.fill(s.red(c), s.green(c), s.blue(c), this.alpha);
      s.ellipse(this.pos.x, this.pos.y, sz, sz);
    }
  }
}

interface ParticlesSketch2Props {
  showControls?: boolean;
}

const ParticlesSketch2 = ({ showControls = true }: ParticlesSketch2Props) => {
  const {
    airQualityDetails,
    fetchCityAirQuality,
    cityQuery,
    resetCity,
    isFetching,
  } = useCity();

  const sketchRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [mediaPipeLoaded, setMediaPipeLoaded] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cityInput, setCityInput] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setCityInput(cityQuery);
  }, [cityQuery]);

  const handleFetchCity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = cityInput.trim();
    if (!trimmed) {
      setStatusMessage("Enter a city name to load air-quality data.");
      return;
    }
    setStatusMessage("Fetching air quality data...");
    const result = await fetchCityAirQuality(trimmed);
    if (!result.success) {
      setStatusMessage(result.error);
      return;
    }
    setStatusMessage(`Loaded data for ${trimmed}.`);
  };

  const handleResetCity = () => {
    resetCity();
    setCityInput("");
    setStatusMessage(null);
  };

  /** Dynamically load MediaPipe scripts once */
  useEffect(() => {
    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(script);
      });

    (async () => {
      try {
        await loadScript(
          "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/face_mesh.js"
        );
        await loadScript(
          "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js"
        );
        setMediaPipeLoaded(true);
      } catch (err) {
        console.error("Failed to load MediaPipe", err);
        setCameraError("Failed to load face tracking library.");
      }
    })();
  }, []);

  /** Main p5 sketch */
  useEffect(() => {
    if (!sketchRef.current || !mediaPipeLoaded || !airQualityDetails) return;

    let sketchInstance: p5 | null = null;
    let cameraStopFn: (() => void) | null = null;

    const sketch = (s: p5) => {
      // --- State ---
      let shapes: ParticleShape[] = [];
      const noiseScale = 0.02;

      let cam: p5.Element | p5.MediaElement | null = null;
      let camReady = false;

      // Pull from context
      const aqi = airQualityDetails.aqi ?? 3;
      const effectStrength = airQualityDetails.effectStrength ?? 0.4;
      const targetCount = airQualityDetails.targetCount ?? 120;

      const components = airQualityDetails.components ?? {
        o3: 0,
        pm2_5: 0,
        pm10: 0,
        co: 0,
        no2: 0,
      };

      // Pollutant state
      const polNorm: Record<PollutantKey, number> = {
        o3: 0.5,
        pm2_5: 0.5,
        pm10: 0.5,
        co: 0.5,
        no2: 0.5,
      };
      const polAlloc: Record<PollutantKey, number> = {
        o3: 0,
        pm2_5: 0,
        pm10: 0,
        co: 0,
        no2: 0,
      };
      const polCenters: Record<PollutantKey, p5.Vector> = {
        o3: s.createVector(),
        pm2_5: s.createVector(),
        pm10: s.createVector(),
        co: s.createVector(),
        no2: s.createVector(),
      };

      // Mouth tracking
      const mouth: MouthState = {
        x: null,
        y: null,
        open: false,
        normOpen: 0,
        _vx: null,
        _vy: null,
      };
      let vortexAngle = 0;
      let vortexMomentum = 0;

      const UPPER_LIP = 13;
      const LOWER_LIP = 14;
      const CHIN = 152;
      const FOREHEAD = 10;

      // --- Helpers ---
      const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

      const pickColorForAQI = (): p5.Color => {
        const tier = aqi ?? 3;
        const arr = AQI_PALETTES[tier] || AQI_PALETTES[3];
        const colorStr = arr[Math.floor(Math.random() * arr.length)];
        return s.color(colorStr);
      };

      /** Cluster centers in a circle */
      const computeClusterCenters = () => {
        const cx = s.width / 2;
        const cy = s.height / 2;
        const radius = Math.min(s.width, s.height) * 0.28;
        const n = POLLUTANT_KEYS.length;

        for (let i = 0; i < n; i++) {
          const angle = (i / n) * s.TWO_PI - s.HALF_PI;
          const key = POLLUTANT_KEYS[i];
          polCenters[key] = s.createVector(
            cx + radius * Math.cos(angle),
            cy + radius * Math.sin(angle)
          );
        }
      };

      /** Normalize components and allocate particle counts */
      const computePollutantAllocations = () => {
        const vals = POLLUTANT_KEYS.map((k) => Math.max(0, components[k] ?? 0));
        const maxv = Math.max(1e-6, ...vals);

        // Normalize
        POLLUTANT_KEYS.forEach((k, i) => {
          polNorm[k] = vals[i] / maxv;
        });

        const sum = vals.reduce((a, b) => a + b, 0);
        let rawShares: number[];

        if (sum <= 1e-9) {
          rawShares = POLLUTANT_KEYS.map(
            () => targetCount / POLLUTANT_KEYS.length
          );
        } else {
          rawShares = vals.map((v) => (v / sum) * targetCount);
        }

        const ints = rawShares.map(Math.floor);
        const remainder = targetCount - ints.reduce((a, b) => a + b, 0);
        const fracs = rawShares
          .map((v, i) => ({ i, f: v - ints[i] }))
          .sort((a, b) => b.f - a.f);

        for (let r = 0; r < remainder; r++) {
          ints[fracs[r].i]++;
        }

        POLLUTANT_KEYS.forEach((k, i) => {
          polAlloc[k] = ints[i];
        });
      };

      /** Initialize shape list from AQI + components */
      const applyAQIToScene = () => {
        shapes = [];
        const tintCol = pickColorForAQI();

        for (const k of POLLUTANT_KEYS) {
          const count = polAlloc[k] || 0;
          const norm = polNorm[k] ?? 0.5;

          for (let i = 0; i < count; i++) {
            const sh = new ParticleShape(
              s,
              s.random(s.width),
              s.random(s.height),
              s.random(18 + 10 * norm, 56 + 16 * norm),
              k,
              tintCol,
              polNorm,
              effectStrength
            );
            shapes.push(sh);
          }
        }
      };

      const dist2D = (
        a: { x: number; y: number },
        b: { x: number; y: number }
      ) => {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.hypot(dx, dy);
      };

      /** Vortex overlay */
      const drawVortexOverlay = () => {
        if (mouth.open) {
          vortexMomentum = Math.min(
            1,
            vortexMomentum + 0.08 * mouth.normOpen + 0.02
          );
        } else {
          vortexMomentum *= 0.92;
        }

        vortexAngle += 0.06 * vortexMomentum;
        if (!mouth.x || !mouth.y || vortexMomentum < 0.02) return;

        const ctx = s.drawingContext as CanvasRenderingContext2D;
        const prevOp = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = "screen";

        const baseR = s.lerp(80, 220, effectStrength);
        const openMul = s.lerp(0.65, 1.4, clamp01(mouth.normOpen));
        const R = baseR * openMul;

        const arms = 14;
        const pointsPerArm = 60;
        const thicknessBase = s.lerp(8, 18, vortexMomentum);
        const cx = mouth.x;
        const cy = mouth.y;

        const curveVertexFn = (
          s as unknown as {
            curveVertex?: ((x: number, y: number) => void) | undefined;
          }
        ).curveVertex;
        const pushVertex =
          typeof curveVertexFn === "function"
            ? (x: number, y: number) => curveVertexFn.call(s, x, y)
            : (x: number, y: number) => s.vertex(x, y);

        s.push();
        s.translate(cx, cy);
        s.noFill();

        for (let a = 0; a < arms; a++) {
          const armAngle = vortexAngle + (a / arms) * s.TWO_PI;
          const col = s.lerpColor(
            s.color("#66d9ff"),
            s.color("#ffffff"),
            0.35 + 0.65 * (a / arms)
          );
          const alpha = 12 + 40 * (1 - a / arms);
          s.stroke(s.red(col), s.green(col), s.blue(col), alpha);

          s.beginShape();
          for (let i = 0; i < pointsPerArm; i++) {
            const t = i / (pointsPerArm - 1);
            const rad = R * t;
            const swirl = armAngle + t * (2.5 * vortexMomentum + 0.6);
            const x = Math.cos(swirl) * rad;
            const y = Math.sin(swirl) * rad;
            s.strokeWeight(Math.max(1, thicknessBase * (1.0 - t)));
            pushVertex(x, y);
          }
          s.endShape();
        }

        s.pop();
        ctx.globalCompositeOperation = prevOp;
      };

      /** Face tracking setup (MediaPipe) */
      const setupFaceTracking = () => {
        if (!videoRef.current || !window.FaceMesh || !window.Camera) return;

        const videoElement = videoRef.current;
        const FaceMesh = window.FaceMesh;
        const Camera = window.Camera;

        const faceMesh = new FaceMesh({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults((results: FaceMeshResults) => {
          if (
            !results.multiFaceLandmarks ||
            results.multiFaceLandmarks.length === 0
          ) {
            mouth.open = false;
            mouth.x = mouth.y = null;
            return;
          }

          const lm = results.multiFaceLandmarks[0];
          const cx = (lm[UPPER_LIP].x + lm[LOWER_LIP].x) / 2;
          const cy = (lm[UPPER_LIP].y + lm[LOWER_LIP].y) / 2;
          const fh = dist2D(lm[FOREHEAD], lm[CHIN]);
          const openNorm =
            dist2D(lm[UPPER_LIP], lm[LOWER_LIP]) / Math.max(fh, 1e-6);

          mouth._vx = 1 - cx;
          mouth._vy = cy;
          mouth.normOpen = clamp01(openNorm);
          mouth.open = openNorm > 0.065;
        });

        const camera = new Camera(videoElement, {
          onFrame: async () => {
            await faceMesh.send({ image: videoElement });
          },
          width: 640,
          height: 480,
        });

        camera
          .start()
          .then(() => {
            cameraStopFn = () => {
              if (camera.stop) {
                camera.stop();
              }
            };
          })
          .catch((err: Error) => {
            console.error("Camera start error:", err);
            setCameraError("Failed to start camera.");
          });
      };

      // --- p5 lifecycle ---
      // Images
      const IMG: Record<PollutantKey, p5.Image | undefined> = {
        o3: undefined,
        pm2_5: undefined,
        pm10: undefined,
        co: undefined,
        no2: undefined,
      };
      let imagesLoaded = false; // add this near IMG
      let imagesToLoad = POLLUTANT_KEYS.length;

      s.setup = () => {
        s.createCanvas(s.windowWidth, s.windowHeight);
        s.imageMode(s.CENTER);
        s.noStroke();

        // --- load images here instead of preload ---
        POLLUTANT_KEYS.forEach((key) => {
          const url = POLLUTANT_IMAGE_URLS[key];
          console.log("loading", key, url);
          s.loadImage(
            url,
            (img) => {
              IMG[key] = img;
              imagesToLoad--;
              console.log("loaded", key, url);
              if (imagesToLoad === 0) {
                imagesLoaded = true;
                console.log("ALL IMAGES LOADED", IMG);
              }
            },
            (err) => {
              imagesToLoad--;
              console.error("failed to load", key, url, err);
            }
          );
        });

        cam = s.createCapture("video");
        (cam as p5.MediaElement).size(s.windowWidth, s.windowHeight);
        (cam as p5.Element).hide();

        computeClusterCenters();
        computePollutantAllocations();
        applyAQIToScene();
        setupFaceTracking();

        camReady = true;
      };

      s.draw = () => {
        if (s.frameCount === 1 || s.frameCount === 30) {
          console.log("IMG in draw", IMG, "imagesLoaded:", imagesLoaded);
        }
        if (!camReady || !cam) {
          s.background(20);
          return;
        }
        // Webcam background mirrored
        s.push();
        s.translate(s.width, 0);
        s.scale(-1, 1);
        s.image(
          cam as p5.MediaElement,
          s.width / 2,
          s.height / 2,
          s.width,
          s.height
        );
        s.pop();

        if (mouth._vx !== null && mouth._vy !== null) {
          mouth.x = mouth._vx * s.width;
          mouth.y = mouth._vy * s.height;
        }

        const openScale = clamp01(mouth.normOpen || 0);

        for (let i = shapes.length - 1; i >= 0; i--) {
          const sh = shapes[i];
          sh.update(s, polCenters, noiseScale, effectStrength);

          if (mouth.open && mouth.x !== null && mouth.y !== null) {
            const d = s.dist(sh.pos.x, sh.pos.y, mouth.x, mouth.y);
            const maxInfluence =
              s.lerp(120, 280, effectStrength) * s.lerp(0.7, 1.4, openScale);

            if (d < maxInfluence) {
              const dir = p5.Vector.sub(
                s.createVector(mouth.x, mouth.y),
                sh.pos
              );
              dir.setMag(s.lerp(0.6, 3.6, effectStrength * openScale));
              sh.pos.add(dir);

              const close = d < 30;
              sh.alpha = Math.max(0, sh.alpha - (close ? 20 : 8));
              sh.size = Math.max(0, sh.size - (close ? 2.5 : 0.7));

              if (d < 12 || sh.alpha <= 0 || sh.size <= 0.5) {
                shapes.splice(i, 1);
                continue;
              }
            }
          }

          sh.display(s, IMG, effectStrength);
        }

        // Top up to targetCount
        if (s.frameCount % 6 === 0 && shapes.length < targetCount) {
          const total = Math.max(
            1,
            Object.values(polAlloc).reduce((a, b) => a + b, 0)
          );
          let pick = Math.floor(s.random(total));
          let chosen: PollutantKey = "o3";

          for (const k of POLLUTANT_KEYS) {
            const c = polAlloc[k] || 0;
            if (pick < c) {
              chosen = k;
              break;
            }
            pick -= c;
          }

          const norm = polNorm[chosen] ?? 0.5;
          const tintCol = pickColorForAQI();

          const newShape = new ParticleShape(
            s,
            s.random(s.width),
            s.random(s.height),
            s.random(10 + 8 * norm, 50 + 12 * norm),
            chosen,
            tintCol,
            polNorm,
            effectStrength
          );
          shapes.push(newShape);
        }

        drawVortexOverlay();
      };

      s.windowResized = () => {
        s.resizeCanvas(s.windowWidth, s.windowHeight);
        if (cam) {
          (cam as p5.MediaElement).size(s.windowWidth, s.windowHeight);
        }
        computeClusterCenters();
      };
    };

    sketchInstance = new p5(sketch, sketchRef.current);

    return () => {
      if (sketchInstance) {
        sketchInstance.remove();
      }
      if (cameraStopFn) {
        cameraStopFn();
      }
    };
  }, [airQualityDetails, mediaPipeLoaded]);

  return (
    <>
      <video
        ref={videoRef}
        style={{ display: "none" }}
        playsInline
        autoPlay
        muted
      />
      <div
        ref={sketchRef}
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none", // let clicks pass through if you want
        }}
      />
      {showControls && (
        <div
          style={{
            position: "fixed",
            top: "1rem",
            left: "1rem",
            width: "min(360px, calc(100vw - 2rem))",
            background: "rgba(6, 12, 30, 0.78)",
            color: "#f0f4f8",
            padding: "1rem",
            borderRadius: "0.75rem",
            pointerEvents: "auto",
            zIndex: 12,
            boxShadow: "0 12px 35px rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
          }}
        >
          <form
            onSubmit={handleFetchCity}
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <label
              htmlFor="city-context-input"
              style={{ fontSize: "0.85rem", letterSpacing: "0.04em" }}
            >
              Set city context
            </label>
            <input
              id="city-context-input"
              type="text"
              placeholder="e.g. Los Angeles"
              value={cityInput}
              onChange={(event) => setCityInput(event.target.value)}
              style={{
                borderRadius: "0.5rem",
                border: "1px solid rgba(255,255,255,0.25)",
                padding: "0.5rem 0.75rem",
                fontSize: "1rem",
                background: "rgba(255,255,255,0.08)",
                color: "#f0f4f8",
              }}
            />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="submit"
                disabled={isFetching}
                style={{
                  flex: 1,
                  border: "none",
                  borderRadius: "0.5rem",
                  padding: "0.45rem 0.75rem",
                  fontWeight: 600,
                  background: "#3b82f6",
                  color: "#ffffff",
                  cursor: isFetching ? "not-allowed" : "pointer",
                  opacity: isFetching ? 0.7 : 1,
                }}
              >
                {isFetching ? "Loading…" : "Load city"}
              </button>
              <button
                type="button"
                onClick={handleResetCity}
                disabled={isFetching && !airQualityDetails}
                style={{
                  flex: 0.8,
                  border: "1px solid rgba(255,255,255,0.35)",
                  borderRadius: "0.5rem",
                  padding: "0.45rem 0.75rem",
                  background: "transparent",
                  color: "#f0f4f8",
                  cursor:
                    isFetching && !airQualityDetails
                      ? "not-allowed"
                      : "pointer",
                  opacity: isFetching && !airQualityDetails ? 0.6 : 1,
                }}
              >
                Clear
              </button>
            </div>
          </form>
          {(statusMessage || isFetching) && (
            <p
              style={{
                marginTop: "0.5rem",
                fontSize: "0.85rem",
                color: "#cbd5f5",
              }}
            >
              {isFetching ? "Fetching latest data…" : statusMessage}
            </p>
          )}
          <div style={{ marginTop: "0.75rem", fontSize: "0.85rem" }}>
            <strong style={{ fontSize: "0.9rem", letterSpacing: "0.05em" }}>
              City context
            </strong>
            {airQualityDetails ? (
              <>
                <div style={{ marginTop: "0.35rem" }}>
                  <span style={{ color: "#9fb5ff" }}>City:</span>{" "}
                  {airQualityDetails.cityName}
                </div>
                <div>
                  <span style={{ color: "#9fb5ff" }}>Region:</span>{" "}
                  {[airQualityDetails.state, airQualityDetails.country]
                    .filter(Boolean)
                    .join(", ") || "N/A"}
                </div>
                <div>
                  <span style={{ color: "#9fb5ff" }}>AQI:</span>{" "}
                  {airQualityDetails.aqi ?? "N/A"} ({airQualityDetails.aqiLabel}
                  )
                </div>
                <div>
                  <span style={{ color: "#9fb5ff" }}>Particles:</span>{" "}
                  {airQualityDetails.targetCount}
                </div>
                <div>
                  <span style={{ color: "#9fb5ff" }}>Coords:</span>{" "}
                  {airQualityDetails.latitude.toFixed(2)},{" "}
                  {airQualityDetails.longitude.toFixed(2)}
                </div>
                <div
                  style={{
                    marginTop: "0.6rem",
                    padding: "0.5rem",
                    borderRadius: "0.5rem",
                    background: "rgba(255,255,255,0.05)",
                    maxHeight: "180px",
                    overflow: "auto",
                  }}
                >
                  <pre
                    style={{
                      margin: 0,
                      fontSize: "0.75rem",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontFamily:
                        '"JetBrains Mono", "Fira Code", "SFMono-Regular", monospace',
                    }}
                  >
                    {JSON.stringify(airQualityDetails, null, 2)}
                  </pre>
                </div>
              </>
            ) : (
              <p style={{ marginTop: "0.35rem", color: "#cbd5f5" }}>
                Load a city to display the sketch context.
              </p>
            )}
          </div>
        </div>
      )}
      {cameraError && (
        <div
          style={{
            position: "fixed",
            inset: "50% auto auto 50%",
            transform: "translate(-50%, -50%)",
            color: "#ff6b6b",
            background: "rgba(0,0,0,0.75)",
            padding: "1.5rem 2rem",
            borderRadius: "0.75rem",
            zIndex: 10,
          }}
        >
          {cameraError}
        </div>
      )}
      {showControls && !airQualityDetails && !cameraError && (
        <div
          style={{
            position: "fixed",
            inset: "50% auto auto 50%",
            transform: "translate(-50%, -50%)",
            color: "#ffffff",
            background: "rgba(0,0,0,0.75)",
            padding: "1.5rem 2rem",
            borderRadius: "0.75rem",
            zIndex: 10,
          }}
        >
          Search for a city to see air-quality particles.
        </div>
      )}
    </>
  );
};

export default ParticlesSketch2;
