"use client";

import { AdaptiveDpr, Sparkles } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { INTRO_PATH, type LocationId } from "@/lib/realms/locations";
import { QUALITY, type Quality } from "@/lib/realms/quality";
import CameraDirector, { type CameraCommand, type IdleMode } from "./camera/CameraDirector";
import Castle from "./world/Castle";
import Clouds from "./world/Clouds";
import Creatures from "./world/Creatures";
import FloatingIslands from "./world/FloatingIslands";
import GodRays from "./world/GodRays";
import Landmarks from "./world/Landmarks";
import Markers from "./world/Markers";
import River from "./world/River";
import Sky, { MOON_DIR } from "./world/Sky";
import Terrain from "./world/Terrain";

export interface KingdomCanvasProps {
  quality: Quality;
  command: CameraCommand | null;
  idle: IdleMode;
  selected: LocationId | null;
  focusMode: boolean;
  markersVisible: boolean;
  onSelect: (id: LocationId) => void;
  /** a territory's in-scene entrance was clicked */
  onPortal: (id: LocationId) => void;
  onArrive: (key: number) => void;
  onReady: () => void;
  /** shift the framed subject away from the info panel: "right" on desktop, "up" on mobile */
  frame: "center" | "panel";
}

/** Fires onReady after the first frames are actually on screen (shaders compiled). */
function ReadySignal({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 3) onReady();
  });
  return null;
}

/**
 * Off-axis framing: instead of moving the camera, slide the projection window
 * (setViewOffset) so the subject sits clear of the info panel. Lerped → no pop.
 */
function FrameShift({ mode }: { mode: "center" | "panel" }) {
  const { camera, size } = useThree();
  const cur = useRef({ x: 0, y: 0 });
  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const desktop = size.width >= 640;
    // portrait screens see far less horizontally → widen the lens so compositions survive
    const aspect = size.width / size.height;
    const fov = aspect >= 1.2 ? 50 : aspect >= 0.8 ? 60 : 76;
    if (Math.abs(cam.fov - fov) > 0.05) {
      cam.fov += (fov - cam.fov) * 0.2;
      cam.updateProjectionMatrix();
    }
    const tx = mode === "panel" && desktop ? -size.width * 0.2 : 0;
    const ty = mode === "panel" && !desktop ? size.height * 0.2 : 0;
    cur.current.x += (tx - cur.current.x) * 0.05;
    cur.current.y += (ty - cur.current.y) * 0.05;
    if (Math.abs(cur.current.x) < 0.5 && Math.abs(cur.current.y) < 0.5 && tx === 0 && ty === 0) {
      if (cam.view?.enabled) cam.clearViewOffset();
      return;
    }
    cam.setViewOffset(size.width, size.height, cur.current.x, cur.current.y, size.width, size.height);
  });
  return null;
}

/** The whole real-time kingdom. Lazy-loaded by RealmExperience (no SSR). */
export default function KingdomCanvas(p: KingdomCanvasProps) {
  const q = QUALITY[p.quality];
  const moonPos = MOON_DIR.clone().multiplyScalar(800);

  return (
    <Canvas
      key={p.quality /* re-create GL context when quality changes */}
      dpr={q.dpr}
      shadows={q.shadows}
      gl={{ antialias: q.antialias, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{ fov: 50, near: 1, far: 6000, position: [-120, 620, 900] }}
      className="!fixed inset-0"
      aria-label="อาณาจักรอัสตรา ฉาก 3 มิติ"
      role="img"
      onCreated={(state) => {
        // frame the first shot of the entrance before anything renders (no snap when it starts)
        state.camera.position.set(...INTRO_PATH.pos[0]);
        state.camera.lookAt(...INTRO_PATH.target[0]);
        // test probe: automated checks set window.__ASTRA_TEST__ to read the live camera/scene
        const w = window as unknown as { __ASTRA_TEST__?: boolean; __astra?: unknown };
        if (w.__ASTRA_TEST__) w.__astra = { camera: state.camera, scene: state.scene, gl: state.gl, size: () => state.size };
      }}
    >
      <color attach="background" args={["#05030d"]} />
      <fogExp2 attach="fog" args={["#120a2a", 0.00085]} />

      <hemisphereLight args={["#6a58b8", "#07040f", 0.55]} />
      <ambientLight intensity={0.12} color="#8a7bd8" />
      <directionalLight
        position={moonPos}
        intensity={1.5}
        color="#a9b8ff"
        castShadow={q.shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-420}
        shadow-camera-right={420}
        shadow-camera-top={420}
        shadow-camera-bottom={-420}
        shadow-camera-far={2000}
        shadow-bias={-0.0005}
      />

      <Suspense fallback={null}>
        <Sky />
        <Terrain segments={q.terrainSegments} shadows={q.shadows} />
        <River />
        <Castle shadows={q.shadows} />
        <FloatingIslands shadows={q.shadows} />
        <Landmarks quality={p.quality} onPortal={p.onPortal} />
        {q.godRays && <GodRays />}
        {q.creatures > 0 && <Creatures count={q.creatures} />}
        <Sparkles count={q.sparkles} scale={[900, 320, 900]} position={[0, 150, 0]} size={14} speed={0.3} opacity={0.75} color="#f2d28a" />
        <Sparkles count={Math.round(q.sparkles / 3)} scale={[260, 200, 260]} position={[0, 140, 0]} size={20} speed={0.5} color="#9b7bff" />
        <Clouds count={q.clouds} />
        <Markers selected={p.selected} focusMode={p.focusMode} onSelect={p.onSelect} visible={p.markersVisible} />
      </Suspense>

      <CameraDirector command={p.command} idle={p.idle} onArrive={p.onArrive} />
      <ReadySignal onReady={p.onReady} />
      <FrameShift mode={p.frame} />
      <AdaptiveDpr pixelated={false} />

      {q.bloom && (
        <EffectComposer multisampling={4}>
          <Bloom intensity={1.1} luminanceThreshold={0.62} luminanceSmoothing={0.25} mipmapBlur />
          <Vignette offset={0.25} darkness={0.75} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
