"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { LOCATIONS, type LocationId, type RealmLocation } from "@/lib/realms/locations";

/** Pillar of light + pulsing ground ring + HTML label (a real <button>, so keyboard & screen readers work). */
function Beacon({ loc, selected, dimmed, onSelect, showLabel }: { loc: RealmLocation; selected: boolean; dimmed: boolean; onSelect: (id: LocationId) => void; showLabel: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  const beamMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uColor: { value: new THREE.Color(loc.color) }, uStrength: { value: 0.5 } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `uniform vec3 uColor; uniform float uStrength; varying vec2 vUv;
          void main(){ float a = pow(1.0 - vUv.y, 1.6) * uStrength; gl_FragColor = vec4(uColor * 1.6, a); }`,
      }),
    [loc.color],
  );
  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({ color: loc.color, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), [loc.color]);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const target = dimmed ? 0.12 : selected ? 0.95 : 0.45;
    beamMat.uniforms.uStrength.value += (target - beamMat.uniforms.uStrength.value) * 0.08;
    if (ring.current) {
      const k = 1 + ((t * 0.6 + loc.position[0]) % 1) * 0.8;
      ring.current.scale.setScalar(k);
      ringMat.opacity = (1 - (k - 1) / 0.8) * (dimmed ? 0.2 : 0.7);
    }
  });

  const top = loc.id === "castle" ? 270 : loc.id === "palmistry" ? 190 : 140;
  return (
    <group position={[loc.position[0], 4, loc.position[2]]}>
      <mesh material={beamMat} position={[0, top / 2, 0]}>
        <cylinderGeometry args={[1.6, 5, top, 12, 1, true]} />
      </mesh>
      <mesh ref={ring} material={ringMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 1, 0]}>
        <ringGeometry args={[loc.id === "castle" ? 120 : 46, loc.id === "castle" ? 123 : 48, 64]} />
      </mesh>
      {showLabel && (
        <Html position={[0, top + 6, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: "auto" }}>
          <button
            type="button"
            onClick={() => onSelect(loc.id)}
            aria-label={`${loc.name} — ${loc.nameTh}`}
            className={`realm-marker ${selected ? "is-selected" : ""} ${dimmed ? "is-dimmed" : ""}`}
            style={{ ["--c" as string]: loc.color }}
          >
            <span className="realm-marker__dot" />
            <span className="realm-marker__text">
              <span className="realm-marker__index">{loc.index}</span>
              {loc.name}
            </span>
          </button>
        </Html>
      )}
    </group>
  );
}

export default function Markers({ selected, focusMode, onSelect, visible }: { selected: LocationId | null; focusMode: boolean; onSelect: (id: LocationId) => void; visible: boolean }) {
  return (
    <group>
      {LOCATIONS.map((l) => (
        <Beacon key={l.id} loc={l} selected={selected === l.id} dimmed={focusMode && selected !== l.id} onSelect={onSelect} showLabel={visible && (!focusMode || selected === l.id)} />
      ))}
    </group>
  );
}
