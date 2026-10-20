import { CanvasTexture, NearestFilter, RepeatWrapping, SRGBColorSpace } from 'three';

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

// side: +1 = right side of the canvas, -1 = left. Outer corners are raised (slanted, long eyes).
function drawEye(ctx, cx, cy, side, expr) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-side * 0.12);
  ctx.scale(1.3, 1.3);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const arc = () => {
    ctx.strokeStyle = '#2a1c18';
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.arc(0, 28, 52, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  };

  if (expr === 'smile') {
    arc();
  } else if (expr === 'wink' && side > 0) {
    ctx.strokeStyle = '#2a1c18';
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(-52, 12);
    ctx.lineTo(54, -8);
    ctx.stroke();
  } else {
    const r = 16;
    const x0 = -54;
    const y0 = -52;
    const w = 108;
    const h = 118;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0 + r, y0);
    ctx.lineTo(x0 + w - r, y0);
    ctx.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
    ctx.lineTo(x0 + w, y0 + h - r);
    ctx.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
    ctx.lineTo(x0 + r, y0 + h);
    ctx.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
    ctx.lineTo(x0, y0 + r);
    ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
    ctx.clip();
    // flat banded iris (hand-drawn, no blur)
    const bands = [
      ['#2d2e34', 0],
      ['#42454e', 0.28],
      ['#646b78', 0.52],
      ['#8b919b', 0.68],
      ['#cdb94e', 0.84],
    ];
    bands.forEach(([col, t], i) => {
      const next = bands[i + 1] ? bands[i + 1][1] : 1;
      ctx.fillStyle = col;
      ctx.fillRect(x0, y0 + h * t, w, h * (next - t) + 1);
    });
    // pupil
    ctx.fillStyle = '#17171b';
    ctx.fillRect(-20, y0 + 6, 40, h * 0.62);
    // highlights
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-side * 30 - 12, y0 + 14, 24, 22);
    ctx.fillStyle = '#fff6b8';
    ctx.fillRect(side * 18, y0 + h - 36, 14, 14);
    ctx.restore();

    // thick upper lash with an outward flick
    ctx.fillStyle = '#2a1c18';
    ctx.beginPath();
    ctx.moveTo(-side * 62, y0 + 6);
    ctx.lineTo(-side * 50, y0 - 14);
    ctx.lineTo(side * 62, y0 - 20);
    ctx.lineTo(side * 86, y0 - 34);
    ctx.lineTo(side * 70, y0 + 8);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawBrow(ctx, W, H, side) {
  // tsuri-mayu: outer end high, inner end low
  const inner = [0.5 + side * 0.08, 0.385];
  const outer = [0.5 + side * 0.37, 0.3];
  ctx.strokeStyle = '#4a3128';
  ctx.lineWidth = 15;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(inner[0] * W, inner[1] * H);
  ctx.lineTo(outer[0] * W, outer[1] * H);
  ctx.stroke();
}

function drawCheek(ctx, x, y) {
  ctx.strokeStyle = '#ff6b9a';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i += 1) {
    const sx = x + i * 17;
    ctx.beginPath();
    ctx.moveTo(sx, y + 22);
    ctx.lineTo(sx + 13, y - 22);
    ctx.stroke();
  }
}

export function faceTexture(expr = 'normal') {
  return memo(`face-${expr}`, () => {
    const W = 600;
    const H = 540;
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    ctx.fillStyle = SKIN;
    ctx.fillRect(0, 0, W, H);
    drawBrow(ctx, W, H, -1);
    drawBrow(ctx, W, H, 1);
    drawEye(ctx, W * 0.3, H * 0.55, -1, expr);
    drawEye(ctx, W * 0.7, H * 0.55, 1, expr);
    drawCheek(ctx, W * 0.16, H * 0.76);
    drawCheek(ctx, W * 0.68, H * 0.76);
    if (expr === 'smile' || expr === 'wink') {
      ctx.strokeStyle = '#c4655a';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(W * 0.5, H * 0.86, 20, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
    return toTexture(c);
  });
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
