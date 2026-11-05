"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { MOON_DIR } from "./Sky";

/**
 * Fake volumetric moon shafts: long additive cones aimed from the moon onto the
 * castle, with a shader that fades along the length and across the rim.
 * Cheap enough for medium quality; bloom (high) makes them sing.
 */
export default function GodRays() {
  const group = useRef<THREE.Group>(null);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec2 vUv; varying vec3 vN; varying vec3 vView;
          void main(){
            vUv = uv;
            vec4 wp = modelMatrix * vec4(position,1.0);
            vN = normalize(mat3(modelMatrix) * normal);
            vView = normalize(cameraPosition - wp.xyz);
            gl_Position = projectionMatrix * viewMatrix * wp;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; varying vec2 vUv; varying vec3 vN; varying vec3 vView;
          void main(){
            float rim = pow(1.0 - abs(dot(vN, vView)), 1.6);
            float core = 1.0 - rim;
            float along = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
            float flicker = 0.85 + 0.15 * sin(uTime * 0.6 + vUv.x * 30.0);
            gl_FragColor = vec4(vec3(0.55, 0.6, 0.95) * core * along * flicker * 0.055, 1.0);
          }`,
      }),
    [],
  );
  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
  });

  const beams = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(up, MOON_DIR);
    return [
      { pos: MOON_DIR.clone().multiplyScalar(420).add(new THREE.Vector3(0, 60, 0)), r: 70, len: 900 },
      { pos: MOON_DIR.clone().multiplyScalar(420).add(new THREE.Vector3(-90, 40, 60)), r: 40, len: 850 },
      { pos: MOON_DIR.clone().multiplyScalar(420).add(new THREE.Vector3(110, 30, -40)), r: 34, len: 820 },
    ].map((b) => ({ ...b, q }));
  }, []);

  return (
    <group ref={group}>
      {beams.map((b, i) => (
        <mesh key={i} material={mat} position={b.pos} quaternion={b.q}>
          <cylinderGeometry args={[b.r * 2.2, b.r * 0.5, b.len, 24, 1, true]} />
        </mesh>
      ))}
    </group>
  );
}
