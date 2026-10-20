import { useRef } from 'react';
import { B, P, Decal } from './Prims.jsx';
import { Head } from './Head.jsx';
import { useRig } from './useRig.js';
import { BASE_POSE } from '../data/poses.js';
import { emblemTexture, zigzagTexture } from './textures.js';

const SKIN = '#fbd9c4';
const HIPS_Y = 0.64;
const R = (name) => BASE_POSE[name];

function Shoe({ shoes }) {
  const { sole, upper, accent } = shoes;
  const zig = zigzagTexture(accent);
  return (
    <group>
      <B a={[0.21, 0.09, 0.31]} pos={[0, -0.045, 0.04]} c={sole} />
      <B a={[0.185, 0.13, 0.25]} pos={[0, 0.065, 0.02]} c={upper} />
      <B a={[0.19, 0.05, 0.09]} pos={[0, 0.025, 0.155]} c={sole} />
      {[1, -1].map((s) => (
        <Decal key={s} map={zig} size={[0.2, 0.075]} pos={[s * 0.1065, -0.045, 0.04]} rot={[0, s * Math.PI / 2, 0]} />
      ))}
    </group>
  );
}

function Leg({ s, o }) {
  const side = s > 0 ? 'L' : 'R';
  const b = o.bottom;
  const cargo = b.type === 'cargo';
  const slim = b.type === 'slim';
  const skirt = b.type === 'skirt';
  const w = cargo ? 0.19 : slim ? 0.135 : 0.09;
  const mat = slim ? { metal: 0.5, rough: 0.35 } : {};
  return (
    <group name={`thigh${side}`} position={[s * 0.09, -0.03, 0]} rotation={R(`thigh${side}`)}>
      <B a={[w, 0.26, w]} pos={[0, -0.13, 0]} c={skirt ? SKIN : b.color} {...mat} />
      {cargo && (
        <>
          <B a={[0.04, 0.12, 0.12]} pos={[s * 0.113, -0.11, 0]} c={b.light} />
          <P g="cylinder" a={[0.026, 0.026, 0.004, 3]} pos={[s * 0.135, -0.1, 0]} rot={[0, 0, Math.PI / 2]} c={b.accent} />
        </>
      )}
      <group name={`knee${side}`} position={[0, -0.26, 0]} rotation={R(`knee${side}`)}>
        {skirt ? (
          <>
            <B a={[0.085, 0.2, 0.085]} pos={[0, -0.1, 0]} c={SKIN} />
            <B a={[0.105, 0.17, 0.105]} pos={[0, -0.115, 0]} c={o.socks} />
            <B a={[0.11, 0.025, 0.11]} pos={[0, -0.04, 0]} c="#ffc2dd" />
          </>
        ) : (
          <B a={[w + 0.01, 0.2, w + 0.01]} pos={[0, -0.1, 0]} c={b.color} {...mat} />
        )}
        {cargo && <B a={[0.235, 0.07, 0.235]} pos={[0, -0.125, 0]} c={b.color} />}
        <group position={[0, -0.26, 0]}>
          <Shoe shoes={o.shoes} />
        </group>
      </group>
    </group>
  );
}

function Arm({ s, o, peace }) {
  const side = s > 0 ? 'L' : 'R';
  const t = o.top;
  const wide = o.sleeve === 'wide';
  const puff = o.sleeve === 'puff';
  const coat = o.sleeve === 'coat';
  const sw = wide ? 0.115 : 0.085;
  const sleeveColor = coat ? o.coat.color : t.color;
  return (
    <group name={`shoulder${side}`} position={[s * 0.235, 0.13, 0]} rotation={R(`shoulder${side}`)}>
      {puff ? (
        <>
          <B a={[0.1, 0.1, 0.1]} pos={[0, -0.03, 0]} c={t.color} />
          <B a={[0.07, 0.17, 0.07]} pos={[0, -0.08, 0]} c={SKIN} />
        </>
      ) : (
        <B a={[sw, 0.17, sw]} pos={[0, -0.08, 0]} c={sleeveColor} />
      )}
      <group name={`elbow${side}`} position={[0, -0.17, 0]} rotation={R(`elbow${side}`)}>
        {puff ? (
          <B a={[0.065, 0.17, 0.065]} pos={[0, -0.08, 0]} c={SKIN} />
        ) : (
          <>
            <B a={[sw + 0.012, 0.17, sw + 0.012]} pos={[0, -0.08, 0]} c={sleeveColor} />
            {wide && <B a={[sw + 0.02, 0.025, sw + 0.02]} pos={[0, -0.155, 0]} c={t.accent} />}
          </>
        )}
        <B a={[0.06, 0.07, 0.055]} pos={[0, -0.19, 0]} c={SKIN} />
        {peace && s < 0 && (
          <>
            <B a={[0.016, 0.075, 0.02]} pos={[-0.016, -0.255, 0]} rot={[0, 0, 0.22]} c={SKIN} />
            <B a={[0.016, 0.075, 0.02]} pos={[0.016, -0.255, 0]} rot={[0, 0, -0.22]} c={SKIN} />
          </>
        )}
      </group>
    </group>
  );
}

function Torso({ o, face, peace }) {
  const t = o.top;
  const suit = t.type === 'bodysuit';
  const emblem = t.emblem ? emblemTexture(t.emblem, t.emblemColor) : null;
  return (
    <>
      <B a={[0.22, 0.1, 0.14]} pos={[0, 0.03, 0]} c={suit ? t.color : SKIN} />
      <group name="chest" position={[0, 0.09, 0]} rotation={R('chest')}>
        <B a={[0.3, 0.16, 0.18]} pos={[0, 0.08, 0]} c={t.color} />
        {t.type === 'cardigan' && (
          <>
            <B a={[0.008, 0.16, 0.184]} pos={[0, 0.08, 0]} c={t.accent} />
            <B a={[0.31, 0.02, 0.19]} pos={[0, 0.005, 0]} c={t.accent} />
            <Decal map={emblem} size={[0.075, 0.0375]} pos={[0.07, 0.115, 0.091]} />
          </>
        )}
        {t.type === 'frill' && (
          <>
            <B a={[0.325, 0.035, 0.2]} pos={[0, 0.005, 0]} c={t.accent} />
            <B a={[0.04, 0.04, 0.02]} pos={[0.03, 0.12, 0.095]} c="#ff4fa3" />
            <B a={[0.04, 0.04, 0.02]} pos={[-0.03, 0.12, 0.095]} c="#ff4fa3" />
            <B a={[0.024, 0.024, 0.026]} pos={[0, 0.12, 0.095]} c="#ffd1e6" />
          </>
        )}
        {suit && <B a={[0.31, 0.02, 0.19]} pos={[0, 0.155, 0]} c={t.accent} metal={0.6} rough={0.3} />}
        <Arm s={1} o={o} peace={peace} />
        <Arm s={-1} o={o} peace={peace} />
        <group name="neck" position={[0, 0.16, 0]} rotation={R('neck')}>
          <B a={[0.07, 0.07, 0.07]} pos={[0, 0.0, 0]} c={SKIN} />
          {o.extras.includes('choker') && <B a={[0.085, 0.022, 0.085]} pos={[0, 0.01, 0]} c="#ff4fa3" />}
          <group name="head" position={[0, 0.035, 0]} rotation={R('head')} scale={1.15}>
            <Head outfit={o} face={face} />
          </group>
        </group>
      </group>
    </>
  );
}

function Bottom({ o }) {
  const b = o.bottom;
  const skirt = b.type === 'skirt';
  const slim = b.type === 'slim';
  return (
    <>
      <B a={[0.28, 0.11, 0.18]} c={b.color} metal={slim ? 0.5 : 0} rough={slim ? 0.35 : 0.85} />
      {b.type === 'cargo' && <B a={[0.29, 0.035, 0.19]} pos={[0, 0.075, 0]} c={b.light} />}
      {skirt && (
        <>
          <P g="cylinder" a={[0.15, 0.24, 0.2, 8]} pos={[0, -0.08, 0]} c={b.color} />
          <P g="torus" a={[0.235, 0.012, 3, 8]} pos={[0, -0.178, 0]} rot={[Math.PI / 2, 0, Math.PI / 8]} c={b.accent} />
        </>
      )}
    </>
  );
}

function Coat({ o }) {
  const c = o.coat;
  if (!c) return null;
  return (
    <group position={[0, -0.015, 0]}>
      <B a={[0.36, 0.55, 0.04]} pos={[0, 0, -0.105]} c={c.color} />
      {[1, -1].map((s) => (
        <group key={s}>
          <B a={[0.04, 0.55, 0.21]} pos={[s * 0.17, 0, 0]} c={c.color} />
          <B a={[0.1, 0.5, 0.03]} pos={[s * 0.115, -0.02, 0.1]} c={c.color} />
          <B a={[0.012, 0.5, 0.034]} pos={[s * 0.065, -0.02, 0.1]} c={c.accent} />
        </group>
      ))}
    </group>
  );
}

export function ProceduralAvatar({ outfit, pose }) {
  const outer = useRef();
  const rig = useRef();
  useRig(rig, outer, pose);
  const peace = !!pose.peace;

  return (
    <group ref={outer}>
      <group ref={rig}>
        <group name="hips" position={[0, HIPS_Y, 0]} rotation={R('hips')}>
          <Bottom o={outfit} />
          <Leg s={1} o={outfit} />
          <Leg s={-1} o={outfit} />
          <group name="spine" position={[0, 0.05, 0]} rotation={R('spine')}>
            <Torso o={outfit} face={pose.face ?? 'normal'} peace={peace} />
            <Coat o={outfit} />
          </group>
        </group>
      </group>
    </group>
  );
}
