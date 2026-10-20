import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import { BASE_POSE, JOINTS } from '../data/poses.js';

// Drives any object tree whose nodes are named after JOINTS (procedural avatar or GLB).
// `outerRef` receives the vertical pose offset.
export function useRig(rootRef, outerRef, pose) {
  const joints = useRef(null);

  useFrame(({ clock }, dt) => {
    const root = rootRef.current;
    if (!root) return;
    if (!joints.current) {
      joints.current = {};
      JOINTS.forEach((n) => {
        const o = root.getObjectByName(n);
        if (o) joints.current[n] = o;
      });
    }
    const t = clock.elapsedTime;
    const k = Math.min(dt, 0.05);

    JOINTS.forEach((name) => {
      const obj = joints.current[name];
      if (!obj) return;
      const target = [...(pose.joints[name] ?? BASE_POSE[name])];
      if (name === 'chest') target[0] += Math.sin(t * 1.6) * 0.012;
      if (name === 'head') target[2] += Math.sin(t * 0.9) * 0.02;
      if (name === 'hips') target[1] += Math.sin(t * 0.5) * 0.02;
      if (pose.wave && pose.wave.joint === name) {
        target[pose.wave.axis] += Math.sin(t * pose.wave.speed) * pose.wave.amp;
      }
      obj.rotation.x = MathUtils.damp(obj.rotation.x, target[0], 8, k);
      obj.rotation.y = MathUtils.damp(obj.rotation.y, target[1], 8, k);
      obj.rotation.z = MathUtils.damp(obj.rotation.z, target[2], 8, k);
    });

    if (outerRef.current) {
      outerRef.current.position.y = MathUtils.damp(outerRef.current.position.y, pose.y ?? 0, 8, k);
    }
  });
}
