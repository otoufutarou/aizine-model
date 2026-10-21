// Single source of truth for AIRA's face. Pure data (no three.js) so UI, chat and the texture painter share it.
// Texture space: 600x540 canvas. Face shape, hat, hair and body live elsewhere and are not touched here.

// Shared by every expression: eye centre, width, stroke and iris design.
export const EYE = {
  cx: [0.28, 0.72], // left / right eye centre (fraction of canvas width)
  cy: 0.53, // fraction of canvas height
  w: 220,
  h: 195,
  tilt: 0.08, // rad, outer corner raised
  line: 12, // stroke width shared by lid lines and closed eyes
  lineColor: '#1c1210',
  sclera: '#fffaf4',
  iris: '#4a342c',
  pupil: '#1a100d',
  highlight: '#ffffff',
};

// Brows are positioned independently of the eyes and are always drawn on top of them.
// Tsuri-mayu is the base; an expression only changes `angle` (degrees, outer end up).
export const BROW = {
  cx: 0.24, // centre offset from the face midline (fraction of width)
  cy: 0.39, // fraction of height
  half: 85.6, // half length in px
  line: 9,
  color: '#4a3128',
};

// Same pink "///" on every expression.
export const CHEEK = { color: '#ff6b9a', line: 9, x: [0.16, 0.68], y: 0.82 };

// open eye lid: quadratic upper-lid line (inner end, outer end, control point; px from eye centre).
// Closed eyes (smile / wink) use `arc` rise and span the full EYE.w.
export const EXPRESSIONS = [
  {
    id: 'normal',
    name: '通常',
    en: 'NORMAL',
    keywords: ['通常の顔', '普通の顔', '真顔', '通常の表情', 'ノーマル顔'],
    brow: { angle: 11 },
    eyes: { left: 'open', right: 'open' },
    open: { lidInner: -30, lidOuter: 4, lidCtrl: -16, irisY: 4, pupilScale: 1 },
  },
  {
    id: 'smile',
    name: '笑顔',
    en: 'SMILE',
    keywords: ['笑顔', '笑って', 'にこにこ', 'ニコニコ', 'にっこり', 'スマイル', '笑う', '笑み'],
    brow: { angle: 7 },
    eyes: { left: 'closed', right: 'closed' },
    arc: { rise: 62 },
  },
  {
    id: 'wink',
    name: 'ウインク',
    en: 'WINK',
    keywords: ['ウインク', 'ウィンク', 'ウインクして', 'ぱちっ'],
    brow: { angle: 11, closedAngle: 6 },
    eyes: { left: 'open', right: 'closed' },
    open: { lidInner: -30, lidOuter: 4, lidCtrl: -16, irisY: 4, pupilScale: 1 },
    arc: { rise: 52 },
  },
  {
    id: 'cool',
    name: 'クール',
    en: 'COOL',
    keywords: ['クールな顔', 'クール顔', 'クールな表情', 'クールに', 'きりっと', 'キリッと', 'キメ顔', 'きめ顔', 'ドヤ顔', 'どや顔'],
    brow: { angle: 13 },
    eyes: { left: 'open', right: 'open' },
    // lid sits higher than NORMAL and the outer corner flicks up: alert tsurime, never sleepy
    open: { lidInner: -22, lidOuter: -46, lidCtrl: -62, irisY: 6, pupilScale: 1.1 },
  },
];

export const DEFAULT_EXPRESSION = 'normal';
export const getExpression = (id) => EXPRESSIONS.find((e) => e.id === id) ?? EXPRESSIONS[0];
