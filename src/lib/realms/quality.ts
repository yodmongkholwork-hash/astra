export type Quality = "low" | "medium" | "high";

export interface QualityProfile {
  dpr: [number, number];
  terrainSegments: number;
  clouds: number;
  sparkles: number;
  creatures: number;
  shadows: boolean;
  bloom: boolean;
  godRays: boolean;
  antialias: boolean;
}

export const QUALITY: Record<Quality, QualityProfile> = {
  low: { dpr: [0.75, 1], terrainSegments: 96, clouds: 45, sparkles: 160, creatures: 0, shadows: false, bloom: false, godRays: false, antialias: false },
  medium: { dpr: [1, 1.5], terrainSegments: 160, clouds: 110, sparkles: 420, creatures: 5, shadows: false, bloom: false, godRays: true, antialias: true },
  high: { dpr: [1, 2], terrainSegments: 240, clouds: 200, sparkles: 900, creatures: 9, shadows: true, bloom: true, godRays: true, antialias: false /* MSAA handled by composer */ },
};

/** Conservative auto-detect: touch / small screens / few cores start lower. */
export function detectQuality(): Quality {
  if (typeof window === "undefined") return "medium";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  if (coarse || small || cores <= 4) return "low";
  if (cores >= 8 && window.devicePixelRatio <= 2) return "high";
  return "medium";
}

export function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
