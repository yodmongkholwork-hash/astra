import { LOCATIONS } from "@/lib/realms/locations";

/** Small deterministic value-noise / fbm used by terrain, mountains and rocks (no dependency). */
function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}
const smooth = (t: number) => t * t * (3 - 2 * t);

export function noise2(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  const u = smooth(xf);
  const v = smooth(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x: number, y: number, octaves = 5) {
  let amp = 0.5;
  let f = 1;
  let sum = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise2(x * f, y * f);
    f *= 2.03;
    amp *= 0.5;
  }
  return sum;
}

/** ridged fbm → sharp mountain crests */
export function ridged(x: number, y: number, octaves = 5) {
  let amp = 0.5;
  let f = 1;
  let sum = 0;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(noise2(x * f, y * f) * 2 - 1);
    sum += amp * n * n;
    f *= 2.1;
    amp *= 0.5;
  }
  return sum;
}

const ss = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

const PADS = LOCATIONS.filter((l) => l.id !== "castle").map((l) => ({ x: l.position[0], z: l.position[2] }));

/**
 * Kingdom height field. Valley basin (r < ~380) with gentle hills, a ring of
 * ridged mountains beyond, and flattened pads under every territory.
 */
export function heightAt(x: number, z: number) {
  const r = Math.hypot(x, z);
  let h = (fbm(x * 0.006 + 11, z * 0.006 - 7, 4) - 0.45) * 26; // rolling valley
  const mount = ss(360, 620, r);
  h += mount * (ridged(x * 0.0045 + 3, z * 0.0045 + 9, 5) * 330 + 30);
  h -= ss(120, 0, r) * 6; // slight bowl around the castle
  const moat = ss(26, 8, Math.abs(r - 111));
  h = h * (1 - moat) - 5 * moat; // carve the moat channel
  for (const p of PADS) {
    const d = Math.hypot(x - p.x, z - p.z);
    const w = ss(70, 30, d);
    h = h * (1 - w) + 4 * w;
  }
  return h;
}
