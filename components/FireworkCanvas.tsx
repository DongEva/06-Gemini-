import React, { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { FireworkConfig, ExplosionType, Particle, Rocket } from '../types';
import { soundManager } from '../utils/audio';

interface FireworkCanvasProps {
  currentConfig: FireworkConfig | null;
  isAutoFire: boolean;
}

export interface FireworkCanvasHandle {
  launchRocket: (x: number, y: number) => void;
}

const FireworkCanvas = forwardRef<FireworkCanvasHandle, FireworkCanvasProps>(({ currentConfig, isAutoFire }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rocketsRef = useRef<Rocket[]>([]);
  const animationFrameRef = useRef<number>(0);
  const autoFireTimerRef = useRef<number>(0);

  const random = (min: number, max: number) => Math.random() * (max - min) + min;

  const createBurst = (x: number, y: number, config: FireworkConfig, typeOverride?: ExplosionType, scaleMultiplier: number = 1, colorOverride?: number) => {
    // Increase base count significantly for "More Complex" feel
    const baseCount = config.particleCount; 
    const count = Math.floor(baseCount * (typeOverride === ExplosionType.RING ? 0.4 : 1) * scaleMultiplier);
    
    const newParticles: Particle[] = [];
    const baseHue = colorOverride ?? Math.floor(random(config.hue.min, config.hue.max));
    const type = typeOverride ?? config.explosionType;

    // Adjust velocity based on scale multiplier (larger fireworks explode wider)
    const burstVelocity = config.initialVelocity * scaleMultiplier;

    for (let i = 0; i < count; i++) {
      let vx = 0;
      let vy = 0;
      // Add more variation to velocity for natural look
      const velocity = random(burstVelocity * 0.5, burstVelocity);
      
      let pLife = 1.0;
      let pBehavior: 'normal' | 'split' = 'normal';

      switch (type) {
        case ExplosionType.RING:
          const angle = (Math.PI * 2 * i) / count;
          // Rings need precise velocity
          const ringVel = burstVelocity * 0.9;
          vx = Math.cos(angle) * ringVel;
          vy = Math.sin(angle) * ringVel;
          break;
        case ExplosionType.STAR:
          const starA = (Math.PI * 2 * i) / count;
          // Create points of the star
          const r = burstVelocity * (i % 2 === 0 ? 1 : 0.3); 
          vx = Math.cos(starA) * r;
          vy = Math.sin(starA) * r;
          break;
        case ExplosionType.WILLOW:
          const wAngle = random(0, Math.PI * 2);
          const wVel = random(0.2, burstVelocity); 
          vx = Math.cos(wAngle) * wVel;
          vy = Math.sin(wAngle) * wVel;
          pLife = random(1.2, 1.8); // Willows last much longer
          break;
        case ExplosionType.PALM:
           // Thicker branches
           if (i > count * 0.4) continue; // Fewer particles but thicker trails conceptually
           const pAngle = random(0, Math.PI * 2);
           const pVel = random(burstVelocity * 0.8, burstVelocity);
           vx = Math.cos(pAngle) * pVel;
           vy = Math.sin(pAngle) * pVel;
           break;
        case ExplosionType.CROSSETTE:
           const cAngle = random(0, Math.PI * 2);
           vx = Math.cos(cAngle) * velocity;
           vy = Math.sin(cAngle) * velocity;
           if (Math.random() > 0.6) pBehavior = 'split';
           break;
        case ExplosionType.SPHERE:
        case ExplosionType.PISTIL:
        default:
          const sAngle = random(0, Math.PI * 2);
          // Sphere fills the volume
          const sVel = random(0.1, velocity);
          vx = Math.cos(sAngle) * sVel;
          vy = Math.sin(sAngle) * sVel;
          break;
      }

      // Physics corrections
      if (type === ExplosionType.PALM) {
         vy -= 1; // Palms shoot slightly up initially
      }

      newParticles.push({
        x,
        y,
        vx,
        vy,
        alpha: 1,
        hue: baseHue + random(-10, 10),
        decay: random(config.decay.min, config.decay.max) * (type === ExplosionType.WILLOW ? 0.4 : 1),
        life: pLife,
        maxLife: pLife,
        hasTrail: config.hasTrail,
        behavior: pBehavior
      });
    }
    particlesRef.current.push(...newParticles);
  };

  const createParticles = (x: number, y: number, config: FireworkConfig) => {
    // Randomize size slightly for every click
    const sizeMultiplier = random(0.8, 1.4);
    
    soundManager.playExplosion(sizeMultiplier);

    // Primary Burst
    createBurst(x, y, config, undefined, sizeMultiplier);

    // Secondary Burst (Complex types)
    if (config.explosionType === ExplosionType.PISTIL) {
      // Inner Core - distinct color, smaller radius
      const secondaryHue = config.secondaryHue ?? (config.hue.min + 180) % 360;
      // Core is usually perfectly spherical and dense
      createBurst(x, y, { ...config, particleCount: config.particleCount * 0.4 }, ExplosionType.SPHERE, sizeMultiplier * 0.5, secondaryHue);
    }
  };

  const launchRocket = useCallback((targetX: number, targetY: number) => {
    if (!canvasRef.current || !currentConfig) return;
    
    // Vertical launch: Start directly below the target
    const startX = targetX + random(-1, 1); 
    const startY = canvasRef.current.height;
    
    // Physics calculation for height
    const height = startY - targetY;
    // Base gravity for rockets (needs to be consistent with update loop)
    const rocketGravity = 0.15; 
    // v^2 = 2gh -> v = sqrt(2gh)
    // Add small random variation to height so they don't all stop exactly at mouse Y
    const heightVariation = random(0.95, 1.1);
    const vy = -Math.sqrt(2 * rocketGravity * (height * heightVariation)); 
    
    const vx = (targetX - startX) / (Math.abs(vy) / rocketGravity); // Correction for drift

    soundManager.playLaunch();

    rocketsRef.current.push({
      x: startX,
      y: startY,
      targetX,
      targetY,
      vx,
      vy,
      hue: random(currentConfig.hue.min, currentConfig.hue.max),
      exploded: false,
      config: currentConfig
    });
  }, [currentConfig]);

  // Expose launchRocket to parent
  useImperativeHandle(ref, () => ({
    launchRocket
  }));

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with heavy trails for "Glow" look
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0, 0, 5, 0.2)'; // Very slight transparency for trails
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.globalCompositeOperation = 'screen'; // Use screen or lighter for better blending

    // Rockets
    for (let i = rocketsRef.current.length - 1; i >= 0; i--) {
      const rocket = rocketsRef.current[i];
      rocket.x += rocket.vx;
      rocket.y += rocket.vy;
      rocket.vy += 0.15; // Must match rocketGravity in launchRocket

      // Draw Rocket
      ctx.beginPath();
      ctx.moveTo(rocket.x - rocket.vx * 4, rocket.y - rocket.vy * 4);
      ctx.lineTo(rocket.x, rocket.y);
      ctx.strokeStyle = `hsl(40, 100%, 70%)`; // Gold tail
      ctx.lineWidth = 3;
      ctx.stroke();

      // Sparkle on rocket head
      ctx.fillStyle = '#FFF';
      ctx.fillRect(rocket.x - 1, rocket.y - 1, 3, 3);

      // Explosion trigger: Apex of flight (velocity near 0) or manual target hit logic
      // We use velocity check for more natural "gravity stop" feeling
      if (rocket.vy >= -1) { 
        createParticles(rocket.x, rocket.y, rocket.config);
        rocketsRef.current.splice(i, 1);
      }
    }

    // Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      
      // Physics
      p.x += p.vx;
      p.y += p.vy;
      
      const friction = p.behavior === 'split' ? 0.94 : (currentConfig?.friction ?? 0.95);
      p.vx *= friction;
      p.vy *= friction;
      p.vy += (currentConfig?.gravity ?? 0.1);

      p.life -= p.decay;
      p.alpha = p.life;

      // Crossette logic: Burst again
      if (p.behavior === 'split' && p.life < 0.7 && p.life > 0.6) {
         p.behavior = 'normal'; // One time split
         soundManager.playExplosion(0.2); // Tiny pop
         // Create 3-4 sub particles
         for(let k=0; k<3; k++) {
             particlesRef.current.push({
                 ...p,
                 vx: p.vx + (Math.random() - 0.5) * 4,
                 vy: p.vy + (Math.random() - 0.5) * 4,
                 life: 0.6,
                 decay: 0.03,
                 hue: p.hue,
                 alpha: 1
             });
         }
         p.life = 0; 
      }

      if (p.life <= 0) {
        particlesRef.current.splice(i, 1);
        continue;
      }

      // Render
      ctx.beginPath();
      if (p.hasTrail) {
         ctx.moveTo(p.x - p.vx * 2.5, p.y - p.vy * 2.5);
         ctx.lineTo(p.x, p.y);
         ctx.lineCap = 'round';
         ctx.strokeStyle = `hsla(${p.hue}, ${currentConfig?.saturation ?? 100}%, ${currentConfig?.lightness ?? 60}%, ${p.alpha})`;
         ctx.lineWidth = 2;
         ctx.stroke();
      } else {
         ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
         ctx.fillStyle = `hsla(${p.hue}, ${currentConfig?.saturation ?? 100}%, ${currentConfig?.lightness ?? 60}%, ${p.alpha})`;
         ctx.fill();
      }
    }

    animationFrameRef.current = requestAnimationFrame(loop);
  }, [currentConfig]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [loop]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    soundManager.resume();
    launchRocket(x, y);
  };

  // Auto Fire Logic
  useEffect(() => {
    if (isAutoFire) {
      const fire = () => {
        if (!canvasRef.current) return;
        const w = canvasRef.current.width;
        const h = canvasRef.current.height;
        
        // Randomize target position high in the sky
        const x = random(w * 0.15, w * 0.85);
        const y = random(h * 0.1, h * 0.4);
        
        launchRocket(x, y);
        
        // Rapid fire sometimes, slow other times
        const delay = random(400, 1500);
        autoFireTimerRef.current = window.setTimeout(fire, delay);
      };
      fire();
      return () => clearTimeout(autoFireTimerRef.current);
    }
  }, [isAutoFire, launchRocket]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full cursor-pointer z-10"
      onClick={handleCanvasClick}
    />
  );
});

FireworkCanvas.displayName = 'FireworkCanvas';

export default FireworkCanvas;