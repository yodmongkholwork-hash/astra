"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { fbm } from "./noise";
import { MAT } from "./materials";

interface Island {
  pos: [number, number, number];
  r: number;
  phase: number;
  spire?: boolean;
  waterfall?: boolean;
}

const ISLANDS: Island[] = [
  { pos: [-128, 118, 40], r: 22, phase: 0, spire: true, waterfall: true },
  { pos: [120, 142, -60], r: 26, phase: 1.3, spire: true, waterfall: true },
  { pos: [40, 172, 150], r: 14, phase: 2.1 },
  { pos: [-60, 196, -150], r: 18, phase: 3.4, spire: true },
  { pos: [190, 96, 110], r: 12, phase: 4.2 },
  { pos: [-210, 160, -40], r: 16, phase: 5.1, waterfall: true },
  { pos: [-20, 250, 60], r: 9, phase: 0.7 },
  { pos: [80, 226, -170], r: 11, phase: 2.8 },
];

/** Inverted, noise-carved rock cone → reads as a torn-off chunk of land. */
function useRockGeometry(r: number, seed: number) {
  return useMemo(() => {
    const g = new THREE.ConeGeometry(r, r * 2.4, 9, 5, false);
    g.rotateX(Math.PI); // point down
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      const n = fbm(x * 0.15 + seed, z * 0.15 + y * 0.1, 3);
      const k = 0.75 + n * 0.6;
      p.setXYZ(i, x * k, y + (y > r * 1.1 ? 0 : (n - 0.5) * r * 0.25), z * k);
    }
    g.computeVertexNormals();
    return g;
  }, [r, seed]);
}

function IslandMesh({ island, shadows }: { island: Island; shadows: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const rock = useRockGeometry(island.r, island.phase * 10);
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime * 0.35 + island.phase;
    ref.current.position.y = island.pos[1] + Math.sin(t) * 2.2;
    ref.current.rotation.y = Math.sin(t * 0.3) * 0.05;
  });
  return (
    <group ref={ref} position={island.pos}>
      <mesh geometry={rock} material={MAT.rock} position={[0, -island.r * 1.2, 0]} castShadow={shadows} />
      <mesh material={MAT.grass} position={[0, 0.2, 0]} receiveShadow={shadows}>
        <cylinderGeometry args={[island.r * 0.98, island.r * 0.9, 1.6, 12]} />
      </mesh>
      {island.spire && (
        <group position={[island.r * 0.2, 0.8, -island.r * 0.15]}>
          <mesh material={MAT.stone} position={[0, 9, 0]} castShadow={shadows}>
            <cylinderGeometry args={[2.4, 3, 18, 10]} />
          </mesh>
          <mesh material={MAT.roof} position={[0, 23, 0]}>
            <coneGeometry args={[3.4, 10, 10]} />
          </mesh>
          <mesh material={MAT.window} position={[0, 12, 2.9]}>
            <planeGeometry args={[1, 2.2]} />
          </mesh>
        </group>
      )}
      {/* hanging crystal shard under the island */}
      <mesh material={MAT.crystal} position={[0, -island.r * 2.5, 0]} rotation={[Math.PI, 0, 0]} scale={[0.6, 1.6, 0.6]}>
        <octahedronGeometry args={[island.r * 0.18, 0]} />
      </mesh>
      {island.waterfall && <Waterfall height={island.pos[1] + 10} x={island.r * 0.85} />}
    </group>
  );
}

/** Scrolling-noise shader on a long ribbon falling from the island rim. */
function Waterfall({ height, x }: { height: number; x: number }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uTime: { value: 0 } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; varying vec2 vUv;
          float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
          float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
            return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
          void main(){
            float streaks = n(vec2(vUv.x * 18.0, vUv.y * 6.0 + uTime * 2.4));
            float edge = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x);
            float fade = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.92, vUv.y);
            vec3 col = mix(vec3(0.25,0.75,0.85), vec3(0.85,0.95,1.0), streaks);
            gl_FragColor = vec4(col, (0.25 + streaks * 0.55) * edge * fade * 0.8);
          }`,
      }),
    [],
  );
  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
  });
  return (
    <mesh material={mat} position={[x, -height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[6, height, 1, 1]} />
    </mesh>
  );
}

/** Arched bridges linking the castle plateau to the two nearest islands. */
function Bridges() {
  const tubes = useMemo(() => {
    const make = (a: THREE.Vector3, b: THREE.Vector3) => {
      const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 18, 0));
      return new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 40, 1.3, 6, false);
    };
    return [make(new THREE.Vector3(-48, 70, 18), new THREE.Vector3(-112, 118, 36)), make(new THREE.Vector3(44, 80, -22), new THREE.Vector3(102, 142, -52))];
  }, []);
  return (
    <>
      {tubes.map((g, i) => (
        <mesh key={i} geometry={g} material={MAT.gold} />
      ))}
    </>
  );
}

export default function FloatingIslands({ shadows }: { shadows: boolean }) {
  return (
    <group>
      {ISLANDS.map((isl, i) => (
        <IslandMesh key={i} island={isl} shadows={shadows} />
      ))}
      <Bridges />
    </group>
  );
}
