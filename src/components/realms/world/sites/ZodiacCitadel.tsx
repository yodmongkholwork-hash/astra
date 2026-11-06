"use client";

import { Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ZODIAC } from "@/lib/engines";
import { glow, MAT } from "../materials";
import { canvasTexture, NearOnly, Portal, Spin } from "./shared";

/**
 * 03 — ZODIAC CITADEL (Phase 3 full environment)
 * Local space: +Z faces the castle. Ground = y 0.
 *  - terraced base, observatory tower with gold bands and lit window slits
 *  - dome with a brass telescope that slowly sweeps the sky
 *  - twin side towers joined by arched bridges
 *  - the Great Zodiac Mechanism above the dome: plaque ring with the 12 signs,
 *    counter-rotating gear ring, tilted ecliptic, armillary sphere around a sun,
 *    seven classical planets on their orbits
 *  - star constellations drawn in the sky above
 *  - interactive portal doorway at the tower foot (enter the Astrology room)
 */

const MECH_Y = 112;

const brass = new THREE.MeshStandardMaterial({ color: "#b8893a", metalness: 1, roughness: 0.32, emissive: "#2a1a06", emissiveIntensity: 0.5 });

function useSignAtlas() {
  return useMemo(() => {
    const S = 128;
    return canvasTexture(S * 12, S, (ctx) => {
      ZODIAC.forEach((z, i) => {
        const x = i * S;
        const g = ctx.createRadialGradient(x + S / 2, S / 2, 4, x + S / 2, S / 2, S / 2);
        g.addColorStop(0, "#1d2c6e");
        g.addColorStop(1, "#08102e");
        ctx.fillStyle = g;
        ctx.fillRect(x, 0, S, S);
        ctx.strokeStyle = "#e6c47a";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x + S / 2, S / 2, S / 2 - 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#f2d28a";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "56px 'Segoe UI Symbol', 'Noto Sans Symbols', 'DejaVu Sans', serif";
        ctx.fillText(z.glyph.replace("︎", ""), x + S / 2, S / 2 - 6);
        ctx.font = "600 13px Georgia, serif";
        ctx.fillText(z.key.toUpperCase(), x + S / 2, S - 22);
      });
    });
  }, []);
}

/** 12 sign plaques standing on the great ring, facing outward. */
function SignRing({ r }: { r: number }) {
  const tex = useSignAtlas();
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: "#ffffff", emissiveIntensity: 0.75, metalness: 0.3, roughness: 0.4, side: THREE.DoubleSide }), [tex]);
  const geos = useMemo(
    () =>
      ZODIAC.map((_, i) => {
        const g = new THREE.CircleGeometry(4.2, 40);
        const uv = g.attributes.uv as THREE.BufferAttribute;
        for (let k = 0; k < uv.count; k++) uv.setX(k, (i + uv.getX(k)) / 12);
        return g;
      }),
    [],
  );
  return (
    <group>
      <mesh material={MAT.gold}>
        <torusGeometry args={[r, 0.7, 10, 128]} />
      </mesh>
      <mesh material={MAT.gold} position={[0, -3.2, 0]}>
        <torusGeometry args={[r, 0.35, 8, 128]} />
      </mesh>
      {ZODIAC.map((z, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <group key={z.key} position={[Math.sin(a) * r, 4.6, Math.cos(a) * r]} rotation={[0, a, 0]}>
            <mesh geometry={geos[i]} material={mat} />
            <mesh material={MAT.gold} position={[0, -4.2, 0]}>
              <cylinderGeometry args={[0.25, 0.25, 4, 6]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Toothed gear ring (instanced teeth). */
function GearRing({ r, teeth }: { r: number; teeth: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      m.compose(new THREE.Vector3(Math.sin(a) * (r + 1), 0, Math.cos(a) * (r + 1)), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a), new THREE.Vector3(1, 1, 1));
      ref.current!.setMatrixAt(i, m);
    }
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [r, teeth]);
  return (
    <group>
      <mesh material={brass} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r, 0.9, 6, 96]} />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, teeth]} material={brass}>
        <boxGeometry args={[1.2, 1.4, 1.6]} />
      </instancedMesh>
    </group>
  );
}

const PLANETS: { name: string; r: number; size: number; color: string; speed: number; ring?: boolean }[] = [
  { name: "Moon", r: 12, size: 1.1, color: "#dfe4f5", speed: 0.9 },
  { name: "Mercury", r: 15, size: 0.9, color: "#c9b28a", speed: 0.7 },
  { name: "Venus", r: 18, size: 1.4, color: "#f7e1a6", speed: 0.5 },
  { name: "Mars", r: 21, size: 1.2, color: "#ff7a5c", speed: 0.38 },
  { name: "Jupiter", r: 24.5, size: 2.4, color: "#e8c39a", speed: 0.24 },
  { name: "Saturn", r: 28, size: 2, color: "#e9d9a8", speed: 0.16, ring: true },
];

function Orrery() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const orbitMat = useMemo(() => glow("#7fb8ff", 0.35), []);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    PLANETS.forEach((p, i) => {
      const g = refs.current[i];
      if (g) g.position.set(Math.cos(t * p.speed * 0.4 + i * 1.3) * p.r, 0, Math.sin(t * p.speed * 0.4 + i * 1.3) * p.r);
    });
  });
  return (
    <group rotation={[0.41, 0, 0]}>
      {PLANETS.map((p, i) => (
        <group key={p.name}>
          <mesh material={orbitMat} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[p.r - 0.08, p.r + 0.08, 128]} />
          </mesh>
          <group ref={(el) => void (refs.current[i] = el)}>
            <mesh>
              <sphereGeometry args={[p.size, 24, 16]} />
              <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={0.55} roughness={0.6} />
            </mesh>
            {p.ring && (
              <mesh rotation={[Math.PI / 2.4, 0, 0]}>
                <ringGeometry args={[p.size * 1.4, p.size * 2.2, 48]} />
                <meshBasicMaterial color="#e9d9a8" transparent opacity={0.6} side={THREE.DoubleSide} />
              </mesh>
            )}
          </group>
        </group>
      ))}
    </group>
  );
}

function Armillary() {
  return (
    <group>
      <Spin speed={0.25}>
        <mesh material={brass}>
          <torusGeometry args={[9, 0.3, 8, 64]} />
        </mesh>
      </Spin>
      <Spin speed={-0.18} axis="x">
        <mesh material={brass} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[8, 0.28, 8, 64]} />
        </mesh>
      </Spin>
      <Spin speed={0.12} axis="z">
        <mesh material={MAT.gold} rotation={[0.4, 0.6, 0]}>
          <torusGeometry args={[10.2, 0.22, 8, 64]} />
        </mesh>
      </Spin>
      <mesh>
        <sphereGeometry args={[4, 32, 24]} />
        <meshBasicMaterial color="#ffd98a" toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[5.6, 24, 16]} />
        <meshBasicMaterial color="#ffb347" transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** A few named constellations drawn as glowing stars + faint lines. */
const CONSTELLATIONS: [number, number, number][][] = [
  // "the Hunter"
  [[-40, 0, 0], [-30, 14, 4], [-18, 22, 0], [-26, -4, 2], [-22, -18, 0], [-36, -16, 3], [-29, 2, 1], [-26, 3, 1], [-23, 4, 1]],
  // "the Scales"
  [[10, 10, 0], [22, 18, -2], [34, 10, 0], [22, 0, -4], [16, -10, 0], [28, -12, 0]],
  // "the Crown"
  [[-6, 34, -6], [2, 38, -6], [10, 40, -5], [18, 38, -4], [24, 33, -3]],
];
const EDGES: [number, number][][] = [
  [[0, 1], [1, 2], [0, 6], [6, 7], [7, 8], [8, 1], [6, 3], [3, 4], [8, 5], [3, 5]],
  [[0, 1], [1, 2], [0, 3], [2, 3], [3, 4], [3, 5]],
  [[0, 1], [1, 2], [2, 3], [3, 4]],
];

function Constellations() {
  const { lines, stars } = useMemo(() => {
    const seg: number[] = [];
    const pts: number[] = [];
    CONSTELLATIONS.forEach((c, k) => {
      c.forEach((p) => pts.push(...p));
      EDGES[k].forEach(([a, b]) => seg.push(...c[a], ...c[b]));
    });
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.Float32BufferAttribute(seg, 3));
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return { lines: lg, stars: pg };
  }, []);
  return (
    <Spin speed={0.02}>
      <group scale={1.4}>
        <lineSegments geometry={lines}>
          <lineBasicMaterial color="#9fc4ff" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
        </lineSegments>
        <points geometry={stars}>
          <pointsMaterial color="#e8f0ff" size={3.2} sizeAttenuation transparent opacity={0.95} toneMapped={false} />
        </points>
      </group>
    </Spin>
  );
}

function Telescope() {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.08) * 0.9;
  });
  return (
    <group ref={ref}>
      <group rotation={[-0.75, 0, 0]}>
        <mesh material={brass} position={[0, 0, 11]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[2.4, 1.5, 24, 20]} />
        </mesh>
        {[3, 10, 18].map((z) => (
          <mesh key={z} material={MAT.gold} position={[0, 0, z]}>
            <torusGeometry args={[2.2 - z * 0.03, 0.3, 6, 24]} />
          </mesh>
        ))}
        <mesh position={[0, 0, 23.1]}>
          <circleGeometry args={[2.3, 24]} />
          <meshBasicMaterial color="#9fd0ff" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

export default function ZodiacCitadel({ color, quality, onPortal }: { color: string; quality: "low" | "medium" | "high"; onPortal?: () => void }) {
  const slitMat = useMemo(() => glow("#9fd0ff", 0.8), []);
  return (
    <group>
      {/* terraced base */}
      {[
        [46, 3, 0],
        [38, 3, 3],
      ].map(([r, h, y], i) => (
        <group key={i}>
          <mesh material={i ? MAT.stoneLight : MAT.stone} position={[0, y + h / 2, 0]} receiveShadow>
            <cylinderGeometry args={[r, r + 2, h, 48]} />
          </mesh>
          <mesh material={MAT.gold} position={[0, y + h, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r, 0.35, 6, 96]} />
          </mesh>
        </group>
      ))}

      {/* observatory tower */}
      <mesh material={MAT.stone} position={[0, 6 + 29, 0]} castShadow>
        <cylinderGeometry args={[9.5, 12, 58, 24]} />
      </mesh>
      {[14, 30, 46, 62].map((y) => (
        <mesh key={y} material={MAT.gold} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[12 - (y - 6) * 0.043 + 0.3, 0.45, 8, 48]} />
        </mesh>
      ))}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 + 0.26;
        const y = 22 + (i % 3) * 14;
        const r = 12 - (y - 6) * 0.043 + 0.05;
        return (
          <mesh key={i} material={slitMat} position={[Math.sin(a) * r, y, Math.cos(a) * r]} rotation={[0, a, 0]}>
            <planeGeometry args={[0.9, 6]} />
          </mesh>
        );
      })}
      {/* dome + telescope */}
      <mesh material={MAT.roof} position={[0, 64, 0]} castShadow>
        <sphereGeometry args={[13, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <group position={[0, 70, 0]}>
        <Telescope />
      </group>

      {/* twin towers + bridges */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <group position={[s * 27, 6, -6]}>
            <mesh material={MAT.stone} position={[0, 19, 0]} castShadow>
              <cylinderGeometry args={[4.5, 5.5, 38, 14]} />
            </mesh>
            <mesh material={MAT.roof} position={[0, 38, 0]}>
              <sphereGeometry args={[5.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            <mesh material={MAT.gold} position={[0, 45, 0]}>
              <cylinderGeometry args={[0.15, 0.5, 4, 6]} />
            </mesh>
          </group>
          <mesh material={MAT.stoneLight}>
            <tubeGeometry args={[new THREE.QuadraticBezierCurve3(new THREE.Vector3(s * 23, 38, -6), new THREE.Vector3(s * 16, 44, -4), new THREE.Vector3(s * 9.6, 40, -1)), 20, 1.1, 6, false]} />
          </mesh>
        </group>
      ))}

      {/* struts carrying the mechanism */}
      {[0, 1, 2, 3].map((k) => {
        const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
        const from = new THREE.Vector3(Math.sin(a) * 11, 66, Math.cos(a) * 11);
        const to = new THREE.Vector3(Math.sin(a) * 30, MECH_Y - 4, Math.cos(a) * 30);
        return (
          <mesh key={k} material={brass}>
            <tubeGeometry args={[new THREE.LineCurve3(from, to), 1, 0.45, 6, false]} />
          </mesh>
        );
      })}

      {/* the Great Zodiac Mechanism */}
      <group position={[0, MECH_Y, 0]} name="zodiac-mechanism">
        <Spin speed={0.05}>
          <SignRing r={36} />
        </Spin>
        <group position={[0, -4, 0]}>
          <Spin speed={-0.09}>
            <GearRing r={30} teeth={quality === "low" ? 40 : 72} />
          </Spin>
        </group>
        <mesh rotation={[Math.PI / 2 + 0.41, 0, 0]}>
          <torusGeometry args={[33, 0.2, 6, 128]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        <Armillary />
        <Orrery />
        <pointLight color="#ffd98a" intensity={9000} distance={160} decay={2} />
      </group>

      {/* constellations overhead */}
      <group position={[0, MECH_Y + 75, -30]}>
        <Constellations />
      </group>

      <NearOnly distance={450}>
        <Sparkles count={quality === "low" ? 40 : 120} scale={[100, 60, 100]} position={[0, MECH_Y, 0]} size={6} speed={0.25} color="#9fc4ff" />
      </NearOnly>

      {/* the entrance */}
      <group position={[0, 6, 12.3]}>
        <Portal width={7} height={12} color={color} onActivate={onPortal} label="zodiac-portal" />
      </group>
    </group>
  );
}
