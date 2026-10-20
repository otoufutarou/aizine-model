import { useRef } from 'react';
import { DoubleSide } from 'three';
import { M, P, Decal } from './Prims.jsx';
import { Head } from './Head.jsx';
import { useRig } from './useRig.js';
import { BASE_POSE } from '../data/poses.js';
import { emblemTexture, zigzagTexture } from './textures.js';
import { getAccessory } from '../fashion/outfits.js';
import {
  CARDIGAN_PROFILE, CHEST_PROFILE, COAT_PROFILE, CROP_PROFILE, OVERSIZE_PROFILE, PELVIS_PROFILE,
  SHORT_JACKET_PROFILE, TORSO_X, TORSO_Z, TRACK_PROFILE, frontZ, lathe,
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
      <P g="sphere" a={[1, 10, 7]} pos={[0, -0.04, 0.04]} scale={[0.115, 0.05, 0.19]} c={sole} flat />
      <P g="sphere" a={[1, 10, 8]} pos={[0, 0.035, 0.04]} scale={[0.108, 0.1, 0.17]} c={upper} flat />
      <P g="sphere" a={[1, 8, 6]} pos={[0, -0.002, 0.15]} scale={[0.07, 0.05, 0.06]} c={sole} flat />
      <P g="sphere" a={[1, 8, 6]} pos={[0, 0.1, -0.03]} scale={[0.075, 0.05, 0.075]} c={upper} flat />
      {shoes.type === 'boot' && (
        <>
          <P g="cylinder" a={[0.062, 0.054, 0.21, 9]} pos={[0, 0.13, 0]} c={upper} flat />
          <P g="torus" a={[0.062, 0.012, 4, 9]} pos={[0, 0.235, 0]} rot={[PI2, 0, 0]} c={accent} />
          <P g="cylinder" a={[0.006, 0.006, 0.17, 4]} pos={[0, 0.13, 0.057]} c={accent} />
        </>
      )}
      {[1, -1].map((s) => (
        <Decal key={s} map={zig} size={[0.12, 0.045]} pos={[s * 0.1175, -0.04, 0.04]} rot={[0, s * PI2, 0]} />
      ))}
    </group>
  );
}

// [thigh radius, knee radius, hem radius, hip offset x]
const LEG_DIMS = {
  cargo: [0.1, 0.12, 0.15, 0.09],
  baggy: [0.115, 0.14, 0.175, 0.105],
  wide: [0.105, 0.125, 0.14, 0.1],
  parachute: [0.1, 0.135, 0.07, 0.1],
  slim: [0.068, 0.056, 0.052, 0.09],
  skirt: [0.045, 0.04, 0.038, 0.09],
  mini: [0.047, 0.04, 0.038, 0.09],
};

function Leg({ s, o }) {
  const side = s > 0 ? 'L' : 'R';
  const b = o.bottom;
  const bare = b.type === 'skirt' || b.type === 'mini';
  const slim = b.type === 'slim';
  const nylon = b.type === 'parachute';
  const [rt, rk, rh, hx] = LEG_DIMS[b.type];
  const mat = slim ? { metal: 0.5, rough: 0.35 } : nylon ? { metal: 0.35, rough: 0.4 } : {};
  const boot = o.shoes.type === 'boot';
  return (
    <group name={`thigh${side}`} position={[s * hx, -0.03, 0]} rotation={R(`thigh${side}`)}>
      <P g="sphere" a={[1, 8, 6]} scale={[rt * 1.05, rt * 1.05, rt * 1.05]} c={bare ? SKIN : b.color} {...mat} />
      <P g="cylinder" a={[rt, rk, 0.26, 9]} pos={[0, -0.13, 0]} c={bare ? SKIN : b.color} {...mat} />
      {b.type === 'cargo' && (
        <>
          <P g="sphere" a={[1, 7, 5]} pos={[s * 0.112, -0.1, 0.01]} scale={[0.03, 0.06, 0.07]} c={b.light} />
          <P g="cylinder" a={[0.026, 0.026, 0.004, 3]} pos={[s * 0.143, -0.1, 0.01]} rot={[0, 0, PI2]} c={b.accent} />
        </>
      )}
      <group name={`knee${side}`} position={[0, -0.26, 0]} rotation={R(`knee${side}`)}>
        <P g="sphere" a={[1, 8, 6]} scale={[rk, rk, rk]} c={bare ? SKIN : b.color} {...mat} />
        {bare ? (
          <>
            <P g="cylinder" a={[0.04, 0.034, 0.24, 8]} pos={[0, -0.12, 0]} c={SKIN} />
            {o.socks && (
              <>
                <P g="cylinder" a={[0.048, 0.046, 0.15, 8]} pos={[0, -0.14, 0]} c={o.socks} />
                <P g="cylinder" a={[0.052, 0.05, 0.025, 8]} pos={[0, -0.075, 0]} c="#ffc2dd" />
              </>
            )}
          </>
        ) : (
          <P g="cylinder" a={[rk, rh, 0.22, 9]} pos={[0, -0.11, 0]} c={b.color} {...mat} />
        )}
        {(b.type === 'cargo' || b.type === 'baggy') && <P g="cylinder" a={[rh, rh + 0.006, 0.05, 9]} pos={[0, -0.205, 0]} c={b.light} />}
        {b.type === 'wide' && <P g="cylinder" a={[rh, rh + 0.004, 0.03, 9]} pos={[0, -0.215, 0]} c={b.light} />}
        {nylon && <P g="torus" a={[rh, 0.016, 4, 9]} pos={[0, -0.2, 0]} rot={[PI2, 0, 0]} c={b.accent} />}
        <group position={[0, -0.242, 0]} scale={boot ? 1.15 : 1.2}>
          <Shoe shoes={o.shoes} />
        </group>
      </group>
    </group>
  );
}

// Sleeve shapes: shoulder ball radius, upper [top, bottom], elbow ball, lower [top, bottom], cuff ring radius.
const SLEEVES = {
  long: { sh: 0.063, up: [0.05, 0.055], el: 0.056, lo: [0.056, 0.05] },
  wide: { sh: 0.063, up: [0.055, 0.07], el: 0.07, lo: [0.07, 0.098], cuff: 0.1 },
  coat: { sh: 0.063, up: [0.05, 0.055], el: 0.056, lo: [0.056, 0.05] },
  jacket: { sh: 0.06, up: [0.047, 0.05], el: 0.05, lo: [0.05, 0.044], cuff: 0.046 },
  track: { sh: 0.066, up: [0.056, 0.066], el: 0.066, lo: [0.066, 0.06], cuff: 0.058 },
  oversize: { sh: 0.088, up: [0.078, 0.095], el: 0.096, lo: [0.096, 0.126], cuff: 0.128 },
  short: { sh: 0.062, up: [0.052, 0.06], el: 0.04, lo: [0.034, 0.03], skinLower: true },
};

function Arm({ s, o, peace }) {
  const side = s > 0 ? 'L' : 'R';
  const t = o.top;
  const puff = o.sleeve === 'puff';
  const coat = o.sleeve === 'coat';
  const d = SLEEVES[o.sleeve] ?? SLEEVES.long;
  const sleeveColor = coat ? o.coat.color : t.color;
  const lowerColor = d.skinLower ? SKIN : sleeveColor;
  const shine = o.sleeve === 'track' ? { metal: 0.35, rough: 0.4 } : {};
  const band = getAccessory(o, 'wristband');
  return (
    <group name={`shoulder${side}`} position={[s * (o.sleeve === 'oversize' ? 0.225 : 0.205), 0.12, 0]} rotation={R(`shoulder${side}`)}>
      {puff ? (
        <>
          <P g="sphere" a={[1, 8, 6]} pos={[0, -0.025, 0]} scale={[0.082, 0.075, 0.08]} c={t.color} />
          <P g="cylinder" a={[0.034, 0.03, 0.18, 7]} pos={[0, -0.09, 0]} c={SKIN} />
        </>
      ) : (
        <>
          <P g="sphere" a={[1, 8, 6]} scale={[d.sh, d.sh, d.sh]} c={sleeveColor} {...shine} />
          <P g="cylinder" a={[d.up[0], d.up[1], 0.18, 8]} pos={[0, -0.09, 0]} c={sleeveColor} {...shine} />
          {o.sleeve === 'track' && <P g="torus" a={[0.062, 0.01, 4, 9]} pos={[0, -0.07, 0]} rot={[PI2, 0, 0]} c={t.accent} />}
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
            <P g="sphere" a={[1, 8, 6]} scale={[d.el, d.el, d.el]} c={lowerColor} {...shine} />
            <P g="cylinder" a={[d.lo[0], d.lo[1], 0.17, 8]} pos={[0, -0.085, 0]} c={lowerColor} {...shine} />
            {d.cuff && <P g="cylinder" a={[d.cuff, d.cuff, 0.022, 8]} pos={[0, -0.165, 0]} c={t.accent} />}
          </>
        )}
        {band && <P g="torus" a={[0.04, 0.014, 4, 9]} pos={[0, -0.18, 0]} rot={[PI2, 0, 0]} c={band.color} />}
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

const STYLE_TOPS = ['crop', 'shortJacket', 'track', 'oversize'];
const ring = (y, r, sx = TORSO_X, sz = TORSO_Z) => ({ pos: [0, y, 0], rot: [PI2, 0, 0], scale: [sx, sz, 1], a: [r, 0.012, 4, 12] });

// Tops of the ViVi style lines, drawn in chest-local space over the chest lathe.
function StyleTop({ t }) {
  if (!STYLE_TOPS.includes(t.type)) return null;
  if (t.type === 'crop') {
    const shell = lathe('crop', CROP_PROFILE);
    const emblem = emblemTexture(t.emblem, t.emblemColor);
    return (
      <>
        <M geo={shell} c={t.color} side={DoubleSide} />
        <P g="torus" {...ring(0.08, 0.134)} c={t.accent} />
        <Decal map={emblem} size={[0.09, 0.045]} pos={[0, 0.125, frontZ(CROP_PROFILE, 0.125) + 0.003]} />
      </>
    );
  }
  if (t.type === 'shortJacket') {
    const shell = lathe('shortJacket', SHORT_JACKET_PROFILE, { phiStart: 0.34, phiLength: Math.PI * 2 - 0.68, seg: 14 });
    return (
      <>
        <M geo={shell} c={t.color} side={DoubleSide} />
        <P g="torus" {...ring(0.034, 0.133)} c={t.accent} />
        <P g="torus" {...ring(0.165, 0.1, 1.1, 0.8)} c={t.accent} />
      </>
    );
  }
  if (t.type === 'track') {
    const shell = lathe('track', TRACK_PROFILE, { seg: 14 });
    return (
      <>
        <M geo={shell} c={t.color} metal={0.35} rough={0.4} side={DoubleSide} />
        <P g="torus" {...ring(-0.025, 0.142)} c={t.accent} />
        <P g="torus" {...ring(0.172, 0.062, 1.15, 0.85)} c={t.accent} />
        <P g="cylinder" a={[0.004, 0.004, 0.2, 4]} pos={[0, 0.08, frontZ(TRACK_PROFILE, 0.08) + 0.004]} c={t.inner} />
        <P g="cylinder" a={[0.005, 0.005, 0.2, 4]} pos={[-0.062, 0.08, frontZ(TRACK_PROFILE, 0.08) * 0.82]} c={t.accent} />
      </>
    );
  }
  const shell = lathe('oversize', OVERSIZE_PROFILE, { phiStart: 0.3, phiLength: Math.PI * 2 - 0.6, seg: 14 });
  return (
    <>
      <M geo={shell} c={t.color} side={DoubleSide} />
      <P g="torus" {...ring(-0.15, 0.208)} c={t.accent} />
      <P g="torus" {...ring(0.19, 0.088, 1.15, 0.85)} c={t.color} />
    </>
  );
}

// Crossbody bag, heart pendant; both ride on the chest so they follow poses.
function Accessories({ o }) {
  const bag = getAccessory(o, 'bag');
  const heart = getAccessory(o, 'heart');
  const big = o.top.type === 'oversize';
  const zBag = big ? 0.185 : 0.14;
  const from = [0.13, 0.15];
  const to = [-0.17, -0.12];
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  return (
    <>
      {bag && (
        <>
          <P g="cylinder" a={[0.007, 0.007, Math.hypot(dx, dy), 5]} pos={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, zBag - 0.015]} rot={[0, 0, Math.atan2(-dx, dy)]} c={bag.color} />
          <P g="sphere" a={[1, 8, 6]} pos={[to[0], to[1] - 0.02, zBag]} scale={[0.085, 0.065, 0.045]} c={bag.color} />
          <P g="sphere" a={[1, 8, 6]} pos={[to[0], to[1] + 0.005, zBag + 0.02]} scale={[0.07, 0.03, 0.03]} c={bag.color} />
          <P g="sphere" a={[0.012, 6, 5]} pos={[to[0], to[1] + 0.005, zBag + 0.05]} c="#ffffff" />
          {bag.charm && (
            <>
              <P g="cylinder" a={[0.003, 0.003, 0.06, 4]} pos={[to[0] + 0.07, to[1] - 0.06, zBag]} c="#ffffff" />
              <P g="sphere" a={[0.026, 7, 5]} pos={[to[0] + 0.07, to[1] - 0.105, zBag]} c={bag.charm} />
            </>
          )}
        </>
      )}
      {heart && (
        <group position={[0, 0.11, frontZ(CHEST_PROFILE, 0.11) + 0.012]}>
          <P g="sphere" a={[0.016, 6, 5]} pos={[-0.011, 0.007, 0]} c={heart.color} />
          <P g="sphere" a={[0.016, 6, 5]} pos={[0.011, 0.007, 0]} c={heart.color} />
          <P g="cone" a={[0.021, 0.034, 6]} pos={[0, -0.012, 0]} rot={[0, 0, Math.PI]} c={heart.color} />
        </group>
      )}
    </>
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
        <M geo={chest} c={suit ? t.color : t.inner ?? SKIN} metal={suit ? 0.1 : 0} />
        {!suit && !STYLE_TOPS.includes(t.type) && (
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
        <StyleTop t={t} />
        <Accessories o={o} />
        {suit && <P g="torus" a={[0.07, 0.01, 4, 10]} pos={[0, 0.17, 0]} rot={[PI2, 0, 0]} scale={[TORSO_X, TORSO_Z, 1]} c={t.accent} metal={0.6} rough={0.3} />}
        <Arm s={1} o={o} peace={peace} />
        <Arm s={-1} o={o} peace={peace} />
        <group name="neck" position={[0, 0.15, 0]} rotation={R('neck')}>
          <P g="cylinder" a={[0.03, 0.036, 0.22, 10]} pos={[0, 0.04, 0]} c={SKIN} />
          {getAccessory(o, 'choker') && <P g="torus" a={[0.04, 0.007, 4, 10]} pos={[0, 0.03, 0]} rot={[PI2, 0, 0]} c={getAccessory(o, 'choker').color} />}
          <group name="head" position={[0, 0.14, 0]} rotation={R('head')} scale={1.28}>
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
  const mini = b.type === 'mini';
  const slim = b.type === 'slim';
  const nylon = b.type === 'parachute';
  const pelvis = lathe('pelvis', PELVIS_PROFILE, { sx: 1.15, sz: 0.78 });
  const wrap = getAccessory(o, 'waistWrap');
  const charm = getAccessory(o, 'bagCharm');
  const waist = ['cargo', 'baggy', 'wide', 'parachute'].includes(b.type);
  return (
    <>
      <M geo={pelvis} c={b.color} metal={slim ? 0.5 : nylon ? 0.35 : 0} rough={slim ? 0.35 : nylon ? 0.4 : 0.85} />
      {waist && (
        <P g="torus" a={[0.118, 0.014, 4, 12]} pos={[0, 0.118, 0]} rot={[PI2, 0, 0]} scale={[1.15, 0.78, 1]} c={nylon ? b.accent : b.light} />
      )}
      {skirt && (
        <>
          <P g="cylinder" a={[0.15, 0.24, 0.2, 12]} pos={[0, -0.07, 0]} scale={[1.05, 1, 0.9]} c={b.color} />
          <P g="torus" a={[0.235, 0.012, 3, 12]} pos={[0, -0.168, 0]} rot={[PI2, 0, Math.PI / 8]} scale={[1.05, 0.9, 1]} c={b.accent} />
        </>
      )}
      {mini && (
        <>
          <P g="cylinder" a={[0.155, 0.255, 0.115, 12]} pos={[0, -0.035, 0]} scale={[1.08, 1, 0.92]} c={b.color} />
          <P g="torus" a={[0.252, 0.012, 3, 12]} pos={[0, -0.092, 0]} rot={[PI2, 0, Math.PI / 8]} scale={[1.08, 0.92, 1]} c={b.accent} />
          <P g="torus" a={[0.156, 0.012, 3, 12]} pos={[0, 0.022, 0]} rot={[PI2, 0, 0]} scale={[1.08, 0.92, 1]} c={b.accent} />
        </>
      )}
      {charm && (
        <>
          <P g="cylinder" a={[0.003, 0.003, 0.07, 4]} pos={[-0.13, -0.04, 0.2]} c="#ffffff" />
          <P g="sphere" a={[0.028, 7, 5]} pos={[-0.13, -0.095, 0.2]} c={charm.color} />
          <P g="sphere" a={[0.014, 6, 5]} pos={[-0.108, -0.08, 0.212]} c="#ffffff" />
        </>
      )}
      {wrap && (
        <>
          <P g="torus" a={[0.165, 0.028, 5, 14]} pos={[0, 0.075, 0]} rot={[PI2, 0, 0]} scale={[1.1, 0.88, 1]} c={wrap.color} />
          <P g="sphere" a={[0.034, 6, 5]} pos={[-0.11, 0.07, 0.14]} c={wrap.color} />
          <P g="cylinder" a={[0.022, 0.02, 0.17, 6]} pos={[-0.13, -0.02, 0.15]} rot={[0.15, 0, 0.25]} c={wrap.color} />
          <P g="cylinder" a={[0.022, 0.02, 0.15, 6]} pos={[-0.08, -0.02, 0.165]} rot={[0.15, 0, -0.2]} c={wrap.color} />
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
