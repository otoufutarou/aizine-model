import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { P } from './Prims.jsx';
import { Head } from './Head.jsx';
import { useRig } from './useRig.js';
import { BASE_POSE } from '../data/poses.js';

const SKIN = '#f7d9cb';
const HIPS_Y = 1.0;
const R = (name) => BASE_POSE[name];

function Shoe({ shoes }) {
  const { type, upper, sole, accent } = shoes;
  const chunky = type === 'sneaker';
  return (
    <group>
      {/* platform sole */}
      <P g="box" a={[0.105, 0.065, 0.27]} pos={[0, -0.0675, 0.05]} c={sole} rough={0.5} />
      <P g="box" a={[0.108, 0.012, 0.274]} pos={[0, -0.04, 0.05]} c={accent} rough={0.5} />
      {/* upper */}
      <P g="sphere" a={[0.054, 20, 12]} pos={[0, 0.0, 0.045]} scale={[1, 0.85, 2.3]} c={upper} rough={0.5} />
      <P g="cylinder" a={[0.05, 0.054, 0.07, 18]} pos={[0, 0.03, 0]} c={upper} rough={0.5} />
      <P g="sphere" a={[0.05, 16, 10]} pos={[0, -0.012, 0.15]} scale={[1, 0.6, 1.1]} c={upper} rough={0.5} />
      {chunky && [0.03, 0.065, 0.1].map((z) => (
        <P key={z} g="box" a={[0.07, 0.006, 0.012]} pos={[0, 0.03 - z * 0.12, z]} rot={[-0.3, 0, 0]} c={accent} />
      ))}
      {type === 'maryjane' && (
        <>
          <P g="box" a={[0.108, 0.012, 0.016]} pos={[0, 0.025, 0.035]} c={accent} metal={0.8} rough={0.3} />
          <P g="sphere" a={[0.01, 10, 8]} pos={[0.054, 0.025, 0.035]} c={accent} metal={0.8} rough={0.3} />
        </>
      )}
    </group>
  );
}

function Leg({ s, o }) {
  const side = s > 0 ? 'L' : 'R';
  const { type, color, accent } = o.bottom;
  const baggy = type === 'cargo';
  const slim = type === 'slim';
  const skirt = type === 'skirt';
  const trouser = baggy || slim;
  const metal = slim ? 0.7 : 0;
  const rough = slim ? 0.25 : 0.8;
  return (
    <group name={`thigh${side}`} position={[s * 0.085, -0.03, 0]} rotation={R(`thigh${side}`)}>
      <P g="capsule" a={[0.06, 0.34, 6, 14]} pos={[0, -0.22, 0]} c={SKIN} rough={0.55} />
      {trouser && (
        <P g="cylinder" a={baggy ? [0.092, 0.098, 0.46, 20] : [0.07, 0.058, 0.46, 20]} pos={[0, -0.225, 0]} c={color} metal={metal} rough={rough} />
      )}
      {baggy && (
        <>
          <P g="box" a={[0.034, 0.12, 0.1]} pos={[s * 0.098, -0.2, 0.01]} c={color} rough={0.9} />
          <P g="box" a={[0.038, 0.016, 0.104]} pos={[s * 0.098, -0.145, 0.01]} c={accent} metal={0.8} rough={0.3} />
        </>
      )}
      <group name={`knee${side}`} position={[0, -0.45, 0]} rotation={R(`knee${side}`)}>
        <P g="capsule" a={[0.045, 0.3, 6, 14]} pos={[0, -0.21, 0]} c={SKIN} rough={0.55} />
        {trouser && (
          <P g="cylinder" a={baggy ? [0.098, 0.105, 0.34, 20] : [0.058, 0.048, 0.38, 20]} pos={[0, baggy ? -0.18 : -0.19, 0]} c={color} metal={metal} rough={rough} />
        )}
        {baggy && <P g="torus" a={[0.103, 0.01, 8, 20]} pos={[0, -0.35, 0]} rot={[Math.PI / 2, 0, 0]} c={accent} metal={0.8} rough={0.3} />}
        {skirt && o.socks && (
          <>
            <P g="cylinder" a={[0.054, 0.05, 0.37, 18]} pos={[0, -0.225, 0]} c={o.socks} rough={0.9} />
            <P g="torus" a={[0.056, 0.012, 8, 18]} pos={[0, -0.05, 0]} rot={[Math.PI / 2, 0, 0]} c="#ffc2dd" rough={0.9} />
          </>
        )}
        {o.shoes.type === 'boot' && (
          <P g="cylinder" a={[0.062, 0.056, 0.2, 20]} pos={[0, -0.3, 0]} c={o.shoes.upper} rough={0.4} />
        )}
        <group position={[0, -0.42, 0]}>
          <Shoe shoes={o.shoes} />
        </group>
      </group>
    </group>
  );
}

function Hand({ s, peace }) {
  const fingers = useRef();
  useFrame(() => {
    if (fingers.current) fingers.current.visible = !!peace.current;
  });
  return (
    <group position={[0, -0.27, 0]}>
      <P g="sphere" a={[0.033, 14, 10]} scale={[0.9, 1.2, 0.7]} pos={[0, -0.02, 0]} c={SKIN} />
      {s < 0 && (
        <group ref={fingers} position={[0, -0.05, 0]}>
          <P g="capsule" a={[0.009, 0.05, 4, 8]} pos={[-0.012, -0.03, 0]} rot={[0, 0, 0.2]} c={SKIN} />
          <P g="capsule" a={[0.009, 0.05, 4, 8]} pos={[0.014, -0.03, 0]} rot={[0, 0, -0.2]} c={SKIN} />
        </group>
      )}
    </group>
  );
}

function Arm({ s, o, peace }) {
  const side = s > 0 ? 'L' : 'R';
  const top = o.top;
  const sleeveColor = top.color;
  return (
    <group name={`shoulder${side}`} position={[s * 0.178, 0.2, 0]} rotation={R(`shoulder${side}`)}>
      <P g="sphere" a={[0.043, 14, 10]} c={SKIN} />
      <P g="capsule" a={[0.037, 0.22, 6, 12]} pos={[0, -0.15, 0]} c={SKIN} rough={0.55} />
      {o.sleeve === 'puff' && <P g="sphere" a={[0.06, 16, 12]} pos={[0, -0.03, 0]} scale={[1, 1.1, 1]} c={top.color} rough={0.8} />}
      {o.sleeve === 'long' && <P g="cylinder" a={[0.04, 0.038, 0.28, 16]} pos={[0, -0.15, 0]} c={sleeveColor} rough={0.7} />}
      <group name={`elbow${side}`} position={[0, -0.29, 0]} rotation={R(`elbow${side}`)}>
        <P g="sphere" a={[0.03, 12, 8]} c={SKIN} />
        <P g="capsule" a={[0.031, 0.2, 6, 12]} pos={[0, -0.14, 0]} c={SKIN} rough={0.55} />
        {o.sleeve === 'long' && <P g="cylinder" a={[0.038, 0.034, 0.26, 16]} pos={[0, -0.135, 0]} c={sleeveColor} rough={0.7} />}
        {top.type === 'crop' && <P g="torus" a={[0.032, 0.008, 8, 16]} pos={[0, -0.01, 0]} rot={[Math.PI / 2, 0, 0]} c={top.accent} metal={0.8} rough={0.3} />}
        <Hand s={s} peace={peace} />
      </group>
    </group>
  );
}

function Torso({ o, peace }) {
  const t = o.top;
  const full = t.type === 'bodysuit';
  return (
    <>
      {/* skin torso */}
      <P g="cylinder" a={[0.105, 0.115, 0.2, 24]} pos={[0, 0.08, 0]} scale={[1, 1, 0.8]} c={SKIN} rough={0.55} />
      <group name="chest" position={[0, 0.17, 0]} rotation={R('chest')}>
        <P g="cylinder" a={[0.14, 0.11, 0.24, 24]} pos={[0, 0.1, 0]} scale={[1, 1, 0.75]} c={SKIN} rough={0.55} />
        {/* top */}
        {t.type === 'crop' && (
          <>
            <P g="cylinder" a={[0.146, 0.127, 0.16, 28]} pos={[0, 0.13, 0]} scale={[1, 1, 0.78]} c={t.color} rough={0.8} />
            <P g="box" a={[0.012, 0.15, 0.01]} pos={[0, 0.13, 0.112]} c={t.accent} metal={0.9} rough={0.2} />
            <P g="box" a={[0.2, 0.014, 0.012]} pos={[0, 0.055, 0.1]} c={t.accent} metal={0.9} rough={0.2} />
          </>
        )}
        {t.type === 'frill' && (
          <>
            <P g="cylinder" a={[0.146, 0.128, 0.19, 28]} pos={[0, 0.115, 0]} scale={[1, 1, 0.78]} c={t.color} rough={0.9} />
            <P g="torus" a={[0.138, 0.02, 10, 32]} pos={[0, 0.02, 0]} scale={[1, 0.78, 1]} rot={[Math.PI / 2, 0, 0]} c={t.accent} rough={0.9} />
            <P g="torus" a={[0.13, 0.014, 10, 32]} pos={[0, 0.045, 0]} scale={[1, 0.78, 1]} rot={[Math.PI / 2, 0, 0]} c={t.color} rough={0.9} />
            <group position={[0, 0.15, 0.108]}>
              <P g="sphere" a={[0.022, 14, 10]} pos={[0.024, 0, 0]} scale={[1.2, 0.9, 0.6]} c="#ff4fa3" />
              <P g="sphere" a={[0.022, 14, 10]} pos={[-0.024, 0, 0]} scale={[1.2, 0.9, 0.6]} c="#ff4fa3" />
              <P g="sphere" a={[0.011, 10, 8]} c="#ffd1e6" />
            </group>
          </>
        )}
        {full && (
          <P g="cylinder" a={[0.146, 0.127, 0.2, 28]} pos={[0, 0.12, 0]} scale={[1, 1, 0.78]} c={t.color} rough={0.5} />
        )}
        {o.extras.includes('chain') && (
          <P g="torus" a={[0.085, 0.004, 8, 32]} pos={[0, 0.2, 0.06]} scale={[1, 1.1, 1]} rot={[0.9, 0, 0]} c="#d9dbe6" metal={0.95} rough={0.15} />
        )}
        <Arm s={1} o={o} peace={peace} />
        <Arm s={-1} o={o} peace={peace} />
        {/* neck + head */}
        <group name="neck" position={[0, 0.26, 0]} rotation={R('neck')}>
          <P g="cylinder" a={[0.034, 0.038, 0.12, 16]} pos={[0, 0.02, 0]} c={SKIN} rough={0.55} />
          {o.extras.includes('choker') && (
            <>
              <P g="torus" a={[0.04, 0.007, 8, 24]} pos={[0, 0.03, 0]} rot={[Math.PI / 2, 0, 0]} c="#0e0e12" />
              <P g="torus" a={[0.008, 0.002, 8, 12]} pos={[0, 0.03, 0.044]} c="#ff4fa3" metal={0.9} rough={0.2} />
            </>
          )}
          <group name="head" position={[0, 0.08, 0]} rotation={R('head')} scale={1.3}>
            <Head outfit={o} />
          </group>
        </group>
      </group>
    </>
  );
}

function Bottom({ o }) {
  const b = o.bottom;
  const skirt = b.type === 'skirt';
  return (
    <>
      <P g="sphere" a={[0.125, 24, 16]} scale={[1.12, 0.78, 0.88]} c={skirt ? SKIN : b.color} rough={skirt ? 0.55 : 0.7} metal={b.type === 'slim' ? 0.7 : 0} />
      {skirt ? (
        <>
          <P g="cylinder" a={[0.125, 0.23, 0.24, 36, 1, false]} pos={[0, -0.1, 0]} scale={[1, 1, 0.9]} c={b.color} rough={0.9} flatShading />
          <P g="torus" a={[0.228, 0.01, 8, 36]} pos={[0, -0.215, 0]} scale={[1, 0.9, 1]} rot={[Math.PI / 2, 0, 0]} c={b.accent} />
        </>
      ) : (
        <>
          <P g="cylinder" a={[0.122, 0.13, 0.12, 28]} pos={[0, 0.03, 0]} scale={[1, 1, 0.82]} c={b.color} metal={b.type === 'slim' ? 0.7 : 0} rough={b.type === 'slim' ? 0.25 : 0.8} />
          <P g="torus" a={[0.124, 0.009, 8, 28]} pos={[0, 0.092, 0]} scale={[1, 0.82, 1]} rot={[Math.PI / 2, 0, 0]} c="#14131a" metal={0.4} />
          <P g="box" a={[0.03, 0.022, 0.01]} pos={[0, 0.092, 0.107]} c="#d9dbe6" metal={0.95} rough={0.15} />
        </>
      )}
    </>
  );
}

function Coat({ o }) {
  const c = o.coat;
  if (!c) return null;
  return (
    <group>
      <mesh position={[0, 0.0, 0]} scale={[1, 1, 0.86]} castShadow>
        <cylinderGeometry args={[0.15, 0.225, 0.78, 36, 1, true, 0.14 * Math.PI, 1.72 * Math.PI]} />
        <meshStandardMaterial color={c.color} roughness={0.6} side={2} />
      </mesh>
      <P g="sphere" a={[0.1, 20, 12]} pos={[0, 0.36, 0]} scale={[1.9, 0.4, 1.05]} c={c.color} rough={0.6} />
    </group>
  );
}

export function ProceduralAvatar({ outfit, pose }) {
  const outer = useRef();
  const rig = useRef();
  const peaceFlag = useRef(false);
  peaceFlag.current = !!pose.peace;
  useRig(rig, outer, pose);

  return (
    <group ref={outer}>
      <group ref={rig}>
        <group name="hips" position={[0, HIPS_Y, 0]} rotation={R('hips')}>
          <Bottom o={outfit} />
          <Leg s={1} o={outfit} />
          <Leg s={-1} o={outfit} />
          <group name="spine" rotation={R('spine')}>
            <Torso o={outfit} peace={peaceFlag} />
            <Coat o={outfit} />
          </group>
        </group>
      </group>
    </group>
  );
}
