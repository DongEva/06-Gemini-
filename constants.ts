import { FireworkConfig, ExplosionType } from './types';

// A high quality castle night scene
export const BACKGROUND_IMAGE_URL = "https://images.unsplash.com/photo-1516466723877-e462d73008e9?q=80&w=2070&auto=format&fit=crop";

export const ARCANA_PRESETS: FireworkConfig[] = [
  {
    name: "The Sun",
    hue: { min: 45, max: 60 },
    saturation: 100,
    lightness: 70,
    particleCount: 300,
    initialVelocity: 16,
    gravity: 0.15,
    friction: 0.96,
    decay: { min: 0.01, max: 0.025 },
    explosionType: ExplosionType.PALM,
    hasTrail: true,
    trailLength: 0.6,
    secondaryHue: 20
  },
  {
    name: "The Moon",
    hue: { min: 180, max: 220 },
    saturation: 40,
    lightness: 90,
    particleCount: 250,
    initialVelocity: 14,
    gravity: 0.08,
    friction: 0.94,
    decay: { min: 0.005, max: 0.015 },
    explosionType: ExplosionType.WILLOW,
    hasTrail: true,
    trailLength: 0.8,
    secondaryHue: 0
  },
  {
    name: "The Tower",
    hue: { min: 0, max: 20 },
    saturation: 100,
    lightness: 60,
    particleCount: 350,
    initialVelocity: 18,
    gravity: 0.18,
    friction: 0.95,
    decay: { min: 0.015, max: 0.035 },
    explosionType: ExplosionType.CROSSETTE,
    hasTrail: true,
    trailLength: 0.3,
    secondaryHue: 40
  },
  {
    name: "The Star",
    hue: { min: 260, max: 320 },
    saturation: 90,
    lightness: 80,
    particleCount: 200,
    initialVelocity: 15,
    gravity: 0.12,
    friction: 0.96,
    decay: { min: 0.02, max: 0.04 },
    explosionType: ExplosionType.STAR,
    hasTrail: false,
    trailLength: 0,
    secondaryHue: 180
  },
  {
    name: "Wheel of Fortune",
    hue: { min: 0, max: 360 },
    saturation: 100,
    lightness: 65,
    particleCount: 400,
    initialVelocity: 17,
    gravity: 0.14,
    friction: 0.95,
    decay: { min: 0.01, max: 0.02 },
    explosionType: ExplosionType.PISTIL,
    hasTrail: true,
    trailLength: 0.4,
    secondaryHue: 0
  },
  {
    name: "The Magician",
    hue: { min: 280, max: 300 },
    saturation: 100,
    lightness: 70,
    particleCount: 275,
    initialVelocity: 12,
    gravity: 0.1,
    friction: 0.97,
    decay: { min: 0.01, max: 0.02 },
    explosionType: ExplosionType.RING,
    hasTrail: true,
    trailLength: 0.2,
    secondaryHue: 120
  }
];