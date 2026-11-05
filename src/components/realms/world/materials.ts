import * as THREE from "three";

/** Shared materials — created once, reused by every structure to keep draw state small. */
export const MAT = {
  stone: new THREE.MeshStandardMaterial({ color: "#2c2842", roughness: 0.88, metalness: 0.05 }),
  stoneLight: new THREE.MeshStandardMaterial({ color: "#3d3858", roughness: 0.85, metalness: 0.05 }),
  rock: new THREE.MeshStandardMaterial({ color: "#1d1a2c", roughness: 0.95, flatShading: true }),
  roof: new THREE.MeshStandardMaterial({ color: "#1a2352", roughness: 0.45, metalness: 0.55 }),
  gold: new THREE.MeshStandardMaterial({ color: "#d6aa52", roughness: 0.3, metalness: 1, emissive: "#3a2408", emissiveIntensity: 0.6 }),
  window: new THREE.MeshBasicMaterial({ color: "#ffc56b", toneMapped: false }),
  grass: new THREE.MeshStandardMaterial({ color: "#13302f", roughness: 0.95 }),
  crystal: new THREE.MeshStandardMaterial({ color: "#9b7bff", emissive: "#7b52ff", emissiveIntensity: 2.4, roughness: 0.15, metalness: 0.2, toneMapped: false }),
};

/** Additive glow material factory (beams, halos, runes). */
export function glow(color: string, opacity = 0.6) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
}
