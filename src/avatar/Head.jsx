import { useMemo } from 'react';
import { DoubleSide } from 'three';
import { M, P } from './Prims.jsx';
import { faceTexture, hatTexture } from './textures.js';
import { domeGeometry, hairShell, headGeometry } from './geometry.js';

const SKIN = '#fbd9c4';
const HAIR = '#3b2a26';
const DOME_CY = 0.17;
const DOME_RY = 0.22;
const CUT = (0.26 - DOME_CY) / DOME_RY;

// Origin = base of the head (just above the neck). Head centre sits at y = 0.15.
export function Head({ outfit, face = 'normal' }) {
  const faceTex = useMemo(() => faceTexture(face), [face]);
  const { hat } = outfit;
  const hatTex = useMemo(() => hatTexture(hat.palette, hat.pink), [hat]);

  const backHair = hairShell('hair-back', {
    rTop: 0.18, rBot: 0.165, h: 0.46, rx: 1.06, rz: 1.0,
    thetaStart: Math.PI * 0.52, thetaLength: Math.PI * 0.96,
  });
  const sideHair = (s) => hairShell(`hair-side-${s}`, {
    rTop: 0.18, rBot: 0.165, h: 0.4, rx: 1.06, rz: 1.0,
    thetaStart: s > 0 ? Math.PI * 0.3 : Math.PI * 1.34,
    thetaLength: Math.PI * 0.36, jag: 0.03, bulge: 0.03,
  });

  return (
    <group>
      {/* head: deformed sphere; group 0 is the front carrying the hand-drawn face */}
      <mesh geometry={headGeometry()} castShadow>
        <meshStandardMaterial attach="material-0" map={faceTex} roughness={0.9} />
        <meshStandardMaterial attach="material-1" color={SKIN} roughness={0.9} />
      </mesh>

      {/* hair: curved curtains falling from under the beanie + two face-framing locks */}
      <M geo={backHair} pos={[0, 0.03, -0.01]} c={HAIR} side={DoubleSide} />
      <M geo={sideHair(1)} pos={[0, 0.02, -0.01]} c={HAIR} side={DoubleSide} />
      <M geo={sideHair(-1)} pos={[0, 0.02, -0.01]} c={HAIR} side={DoubleSide} />
      {[1, -1].map((s) => (
        <P key={s} g="sphere" a={[1, 8, 6]} pos={[s * 0.183, 0.05, 0.02]} rot={[0, 0, s * 0.05]} scale={[0.03, 0.17, 0.055]} c={HAIR} />
      ))}

      {/* beanie: knit dome + rolled band, checker texture, bear ears */}
      <group position={[0, -0.03, 0.015]} rotation={[-0.05, 0, 0]}>
        <mesh geometry={domeGeometry(CUT)} position={[0, DOME_CY + 0.02, -0.005]} scale={[0.25, DOME_RY, 0.235]} castShadow>
          <meshStandardMaterial map={hatTex} roughness={0.9} flatShading side={DoubleSide} />
        </mesh>
        <P g="cylinder" a={[0.19, 0.19, 0.14, 16]} pos={[0, 0.28, -0.005]} scale={[1.17, 1, 1.15]} map={hatTex} flat />
        {[1, -1].map((s) => (
          <group key={s} position={[s * 0.15, 0.41, -0.02]} rotation={[0, 0, -s * 0.3]}>
            <P g="icosahedron" a={[0.085, 1]} scale={[1, 1.3, 0.75]} c={hat.ear} flat />
            <P g="icosahedron" a={[0.056, 1]} pos={[0, -0.005, 0.05]} scale={[1, 1.3, 0.5]} c={hat.earIn} flat />
          </group>
        ))}
        {outfit.extras.includes('ribbon') && (
          <group position={[0.125, 0.255, 0.115]} rotation={[0, 0.7, 0.25]}>
            <P g="sphere" a={[1, 6, 5]} pos={[0.04, 0, 0]} scale={[0.04, 0.03, 0.018]} c="#ff4fa3" />
            <P g="sphere" a={[1, 6, 5]} pos={[-0.04, 0, 0]} scale={[0.04, 0.03, 0.018]} c="#ff4fa3" />
            <P g="sphere" a={[0.022, 6, 5]} scale={[1, 1, 0.8]} c="#ffd1e6" />
          </group>
        )}
      </group>
    </group>
  );
}
