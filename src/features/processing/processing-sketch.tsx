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

/**
 * WebGL frosted glass camera effect with AQI-driven particles.
 */
const ProcessingSketch = () => {
  const sketchRef = useRef<HTMLDivElement | null>(null);
  const { airQualityDetails } = useCity();
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sketchConfig = useMemo(() => {
    const defaultConfig = {
      particleCount: 150,
      particleSpeed: 0.15,
      particleBrightness: 1,
      particleSize: 2.5,
    };

    if (!airQualityDetails) {
      return defaultConfig;
    }

    const { effectStrength, targetCount } = airQualityDetails;
    const strength = Number.isFinite(effectStrength)
      ? Math.min(Math.max(effectStrength, 0), 1)
      : 0.3;

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
    };
  }, [airQualityDetails]);

  useEffect(() => {
    if (!sketchRef.current || !airQualityDetails) {
      return;
    }

    let sketchInstance: p5 | null = null;

    const sketch = (s: p5) => {
      const DOWNSAMPLE = 2;
      const BLUR_RADIUS = 5;
      const REFRACT_AMT = 0.1;
      const GRAIN_AMT = 0.01;
      const DESAT_AMT = 0.1;
      const BRUSH_SIZE = 80;
      const BRUSH_STRENGTH = 0.3;

      let cam: p5.Element | p5.MediaElement;
      let camReady = false;
      let pgLowA: p5.Graphics;
      let pgLowB: p5.Graphics;
      let pgTemp: p5.Graphics;
      let maskG: p5.Graphics;
      let lowResW: number;
      let lowResH: number;

      let copyShader: p5.Shader;
      let blurHShader: p5.Shader;
      let blurVShader: p5.Shader;
      let compositeShader: p5.Shader;
      let particleShader: p5.Shader;

      let particles: Particle[] = [];

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

      const updateParticles = () => {
        const time = s.millis() / 1000.0;
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
          if (p.x < 0) p.x = s.width;
          if (p.x > s.width) p.x = 0;
          if (p.y < 0) p.y = s.height;
          if (p.y > s.height) p.y = 0;
        }
      };

      const setupCamera = () => {
        cam = s.createCapture("video");

        cam.elt.addEventListener("loadedmetadata", () => {
          camReady = true;
          setIsLoading(false);
        });

        if (cam.elt && cam.elt instanceof HTMLVideoElement) {
          cam.elt.setAttribute("playsinline", "");
          cam.elt.muted = true;
        }
        cam.hide();
      };

      const resetMask = () => {
        maskG.background(255);
      };

      const paintReveal = (x: number, y: number) => {
        maskG.push();
        maskG.noStroke();
        maskG.fill(0, 0, 0, BRUSH_STRENGTH * 255);
        maskG.circle(x, y, BRUSH_SIZE);
        maskG.pop();
      };

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
          
          void main() {
            vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
            gl_FragColor = texture2D(tex, uv);
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
            float sigma = 2.5;
            
            for(int i = -4; i <= 4; i++) {
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
            float sigma = 2.5;
            
            for(int i = -4; i <= 4; i++) {
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
          
          void main() {
            vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
            float maskValue = texture2D(maskTex, uv).r;
            
            vec2 noiseUV = uv * resolution * 0.5;
            float n1 = noise(noiseUV + time * 0.1);
            float n2 = noise(noiseUV + time * 0.1 + 100.0);
            vec2 refractOffset = vec2(n1, n2) * 2.0 - 1.0;
            refractOffset *= refractAmt / resolution;
            
            vec2 refractedUV = uv + refractOffset * maskValue;
            refractedUV = clamp(refractedUV, 0.0, 1.0);
            
            vec4 sharpColor = texture2D(camTex, uv);
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
              
              vec3 particleColor = vec3(0.4, 1.0, 0.5) * particleBrightness[i];
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

      s.setup = () => {
        s.createCanvas(s.windowWidth, s.windowHeight, s.WEBGL);
        s.pixelDensity(1);

        lowResW = Math.floor(s.width / DOWNSAMPLE);
        lowResH = Math.floor(s.height / DOWNSAMPLE);

        pgLowA = s.createGraphics(lowResW, lowResH, s.WEBGL);
        pgLowB = s.createGraphics(lowResW, lowResH, s.WEBGL);
        pgLowA.pixelDensity(1);
        pgLowB.pixelDensity(1);

        pgTemp = s.createGraphics(s.width, s.height, s.WEBGL);
        pgTemp.pixelDensity(1);

        maskG = s.createGraphics(s.width, s.height);
        maskG.pixelDensity(1);
        resetMask();

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

        updateParticles();

        // Step 1: Copy camera to low-res buffer
        pgLowA.push();
        pgLowA.shader(copyShader);
        copyShader.setUniform("tex", cam as p5.MediaElement);
        pgLowA.rect(0, 0, pgLowA.width, pgLowA.height);
        pgLowA.pop();

        // Step 2: Horizontal blur
        pgLowB.push();
        pgLowB.shader(blurHShader);
        blurHShader.setUniform("tex", pgLowA);
        blurHShader.setUniform("resolution", [pgLowA.width, pgLowA.height]);
        blurHShader.setUniform("radius", BLUR_RADIUS);
        pgLowB.rect(0, 0, pgLowB.width, pgLowB.height);
        pgLowB.pop();

        // Step 3: Vertical blur
        pgLowA.push();
        pgLowA.shader(blurVShader);
        blurVShader.setUniform("tex", pgLowB);
        blurVShader.setUniform("resolution", [pgLowB.width, pgLowB.height]);
        blurVShader.setUniform("radius", BLUR_RADIUS);
        pgLowA.rect(0, 0, pgLowA.width, pgLowA.height);
        pgLowA.pop();

        // Step 4: Composite frost effect
        pgTemp.push();
        pgTemp.shader(compositeShader);
        compositeShader.setUniform("camTex", cam as p5.MediaElement);
        compositeShader.setUniform("blurTex", pgLowA);
        compositeShader.setUniform("maskTex", maskG);
        compositeShader.setUniform("resolution", [s.width, s.height]);
        compositeShader.setUniform("time", s.millis() / 1000.0);
        compositeShader.setUniform("refractAmt", REFRACT_AMT);
        compositeShader.setUniform("grainAmt", GRAIN_AMT);
        compositeShader.setUniform("desatAmt", DESAT_AMT);
        pgTemp.rect(0, 0, pgTemp.width, pgTemp.height);
        pgTemp.pop();

        // Step 5: Add particles
        s.push();
        s.shader(particleShader);
        particleShader.setUniform("previousFrame", pgTemp);
        particleShader.setUniform("maskTex", maskG);
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

      s.mouseDragged = () => {
        paintReveal(s.mouseX, s.mouseY);
        return false;
      };

      s.touchMoved = () => {
        for (const touch of s.touches as Array<{ x: number; y: number }>) {
          paintReveal(touch.x, touch.y);
        }
        return false;
      };

      s.keyPressed = () => {
        if (s.key === "r" || s.key === "R") {
          resetMask();
        }
      };

      s.windowResized = () => {
        s.resizeCanvas(s.windowWidth, s.windowHeight);
      };
    };

    sketchInstance = new p5(sketch, sketchRef.current);

    return () => {
      if (sketchInstance) {
        sketchInstance.remove();
      }
    };
  }, [sketchConfig, airQualityDetails]);

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
          margin: 0,
          padding: 0,
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
            zIndex: 10,
            padding: "2rem",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            borderRadius: "8px",
          }}
        >
          {cameraError || "Initializing camera..."}
        </div>
      )}
    </>
  );
};

export default ProcessingSketch;
