"use client";

import { Float, Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { LOCATIONS, type LocationId } from "@/lib/realms/locations";
import { glow, MAT } from "./materials";

/**
 * Territory landmarks (Phase 1–2 silhouettes).
 * Each has its own architecture, light colour and a signature animated object,
 * so territories read clearly from the aerial overview. Phases 3–4 expand each
 * into a full environment with interior shots.
 */

function Spin({ speed = 0.3, axis = "y", children }: { speed?: number; axis?: "x" | "y" | "z"; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation[axis] += dt * speed;
  });
  return <group ref={ref}>{children}</group>;
}

const Light = ({ color, y = 30, intensity = 4000 }: { color: string; y?: number; intensity?: number }) => <pointLight position={[0, y, 0]} color={color} intensity={intensity} distance={160} decay={2} />;

/* 02 — Tarot Sanctuary: stepped temple with columns and orbiting golden cards */
function Tarot({ c }: { c: string }) {
  const cardMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a1650", emissive: c, emissiveIntensity: 0.9, metalness: 0.6, roughness: 0.3, side: THREE.DoubleSide }), [c]);
  return (
    <group>
      {[44, 36, 28].map((w, i) => (
        <mesh key={w} material={MAT.stone} position={[0, 3 + i * 5, 0]}>
          <boxGeometry args={[w, 5, w * 0.8]} />
        </mesh>
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} material={MAT.stoneLight} position={[-10.5 + i * 3, 25, 9]}>
          <cylinderGeometry args={[0.8, 0.9, 14, 10]} />
        </mesh>
      ))}
      <mesh material={MAT.stone} position={[0, 26, -2]}>
        <boxGeometry args={[26, 14, 16]} />
      </mesh>
      <mesh material={MAT.gold} position={[0, 36.5, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.1, 15, 7, 4]} />
      </mesh>
      <group position={[0, 52, 0]}>
        <Spin speed={0.35}>
          {Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2;
            return (
              <Float key={i} speed={2} floatIntensity={2} rotationIntensity={0.4}>
                <mesh material={cardMat} position={[Math.sin(a) * 16, Math.sin(i) * 3, Math.cos(a) * 16]} rotation={[0, a, 0]}>
                  <planeGeometry args={[4, 6.6]} />
                </mesh>
              </Float>
            );
          })}
        </Spin>
      </group>
      {/* candle flames */}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} material={MAT.window} position={[-20 + (i % 5) * 10, 8.5, i < 5 ? 17.5 : -17.5]}>
          <sphereGeometry args={[0.5, 6, 6]} />
        </mesh>
      ))}
      <Light color={c} y={40} />
    </group>
  );
}

/* 03 — Zodiac Citadel: observatory tower with a giant armillary mechanism */
function Zodiac({ c }: { c: string }) {
  const ringMat = useMemo(() => glow(c, 0.85), [c]);
  return (
    <group>
      <mesh material={MAT.stone} position={[0, 30, 0]}>
        <cylinderGeometry args={[9, 14, 60, 16]} />
      </mesh>
      <mesh material={MAT.roof} position={[0, 64, 0]}>
        <sphereGeometry args={[12, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={MAT.stone} position={[s * 22, 14, 0]}>
          <cylinderGeometry args={[4, 5.5, 28, 10]} />
        </mesh>
      ))}
      <group position={[0, 90, 0]}>
        <Spin speed={0.2}>
          <mesh material={MAT.gold}>
            <torusGeometry args={[26, 0.6, 8, 96]} />
          </mesh>
        </Spin>
        <Spin speed={-0.3} axis="x">
          <mesh material={MAT.gold} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[21, 0.5, 8, 96]} />
          </mesh>
        </Spin>
        <Spin speed={0.12} axis="z">
          <mesh material={ringMat} rotation={[Math.PI / 2.6, 0, 0]}>
            <torusGeometry args={[31, 0.25, 6, 128]} />
          </mesh>
        </Spin>
        <mesh>
          <sphereGeometry args={[4, 24, 16]} />
          <meshBasicMaterial color="#ffe6a8" toneMapped={false} />
        </mesh>
        <Spin speed={0.5}>
          {[["#7fb8ff", 12, 1.6], ["#ff8a6b", 17, 1.2], ["#f7e1a6", 24, 2.2]].map(([col, r, s], i) => (
            <mesh key={i} position={[r as number, 0, 0]} rotation={[0, i, 0]}>
              <sphereGeometry args={[s as number, 16, 12]} />
              <meshStandardMaterial color={col as string} emissive={col as string} emissiveIntensity={0.8} />
            </mesh>
          ))}
        </Spin>
      </group>
      <Light color={c} y={80} intensity={6000} />
    </group>
  );
}

function Prang({ h, x, z }: { h: number; x: number; z: number }) {
  return (
    <group position={[x, 10, z]}>
      {Array.from({ length: 6 }, (_, i) => {
        const w = (1 - i / 7) * h * 0.22;
        return (
          <mesh key={i} material={i % 2 ? MAT.gold : MAT.stoneLight} position={[0, (i * h) / 7, 0]}>
            <cylinderGeometry args={[w * 0.8, w, h / 7, 8]} />
          </mesh>
        );
      })}
      <mesh material={MAT.gold} position={[0, h * 0.86 + h * 0.08, 0]}>
        <coneGeometry args={[h * 0.05, h * 0.25, 8]} />
      </mesh>
    </group>
  );
}

/* 04 — Siam Astral Temple: prang towers on a terraced base, golden finials */
function Siam({ c }: { c: string }) {
  return (
    <group>
      {[52, 42, 32].map((w, i) => (
        <mesh key={w} material={i === 2 ? MAT.gold : MAT.stone} position={[0, 1.6 + i * 3.4, 0]}>
          <boxGeometry args={[w, 3.4, w]} />
        </mesh>
      ))}
      <Prang h={70} x={0} z={0} />
      {[[-12, -12], [12, -12], [-12, 12], [12, 12]].map(([x, z]) => (
        <Prang key={`${x}${z}`} h={38} x={x} z={z} />
      ))}
      {/* nine planetary orbs */}
      <group position={[0, 48, 0]}>
        <Spin speed={0.25}>
          {Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.sin(a) * 24, Math.cos(i * 2) * 2, Math.cos(a) * 24]}>
                <sphereGeometry args={[1.3, 12, 8]} />
                <meshBasicMaterial color={c} toneMapped={false} />
              </mesh>
            );
          })}
        </Spin>
      </group>
      <Light color={c} y={36} />
    </group>
  );
}

/* 05 — Five Elements Empire: five-tier pagoda, floating yin-yang, five element orbs */
function Elements({ c }: { c: string }) {
  const red = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5a0f14", roughness: 0.6 }), []);
  const yin = useMemo(() => new THREE.MeshBasicMaterial({ color: "#0b0b10" }), []);
  const yang = useMemo(() => new THREE.MeshBasicMaterial({ color: "#f4ead5", toneMapped: false }), []);
  const ELEM = ["#3fbf8f", "#e05a4a", "#c99a45", "#d8dcef", "#5aa0ff"];
  return (
    <group>
      <mesh material={MAT.stone} position={[0, 2, 0]}>
        <cylinderGeometry args={[30, 32, 4, 8]} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => {
        const w = 18 - i * 2.6;
        const y = 4 + i * 11;
        return (
          <group key={i} position={[0, y, 0]}>
            <mesh material={red} position={[0, 4, 0]}>
              <boxGeometry args={[w, 8, w]} />
            </mesh>
            <mesh material={MAT.roof} position={[0, 9.5, 0]} rotation={[0, Math.PI / 4, 0]}>
              <coneGeometry args={[w * 1.05, 4, 4]} />
            </mesh>
            <mesh material={MAT.gold} position={[0, 8, 0]}>
              <boxGeometry args={[w + 0.6, 0.4, w + 0.6]} />
            </mesh>
          </group>
        );
      })}
      <mesh material={MAT.gold} position={[0, 66, 0]}>
        <cylinderGeometry args={[0.2, 0.6, 8, 6]} />
      </mesh>
      {/* yin-yang disc */}
      <group position={[0, 92, 0]}>
        <Spin speed={0.4} axis="z">
          <group rotation={[0, 0, 0]}>
            <mesh material={yang}>
              <circleGeometry args={[12, 48, 0, Math.PI]} />
            </mesh>
            <mesh material={yin} rotation={[0, 0, Math.PI]}>
              <circleGeometry args={[12, 48, 0, Math.PI]} />
            </mesh>
            <mesh material={yin} position={[6, 0, 0.05]}>
              <circleGeometry args={[6, 32]} />
            </mesh>
            <mesh material={yang} position={[-6, 0, 0.05]}>
              <circleGeometry args={[6, 32]} />
            </mesh>
            <mesh material={yang} position={[6, 0, 0.1]}>
              <circleGeometry args={[1.6, 16]} />
            </mesh>
            <mesh material={yin} position={[-6, 0, 0.1]}>
              <circleGeometry args={[1.6, 16]} />
            </mesh>
          </group>
        </Spin>
      </group>
      <Spin speed={0.3}>
        {ELEM.map((col, i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <Float key={col} speed={1.5} floatIntensity={3}>
              <mesh position={[Math.sin(a) * 36, 30, Math.cos(a) * 36]}>
                <icosahedronGeometry args={[3, 0]} />
                <meshBasicMaterial color={col} toneMapped={false} />
              </mesh>
            </Float>
          );
        })}
      </Spin>
      <Light color={c} y={40} />
    </group>
  );
}

/* 06 — Numeria Kingdom: city of rune obelisks with orbiting glowing digits (as glyph blocks) */
function Numeria({ c }: { c: string }) {
  const runeMat = useMemo(() => glow(c, 0.9), [c]);
  const obelisks = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const r = i % 2 ? 30 : 18;
        return { x: Math.sin(a) * r, z: Math.cos(a) * r, h: 16 + ((i * 7) % 5) * 7 };
      }),
    [],
  );
  return (
    <group>
      <mesh material={MAT.stone} position={[0, 1, 0]}>
        <cylinderGeometry args={[40, 42, 2, 9]} />
      </mesh>
      {obelisks.map((o, i) => (
        <group key={i} position={[o.x, 2, o.z]}>
          <mesh material={MAT.stoneLight} position={[0, o.h / 2, 0]}>
            <boxGeometry args={[3, o.h, 3]} />
          </mesh>
          <mesh material={MAT.gold} position={[0, o.h + 1.5, 0]}>
            <coneGeometry args={[2.1, 3, 4]} />
          </mesh>
          {[0.3, 0.55, 0.8].map((f) => (
            <mesh key={f} material={runeMat} position={[0, o.h * f, 1.52]}>
              <planeGeometry args={[1.6, 0.5]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* central nonagon "equation" rings */}
      <group position={[0, 40, 0]}>
        {[10, 16, 22].map((r, i) => (
          <Spin key={r} speed={(i % 2 ? -1 : 1) * (0.2 + i * 0.1)}>
            <mesh material={runeMat} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[r, 0.35, 4, 9]} />
            </mesh>
          </Spin>
        ))}
        <mesh material={MAT.crystal}>
          <dodecahedronGeometry args={[4, 0]} />
        </mesh>
      </group>
      <Sparkles count={60} scale={[60, 50, 60]} position={[0, 30, 0]} size={6} speed={0.4} color={c} />
      <Light color={c} y={40} />
    </group>
  );
}

/* 07 — Dreamveil Forest: glowing trees in a ring of mist with drifting lights */
function Dreamveil({ c }: { c: string }) {
  const trunk = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1b1026", roughness: 0.9 }), []);
  const leaves = useMemo(() => new THREE.MeshStandardMaterial({ color: "#0f1a22", emissive: c, emissiveIntensity: 0.18, roughness: 0.85 }), [c]);
  const glowLeaf = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a1438", emissive: c, emissiveIntensity: 0.9, roughness: 0.6 }), [c]);
  const trees = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => {
        const a = i * 2.399; // golden-angle scatter
        const r = 8 + Math.sqrt(i) * 9;
        return { x: Math.sin(a) * r, z: Math.cos(a) * r, h: 14 + ((i * 11) % 9) * 2.4, s: 4 + ((i * 5) % 4) };
      }),
    [],
  );
  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          <mesh material={trunk} position={[0, t.h / 2, 0]}>
            <cylinderGeometry args={[0.5, 1.1, t.h, 6]} />
          </mesh>
          {[0, 1, 2].map((k) => (
            <mesh key={k} material={k === 2 && i % 3 === 0 ? glowLeaf : leaves} position={[0, t.h * (0.45 + k * 0.22), 0]}>
              <coneGeometry args={[t.s * (1 - k * 0.25), t.h * 0.42, 7]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* dream moon-gate */}
      <mesh material={MAT.crystal} position={[0, 14, 0]}>
        <torusGeometry args={[9, 0.8, 12, 48]} />
      </mesh>
      <Sparkles count={120} scale={[80, 30, 80]} position={[0, 16, 0]} size={10} speed={0.25} color={c} />
      <Light color={c} y={34} intensity={900} />
    </group>
  );
}

/* 08 — Palmistry Tower: tall wizard tower with a floating, glowing palm sigil */
function Palmistry({ c }: { c: string }) {
  const palmShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-4, -6);
    s.quadraticCurveTo(-6, 0, -5, 3);
    [-4, -1.5, 1, 3.5].forEach((x, i) => {
      const top = 7 + (i === 1 || i === 2 ? 2.5 : 0.5);
      s.lineTo(x - 0.8, 3.5);
      s.lineTo(x - 0.8, top);
      s.quadraticCurveTo(x, top + 1.4, x + 0.8, top);
      s.lineTo(x + 0.8, 3.5);
    });
    s.lineTo(5, 0);
    s.lineTo(8, 2.5);
    s.quadraticCurveTo(9, 1.5, 7, -1);
    s.quadraticCurveTo(5, -6, 4, -6);
    s.lineTo(-4, -6);
    return new THREE.ShapeGeometry(s);
  }, []);
  const palmMat = useMemo(() => glow(c, 0.75), [c]);
  return (
    <group>
      <mesh material={MAT.rock} position={[0, 6, 0]}>
        <cylinderGeometry args={[16, 22, 12, 9]} />
      </mesh>
      <mesh material={MAT.stone} position={[0, 60, 0]}>
        <cylinderGeometry args={[7, 10, 100, 12]} />
      </mesh>
      {[34, 62, 90].map((y) => (
        <mesh key={y} material={MAT.gold} position={[0, y, 0]}>
          <torusGeometry args={[8.6, 0.5, 6, 24]} />
        </mesh>
      ))}
      <mesh material={MAT.stoneLight} position={[0, 112, 0]}>
        <cylinderGeometry args={[11, 8, 6, 12]} />
      </mesh>
      <mesh material={MAT.roof} position={[0, 128, 0]}>
        <coneGeometry args={[12, 28, 12]} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} material={MAT.window} position={[Math.sin(i * 2.4) * 8.5, 20 + i * 9, Math.cos(i * 2.4) * 8.5]} rotation={[0, i * 2.4, 0]}>
          <planeGeometry args={[1.2, 2.6]} />
        </mesh>
      ))}
      <Float speed={1.4} floatIntensity={4} rotationIntensity={0.2}>
        <Spin speed={0.35}>
          <mesh geometry={palmShape} material={palmMat} position={[0, 156, 0]} scale={1.6} />
        </Spin>
      </Float>
      <Light color={c} y={150} intensity={5000} />
    </group>
  );
}

const BUILD: Record<Exclude<LocationId, "castle">, (p: { c: string }) => ReactNode> = {
  tarot: Tarot,
  zodiac: Zodiac,
  siam: Siam,
  elements: Elements,
  numeria: Numeria,
  dreamveil: Dreamveil,
  palmistry: Palmistry,
};

export default function Landmarks() {
  return (
    <group>
      {LOCATIONS.filter((l) => l.id !== "castle").map((l) => {
        const B = BUILD[l.id as Exclude<LocationId, "castle">];
        // face the castle
        const yaw = Math.atan2(-l.position[0], -l.position[2]);
        return (
          <group key={l.id} position={[l.position[0], 4, l.position[2]]} rotation={[0, yaw, 0]}>
            <B c={l.color} />
          </group>
        );
      })}
    </group>
  );
}
