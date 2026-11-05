"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { heightAt } from "./noise";

const flowShader = (color: string) =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
      void main(){
        float flow = sin(vUv.x * 90.0 - uTime * 3.0 + sin(vUv.y * 12.0) * 2.0) * 0.5 + 0.5;
        float shimmer = pow(flow, 6.0);
        float edge = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
        vec3 col = uColor * (0.55 + 0.45 * flow) + vec3(0.7, 0.95, 1.0) * shimmer * 0.6;
        gl_FragColor = vec4(col, 0.85 * edge);
      }`,
  });

/** Ribbon geometry laid on the terrain along a spline. */
function ribbon(points: THREE.Vector3[], width: number) {
  const curve = new THREE.CatmullRomCurve3(points);
  const N = 220;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = curve.getPoint(t);
    const tan = curve.getTangent(t);
    const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize().multiplyScalar(width / 2);
    for (const s of [-1, 1]) {
      const x = p.x + side.x * s;
      const z = p.z + side.z * s;
      pos.push(x, Math.max(heightAt(x, z), p.y) + 0.8, z);
      uv.push(t, s < 0 ? 0 : 1);
    }
    if (i < N) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/** Glowing magical river from the northern mountains to the castle moat, plus the moat itself. */
export default function River() {
  const riverMat = useMemo(() => flowShader("#1fb8b0"), []);
  const moatMat = useMemo(() => flowShader("#2a8fd6"), []);
  const riverGeo = useMemo(() => {
    const pts = [
      [-150, 0, -400],
      [-170, 0, -330],
      [-90, 0, -230],
      [-40, 0, -160],
      [-8, 0, -118],
    ].map(([x, , z]) => new THREE.Vector3(x, Math.max(heightAt(x, z), -2), z));
    return ribbon(pts, 16);
  }, []);
  useFrame((_, dt) => {
    riverMat.uniforms.uTime.value += dt;
    moatMat.uniforms.uTime.value += dt * 0.6;
  });
  return (
    <group>
      <mesh geometry={riverGeo} material={riverMat} />
      <mesh material={moatMat} position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[100, 122, 96, 1]} />
      </mesh>
    </group>
  );
}
