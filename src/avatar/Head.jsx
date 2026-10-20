import { useMemo } from 'react';
import { BoxGeometry } from 'three';
import { B, P } from './Prims.jsx';
import { faceTexture, hatTexture } from './textures.js';

const SKIN = '#fbd9c4';
const HAIR = '#3b2a26';

// Origin = top of the neck. Head centre sits at y = 0.14.
export function Head({ outfit, face = 'normal' }) {
  const geo = useMemo(() => {
    const g = new BoxGeometry(0.3, 0.27, 0.27);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i += 1) {
      if (p.getY(i) < 0) p.setX(i, p.getX(i) * 0.86);
    }
    return g;
  }, []);
  const faceTex = useMemo(() => faceTexture(face), [face]);
  const { hat } = outfit;
  const hatTex = useMemo(() => hatTexture(hat.palette, hat.pink), [hat]);

  return (
    <group>
      {/* head: front face (material 4) carries the hand-drawn face */}
      <mesh geometry={geo} position={[0, 0.14, 0]} castShadow>
        {[0, 1, 2, 3, 5].map((i) => (
          <meshStandardMaterial key={i} attach={`material-${i}`} color={SKIN} flatShading roughness={0.9} />
        ))}
        <meshStandardMaterial attach="material-4" map={faceTex} roughness={0.9} />
      </mesh>

      {/* hair: back + side panels with jagged tips */}
      <B a={[0.34, 0.5, 0.07]} pos={[0, 0.06, -0.145]} c={HAIR} />
      {[-0.13, -0.065, 0, 0.065, 0.13].map((x, i) => (
        <B key={x} a={[0.065, 0.04 + (i % 3) * 0.035, 0.07]} pos={[x, -0.2 - (i % 3) * 0.0175, -0.145]} c={HAIR} />
      ))}
      {[1, -1].map((s) => (
        <group key={s}>
          <B a={[0.045, 0.5, 0.26]} pos={[s * 0.16, 0.055, -0.01]} c={HAIR} />
          <B a={[0.045, 0.07, 0.2]} pos={[s * 0.16, -0.23, -0.04]} c={HAIR} />
          <B a={[0.04, 0.34, 0.05]} pos={[s * 0.14, 0.09, 0.125]} c={HAIR} />
        </group>
      ))}

      {/* beanie with checker pattern and bear ears */}
      <group rotation={[-0.04, 0, 0]}>
        <B a={[0.35, 0.13, 0.32]} pos={[0, 0.275, -0.005]} map={hatTex} />
        <B a={[0.31, 0.06, 0.28]} pos={[0, 0.37, -0.01]} map={hatTex} />
        <B a={[0.355, 0.02, 0.325]} pos={[0, 0.215, -0.005]} map={hatTex} />
        {[1, -1].map((s) => (
          <group key={s} position={[s * 0.14, 0.405, -0.02]} rotation={[0, 0, -s * 0.3]}>
            <P g="icosahedron" a={[0.08, 0]} scale={[1, 1, 0.7]} c={hat.ear} />
            <P g="icosahedron" a={[0.052, 0]} pos={[0, -0.005, 0.05]} scale={[1, 1, 0.5]} c={hat.earIn} />
          </group>
        ))}
        {outfit.extras.includes('ribbon') && (
          <group position={[0.1, 0.33, 0.165]} rotation={[0, 0.3, 0.2]}>
            <B a={[0.05, 0.045, 0.02]} pos={[0.035, 0, 0]} c="#ff4fa3" />
            <B a={[0.05, 0.045, 0.02]} pos={[-0.035, 0, 0]} c="#ff4fa3" />
            <B a={[0.028, 0.028, 0.026]} c="#ffd1e6" />
          </group>
        )}
      </group>
    </group>
  );
}
