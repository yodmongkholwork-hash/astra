"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Volumetric-looking cloud sea built from camera-facing instanced quads.
 * The puff shape is generated in the fragment shader (fbm + radial falloff),
 * so no texture download is needed. Puffs fade out as the camera flies through
 * them, which is what makes the entrance descent feel like breaking cloud cover.
 */
const vertex = /* glsl */ `
  attribute vec4 aData; // x: size, y: seed, z: drift speed, w: tint
  uniform float uTime;
  varying vec2 vUv; varying float vSeed; varying float vFade; varying float vTint;
  void main() {
    vUv = uv; vSeed = aData.y; vTint = aData.w;
    vec3 center = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    center.x += sin(uTime * aData.z + aData.y * 6.28) * 18.0 + uTime * aData.z * 6.0;
    center.x = mod(center.x + 1400.0, 2800.0) - 1400.0; // wrap the drift
    vec4 mv = modelViewMatrix * vec4(center, 1.0);
    mv.xy += position.xy * aData.x;           // billboard in view space
    float d = -mv.z;
    vFade = smoothstep(aData.x * 0.25, aData.x * 0.9, d) * (1.0 - smoothstep(1500.0, 2400.0, d));
    gl_Position = projectionMatrix * mv;
  }`;

const fragment = /* glsl */ `
  uniform vec3 uLit; uniform vec3 uShade;
  varying vec2 vUv; varying float vSeed; varying float vFade; varying float vTint;
  float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
  float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
  float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<4;i++){ s+=a*n(p); p*=2.1; a*=.5; } return s; }
  void main(){
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    float shape = fbm(p * 3.2 + vSeed * 17.0);
    float a = smoothstep(1.0, 0.15, r + (shape - 0.5) * 0.9);
    if (a < 0.01) discard;
    // lit from above by the moon, shaded underneath
    vec3 col = mix(uShade, uLit, clamp(0.35 + p.y * 1.4 + shape * 0.5, 0.0, 1.0));
    col = mix(col, col * vec3(0.9, 0.75, 1.15), vTint);
    gl_FragColor = vec4(col, a * 0.55 * vFade);
  }`;

interface Layer {
  count: number;
  y: [number, number];
  radius: [number, number];
  size: [number, number];
}

export default function Clouds({ count }: { count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const layers: Layer[] = useMemo(
    () => [
      { count: Math.round(count * 0.55), y: [390, 480], radius: [680, 1500], size: [180, 360] }, // cloud sea (entrance)
      { count: Math.round(count * 0.3), y: [90, 170], radius: [380, 900], size: [110, 220] }, // mountain wreaths
      { count: Math.round(count * 0.15), y: [20, 60], radius: [150, 700], size: [70, 130] }, // valley mist
    ],
    [count],
  );
  const total = layers.reduce((s, l) => s + l.count, 0);

  const { geometry, material } = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1);
    const data = new Float32Array(total * 4);
    let k = 0;
    let seed = 3;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (const l of layers) {
      for (let i = 0; i < l.count; i++, k++) {
        data.set([l.size[0] + rnd() * (l.size[1] - l.size[0]), rnd(), 0.02 + rnd() * 0.05, rnd() * 0.8], k * 4);
      }
    }
    g.setAttribute("aData", new THREE.InstancedBufferAttribute(data, 4));
    const m = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 }, uLit: { value: new THREE.Color("#a9a3d8") }, uShade: { value: new THREE.Color("#241a45") } },
    });
    return { geometry: g, material: m };
  }, [layers, total]);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const m = new THREE.Matrix4();
    let k = 0;
    let seed = 11;
    const rnd = () => ((seed = (seed * 48271) % 2147483647) / 2147483647);
    for (const l of layers) {
      for (let i = 0; i < l.count; i++, k++) {
        const a = rnd() * Math.PI * 2;
        const r = l.radius[0] + Math.sqrt(rnd()) * (l.radius[1] - l.radius[0]);
        m.makeTranslation(Math.sin(a) * r, l.y[0] + rnd() * (l.y[1] - l.y[0]), Math.cos(a) * r);
        ref.current.setMatrixAt(k, m);
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [layers]);

  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt;
  });

  return <instancedMesh ref={ref} args={[geometry, material, total]} frustumCulled={false} renderOrder={5} />;
}
