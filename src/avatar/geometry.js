import { CylinderGeometry, LatheGeometry, SphereGeometry, Vector2 } from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Low-poly but rounded: every part is a deformed sphere / lathe / cylinder, never a box.
const cache = new Map();
const memo = (key, build) => {
  if (!cache.has(key)) cache.set(key, build());
  return cache.get(key);
};

// Torso cross-section is an ellipse: wider than deep.
export const TORSO_X = 1.2;
export const TORSO_Z = 0.72;

// Profiles are [y, radius] pairs, bottom to top (chest-local space).
export const CHEST_PROFILE = [
  [-0.04, 0.105], [0.02, 0.102], [0.09, 0.128], [0.14, 0.148], [0.158, 0.13], [0.172, 0.075], [0.182, 0.038],
];
export const CARDIGAN_PROFILE = [
  [0.005, 0.124], [0.05, 0.142], [0.11, 0.164], [0.15, 0.166], [0.17, 0.13], [0.182, 0.074],
];
// Cropped tee: starts above the waist so the midriff shows.
export const CROP_PROFILE = [
  [0.075, 0.133], [0.11, 0.164], [0.15, 0.166], [0.17, 0.13], [0.182, 0.074],
];
export const SHORT_JACKET_PROFILE = [
  [0.03, 0.132], [0.07, 0.15], [0.125, 0.172], [0.155, 0.172], [0.172, 0.13], [0.182, 0.074],
];
// Track jacket: straight, waist-length, with a banded hem.
export const TRACK_PROFILE = [
  [-0.03, 0.14], [0.03, 0.148], [0.1, 0.168], [0.15, 0.172], [0.172, 0.13], [0.182, 0.074],
];
// Oversize jacket: dropped shoulders, boxy, hip length.
export const OVERSIZE_PROFILE = [
  [-0.16, 0.205], [-0.06, 0.21], [0.06, 0.205], [0.14, 0.2], [0.185, 0.17], [0.2, 0.1], [0.208, 0.062],
];
export const PELVIS_PROFILE = [
  [-0.06, 0.125], [0.0, 0.15], [0.07, 0.14], [0.125, 0.112],
];
export const COAT_PROFILE = [
  [-0.36, 0.23], [-0.2, 0.18], [0, 0.162], [0.12, 0.164], [0.2, 0.172], [0.235, 0.115], [0.248, 0.07],
];

const toVec = (pts) => pts.map(([y, r]) => new Vector2(r, y));

export function lathe(key, pts, { sx = TORSO_X, sz = TORSO_Z, seg = 12, phiStart = 0, phiLength = Math.PI * 2 } = {}) {
  return memo(key, () => {
    const g = new LatheGeometry(toVec(pts), seg, phiStart, phiLength);
    g.scale(sx, 1, sz);
    return g;
  });
}

// Surface z (front) of a torso profile at height y, for placing decals.
export function frontZ(pts, y) {
  for (let i = 0; i < pts.length - 1; i += 1) {
    const [y0, r0] = pts[i];
    const [y1, r1] = pts[i + 1];
    if (y >= y0 && y <= y1) return (r0 + ((r1 - r0) * (y - y0)) / (y1 - y0)) * TORSO_Z * 0.97;
  }
  return 0.1;
}

// Head: a softly rounded square (rounded box) with a flat front for the hand-drawn face.
// Front triangles (group 0) get planar-projected UVs for the face texture.
export const HEAD_CY = 0.15;
const FACE_W = 0.34;
const FACE_H = 0.306;
export function headGeometry() {
  return memo('head', () => {
    const raw = new RoundedBoxGeometry(0.34, 0.31, 0.3, 6, 0.065);
    const p = raw.attributes.position;
    const uv = raw.attributes.uv;
    for (let i = 0; i < p.count; i += 1) {
      const ny = p.getY(i) / 0.155; // -1 chin .. 1 crown
      const jaw = ny < 0 ? 1 - 0.07 * -ny : 1;
      const x = p.getX(i) * jaw;
      const y = HEAD_CY + p.getY(i);
      p.setXYZ(i, x, y, p.getZ(i));
      uv.setXY(i, 0.5 + x / FACE_W, 0.5 + (y - 0.14) / FACE_H);
    }
    const g = mergeVertices(raw);
    const mp = g.attributes.position;
    const index = g.getIndex().array;
    const front = [];
    const back = [];
    for (let i = 0; i < index.length; i += 3) {
      const a = index[i];
      const b = index[i + 1];
      const c = index[i + 2];
      const cz = (mp.getZ(a) + mp.getZ(b) + mp.getZ(c)) / 3;
      (cz > 0 ? front : back).push(a, b, c);
    }
    g.setIndex([...front, ...back]);
    g.clearGroups();
    g.addGroup(0, front.length, 0);
    g.addGroup(front.length, back.length, 1);
    return g;
  });
}

// Curved hair curtain wrapping from one temple around the back, with a jagged hem.
export function hairShell(key, { rTop, rBot, h, rx, rz, thetaStart, thetaLength, jag = 0.05, bulge = 0.07 }) {
  return memo(key, () => {
    const g = new CylinderGeometry(rTop, rBot, h, 14, 3, true, thetaStart, thetaLength);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i += 1) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      const t = (h / 2 - y) / h; // 0 top .. 1 hem
      const swell = 1 + bulge * Math.sin(Math.min(1, t * 1.25) * Math.PI * 0.8);
      let ny = y;
      if (t > 0.99) ny -= jag * (0.5 + 0.5 * Math.sin(Math.atan2(x, z) * 8));
      p.setXYZ(i, x * rx * swell, ny, z * rz * swell);
    }
    g.computeVertexNormals();
    return g;
  });
}

// Beanie dome: a cut sphere, scaled by the mesh.
export function domeGeometry(cutCos) {
  return memo(`dome-${cutCos}`, () => new SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.acos(cutCos)));
}
