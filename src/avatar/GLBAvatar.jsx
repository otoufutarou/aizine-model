import { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useRig } from './useRig.js';
import { OUTFITS } from '../data/outfits.js';

// Drop-in replacement for ProceduralAvatar. Contract (see README):
//  - bones/nodes named like JOINTS (hips, spine, chest, neck, head, shoulderL, ...)
//  - outfit nodes named `<outfitId>_<anything>` (e.g. street_top, girly_skirt); only the active outfit is visible
export function GLBAvatar({ url, outfit, pose }) {
  const { scene } = useGLTF(url);
  const outer = useRef();
  const rig = useRef();
  useRig(rig, outer, pose);

  useEffect(() => {
    scene.traverse((node) => {
      const hit = OUTFITS.find((o) => node.name.startsWith(`${o.id}_`));
      if (hit) node.visible = hit.id === outfit.id;
      node.castShadow = true;
    });
  }, [scene, outfit.id]);

  return (
    <group ref={outer}>
      <group ref={rig}>
        <primitive object={scene} />
      </group>
    </group>
  );
}
