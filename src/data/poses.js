// Joint rotations are Euler XYZ radians. Names match the GLB rig convention in the README.
// Character faces +z, her left side is +x. Positive z on shoulderL lifts the arm outward.
export const JOINTS = [
  'hips', 'spine', 'chest', 'neck', 'head',
  'shoulderL', 'elbowL', 'shoulderR', 'elbowR',
  'thighL', 'kneeL', 'thighR', 'kneeR',
];

export const BASE_POSE = {
  hips: [0, 0, 0],
  spine: [0, 0, 0],
  chest: [0, 0, 0],
  neck: [0, 0, 0],
  head: [0, 0, 0],
  shoulderL: [0.05, 0, 0.14],
  elbowL: [-0.2, 0, 0],
  shoulderR: [0.05, 0, -0.14],
  elbowR: [-0.2, 0, 0],
  thighL: [0, 0, 0.04],
  kneeL: [0, 0, 0],
  thighR: [0, 0, -0.04],
  kneeR: [0, 0, 0],
};

export const POSES = [
  {
    id: 'stand',
    name: 'スタンド',
    en: 'STAND',
    joints: { head: [0, 0.05, 0.05], hips: [0, 0, 0.02] },
    y: 0,
  },
  {
    id: 'peace',
    name: 'ピース',
    en: 'PEACE',
    joints: {
      head: [0, -0.1, -0.14],
      chest: [0, 0.1, 0.03],
      shoulderR: [-1.1, 0, -0.45],
      elbowR: [-2.2, 0, 0.3],
      shoulderL: [0.05, 0, 0.2],
      thighL: [0, 0, 0.1],
      thighR: [-0.08, 0, -0.1],
    },
    peace: true,
    y: 0,
  },
  {
    id: 'hip',
    name: 'ハンドオンヒップ',
    en: 'HAND ON HIP',
    joints: {
      hips: [0, 0.1, 0.06],
      chest: [0, 0, -0.06],
      head: [0, -0.1, 0.1],
      shoulderL: [0, 0, 0.6],
      elbowL: [0, 0, -1.3],
      shoulderR: [0, 0, -0.6],
      elbowR: [0, 0, 1.3],
      thighL: [-0.18, 0, 0.06],
      kneeL: [0.12, 0, 0],
      thighR: [0.04, 0, -0.12],
    },
    y: -0.005,
  },
  {
    id: 'wave',
    name: 'バイバイ',
    en: 'WAVE',
    joints: {
      head: [0, 0.1, 0.12],
      shoulderL: [0, 0, 2.5],
      elbowL: [0, 0, 0.4],
    },
    wave: { joint: 'elbowL', axis: 2, amp: 0.5, speed: 7 },
    y: 0,
  },
  {
    id: 'runway',
    name: 'ランウェイ',
    en: 'RUNWAY',
    joints: {
      hips: [0, -0.2, 0.05],
      chest: [0, 0.3, -0.04],
      head: [0, 0.1, 0],
      shoulderL: [0.45, 0, 0.1],
      elbowL: [-0.5, 0, 0],
      shoulderR: [-0.45, 0, -0.1],
      elbowR: [-0.6, 0, 0],
      thighL: [-0.38, 0, 0.0],
      kneeL: [0.05, 0, 0],
      thighR: [0.3, 0, -0.02],
      kneeR: [0.55, 0, 0],
    },
    y: -0.05,
  },
];

export const DEFAULT_POSE = 'stand';
export const getPose = (id) => POSES.find((p) => p.id === id) ?? POSES[0];
