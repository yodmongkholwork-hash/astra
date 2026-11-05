"use client";

import { Stars } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export const MOON_DIR = new THREE.Vector3(-0.55, 0.42, -0.72).normalize();

/** Gradient night dome, aurora-tinted horizon, star field and a haloed moon. */
export default function Sky() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { uTime: { value: 0 }, uMoon: { value: MOON_DIR } },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform vec3 uMoon;
          varying vec3 vDir;
          void main() {
            float h = vDir.y;
            vec3 zenith = vec3(0.012, 0.010, 0.035);
            vec3 upper  = vec3(0.07, 0.035, 0.16);
            vec3 horizon= vec3(0.20, 0.09, 0.32);
            vec3 below  = vec3(0.03, 0.02, 0.06);
            vec3 col = mix(horizon, upper, smoothstep(0.0, 0.28, h));
            col = mix(col, zenith, smoothstep(0.25, 0.85, h));
            col = mix(below, col, smoothstep(-0.25, 0.02, h));
            // mystic teal aurora band
            float band = exp(-pow((h - 0.16 - 0.04 * sin(vDir.x * 6.0 + uTime * 0.05)) * 14.0, 2.0));
            col += vec3(0.05, 0.22, 0.24) * band * (0.5 + 0.5 * sin(vDir.x * 3.0 + vDir.z * 2.0 + uTime * 0.08));
            // moon glow
            float m = max(dot(vDir, uMoon), 0.0);
            float disc = smoothstep(0.99935, 0.99955, m);
            col = mix(col, vec3(0.93, 0.94, 1.0) * 1.6, disc);
            col += vec3(0.55, 0.6, 0.85) * pow(m, 900.0) * 1.2 + vec3(0.25, 0.22, 0.45) * pow(m, 14.0) * 0.55;
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    [],
  );
  const ref = useRef(material);
  const dome = useRef<THREE.Mesh>(null);
  const camera = useThree((s) => s.camera);
  useFrame((_, dt) => {
    ref.current.uniforms.uTime.value += dt;
    dome.current?.position.copy(camera.position); // infinitely distant sky: always centred on the eye
  });

  return (
    <group>
      <mesh ref={dome} material={material} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[2400, 48, 24]} />
      </mesh>
      <Stars radius={1600} depth={300} count={6000} factor={30} saturation={0.4} fade speed={0.4} />
    </group>
  );
}
