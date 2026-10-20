import { useRef } from 'react';
import { DoubleSide } from 'three';
import { M, P, Decal } from './Prims.jsx';
import { Head } from './Head.jsx';
import { useRig } from './useRig.js';
import { BASE_POSE } from '../data/poses.js';
import { emblemTexture, zigzagTexture } from './textures.js';
import {
  CARDIGAN_PROFILE, CHEST_PROFILE, COAT_PROFILE, PELVIS_PROFILE, TORSO_X, TORSO_Z, frontZ, lathe,
} from './geometry.js';

const SKIN = '#fbd9c4';
const HIPS_Y = 0.64;
const R = (name) => BASE_POSE[name];
const PI2 = Math.PI / 2;

// Chunky platform sneaker built from squashed spheres.
function Shoe({ shoes }) {
  const { sole, upper, accent } = shoes;
  const zig = zigzagTexture(accent);
  return (
    <group>
      <P g="sphere" a={[1, 10, 7]} pos={[0, -0.04, 0.04]} scale={[0.115, 0.05, 0.19]} c={sole} />
      <P g="sphere" a={[1, 10, 8]} pos={[0, 0.035, 0.04]} scale={[0.108, 0.1, 0.17]} c={upper} />
      <P g="sphere" a={[1, 8, 6]} pos={[0, -0.002, 0.15]} scale={[0.07, 0.05, 0.06]} c={sole} />
      <P g="sphere" a={[1, 8, 6]} pos={[0, 0.1, -0.03]} scale={[0.075, 0.05, 0.075]} c={upper} />
      {[1, -1].map((s) => (
        <Decal key={s} map={zig} size={[0.12, 0.045]} pos={[s * 0.1175, -0.04, 0.04]} rot={[0, s * PI2, 0]} />
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
  const mat = slim ? { metal: 0.5, rough: 0.35 } : {};
  // [top radius, knee radius, hem radius]
  const [rt, rk, rh] = cargo ? [0.1, 0.12, 0.15] : slim ? [0.068, 0.056, 0.052] : [0.045, 0.04, 0.038];
  return (
    <group name={`thigh${side}`} position={[s * 0.09, -0.03, 0]} rotation={R(`thigh${side}`)}>
      <P g="sphere" a={[1, 8, 6]} scale={[rt * 1.05, rt * 1.05, rt * 1.05]} c={skirt ? SKIN : b.color} {...mat} />
      <P g="cylinder" a={[rt, rk, 0.26, 9]} pos={[0, -0.13, 0]} c={skirt ? SKIN : b.color} {...mat} />
      {cargo && (
        <>
          <P g="sphere" a={[1, 7, 5]} pos={[s * 0.112, -0.1, 0.01]} scale={[0.03, 0.06, 0.07]} c={b.light} />
          <P g="cylinder" a={[0.026, 0.026, 0.004, 3]} pos={[s * 0.143, -0.1, 0.01]} rot={[0, 0, PI2]} c={b.accent} />
        </>
      )}
      <group name={`knee${side}`} position={[0, -0.26, 0]} rotation={R(`knee${side}`)}>
        <P g="sphere" a={[1, 8, 6]} scale={[rk, rk, rk]} c={skirt ? SKIN : b.color} {...mat} />
        {skirt ? (
          <>
            <P g="cylinder" a={[0.04, 0.034, 0.24, 8]} pos={[0, -0.12, 0]} c={SKIN} />
            <P g="cylinder" a={[0.048, 0.046, 0.15, 8]} pos={[0, -0.14, 0]} c={o.socks} />
            <P g="cylinder" a={[0.052, 0.05, 0.025, 8]} pos={[0, -0.075, 0]} c="#ffc2dd" />
          </>
        ) : (
          <P g="cylinder" a={[rk, rh, 0.22, 9]} pos={[0, -0.11, 0]} c={b.color} {...mat} />
        )}
        {cargo && <P g="cylinder" a={[rh, rh + 0.006, 0.05, 9]} pos={[0, -0.205, 0]} c={b.light} />}
        <group position={[0, -0.242, 0]} scale={1.2}>
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
  const sleeveColor = coat ? o.coat.color : t.color;
  return (
    <group name={`shoulder${side}`} position={[s * 0.205, 0.12, 0]} rotation={R(`shoulder${side}`)}>
      {puff ? (
        <>
          <P g="sphere" a={[1, 8, 6]} pos={[0, -0.025, 0]} scale={[0.082, 0.075, 0.08]} c={t.color} />
          <P g="cylinder" a={[0.034, 0.03, 0.18, 7]} pos={[0, -0.09, 0]} c={SKIN} />
        </>
      ) : (
        <>
          <P g="sphere" a={[1, 8, 6]} scale={[0.063, 0.063, 0.063]} c={sleeveColor} />
          <P g="cylinder" a={[wide ? 0.055 : 0.05, wide ? 0.07 : 0.055, 0.18, 8]} pos={[0, -0.09, 0]} c={sleeveColor} />
        </>
      )}
      <group name={`elbow${side}`} position={[0, -0.18, 0]} rotation={R(`elbow${side}`)}>
        {puff ? (
          <>
            <P g="sphere" a={[1, 7, 5]} scale={[0.034, 0.034, 0.034]} c={SKIN} />
            <P g="cylinder" a={[0.03, 0.026, 0.17, 7]} pos={[0, -0.085, 0]} c={SKIN} />
          </>
        ) : (
          <>
            <P g="sphere" a={[1, 8, 6]} scale={[wide ? 0.07 : 0.056, wide ? 0.07 : 0.056, wide ? 0.07 : 0.056]} c={sleeveColor} />
            <P g="cylinder" a={[wide ? 0.07 : 0.056, wide ? 0.098 : 0.05, 0.17, 8]} pos={[0, -0.085, 0]} c={sleeveColor} />
            {wide && <P g="cylinder" a={[0.1, 0.1, 0.022, 8]} pos={[0, -0.165, 0]} c={t.accent} />}
          </>
        )}
        <P g="sphere" a={[1, 8, 6]} pos={[0, -0.2, 0]} scale={[0.036, 0.042, 0.03]} c={SKIN} />
        {peace && s < 0 && (
          <>
            <P g="cylinder" a={[0.009, 0.011, 0.08, 6]} pos={[-0.014, -0.26, 0]} rot={[0, 0, 0.25]} c={SKIN} />
            <P g="cylinder" a={[0.009, 0.011, 0.08, 6]} pos={[0.014, -0.26, 0]} rot={[0, 0, -0.25]} c={SKIN} />
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
  const chest = lathe('chest', CHEST_PROFILE);
  const cardigan = lathe('cardigan', CARDIGAN_PROFILE);
  const hemY = 0.012;
  return (
    <>
      <group name="chest" position={[0, 0.09, 0]} rotation={R('chest')}>
        {/* body: waist -> chest -> shoulders as one tapered lathe */}
        <M geo={chest} c={suit ? t.color : SKIN} metal={suit ? 0.1 : 0} />
        {!suit && (
          <>
            <M geo={cardigan} c={t.color} side={DoubleSide} />
            <P g="torus" a={[0.125, 0.012, 5, 12]} pos={[0, hemY + 0.005, 0]} rot={[PI2, 0, 0]} scale={[TORSO_X, TORSO_Z, 1]} c={t.accent} />
          </>
        )}
        {t.type === 'cardigan' && (
          <>
            {[0.05, 0.095, 0.14].map((y) => (
              <P key={y} g="sphere" a={[0.011, 6, 4]} pos={[0.0, y, frontZ(CARDIGAN_PROFILE, y) + 0.012]} c={t.accent} />
            ))}
            <Decal map={emblem} size={[0.075, 0.0375]} pos={[0.075, 0.115, frontZ(CARDIGAN_PROFILE, 0.115) + 0.002]} rot={[0, 0.35, 0]} />
          </>
        )}
        {t.type === 'frill' && (
          <>
            <P g="torus" a={[0.15, 0.018, 4, 12]} pos={[0, 0.02, 0]} rot={[PI2, 0, 0]} scale={[TORSO_X, TORSO_Z, 1]} c={t.accent} />
            <group position={[0, 0.125, frontZ(CARDIGAN_PROFILE, 0.125) + 0.012]}>
              <P g="sphere" a={[1, 6, 5]} pos={[0.032, 0, 0]} scale={[0.036, 0.026, 0.014]} c="#ff4fa3" />
              <P g="sphere" a={[1, 6, 5]} pos={[-0.032, 0, 0]} scale={[0.036, 0.026, 0.014]} c="#ff4fa3" />
              <P g="sphere" a={[0.02, 6, 5]} c="#ffd1e6" />
            </group>
          </>
        )}
        {suit && <P g="torus" a={[0.07, 0.01, 4, 10]} pos={[0, 0.17, 0]} rot={[PI2, 0, 0]} scale={[TORSO_X, TORSO_Z, 1]} c={t.accent} metal={0.6} rough={0.3} />}
        <Arm s={1} o={o} peace={peace} />
        <Arm s={-1} o={o} peace={peace} />
        <group name="neck" position={[0, 0.15, 0]} rotation={R('neck')}>
          <P g="cylinder" a={[0.034, 0.04, 0.16, 8]} pos={[0, 0.02, 0]} c={SKIN} />
          {o.extras.includes('choker') && <P g="torus" a={[0.04, 0.007, 4, 10]} pos={[0, 0.03, 0]} rot={[PI2, 0, 0]} c="#ff4fa3" />}
          <group name="head" position={[0, 0.09, 0]} rotation={R('head')} scale={1.28}>
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
  const pelvis = lathe('pelvis', PELVIS_PROFILE, { sx: 1.15, sz: 0.78 });
  return (
    <>
      <M geo={pelvis} c={b.color} metal={slim ? 0.5 : 0} rough={slim ? 0.35 : 0.85} />
      {b.type === 'cargo' && (
        <P g="torus" a={[0.118, 0.014, 4, 12]} pos={[0, 0.118, 0]} rot={[PI2, 0, 0]} scale={[1.15, 0.78, 1]} c={b.light} />
      )}
      {skirt && (
        <>
          <P g="cylinder" a={[0.15, 0.24, 0.2, 12]} pos={[0, -0.07, 0]} scale={[1.05, 1, 0.9]} c={b.color} />
          <P g="torus" a={[0.235, 0.012, 3, 12]} pos={[0, -0.168, 0]} rot={[PI2, 0, Math.PI / 8]} scale={[1.05, 0.9, 1]} c={b.accent} />
        </>
      )}
    </>
  );
}

function Coat({ o }) {
  const c = o.coat;
  if (!c) return null;
  const shell = lathe('coat', COAT_PROFILE, { sx: 1.2, sz: 0.8, seg: 14, phiStart: 0.2, phiLength: Math.PI * 2 - 0.4 });
  return <M geo={shell} c={c.color} side={DoubleSide} />;
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
