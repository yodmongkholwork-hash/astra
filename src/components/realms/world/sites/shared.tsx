"use client";

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { MAT } from "../materials";

/** Shared building blocks for full territory environments (Phase 3+). */

export function Spin({ speed = 0.3, axis = "y", children }: { speed?: number; axis?: "x" | "y" | "z"; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation[axis] += dt * speed;
  });
  return <group ref={ref}>{children}</group>;
}

/**
 * Detail LOD: children render only while the camera is within `distance` of
 * this group's world position. Keeps the aerial overview cheap (fewer draw
 * calls) while close shots get the full set dressing.
 */
export function NearOnly({ distance, children }: { distance: number; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.getWorldPosition(tmp);
    ref.current.visible = tmp.distanceTo(camera.position) < distance;
  });
  return <group ref={ref}>{children}</group>;
}

/* ---------- flames: camera-facing flickering points (one draw call per set) ---------- */
export function Flames({ points, color = "#ffb347", size = 3 }: { points: [number, number, number][]; color?: string; size?: number }) {
  const { geometry, material } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(points.flat(), 3));
    g.setAttribute("seed", new THREE.Float32BufferAttribute(points.map((_, i) => (i * 0.618) % 1), 1));
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uSize: { value: size } },
      vertexShader: /* glsl */ `
        attribute float seed; uniform float uTime; uniform float uSize; varying float vF;
        void main(){
          vF = 0.75 + 0.25 * sin(uTime * 13.0 + seed * 40.0) * sin(uTime * 7.0 + seed * 9.0);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = uSize * vF * (300.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; varying float vF;
        void main(){
          vec2 p = gl_PointCoord - 0.5; p.y *= 0.7;
          float d = length(p) * 2.0;
          float a = smoothstep(1.0, 0.0, d);
          vec3 col = mix(uColor, vec3(1.0, 0.95, 0.8), smoothstep(0.6, 0.0, d));
          gl_FragColor = vec4(col * 1.5, a * vF);
        }`,
    });
    return { geometry: g, material: m };
  }, [points, color, size]);
  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt;
  });
  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

/* ---------- interactive entrance portal ---------- */
const portalVertex = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const portalFragment = /* glsl */ `
  uniform float uTime; uniform vec3 uColor; uniform float uHover; varying vec2 vUv;
  void main(){
    vec2 p = vUv - 0.5; p.x *= 0.8;
    float r = length(p);
    float a = atan(p.y, p.x);
    float swirl = sin(a * 5.0 + r * 28.0 - uTime * (2.2 + uHover * 2.0)) * 0.5 + 0.5;
    float core = smoothstep(0.5, 0.0, r);
    vec3 col = mix(uColor * 0.4, uColor * 1.6, swirl * core) + vec3(1.0) * pow(core, 4.0) * (0.6 + uHover);
    float alpha = smoothstep(0.52, 0.42, r) * (0.75 + 0.25 * swirl);
    gl_FragColor = vec4(col, alpha);
  }`;

/**
 * Arched doorway whose surface is a swirling portal. It is a real click target
 * in the 3D scene: `onActivate` decides whether that means "travel here" or
 * "enter the room" (see RealmExperience).
 */
export function Portal({ width, height, color, onActivate, label }: { width: number; height: number; color: string; onActivate?: () => void; label: string }) {
  const [hover, setHover] = useState(false);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
        uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uHover: { value: 0 } },
        vertexShader: portalVertex,
        fragmentShader: portalFragment,
      }),
    [color],
  );
  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
    mat.uniforms.uHover.value += ((hover ? 1 : 0) - mat.uniforms.uHover.value) * 0.12;
  });
  const archShape = useMemo(() => {
    const s = new THREE.Shape();
    const w = width / 2;
    s.moveTo(-w, 0);
    s.lineTo(-w, height - w);
    s.absarc(0, height - w, w, Math.PI, 0, true);
    s.lineTo(w, 0);
    s.lineTo(-w, 0);
    const g = new THREE.ShapeGeometry(s, 24);
    // ShapeGeometry UVs are in shape units → normalise to 0..1 for the shader
    const uv = g.attributes.uv as THREE.BufferAttribute;
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + w) / width, pos.getY(i) / height);
    return g;
  }, [width, height]);

  const stop = (e: ThreeEvent<PointerEvent | MouseEvent>) => e.stopPropagation();
  return (
    <group>
      {/* stone frame */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={MAT.stoneLight} position={[s * (width / 2 + 1), (height - width / 2) / 2, 0]}>
          <boxGeometry args={[2, height - width / 2, 2.4]} />
        </mesh>
      ))}
      <mesh material={MAT.gold} position={[0, height - width / 2, 0]}>
        <torusGeometry args={[width / 2 + 1, 1, 8, 32, Math.PI]} />
      </mesh>
      <mesh
        geometry={archShape}
        material={mat}
        position={[0, 0, 0.3]}
        name={label}
        onClick={(e) => {
          stop(e);
          onActivate?.();
        }}
        onPointerOver={(e) => {
          stop(e);
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "";
        }}
      />
      <pointLight position={[0, height * 0.45, 4]} color={color} intensity={1800} distance={60} decay={2} />
    </group>
  );
}

/* ---------- procedural texture helpers ---------- */
export function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Star polygon / sigil drawn with canvas paths (font-independent). */
export function drawSigil(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, points: number, step: number) {
  ctx.beginPath();
  for (let i = 0; i <= points; i++) {
    const a = ((i * step) / points) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.08, 0, Math.PI * 2);
  ctx.stroke();
}
