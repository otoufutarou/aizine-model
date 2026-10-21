import { CanvasTexture, NearestFilter, RepeatWrapping, SRGBColorSpace } from 'three';
import { BROW, CHEEK, EYE, getExpression } from './expressions.js';

const SKIN = '#fbd9c4';
const cache = new Map();

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function toTexture(canvas, nearest = false) {
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  if (nearest) {
    t.magFilter = NearestFilter;
    t.minFilter = NearestFilter;
    t.generateMipmaps = false;
  }
  return t;
}

function memo(key, build) {
  if (!cache.has(key)) cache.set(key, build());
  return cache.get(key);
}

const INK = 'round';

function closedEye(ctx, side, arc) {
  const { w, line, lineColor } = EYE;
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = line;
  ctx.lineCap = INK;
  ctx.beginPath();
  ctx.moveTo(-w / 2, arc.rise * 0.28);
  ctx.quadraticCurveTo(0, -arc.rise * 0.95, w / 2, arc.rise * 0.28);
  ctx.stroke();
}

function openEye(ctx, side, o) {
  const { w, h, line, lineColor } = EYE;
  const xi = -side * (w / 2 + 2); // inner end (towards the nose line)
  const xo = side * (w / 2 + 2); // outer end
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = EYE.sclera;
  ctx.fillRect(-w, -h, w * 2, h * 2);
  ctx.fillStyle = EYE.iris;
  ctx.beginPath();
  ctx.ellipse(0, o.irisY, w * 0.44, h * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = EYE.pupil;
  ctx.beginPath();
  ctx.ellipse(0, o.irisY + 2, w * 0.22 * o.pupilScale, h * 0.3 * o.pupilScale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = EYE.highlight;
  ctx.beginPath();
  ctx.arc(-side * 14, o.irisY + 12, 10, 0, Math.PI * 2);
  ctx.fill();
  // skin-coloured lid hides the top of the eyeball
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.moveTo(xi, o.lidInner);
  ctx.quadraticCurveTo(0, o.lidCtrl, xo, o.lidOuter);
  ctx.lineTo(xo, -h);
  ctx.lineTo(xi, -h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = line;
  ctx.lineCap = INK;
  ctx.beginPath();
  ctx.moveTo(xi, o.lidInner);
  ctx.quadraticCurveTo(0, o.lidCtrl, xo, o.lidOuter);
  ctx.stroke();
}

// side: -1 = left of canvas, +1 = right of canvas.
function drawEye(ctx, W, H, side, expr) {
  ctx.save();
  ctx.translate(W * EYE.cx[side > 0 ? 1 : 0], H * EYE.cy);
  ctx.rotate(-side * EYE.tilt);
  if (expr.eyes[side > 0 ? 'right' : 'left'] === 'closed') closedEye(ctx, side, expr.arc);
  else openEye(ctx, side, expr.open);
  ctx.restore();
}

// Tsuri-mayu: outer end high, inner end low. Only the angle depends on the expression.
function drawBrow(ctx, W, H, side, expr) {
  const closed = expr.eyes[side > 0 ? 'right' : 'left'] === 'closed';
  const deg = closed && expr.brow.closedAngle != null ? expr.brow.closedAngle : expr.brow.angle;
  const a = (deg * Math.PI) / 180;
  const cx = (0.5 + side * BROW.cx) * W;
  const cy = BROW.cy * H;
  const dx = Math.cos(a) * BROW.half * -side;
  const dy = Math.sin(a) * BROW.half;
  ctx.strokeStyle = BROW.color;
  ctx.lineWidth = BROW.line;
  ctx.lineCap = INK;
  ctx.beginPath();
  ctx.moveTo(cx + dx, cy + dy); // inner end, lower
  ctx.lineTo(cx - dx, cy - dy); // outer end, higher
  ctx.stroke();
}

function drawCheek(ctx, x, y) {
  ctx.strokeStyle = CHEEK.color;
  ctx.lineWidth = CHEEK.line;
  ctx.lineCap = INK;
  for (let i = 0; i < 3; i += 1) {
    const sx = x + i * 17;
    ctx.beginPath();
    ctx.moveTo(sx, y + 22);
    ctx.lineTo(sx + 13, y - 22);
    ctx.stroke();
  }
}

// Eyes first, then brows on top so a lid can never hide them. No mouth or nose on any expression.
export function faceCanvas(exprId = 'normal') {
  return memo(`face-canvas-${exprId}`, () => {
    const W = 600;
    const H = 540;
    const expr = getExpression(exprId);
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    ctx.fillStyle = SKIN;
    ctx.fillRect(0, 0, W, H);
    drawEye(ctx, W, H, -1, expr);
    drawEye(ctx, W, H, 1, expr);
    drawBrow(ctx, W, H, -1, expr);
    drawBrow(ctx, W, H, 1, expr);
    drawCheek(ctx, W * CHEEK.x[0], H * CHEEK.y);
    drawCheek(ctx, W * CHEEK.x[1], H * CHEEK.y);
    return c;
  });
}

export function faceTexture(expr = 'normal') {
  return memo(`face-${expr}`, () => toTexture(faceCanvas(expr)));
}

export function hatTexture(palette, pink) {
  return memo(`hat-${palette.join()}-${pink}`, () => {
    const N = 4;
    const S = 32;
    const c = makeCanvas(N * S, N * S);
    const ctx = c.getContext('2d');
    for (let i = 0; i < N; i += 1) {
      for (let j = 0; j < N; j += 1) {
        let col = (i + j) % 2 ? palette[0] : palette[1];
        if ((i + j * 2) % 5 === 0) col = palette[2];
        if (i === 1 && j === 2) col = pink;
        ctx.fillStyle = col;
        ctx.fillRect(i * S, j * S, S, S);
      }
    }
    const t = toTexture(c, true);
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    t.repeat.set(2, 1);
    return t;
  });
}

export function emblemTexture(text, color) {
  return memo(`emblem-${text}-${color}`, () => {
    const c = makeCanvas(256, 128);
    const ctx = c.getContext('2d');
    ctx.font = "italic 900 96px 'Arial Black', Impact, sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, 128, 70);
    return toTexture(c);
  });
}

export function zigzagTexture(color) {
  return memo(`zig-${color}`, () => {
    const c = makeCanvas(256, 96);
    const ctx = c.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = 16;
    ctx.lineJoin = 'miter';
    ctx.beginPath();
    for (let i = 0; i <= 6; i += 1) {
      const x = 20 + i * 36;
      const y = i % 2 ? 22 : 74;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    return toTexture(c);
  });
}
