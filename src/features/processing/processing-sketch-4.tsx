import { useEffect, useMemo, useRef, useState } from "react";
import p5 from "p5";
import { useCity } from "../../providers/use-city";

interface Particle {
  x: number;
  y: number;
  noiseOffsetX: number;
  noiseOffsetY: number;
  size: number;
  brightness: number;
}

interface SketchConfig {
  particleCount: number;
  particleSpeed: number;
  particleBrightness: number;
  particleSize: number;
  blurRadius: number;
}

const MIN_BLUR_RADIUS = 2;
const MAX_BLUR_RADIUS = 18;
const SWIPE_RADIUS = 140;
const SWIPE_STRENGTH = 6;
const SWIPE_DECAY_MS = 240;
const SWIPE_SPEED_SCALE = 22;
const SWIPE_MIN_DELTA = 1.5;

/**
 * WebGL frosted glass camera effect with AQI-driven particles.
 */
const ProcessingSketch2 = () => {
  const sketchRef = useRef<HTMLDivElement | null>(null);
  const { airQualityDetails } = useCity();
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sketchInstanceRef = useRef<p5 | null>(null);
  const cameraCaptureRef = useRef<p5.Element | p5.MediaElement | null>(null);
  const cameraElementRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const metadataCleanupRef = useRef<(() => void) | null>(null);

  const sketchConfig = useMemo<SketchConfig>(() => {
    const defaultConfig: SketchConfig = {
      particleCount: 150,
      particleSpeed: 0.15,
      particleBrightness: 1,
      particleSize: 2.5,
      blurRadius: (MIN_BLUR_RADIUS + MAX_BLUR_RADIUS) / 2,
    };

    if (!airQualityDetails) {
      return defaultConfig;
    }

    const { effectStrength, targetCount, visibility } = airQualityDetails;
    console.log(airQualityDetails, "visibility", visibility);
    const strength = Number.isFinite(effectStrength)
      ? Math.min(Math.max(effectStrength, 0), 1)
      : 0.3;

    // Calculate blur radius based on visibility (inverse relationship: lower visibility = more blur)
    // Visibility range: 0-10000 meters (0 = very poor, 10000+ = excellent)
    let blurRadius = (MIN_BLUR_RADIUS + MAX_BLUR_RADIUS) / 2; // Default fallback
    if (
      typeof visibility === "number" &&
      Number.isFinite(visibility) &&
      visibility >= 0
    ) {
      // Clamp visibility to reasonable range (0-10000)
      const clampedVisibility = Math.min(Math.max(visibility, 0), 10000);
      // Inverse mapping: lower visibility → higher blur
      const visibilityRatio = clampedVisibility / 10000;
      blurRadius =
        MAX_BLUR_RADIUS - visibilityRatio * (MAX_BLUR_RADIUS - MIN_BLUR_RADIUS);
    }

    const particleCount = Math.min(
      180,
      Math.max(50, Math.round(targetCount ?? 150))
    );
    const particleSpeed = 0.05 + strength * 0.35;
    const particleBrightness = 0.5 + strength * 0.7;
    const particleSize = 4.5 + strength * 3.0;

    return {
      particleCount,
      particleSpeed,
      particleBrightness,
      particleSize,
      blurRadius,
    };
  }, [airQualityDetails]);

  useEffect(() => {
    let isEffectCancelled = false;

    const releaseResources = () => {
      if (sketchInstanceRef.current) {
        sketchInstanceRef.current.remove();
        sketchInstanceRef.current = null;
      }
      if (cameraCaptureRef.current) {
        cameraCaptureRef.current.remove();
        cameraCaptureRef.current = null;
      }
      if (metadataCleanupRef.current) {
        metadataCleanupRef.current();
        metadataCleanupRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        mediaStreamRef.current = null;
      }
      if (cameraElementRef.current) {
        cameraElementRef.current.srcObject = null;
        cameraElementRef.current = null;
      }
    };

    releaseResources();
    setCameraError(null);

    if (!sketchRef.current || !airQualityDetails) {
      setIsLoading(true);
      return () => {
        isEffectCancelled = true;
        releaseResources();
      };
    }

    setIsLoading(true);

    // Small delay to ensure DOM is fully ready after route transition
    const initTimeout = setTimeout(() => {
      if (isEffectCancelled || !sketchRef.current) {
        return;
      }

      const sketch = (s: p5) => {
        const DOWNSAMPLE = 2;
        const REFRACT_AMT = 0.5;
        const GRAIN_AMT = 0;
        const DESAT_AMT = 0.2;
        const blurRadius = sketchConfig.blurRadius;
        // comment out brush size and strength
        // const BRUSH_SIZE = 80;
        // const BRUSH_STRENGTH = 0.3;

        let cam: p5.MediaElement | null = null;
        let camReady = false;
        let camWidth = 640;
        let camHeight = 480;
        let pgLowA: p5.Graphics | null = null;
        let pgLowB: p5.Graphics | null = null;
        let pgTemp: p5.Graphics | null = null;
        let maskG: p5.Graphics | null = null;
        let lowResW: number;
        let lowResH: number;

        let copyShader: p5.Shader;
        let blurHShader: p5.Shader;
        let blurVShader: p5.Shader;
        let compositeShader: p5.Shader;
        let particleShader: p5.Shader;

        let particles: Particle[] = [];
        const pointerTrail: Array<{
          x: number;
          y: number;
          dx: number;
          dy: number;
          t: number;
        }> = [];
        let lastPointer: {
          x: number;
          y: number;
        } | null = null;

        const initParticles = () => {
          particles = [];
          const count = sketchConfig.particleCount;
          for (let i = 0; i < count; i += 1) {
            particles.push({
              x: s.random(s.width),
              y: s.random(s.height),
              noiseOffsetX: s.random(1000),
              noiseOffsetY: s.random(1000),
              size: s.random(0.8, 1.5) * sketchConfig.particleSize,
              brightness: s.random(0.6, 1.0) * sketchConfig.particleBrightness,
            });
          }
        };

        const applySwipeForce = (p: Particle, now: number) => {
          if (pointerTrail.length === 0) {
            return;
          }

          let fx = 0;
          let fy = 0;
          for (let i = pointerTrail.length - 1; i >= 0; i -= 1) {
            const trail = pointerTrail[i];
            if (now - trail.t > SWIPE_DECAY_MS) {
              continue;
            }

            const dx = p.x - trail.x;
            const dy = p.y - trail.y;
            const distSq = dx * dx + dy * dy;
            if (distSq <= 0 || distSq > SWIPE_RADIUS * SWIPE_RADIUS) {
              continue;
            }

            const dist = Math.sqrt(distSq);
            const falloff = 1 - dist / SWIPE_RADIUS;
            const speed = Math.min(
              Math.sqrt(trail.dx * trail.dx + trail.dy * trail.dy) /
                SWIPE_SPEED_SCALE,
              1
            );
            const magnitude = SWIPE_STRENGTH * speed * falloff * falloff;
            const invDist = 1 / dist;
            fx += dx * invDist * magnitude;
            fy += dy * invDist * magnitude;
          }

          p.x += fx;
          p.y += fy;
        };

        const updateParticles = () => {
          const time = s.millis() / 1000.0;
          const now = s.millis();
          while (
            pointerTrail.length > 0 &&
            now - pointerTrail[0].t > SWIPE_DECAY_MS
          ) {
            pointerTrail.shift();
          }

          for (const p of particles) {
            const noiseX = s.noise(
              p.noiseOffsetX + time * sketchConfig.particleSpeed
            );
            const noiseY = s.noise(
              p.noiseOffsetY + time * sketchConfig.particleSpeed
            );
            const vx = (noiseX - 0.5) * 2.0;
            const vy = (noiseY - 0.5) * 2.0;
            p.x += vx * 0.5;
            p.y += vy * 0.5;
            applySwipeForce(p, now);
            if (p.x < 0) p.x = s.width;
            if (p.x > s.width) p.x = 0;
            if (p.y < 0) p.y = s.height;
            if (p.y > s.height) p.y = 0;
          }
        };

        const setupCamera = () => {
          try {
            const capture = s.createCapture("video") as p5.MediaElement;
            cam = capture;
            cameraCaptureRef.current = capture;

            const videoElement = capture.elt as HTMLVideoElement;
            cameraElementRef.current = videoElement;

            const syncCameraDimensions = () => {
              const intrinsicWidth = videoElement.videoWidth;
              const intrinsicHeight = videoElement.videoHeight;
              if (intrinsicWidth > 0 && intrinsicHeight > 0) {
                camWidth = intrinsicWidth;
                camHeight = intrinsicHeight;
                return;
              }

              const fallbackWidth = videoElement.width;
              const fallbackHeight = videoElement.height;
              if (fallbackWidth > 0 && fallbackHeight > 0) {
                camWidth = fallbackWidth;
                camHeight = fallbackHeight;
              }
            };

            syncCameraDimensions();

            const initialStream = videoElement.srcObject;
            if (initialStream instanceof MediaStream) {
              mediaStreamRef.current = initialStream;
            }

            const handleLoadedMetadata = () => {
              if (isEffectCancelled) {
                return;
              }
              syncCameraDimensions();
              camReady = true;
              setIsLoading(false);
              const stream = videoElement.srcObject;
              if (stream instanceof MediaStream) {
                mediaStreamRef.current = stream;
              }
            };

            videoElement.addEventListener(
              "loadedmetadata",
              handleLoadedMetadata
            );
            metadataCleanupRef.current = () => {
              videoElement.removeEventListener(
                "loadedmetadata",
                handleLoadedMetadata
              );
            };

            videoElement.setAttribute("playsinline", "");
            videoElement.muted = true;
            capture.hide();
          } catch (error) {
            console.error("Camera setup error:", error);
            if (!isEffectCancelled) {
              setCameraError("Failed to start camera.");
              setIsLoading(false);
            }
          }
        };

        const resetMask = () => {
          if (!maskG) {
            return;
          }
          maskG.background(255);
        };

        // comment out paining
        // const paintReveal = (x: number, y: number) => {
        //   maskG.push();
        //   maskG.noStroke();
        //   maskG.fill(0, 0, 0, BRUSH_STRENGTH * 255);
        //   maskG.circle(x, y, BRUSH_SIZE);
        //   maskG.pop();
        // };

        const compileShaders = () => {
          const vertSrc = `
          attribute vec3 aPosition;
          attribute vec2 aTexCoord;
          varying vec2 vTexCoord;
          
          void main() {
            vTexCoord = aTexCoord;
            vec4 positionVec4 = vec4(aPosition, 1.0);
            positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
            gl_Position = positionVec4;
          }
        `;

          const copySrc = `
          precision highp float;
          varying vec2 vTexCoord;
          uniform sampler2D tex;
          uniform vec2 camResolution;
          uniform vec2 outputResolution;

          vec2 coverUV(vec2 uv, vec2 srcResolution, vec2 dstResolution) {
            float srcAspect = srcResolution.x / max(srcResolution.y, 0.0001);
            float dstAspect = dstResolution.x / max(dstResolution.y, 0.0001);
            vec2 mapped = uv;

            if (dstAspect > srcAspect) {
              float scale = srcAspect / dstAspect;
              float offset = (1.0 - scale) * 0.5;
              mapped.y = mapped.y * scale + offset;
            } else {
              float scale = dstAspect / srcAspect;
              float offset = (1.0 - scale) * 0.5;
              mapped.x = mapped.x * scale + offset;
            }

            return mapped;
          }
          
          void main() {
            vec2 uv = vec2(1.0 - vTexCoord.x, 1.0 - vTexCoord.y);
            vec2 cover = coverUV(uv, camResolution, outputResolution);
            gl_FragColor = texture2D(tex, cover);
          }
        `;

          const blurHSrc = `
          precision highp float;
          varying vec2 vTexCoord;
          uniform sampler2D tex;
          uniform vec2 resolution;
          uniform float radius;
          
          float gaussianWeight(float x, float sigma) {
            return exp(-(x * x) / (2.0 * sigma * sigma));
          }
          
          void main() {
            vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
            vec2 texelSize = 1.0 / resolution;
            vec4 result = vec4(0.0);
            float totalWeight = 0.0;
            float sigma = 3.0; //increase blur radius
            
            for(int i = -6; i <= 6; i++) { //increase blur radius
              float weight = gaussianWeight(float(i), sigma);
              vec2 offset = vec2(float(i) * radius * texelSize.x, 0.0);
              result += texture2D(tex, uv + offset) * weight;
              totalWeight += weight;
            }
            
            gl_FragColor = result / totalWeight;
          }
        `;

          const blurVSrc = `
          precision highp float;
          varying vec2 vTexCoord;
          uniform sampler2D tex;
          uniform vec2 resolution;
          uniform float radius;
          
          float gaussianWeight(float x, float sigma) {
            return exp(-(x * x) / (2.0 * sigma * sigma));
          }
          
          void main() {
            vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
            vec2 texelSize = 1.0 / resolution;
            vec4 result = vec4(0.0);
            float totalWeight = 0.0;
            float sigma = 3.0; //increase blur radius
            
            for(int i = -6; i <= 6; i++) { //increase blur radius
              float weight = gaussianWeight(float(i), sigma);
              vec2 offset = vec2(0.0, float(i) * radius * texelSize.y);
              result += texture2D(tex, uv + offset) * weight;
              totalWeight += weight;
            }
            
            gl_FragColor = result / totalWeight;
          }
        `;

          const compositeSrc = `
          precision highp float;
          varying vec2 vTexCoord;
          
          uniform sampler2D camTex;
          uniform sampler2D blurTex;
          uniform sampler2D maskTex;
          uniform vec2 resolution;
          uniform vec2 camResolution;
          uniform float time;
          uniform float refractAmt;
          uniform float grainAmt;
          uniform float desatAmt;
          
          float hash(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
          }
          
          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
          }

          vec2 coverUV(vec2 uv, vec2 srcResolution, vec2 dstResolution) {
            float srcAspect = srcResolution.x / max(srcResolution.y, 0.0001);
            float dstAspect = dstResolution.x / max(dstResolution.y, 0.0001);
            vec2 mapped = uv;

            if (dstAspect > srcAspect) {
              float scale = srcAspect / dstAspect;
              float offset = (1.0 - scale) * 0.5;
              mapped.y = mapped.y * scale + offset;
            } else {
              float scale = dstAspect / srcAspect;
              float offset = (1.0 - scale) * 0.5;
              mapped.x = mapped.x * scale + offset;
            }

            return mapped;
          }
          
          void main() {
            vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
            vec2 mirroredCamUV = vec2(1.0 - uv.x, uv.y);
            float maskValue = texture2D(maskTex, uv).r;
            vec2 camUV = coverUV(mirroredCamUV, camResolution, resolution);
            
            vec2 noiseUV = uv * resolution * 0.5;
            float n1 = noise(noiseUV + time * 0.1);
            float n2 = noise(noiseUV + time * 0.1 + 100.0);
            vec2 refractOffset = vec2(n1, n2) * 2.0 - 1.0;
            refractOffset *= refractAmt / resolution;
            
            vec2 refractedUV = uv + refractOffset * maskValue;
            refractedUV = clamp(refractedUV, 0.0, 1.0);
            
            vec4 sharpColor = texture2D(camTex, camUV);
            vec4 blurredColor = texture2D(blurTex, refractedUV);
            vec4 color = mix(sharpColor, blurredColor, maskValue);
            
            float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
            color.rgb = mix(color.rgb, vec3(luma), desatAmt * maskValue);
            
            float grain = hash(uv * resolution + time * 1000.0) * 2.0 - 1.0;
            color.rgb += grain * grainAmt * maskValue;
            color.rgb += 0.05 * maskValue;
            
            gl_FragColor = vec4(color.rgb, 1.0);
          }
        `;

          const particleCount = sketchConfig.particleCount;
          const particleSrc = `
          precision highp float;
          varying vec2 vTexCoord;
          
          uniform sampler2D previousFrame;
          uniform sampler2D maskTex;
          uniform vec2 resolution;
          uniform float particlePositions[${particleCount * 2}];
          uniform float particleSizes[${particleCount}];
          uniform float particleBrightness[${particleCount}];
          
          void main() {
            vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
            vec2 pixelPos = uv * resolution;
            vec4 color = texture2D(previousFrame, uv);
            float maskValue = texture2D(maskTex, uv).r;
            
            for(int i = 0; i < ${particleCount}; i++) {
              vec2 particlePos = vec2(
                particlePositions[i * 2],
                particlePositions[i * 2 + 1]
              );
              
              float dist = distance(pixelPos, particlePos);
              float size = particleSizes[i];
              float particleAlpha = 1.0 - smoothstep(0.0, size, dist);
              particleAlpha = particleAlpha * particleAlpha;
              particleAlpha *= maskValue;
              
              vec3 particleColor = vec3(1.0, 1.0, 1.0) * particleBrightness[i];
              color.rgb += particleColor * particleAlpha;
            }
            
            gl_FragColor = vec4(color.rgb, 1.0);
          }
        `;

          try {
            copyShader = s.createShader(vertSrc, copySrc);
            blurHShader = s.createShader(vertSrc, blurHSrc);
            blurVShader = s.createShader(vertSrc, blurVSrc);
            compositeShader = s.createShader(vertSrc, compositeSrc);
            particleShader = s.createShader(vertSrc, particleSrc);
          } catch (error) {
            console.error("Shader compilation error:", error);
            setCameraError("Failed to compile shaders");
          }
        };

        const initGraphicsBuffers = () => {
          lowResW = Math.floor(s.width / DOWNSAMPLE);
          lowResH = Math.floor(s.height / DOWNSAMPLE);

          const ensureWebGLBuffer = (
            buffer: p5.Graphics | null,
            width: number,
            height: number
          ) => {
            if (!buffer) {
              const newBuffer = s.createGraphics(width, height, s.WEBGL);
              newBuffer.pixelDensity(1);
              return newBuffer;
            }
            buffer.resizeCanvas(width, height);
            buffer.pixelDensity(1);
            return buffer;
          };

          const ensure2DBuffer = (
            buffer: p5.Graphics | null,
            width: number,
            height: number
          ) => {
            if (!buffer) {
              const newBuffer = s.createGraphics(width, height);
              newBuffer.pixelDensity(1);
              return newBuffer;
            }
            buffer.resizeCanvas(width, height);
            buffer.pixelDensity(1);
            return buffer;
          };

          pgLowA = ensureWebGLBuffer(pgLowA, lowResW, lowResH);
          pgLowB = ensureWebGLBuffer(pgLowB, lowResW, lowResH);
          pgTemp = ensureWebGLBuffer(pgTemp, s.width, s.height);
          maskG = ensure2DBuffer(maskG, s.width, s.height);
          resetMask();
        };

        s.setup = () => {
          s.createCanvas(s.windowWidth, s.windowHeight, s.WEBGL);
          s.pixelDensity(1);
          initGraphicsBuffers();

          setupCamera();
          compileShaders();
          initParticles();
        };

        s.draw = () => {
          if (
            !copyShader ||
            !blurHShader ||
            !blurVShader ||
            !compositeShader ||
            !particleShader
          ) {
            s.background(50, 0, 0);
            return;
          }

          if (!camReady || !cam || cam.width <= 0 || cam.height <= 0) {
            s.background(20);
            return;
          }

          if (!pgLowA || !pgLowB || !pgTemp || !maskG) {
            s.background(20);
            return;
          }

          const lowBufferA = pgLowA;
          const lowBufferB = pgLowB;
          const tempBuffer = pgTemp;
          const maskBuffer = maskG;

          updateParticles();

          // Step 1: Copy camera to low-res buffer
          lowBufferA.push();
          lowBufferA.shader(copyShader);
          copyShader.setUniform("tex", cam);
          copyShader.setUniform("camResolution", [camWidth, camHeight]);
          copyShader.setUniform("outputResolution", [
            lowBufferA.width,
            lowBufferA.height,
          ]);
          lowBufferA.rect(0, 0, lowBufferA.width, lowBufferA.height);
          lowBufferA.pop();

          // Step 2: Horizontal blur
          lowBufferB.push();
          lowBufferB.shader(blurHShader);
          blurHShader.setUniform("tex", lowBufferA);
          blurHShader.setUniform("resolution", [
            lowBufferA.width,
            lowBufferA.height,
          ]);
          blurHShader.setUniform("radius", blurRadius);
          lowBufferB.rect(0, 0, lowBufferB.width, lowBufferB.height);
          lowBufferB.pop();

          // Step 3: Vertical blur
          lowBufferA.push();
          lowBufferA.shader(blurVShader);
          blurVShader.setUniform("tex", lowBufferB);
          blurVShader.setUniform("resolution", [
            lowBufferB.width,
            lowBufferB.height,
          ]);
          blurVShader.setUniform("radius", blurRadius);
          lowBufferA.rect(0, 0, lowBufferA.width, lowBufferA.height);
          lowBufferA.pop();

          // Step 4: Composite frost effect
          tempBuffer.push();
          tempBuffer.shader(compositeShader);
          compositeShader.setUniform("camTex", cam);
          compositeShader.setUniform("blurTex", lowBufferA);
          compositeShader.setUniform("maskTex", maskBuffer);
          compositeShader.setUniform("resolution", [s.width, s.height]);
          compositeShader.setUniform("camResolution", [camWidth, camHeight]);
          compositeShader.setUniform("time", s.millis() / 1000.0);
          compositeShader.setUniform("refractAmt", REFRACT_AMT);
          compositeShader.setUniform("grainAmt", GRAIN_AMT);
          compositeShader.setUniform("desatAmt", DESAT_AMT);
          tempBuffer.rect(0, 0, tempBuffer.width, tempBuffer.height);
          tempBuffer.pop();

          // Step 5: Add particles
          s.push();
          s.shader(particleShader);
          particleShader.setUniform("previousFrame", tempBuffer);
          particleShader.setUniform("maskTex", maskBuffer);
          particleShader.setUniform("resolution", [s.width, s.height]);

          const positions: number[] = [];
          const sizes: number[] = [];
          const brightness: number[] = [];
          for (const p of particles) {
            positions.push(p.x, p.y);
            sizes.push(p.size);
            brightness.push(p.brightness);
          }
          particleShader.setUniform("particlePositions", positions);
          particleShader.setUniform("particleSizes", sizes);
          particleShader.setUniform("particleBrightness", brightness);

          s.rect(0, 0, s.width, s.height);
          s.pop();
        };

        const recordPointer = (x: number, y: number) => {
          const now = s.millis();
          if (lastPointer) {
            const dx = x - lastPointer.x;
            const dy = y - lastPointer.y;
            if (
              Math.abs(dx) > SWIPE_MIN_DELTA ||
              Math.abs(dy) > SWIPE_MIN_DELTA
            ) {
              pointerTrail.push({ x, y, dx, dy, t: now });
              lastPointer = { x, y };
            }
          } else {
            lastPointer = { x, y };
          }
        };

        const clearPointer = () => {
          pointerTrail.length = 0;
          lastPointer = null;
        };

        s.mouseMoved = () => {
          recordPointer(s.mouseX, s.mouseY);
          return false;
        };
        s.mouseDragged = () => {
          recordPointer(s.mouseX, s.mouseY);
          return false;
        };
        s.mouseReleased = () => {
          clearPointer();
          return false;
        };

        s.touchMoved = () => {
          for (const touch of s.touches as Array<{ x: number; y: number }>) {
            recordPointer(touch.x, touch.y);
          }
          return false;
        };
        s.touchEnded = () => {
          clearPointer();
          return false;
        };

        s.keyPressed = () => {
          if (s.key === "r" || s.key === "R") {
            resetMask();
          }
        };

        s.windowResized = () => {
          s.resizeCanvas(s.windowWidth, s.windowHeight);
          initGraphicsBuffers();
        };
      };

      if (!isEffectCancelled && sketchRef.current) {
        sketchInstanceRef.current = new p5(sketch, sketchRef.current);
      }
    }, 100); // Small delay to ensure DOM is ready after route transition

    return () => {
      isEffectCancelled = true;
      clearTimeout(initTimeout);
      releaseResources();
    };
  }, [airQualityDetails, sketchConfig]);

  return (
    <>
      <div
        ref={sketchRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "white",
          margin: 0,
          padding: 0,
          zIndex: 1,
        }}
      />
      {(isLoading || cameraError) && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: cameraError ? "#ff6b6b" : "#ffffff",
            fontSize: "1.2rem",
            textAlign: "center",
            zIndex: 1000,
            padding: "2rem",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            borderRadius: "8px",
            pointerEvents: "none",
          }}
        >
          {cameraError ||
            "Waiting for camera... \n (type a city name if no feed appears)"}
        </div>
      )}
    </>
  );
};

export default ProcessingSketch2;
