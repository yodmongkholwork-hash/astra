"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { glow, MAT } from "./materials";

/**
 * 01 — Grand Royal Castle (procedural).
 * Cliff plateau → curtain wall with towers → tiered keep → four great towers →
 * central spire crowned by a rotating celestial crystal. Windows are one
 * InstancedMesh; everything shares materials from ./materials.
 */

type Tower = { x: number; z: number; r: number; h: number; roof: number };

const PLATEAU_TOP = 46;

function TowerMesh({ t, shadows }: { t: Tower; shadows: boolean }) {
  return (
    <group position={[t.x, PLATEAU_TOP, t.z]}>
      <mesh material={MAT.stone} position={[0, t.h / 2, 0]} castShadow={shadows} receiveShadow={shadows}>
        <cylinderGeometry args={[t.r * 0.92, t.r, t.h, 14]} />
      </mesh>
      {/* crenellated cap ring */}
      <mesh material={MAT.stoneLight} position={[0, t.h + 1.2, 0]}>
        <cylinderGeometry args={[t.r * 1.15, t.r * 1.05, 2.4, 14]} />
      </mesh>
      <mesh material={MAT.gold} position={[0, t.h + 2.6, 0]}>
        <torusGeometry args={[t.r * 1.1, 0.35, 6, 24]} />
      </mesh>
      <mesh material={MAT.roof} position={[0, t.h + 2.4 + t.roof / 2, 0]} castShadow={shadows}>
        <coneGeometry args={[t.r * 1.2, t.roof, 14]} />
      </mesh>
      <mesh material={MAT.gold} position={[0, t.h + 2.4 + t.roof + 2, 0]}>
        <cylinderGeometry args={[0.15, 0.35, 5, 6]} />
      </mesh>
    </group>
  );
}

export default function Castle({ shadows }: { shadows: boolean }) {
  const crystal = useRef<THREE.Group>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const windows = useRef<THREE.InstancedMesh>(null);

  const { wallTowers, greatTowers, windowMatrices } = useMemo(() => {
    const wallTowers: Tower[] = Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      return { x: Math.sin(a) * 62, z: Math.cos(a) * 62, r: 5.5, h: 30, roof: 14 };
    });
    const greatTowers: Tower[] = Array.from({ length: 4 }, (_, i) => {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      return { x: Math.sin(a) * 26, z: Math.cos(a) * 26, r: 7, h: 78, roof: 30 };
    });
    // lit windows scattered on towers + keep
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(1, 1, 1);
    const p = new THREE.Vector3();
    const list: THREE.Matrix4[] = [];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (const t of [...wallTowers, ...greatTowers]) {
      const rows = Math.floor(t.h / 9);
      for (let r = 1; r < rows; r++) {
        for (let k = 0; k < 4; k++) {
          if (rnd() < 0.35) continue;
          const a = (k / 4) * Math.PI * 2 + rnd() * 0.6;
          p.set(t.x + Math.sin(a) * (t.r * 0.95 + 0.05), PLATEAU_TOP + r * 9, t.z + Math.cos(a) * (t.r * 0.95 + 0.05));
          q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), a);
          list.push(new THREE.Matrix4().compose(p.clone(), q.clone(), s));
        }
      }
    }
    // keep faces
    for (let tier = 0; tier < 3; tier++) {
      const half = [18, 13, 9][tier];
      const y0 = PLATEAU_TOP + [0, 34, 60][tier];
      for (let side = 0; side < 4; side++) {
        for (let j = -2; j <= 2; j++) {
          if (rnd() < 0.3) continue;
          const a = (side / 4) * Math.PI * 2;
          p.set(Math.sin(a) * (half + 0.1) + Math.cos(a) * j * half * 0.35, y0 + 10 + rnd() * 14, Math.cos(a) * (half + 0.1) - Math.sin(a) * j * half * 0.35);
          q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), a);
          list.push(new THREE.Matrix4().compose(p.clone(), q.clone(), s));
        }
      }
    }
    m.identity();
    return { wallTowers, greatTowers, windowMatrices: list };
  }, []);

  useLayoutEffect(() => {
    if (!windows.current) return;
    windowMatrices.forEach((mx, i) => windows.current!.setMatrixAt(i, mx));
    windows.current.instanceMatrix.needsUpdate = true;
  }, [windowMatrices]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (crystal.current) {
      crystal.current.rotation.y += dt * 0.4;
      crystal.current.position.y = 228 + Math.sin(t * 0.8) * 2;
    }
    if (ringA.current) ringA.current.rotation.z += dt * 0.3;
    if (ringB.current) ringB.current.rotation.x += dt * 0.22;
  });

  const runeMat = useMemo(() => glow("#f2c35b", 0.55), []);
  const wallMat = MAT.stone;

  return (
    <group>
      {/* cliff plateau */}
      <mesh material={MAT.rock} position={[0, PLATEAU_TOP / 2 - 6, 0]} castShadow={shadows} receiveShadow={shadows}>
        <cylinderGeometry args={[74, 98, PLATEAU_TOP + 12, 11, 3]} />
      </mesh>
      <mesh material={MAT.stoneLight} position={[0, PLATEAU_TOP, 0]} receiveShadow={shadows}>
        <cylinderGeometry args={[74, 74, 1, 32]} />
      </mesh>

      {/* curtain wall */}
      {wallTowers.map((t, i) => {
        const n = wallTowers[(i + 1) % wallTowers.length];
        const mx = (t.x + n.x) / 2;
        const mz = (t.z + n.z) / 2;
        const len = Math.hypot(n.x - t.x, n.z - t.z);
        const ang = Math.atan2(n.x - t.x, n.z - t.z);
        return (
          <group key={i} position={[mx, PLATEAU_TOP, mz]} rotation={[0, ang, 0]}>
            <mesh material={wallMat} position={[0, 9, 0]} castShadow={shadows} receiveShadow={shadows}>
              <boxGeometry args={[4, 18, len]} />
            </mesh>
            {Array.from({ length: Math.floor(len / 4) }, (_, k) => (
              <mesh key={k} material={MAT.stoneLight} position={[0, 19, -len / 2 + 2 + k * 4]}>
                <boxGeometry args={[4.4, 2, 2]} />
              </mesh>
            ))}
          </group>
        );
      })}
      {wallTowers.map((t, i) => (
        <TowerMesh key={`w${i}`} t={t} shadows={shadows} />
      ))}

      {/* tiered keep */}
      {[
        [36, 34, 0],
        [26, 26, 34],
        [18, 22, 60],
      ].map(([w, h, y], i) => (
        <group key={i} position={[0, PLATEAU_TOP + y, 0]}>
          <mesh material={MAT.stone} position={[0, h / 2, 0]} castShadow={shadows} receiveShadow={shadows}>
            <boxGeometry args={[w, h, w]} />
          </mesh>
          <mesh material={MAT.gold} position={[0, h, 0]}>
            <boxGeometry args={[w + 1.2, 0.8, w + 1.2]} />
          </mesh>
        </group>
      ))}
      {greatTowers.map((t, i) => (
        <TowerMesh key={`g${i}`} t={t} shadows={shadows} />
      ))}

      {/* central spire */}
      <mesh material={MAT.stoneLight} position={[0, PLATEAU_TOP + 82 + 20, 0]} castShadow={shadows}>
        <cylinderGeometry args={[5, 8, 40, 8]} />
      </mesh>
      <mesh material={MAT.roof} position={[0, PLATEAU_TOP + 122 + 18, 0]} castShadow={shadows}>
        <coneGeometry args={[9, 36, 8]} />
      </mesh>
      <mesh material={MAT.gold} position={[0, PLATEAU_TOP + 160 + 4, 0]}>
        <cylinderGeometry args={[0.3, 1, 12, 6]} />
      </mesh>

      {/* celestial crystal */}
      <group ref={crystal} position={[0, 228, 0]}>
        <mesh material={MAT.crystal}>
          <octahedronGeometry args={[6, 0]} />
        </mesh>
        <mesh ref={ringA} material={MAT.gold}>
          <torusGeometry args={[13, 0.35, 8, 64]} />
        </mesh>
        <mesh ref={ringB} material={MAT.gold} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[17, 0.25, 8, 64]} />
        </mesh>
        <pointLight color="#9b7bff" intensity={9000} distance={260} decay={2} />
      </group>

      {/* lit windows */}
      <instancedMesh ref={windows} args={[undefined, undefined, windowMatrices.length]} material={MAT.window}>
        <planeGeometry args={[1.4, 3]} />
      </instancedMesh>

      {/* warm courtyard light */}
      <pointLight position={[0, PLATEAU_TOP + 20, 0]} color="#ffb85c" intensity={6000} distance={180} decay={2} />

      {/* glowing rune circle on the plateau */}
      <mesh material={runeMat} position={[0, PLATEAU_TOP + 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[44, 46, 96]} />
      </mesh>
      <RuneRing />
    </group>
  );
}

/** Rotating ring of rune glyph-bars around the castle moat. */
function RuneRing() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const COUNT = 72;
  const mat = useMemo(() => glow("#5ff0d8", 0.7), []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    for (let i = 0; i < COUNT; i++) {
      const a = (i / COUNT) * Math.PI * 2;
      const len = 2 + ((i * 37) % 5);
      m.compose(new THREE.Vector3(Math.sin(a) * 112, 1.5, Math.cos(a) * 112), new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, -a)), new THREE.Vector3(1, len, 1));
      ref.current!.setMatrixAt(i, m);
    }
    ref.current!.instanceMatrix.needsUpdate = true;
  }, []);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.03;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]} material={mat}>
      <planeGeometry args={[1.2, 1]} />
    </instancedMesh>
  );
}
