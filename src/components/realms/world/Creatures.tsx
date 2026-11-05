"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/** Celestial wyverns gliding on wide orbits around the castle; wings flap procedurally. */
function Wyvern({ radius, height, speed, phase, scale }: { radius: number; height: number; speed: number; phase: number; scale: number }) {
  const root = useRef<THREE.Group>(null);
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const wingGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.quadraticCurveTo(6, 3, 14, 1.5);
    s.lineTo(11, -0.5);
    s.lineTo(8, 0.4);
    s.lineTo(5, -1.2);
    s.lineTo(2, -0.6);
    s.lineTo(0, -1.5);
    return new THREE.ShapeGeometry(s);
  }, []);
  const wingMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1a1030", emissive: "#5a2ea8", emissiveIntensity: 0.6, side: THREE.DoubleSide, roughness: 0.6 }), []);
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#120a22", emissive: "#2a1458", roughness: 0.5 }), []);
  const eyeMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#7af0e0", toneMapped: false }), []);

  useFrame((s) => {
    const t = s.clock.elapsedTime * speed + phase;
    const x = Math.sin(t) * radius;
    const z = Math.cos(t) * radius * 0.8;
    const y = height + Math.sin(t * 2.3) * 12;
    if (root.current) {
      root.current.position.set(x, y, z);
      // face along the tangent of the orbit
      root.current.rotation.set(0, Math.atan2(Math.cos(t) * radius, -Math.sin(t) * radius * 0.8), Math.sin(t * 2.3) * 0.25);
    }
    const flap = Math.sin(s.clock.elapsedTime * 3.2 + phase * 5) * 0.55;
    if (left.current) left.current.rotation.z = flap;
    if (right.current) right.current.rotation.z = -flap;
  });

  return (
    <group ref={root} scale={scale}>
      <group rotation={[0, Math.PI / 2, 0]}>
        <mesh material={bodyMat} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[1.2, 12, 6]} />
        </mesh>
        <mesh material={bodyMat} position={[7, 0.4, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.9, 3.5, 5]} />
        </mesh>
        <mesh material={eyeMat} position={[7.6, 0.8, 0.5]}>
          <sphereGeometry args={[0.22, 6, 6]} />
        </mesh>
        <group ref={left} position={[1, 0.4, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh geometry={wingGeo} material={wingMat} rotation={[0, 0, Math.PI / 2]} />
        </group>
        <group ref={right} position={[1, 0.4, -0.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh geometry={wingGeo} material={wingMat} rotation={[0, 0, Math.PI / 2]} />
        </group>
      </group>
    </group>
  );
}

export default function Creatures({ count }: { count: number }) {
  const flock = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        radius: 160 + ((i * 53) % 220),
        height: 140 + ((i * 37) % 130),
        speed: 0.05 + ((i * 13) % 7) * 0.006,
        phase: i * 1.7,
        scale: 1 + ((i * 7) % 4) * 0.25,
      })),
    [count],
  );
  return (
    <group>
      {flock.map((f, i) => (
        <Wyvern key={i} {...f} />
      ))}
    </group>
  );
}
