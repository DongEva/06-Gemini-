export interface Range {
  min: number;
  max: number;
}

export enum ExplosionType {
  SPHERE = 'sphere', // Classic ball
  STAR = 'star', // Spiky
  RING = 'ring', // 2D ring
  PISTIL = 'pistil', // Core + Shell (Double layer)
  WILLOW = 'willow', // Long trails
  CROSSETTE = 'crossette', // Splits into 4
  PALM = 'palm' // Thick branches
}

export interface FireworkConfig {
  name: string;
  hue: Range;
  secondaryHue?: number; // For dual-color fireworks
  saturation: number;
  lightness: number;
  particleCount: number;
  initialVelocity: number;
  gravity: number;
  friction: number;
  decay: Range; // How fast particles fade (0.95 - 0.99)
  explosionType: ExplosionType;
  hasTrail: boolean;
  trailLength: number; // 0 to 1
  soundVolume?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  hue: number;
  decay: number;
  life: number;
  maxLife: number;
  hasTrail: boolean;
  behavior?: 'normal' | 'split'; // For Crossette
}

export interface Rocket {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  hue: number;
  exploded: boolean;
  config: FireworkConfig;
}