"use client";

import { Float, Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { DECK } from "@/lib/data/tarot";
import { glow, MAT } from "../materials";
import { canvasTexture, drawSigil, Flames, NearOnly, Portal, Spin } from "./shared";

/**
 * 02 — TAROT SANCTUARY (Phase 3 full environment)
 * Local space: +Z faces the castle (the approach). Ground = y 0.
 *  - circular plaza with gold rune rings, obelisk braziers lining the approach
 *  - three-tier temple platform, grand stair, portico with six columns, pediment
 *  - interactive portal doorway (enter the existing Tarot room)
 *  - side shrine towers with glowing chamber niches
 *  - a floating ring of the 22 Major Arcana around a turning Wheel of Fortune
 *  - candles on every tier (instanced) with flickering flames
 */

const CARD_W = 160;
const CARD_H = 256;
const MAJOR = DECK.slice(0, 22);

function useCardAtlas() {
  return useMemo(() => {
    const cols = 11;
    const tex = canvasTexture(CARD_W * cols, CARD_H * 2, (ctx) => {
      MAJOR.forEach((card, i) => {
        const x = (i % cols) * CARD_W;
        const y = Math.floor(i / cols) * CARD_H;
        const g = ctx.createLinearGradient(x, y, x, y + CARD_H);
        g.addColorStop(0, "#2a1452");
        g.addColorStop(1, "#0d0620");
        ctx.fillStyle = g;
        ctx.fillRect(x, y, CARD_W, CARD_H);
        ctx.strokeStyle = "#e6c47a";
        ctx.lineWidth = 4;
        ctx.strokeRect(x + 6, y + 6, CARD_W - 12, CARD_H - 12);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 13, y + 13, CARD_W - 26, CARD_H - 26);
        ctx.fillStyle = "#f2d28a";
        ctx.textAlign = "center";
        ctx.font = "600 22px Georgia, 'Times New Roman', serif";
        ctx.fillText(card.numeral, x + CARD_W / 2, y + 44);
        // procedural sigil: star polygon unique to each arcana
        const pts = 5 + (i % 7);
        const step = [2, 3, 2, 3, 3, 4, 3][i % 7];
        ctx.strokeStyle = "#f2d28a";
        ctx.lineWidth = 2.2;
        drawSigil(ctx, x + CARD_W / 2, y + CARD_H / 2 + 4, 42, pts, step);
        ctx.beginPath();
        ctx.arc(x + CARD_W / 2, y + CARD_H / 2 + 4, 8 + (i % 4) * 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(242,210,138,.85)";
        ctx.fill();
        ctx.fillStyle = "#f4ead5";
        ctx.font = "500 15px Georgia, 'Times New Roman', serif";
        ctx.fillText(card.name.toUpperCase().replace("THE ", ""), x + CARD_W / 2, y + CARD_H - 30);
      });
    });
    const back = canvasTexture(CARD_W, CARD_H, (ctx) => {
      ctx.fillStyle = "#170a30";
      ctx.fillRect(0, 0, CARD_W, CARD_H);
      ctx.strokeStyle = "#c9a24e";
      ctx.lineWidth = 4;
      ctx.strokeRect(6, 6, CARD_W - 12, CARD_H - 12);
      ctx.lineWidth = 1.5;
      for (let k = 0; k < 3; k++) drawSigil(ctx, CARD_W / 2, CARD_H / 2, 22 + k * 18, 8, 3);
    });
    return { tex, back, cols };
  }, []);
}

/** 22 cards on a vertical carousel; each card bobs on its own phase. */
function ArcanaRing({ radius, quality }: { radius: number; quality: "low" | "medium" | "high" }) {
  const { tex, back, cols } = useCardAtlas();
  const front = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: "#ffffff", emissiveIntensity: 0.55, roughness: 0.4, metalness: 0.2 }), [tex]);
  const backMat = useMemo(() => new THREE.MeshStandardMaterial({ map: back, emissiveMap: back, emissive: "#ffffff", emissiveIntensity: 0.35, roughness: 0.5 }), [back]);
  const geos = useMemo(
    () =>
      MAJOR.map((_, i) => {
        const g = new THREE.PlaneGeometry(5, 8);
        const u0 = (i % cols) / cols;
        const v0 = 1 - (Math.floor(i / cols) + 1) / 2;
        const uv = g.attributes.uv as THREE.BufferAttribute;
        for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) / cols, v0 + uv.getY(k) / 2);
        return g;
      }),
    [cols],
  );
  const backGeo = useMemo(() => new THREE.PlaneGeometry(5, 8), []);
  const n = quality === "low" ? 12 : 22;
  return (
    <Spin speed={0.12}>
      {MAJOR.slice(0, n).map((_, i) => {
        const a = (i / n) * Math.PI * 2;
        return (
          <group key={i} position={[Math.sin(a) * radius, Math.sin(i * 1.7) * 2.5, Math.cos(a) * radius]} rotation={[0, a, 0]}>
            <Float speed={1.4} floatIntensity={1.5} rotationIntensity={0.25}>
              <mesh geometry={geos[i]} material={front} />
              <mesh geometry={backGeo} material={backMat} rotation={[0, Math.PI, 0]} position={[0, 0, -0.02]} />
            </Float>
          </group>
        );
      })}
    </Spin>
  );
}

/** The turning Wheel of Fortune at the heart of the card ring (close-up subject). */
function WheelOfFortune({ r }: { r: number }) {
  const ref = useRef<THREE.Group>(null);
  const tex = useMemo(
    () =>
      canvasTexture(512, 512, (ctx) => {
        const c = 256;
        const g = ctx.createRadialGradient(c, c, 10, c, c, 250);
        g.addColorStop(0, "#3b1d6e");
        g.addColorStop(1, "#0d0620");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(c, c, 250, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#e6c47a";
        [244, 200, 120, 60].forEach((rr, k) => {
          ctx.lineWidth = k === 0 ? 8 : 3;
          ctx.beginPath();
          ctx.arc(c, c, rr, 0, Math.PI * 2);
          ctx.stroke();
        });
        ctx.lineWidth = 3;
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(c + Math.cos(a) * 60, c + Math.sin(a) * 60);
          ctx.lineTo(c + Math.cos(a) * 244, c + Math.sin(a) * 244);
          ctx.stroke();
        }
        ctx.fillStyle = "#f2d28a";
        ctx.font = "600 34px Georgia, serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ["R", "O", "T", "A"].forEach((ch, k) => {
          const a = (k / 4) * Math.PI * 2 - Math.PI / 2 + Math.PI / 8;
          ctx.fillText(ch, c + Math.cos(a) * 160, c + Math.sin(a) * 160);
        });
        ["I", "V", "X", "XXI"].forEach((ch, k) => {
          const a = (k / 4) * Math.PI * 2 - Math.PI / 2 + Math.PI / 8 + Math.PI / 4;
          ctx.font = "500 22px Georgia, serif";
          ctx.fillText(ch, c + Math.cos(a) * 160, c + Math.sin(a) * 160);
        });
        ctx.lineWidth = 2;
        drawSigil(ctx, c, c, 46, 7, 3);
      }),
    [],
  );
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: "#ffffff", emissiveIntensity: 0.8, metalness: 0.4, roughness: 0.35, side: THREE.DoubleSide }), [tex]);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * 0.15;
  });
  return (
    <group>
      <group ref={ref}>
        <mesh material={mat}>
          <circleGeometry args={[r, 64]} />
        </mesh>
      </group>
      <mesh material={MAT.gold}>
        <torusGeometry args={[r + 0.6, 0.6, 10, 72]} />
      </mesh>
      {Array.from({ length: 12 }, (_, k) => {
        const a = (k / 12) * Math.PI * 2;
        return (
          <mesh key={k} material={MAT.gold} position={[Math.cos(a) * (r + 1.6), Math.sin(a) * (r + 1.6), 0]} rotation={[0, 0, a]}>
            <boxGeometry args={[1.8, 0.8, 0.8]} />
          </mesh>
        );
      })}
    </group>
  );
}

function Candles({ spots }: { spots: [number, number, number][] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#efe3c8", roughness: 0.8, emissive: "#3a2410", emissiveIntensity: 0.4 }), []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    spots.forEach((p, i) => {
      const h = 0.8 + ((i * 7) % 5) * 0.25;
      m.compose(new THREE.Vector3(p[0], p[1] + h / 2, p[2]), new THREE.Quaternion(), new THREE.Vector3(1, h, 1));
      ref.current!.setMatrixAt(i, m);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [spots]);
  const flames = useMemo(() => spots.map((p, i) => [p[0], p[1] + 0.8 + ((i * 7) % 5) * 0.25 + 0.45, p[2]] as [number, number, number]), [spots]);
  return (
    <>
      <instancedMesh ref={ref} args={[undefined, undefined, spots.length]} material={mat}>
        <cylinderGeometry args={[0.22, 0.25, 1, 8]} />
      </instancedMesh>
      <Flames points={flames} size={1.6} />
    </>
  );
}

function FlickerLight({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.PointLight>(null);
  useFrame((s) => {
    if (ref.current) ref.current.intensity = 1400 + Math.sin(s.clock.elapsedTime * 11 + position[0]) * 220 + Math.sin(s.clock.elapsedTime * 23) * 120;
  });
  return <pointLight ref={ref} position={position} color={color} distance={70} decay={2} />;
}

export default function TarotSanctuary({ color, quality, onPortal }: { color: string; quality: "low" | "medium" | "high"; onPortal?: () => void }) {
  const runeMat = useMemo(() => glow("#e6c47a", 0.5), []);
  const niche = useMemo(() => glow(color, 0.55), [color]);

  const candleSpots = useMemo(() => {
    const out: [number, number, number][] = [];
    // along the front edge of each tier, skipping the stair opening
    [
      [25, 4, 20],
      [21, 8, 17],
      [18, 12, 14],
    ].forEach(([hw, y, z]) => {
      for (let x = -hw + 1.5; x <= hw - 1.5; x += 2.6) if (Math.abs(x) > 8.5) out.push([x, y, z - 6 - 0.8]);
    });
    // a ring of candles around the rune circle
    for (let k = 0; k < 28; k++) {
      const a = (k / 28) * Math.PI * 2;
      out.push([Math.sin(a) * 46, 0.6, Math.cos(a) * 46]);
    }
    return out;
  }, []);

  return (
    <group>
      {/* plaza */}
      <mesh material={MAT.stone} position={[0, 0.3, 0]} receiveShadow>
        <cylinderGeometry args={[58, 60, 1.2, 48]} />
      </mesh>
      {[50, 42].map((r) => (
        <mesh key={r} material={runeMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 1, 0]}>
          <ringGeometry args={[r, r + 0.8, 96]} />
        </mesh>
      ))}

      {/* three-tier platform + grand stair */}
      {[
        [50, 40],
        [42, 34],
        [36, 28],
      ].map(([w, d], i) => (
        <mesh key={i} material={i === 2 ? MAT.stoneLight : MAT.stone} position={[0, 2 + i * 4, -6]} castShadow receiveShadow>
          <boxGeometry args={[w, 4, d]} />
        </mesh>
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} material={MAT.stoneLight} position={[0, 0.75 + i * 1.5, 22 - i * 1.6]}>
          <boxGeometry args={[15, 1.5, 3]} />
        </mesh>
      ))}

      {/* temple hall */}
      <group position={[0, 12, -8]}>
        <mesh material={MAT.stone} position={[0, 8, 0]} castShadow>
          <boxGeometry args={[26, 16, 20]} />
        </mesh>
        {/* portico: six columns, wide central bay for the portal */}
        {[-12.5, -9, -5.5, 5.5, 9, 12.5].map((x) => (
          <group key={x} position={[x, 0, 13.5]}>
            <mesh material={MAT.stoneLight} position={[0, 8, 0]} castShadow>
              <cylinderGeometry args={[0.95, 1.1, 16, 12]} />
            </mesh>
            <mesh material={MAT.gold} position={[0, 15.6, 0]}>
              <boxGeometry args={[2.6, 0.8, 2.6]} />
            </mesh>
          </group>
        ))}
        <mesh material={MAT.stone} position={[0, 17.2, 7]}>
          <boxGeometry args={[30, 2.4, 16]} />
        </mesh>
        <mesh material={MAT.gold} position={[0, 18.6, 15]}>
          <boxGeometry args={[30.4, 0.5, 0.5]} />
        </mesh>
        {/* pediment: triangular prism */}
        <mesh material={MAT.roof} position={[0, 21.5, 2]} rotation={[0, 0, 0]} scale={[1, 1, 1]}>
          <cylinderGeometry args={[0.01, 17, 6, 4, 1, false, Math.PI / 4]} />
        </mesh>
        <mesh material={MAT.gold} position={[0, 25.2, 2]}>
          <octahedronGeometry args={[1.4, 0]} />
        </mesh>
        {/* the entrance */}
        <group position={[0, 0, 10.1]}>
          <Portal width={8} height={13} color={color} onActivate={onPortal} label="tarot-portal" />
        </group>
      </group>

      {/* side shrines with glowing chamber niches */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 21, 12, -10]}>
          <mesh material={MAT.stone} position={[0, 10, 0]} castShadow>
            <cylinderGeometry args={[4, 4.6, 20, 12]} />
          </mesh>
          <mesh material={MAT.gold} position={[0, 23.5, 0]}>
            <coneGeometry args={[5, 7, 12]} />
          </mesh>
          {[5, 11, 17].map((y) => (
            <mesh key={y} material={niche} position={[0, y, 4.55]}>
              <planeGeometry args={[1.6, 3]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* obelisk braziers lining the approach */}
      {[
        [-11, 30],
        [11, 30],
        [-11, 42],
        [11, 42],
      ].map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 1, z]}>
          <mesh material={MAT.stoneLight} position={[0, 6, 0]}>
            <boxGeometry args={[2.2, 12, 2.2]} />
          </mesh>
          <mesh material={MAT.gold} position={[0, 12.8, 0]}>
            <cylinderGeometry args={[2, 1, 1.6, 12]} />
          </mesh>
        </group>
      ))}
      <Flames
        points={[
          [-11, 15, 30],
          [11, 15, 30],
          [-11, 15, 42],
          [11, 15, 42],
        ]}
        size={9}
      />
      <FlickerLight position={[-11, 17, 36]} color="#ffb35c" />
      <FlickerLight position={[11, 17, 36]} color="#ffb35c" />

      {/* candles + motes only when the camera is near (overview stays cheap) */}
      <NearOnly distance={420}>
        <Candles spots={candleSpots} />
        <Sparkles count={quality === "low" ? 40 : 110} scale={[90, 70, 90]} position={[0, 35, -6]} size={5} speed={0.35} color="#f2d28a" />
      </NearOnly>

      {/* floating arcana + wheel of fortune */}
      <group position={[0, 62, -8]} name="tarot-wheel">
        <ArcanaRing radius={24} quality={quality} />
        <WheelOfFortune r={12} />
        <pointLight color={color} intensity={6000} distance={120} decay={2} />
      </group>
    </group>
  );
}
