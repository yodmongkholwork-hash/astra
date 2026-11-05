"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { fbm, heightAt } from "./noise";

const SIZE = 1700;

/** Procedural valley + mountain ranges with moonlit vertex colouring (snow on the crests). */
export default function Terrain({ segments, shadows }: { segments: number; shadows: boolean }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(SIZE, SIZE, segments, segments);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const low = new THREE.Color("#0d1a24"); // mossy valley teal-black
    const mid = new THREE.Color("#241f3b"); // violet slate
    const rock = new THREE.Color("#3a3656");
    const snow = new THREE.Color("#b9c3e8");
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = heightAt(x, z);
      pos.setY(i, h);
      const n = fbm(x * 0.03, z * 0.03, 2);
      if (h < 20) c.copy(low).lerp(mid, Math.max(0, h / 20) * 0.6 + n * 0.25);
      else if (h < 160) c.copy(mid).lerp(rock, (h - 20) / 140);
      else c.copy(rock).lerp(snow, Math.min(1, (h - 160) / 90 + n * 0.3));
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [segments]);

  return (
    <mesh geometry={geometry} receiveShadow={shadows}>
      <meshStandardMaterial vertexColors roughness={0.95} metalness={0.02} />
    </mesh>
  );
}
