"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Pose, Vec3 } from "@/lib/realms/locations";

/**
 * CameraDirector — the "movie director" of the kingdom.
 *
 * Every move is a CameraCommand. On a new command the director snapshots the
 * camera's *actual* current position and look-target (including idle drift),
 * builds two CatmullRom splines — one for the eye, one for the look-at point —
 * and eases along them. Because both start from the real current state,
 * there are never jumps, even when a command interrupts another mid-flight.
 *
 *   path   : explicit waypoints (kingdom entrance)
 *   arc    : lifted fly-through between two poses (territory travel, return)
 *   direct : straight push (shot changes, room entry zoom)
 *   cut    : instant placement (deep links, reduced motion)
 *
 * After arrival an idle layer fades in: a slow aerial pan in overview, a gentle
 * breathing sway in focus, plus pointer parallax — all additive, all blended.
 */

export type CameraCommand =
  | { key: number; kind: "path"; pos: Vec3[]; target: Vec3[]; duration: number }
  | { key: number; kind: "arc" | "direct"; to: Pose; duration: number; lift?: number }
  | { key: number; kind: "cut"; to: Pose };

/** CameraCommand without its key (distributes over the union). */
export type CameraCommandInput = CameraCommand extends infer C ? (C extends CameraCommand ? Omit<C, "key"> : never) : never;

export type IdleMode = "none" | "overview" | "focus";

const v = (a: Vec3) => new THREE.Vector3(...a);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// entrance uses a long, soft ease (slow start, very slow settle)
const easeCinematic = (t: number) => 1 - Math.pow(1 - (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2), 1.35);

export default function CameraDirector({ command, idle, onArrive, onProgress }: { command: CameraCommand | null; idle: IdleMode; onArrive: (key: number) => void; onProgress?: (p: number) => void }) {
  const { camera, pointer } = useThree();
  const state = useRef({
    active: false,
    t: 0,
    duration: 1,
    key: -1,
    cinematic: false,
    eye: null as THREE.CatmullRomCurve3 | null,
    look: null as THREE.CatmullRomCurve3 | null,
    basePos: new THREE.Vector3(),
    baseTarget: new THREE.Vector3(),
    target: new THREE.Vector3(0, 60, 0),
    idleW: 0,
    idleClock: 0,
    parallax: new THREE.Vector2(),
    init: false,
  });

  // build splines whenever a new command arrives
  useEffect(() => {
    if (!command) return;
    const s = state.current;
    if (command.kind === "cut") {
      s.basePos.set(...command.to.pos);
      s.baseTarget.set(...command.to.target);
      s.target.copy(s.baseTarget);
      camera.position.copy(s.basePos);
      camera.lookAt(s.target);
      s.active = false;
      s.idleW = 0;
      onArrive(command.key);
      return;
    }
    // start from what is on screen right now (idle drift included), then drop the
    // idle layer: it is baked into the start point, so it must not be added again
    const fromPos = camera.position.clone();
    const fromTarget = s.target.clone();
    s.idleW = 0;
    let eyePts: THREE.Vector3[];
    let lookPts: THREE.Vector3[];

    if (command.kind === "path") {
      eyePts = command.pos.map(v);
      lookPts = command.target.map(v);
      camera.position.copy(eyePts[0]);
    } else {
      const toPos = v(command.to.pos);
      const toTarget = v(command.to.target);
      if (command.kind === "arc") {
        const dist = fromPos.distanceTo(toPos);
        const lift = command.lift ?? THREE.MathUtils.clamp(dist * 0.22, 12, 140);
        const m1 = fromPos.clone().lerp(toPos, 0.33).add(new THREE.Vector3(0, lift * 0.85, 0));
        const m2 = fromPos.clone().lerp(toPos, 0.7).add(new THREE.Vector3(0, lift * 0.55, 0));
        eyePts = [fromPos, m1, m2, toPos];
        // look slightly ahead along the route mid-flight, then settle on the subject
        const ahead = fromTarget.clone().lerp(toTarget, 0.6).add(new THREE.Vector3(0, lift * 0.15, 0));
        lookPts = [fromTarget, ahead, toTarget];
      } else {
        eyePts = [fromPos, fromPos.clone().lerp(toPos, 0.5), toPos];
        lookPts = [fromTarget, fromTarget.clone().lerp(toTarget, 0.5), toTarget];
      }
    }
    s.eye = new THREE.CatmullRomCurve3(eyePts, false, "centripetal");
    s.look = new THREE.CatmullRomCurve3(lookPts, false, "centripetal");
    s.t = 0;
    s.duration = Math.max(0.05, command.duration);
    s.cinematic = command.kind === "path";
    s.key = command.key;
    s.active = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to new commands
  }, [command, camera]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1); // avoid lurches after tab switches
    const s = state.current;
    if (!s.init) {
      // adopt the camera's initial placement so nothing snaps before the first command
      s.basePos.copy(camera.position);
      s.baseTarget.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(100));
      s.target.copy(s.baseTarget);
      s.init = true;
    }

    if (s.active && s.eye && s.look) {
      s.t = Math.min(1, s.t + dt / s.duration);
      const e = s.cinematic ? easeCinematic(s.t) : easeInOut(s.t);
      s.eye.getPoint(e, s.basePos);
      s.look.getPoint(e, s.baseTarget);
      onProgress?.(s.t);
      if (s.t >= 1) {
        s.active = false;
        onArrive(s.key);
      }
    } else {
      s.idleW = Math.min(1, s.idleW + dt / 2.5);
    }

    // idle layer
    s.idleClock += dt;
    s.parallax.lerp(pointer, 0.04);
    const t = s.idleClock;
    const w = s.idleW;
    const off = new THREE.Vector3();
    const toff = new THREE.Vector3();
    if (idle === "overview") {
      off.set(Math.sin(t * 0.045) * 110, Math.sin(t * 0.07) * 12, Math.sin(t * 0.03) * 25);
      toff.set(Math.sin(t * 0.045 + 0.6) * 150, 0, Math.cos(t * 0.035) * 40);
      off.x += s.parallax.x * 30;
      off.y += s.parallax.y * 15;
    } else if (idle === "focus") {
      off.set(Math.sin(t * 0.25) * 2.5, Math.sin(t * 0.33) * 1.5, Math.cos(t * 0.2) * 2.5);
      off.x += s.parallax.x * 6;
      off.y += s.parallax.y * 3;
    }
    camera.position.copy(s.basePos).addScaledVector(off, w);
    s.target.copy(s.baseTarget).addScaledVector(toff, w);
    camera.lookAt(s.target);
  });

  return null;
}
