import { useEffect, useRef, useState } from "react";

const POLLUTANT_KEYS = ["o3", "pm2_5", "pm10", "co", "no2"] as const;
type PollutantKey = (typeof POLLUTANT_KEYS)[number];

const POLLUTANT_IMAGE_URLS: Record<PollutantKey, string> = {
  o3: `${import.meta.env.BASE_URL}thumbnail_new_O3.png`,
  pm2_5: `${import.meta.env.BASE_URL}thumbnail_new_PM2.5.png`,
  pm10: `${import.meta.env.BASE_URL}thumbnail_new_PM10.png`,
  co: `${import.meta.env.BASE_URL}thumbnail_new_CO2.png`,
  no2: `${import.meta.env.BASE_URL}thumbnail_new_NO2.png`,
};

/**
 * Particle class for cursor trail effect.
 * Each particle represents a pollutant image that follows the cursor.
 */
class Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  image: HTMLImageElement;
  opacity: number;

  constructor(x: number, y: number, image: HTMLImageElement) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.speedX = (Math.random() * 2 - 1) * 2;
    this.speedY = (Math.random() * 2 - 1) * 2;
    this.image = image;
    this.opacity = 0.5;
  }

  /**
   * Updates particle position and properties each frame.
   */
  update(): void {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.size > 0.1) {
      this.size -= 0.1;
    }
    if (this.opacity > 0.01) {
      this.opacity -= 0.01;
    }
  }

  /**
   * Draws the particle image on the canvas.
   */
  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.drawImage(
      this.image,
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size
    );
    ctx.restore();
  }
}

/**
 * Custom cursor component that creates a particle trail effect
 * using pollutant images that follow the mouse/touch movement.
 */
const CustomCursor = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const imagesRef = useRef<Map<PollutantKey, HTMLImageElement>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  /**
   * Loads all pollutant images into memory.
   */
  useEffect(() => {
    const loadImages = async () => {
      const imagePromises = Object.entries(POLLUTANT_IMAGE_URLS).map(
        ([key, url]) => {
          return new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              imagesRef.current.set(key as PollutantKey, img);
              resolve();
            };
            img.onerror = reject;
            img.src = url;
          });
        }
      );

      try {
        await Promise.all(imagePromises);
        setImagesLoaded(true);
      } catch (error) {
        console.error("Failed to load particle images:", error);
      }
    };

    loadImages();
  }, []);

  /**
   * Sets up canvas dimensions and initializes animation loop.
   */
  useEffect(() => {
    if (!imagesLoaded || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();

    /**
     * Adds new particles at the specified position.
     */
    const addParticle = (e: MouseEvent | TouchEvent) => {
      const posX = "clientX" in e ? e.clientX : e.touches[0]?.clientX ?? 0;
      const posY = "clientY" in e ? e.clientY : e.touches[0]?.clientY ?? 0;

      // Create 5 particles with random pollutant images
      for (let i = 0; i < 5; i++) {
        const randomKey =
          POLLUTANT_KEYS[Math.floor(Math.random() * POLLUTANT_KEYS.length)];
        const image = imagesRef.current.get(randomKey);
        if (image) {
          particlesRef.current.push(new Particle(posX, posY, image));
        }
      }
    };

    /**
     * Handles particle updates and drawing.
     */
    const handleParticles = () => {
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const particle = particlesRef.current[i];
        particle.update();
        particle.draw(ctx);

        if (particle.size <= 0.1 || particle.opacity <= 0.01) {
          particlesRef.current.splice(i, 1);
        }
      }
    };

    /**
     * Main animation loop.
     */
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      handleParticles();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Event listeners on window/document since canvas has pointer-events-none
    window.addEventListener("mousemove", addParticle);
    window.addEventListener("touchstart", addParticle);
    window.addEventListener("touchmove", addParticle);
    window.addEventListener("resize", resizeCanvas);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("mousemove", addParticle);
      window.removeEventListener("touchstart", addParticle);
      window.removeEventListener("touchmove", addParticle);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [imagesLoaded]);

  return (
    <canvas
      ref={canvasRef}
      id="scrollingRainbow"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 20,
        cursor: "none",
      }}
    />
  );
};

export default CustomCursor;
