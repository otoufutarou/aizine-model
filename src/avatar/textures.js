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

// Flat hand-drawn eye: tall rounded ellipse, no lashes, no shadow. side: +1 = right of canvas.
function drawEye(ctx, cx, cy, side, expr) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-side * 0.08);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#2a1c18';
  ctx.lineWidth = 12;
  if (expr === 'smile') {
    ctx.beginPath();
    ctx.arc(0, 30, 44, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
  } else if (expr === 'wink' && side > 0) {
    ctx.beginPath();
    ctx.moveTo(-44, 14);
    ctx.lineTo(44, -6);
    ctx.stroke();
  } else {
    // reference style: dull half-lidded eye, iris fills the opening, lid droops toward the outer corner
    const w = 220;
    const h = 195;
    const eye = () => {
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
    };
    ctx.save();
    eye();
    ctx.clip();
    ctx.fillStyle = '#fffaf4';
    ctx.fillRect(-w, -h, w * 2, h * 2);
    ctx.fillStyle = '#4a342c';
    ctx.beginPath();
    ctx.ellipse(0, 4, w * 0.44, h * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a100d';
    ctx.beginPath();
    ctx.ellipse(0, 6, w * 0.22, h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-side * 14, 16, 10, 0, Math.PI * 2);
    ctx.fill();
    // heavy lid: slanted cut, outer end lower
    ctx.fillStyle = SKIN;
    ctx.beginPath();
    ctx.moveTo(-w, -h);
    ctx.lineTo(w, -h);
    ctx.lineTo(w, -12 + side * 16);
    ctx.lineTo(-w, -12 - side * 16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#1c1210';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(-side * (w / 2 + 2), -30);
    ctx.quadraticCurveTo(0, -16, side * (w / 2 + 2), 4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBrow(ctx, W, H, side) {
  // tsuri-mayu: outer end high, inner end low
  const inner = [0.5 + side * 0.1, 0.42];
  const outer = [0.5 + side * 0.38, 0.36];
  ctx.strokeStyle = '#4a3128';
  ctx.lineWidth = 9;
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
    drawEye(ctx, W * 0.28, H * 0.53, -1, expr);
    drawEye(ctx, W * 0.72, H * 0.53, 1, expr);
    drawBrow(ctx, W, H, -1);
    drawBrow(ctx, W, H, 1);
    drawCheek(ctx, W * 0.16, H * 0.82);
    drawCheek(ctx, W * 0.68, H * 0.82);
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
