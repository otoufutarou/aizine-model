"""Generate decorative PNG assets (chrome type, stickers, backgrounds) into assets/gen/.

Usage: python3 scripts/gen_assets.py
Everything is procedural (Pillow / numpy / scipy), so no third-party artwork is used.
"""
import math
import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "gen")

PINK = (255, 20, 147)
LIME = (184, 255, 0)
YELLOW = (249, 255, 0)
BLUE = (54, 123, 255)
LAV = (201, 167, 255)
BLACK = (20, 16, 25)
WHITE = (255, 255, 255)
BABY = (255, 212, 233)

F_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"
F_ROUND = "/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf"
F_HAND = "/System/Library/Fonts/MarkerFelt.ttc"

W, H = 1920, 1080


def font(path, size):
    return ImageFont.truetype(path, size)


def save(img, name):
    os.makedirs(OUT, exist_ok=True)
    img.save(os.path.join(OUT, name), optimize=True)


# ---------------------------------------------------------------- chrome engine
def _ramp(u, stops):
    xs = [s[0] for s in stops]
    return np.stack([np.interp(u, xs, [s[1][c] for s in stops]) for c in range(3)], -1)


CHROME = [
    (0.00, (70, 45, 125)), (0.18, (196, 176, 255)), (0.34, (255, 255, 255)),
    (0.47, (150, 130, 205)), (0.56, (46, 34, 100)), (0.68, (170, 160, 245)),
    (0.84, (255, 214, 242)), (1.00, (140, 105, 225)),
]


def _normals(mask, rmax):
    dist = ndi.distance_transform_edt(mask > 0.5)
    t = np.clip(dist / rmax, 0, 1)
    h = np.sqrt(1 - (1 - t) ** 2) * rmax * 0.95
    h = ndi.gaussian_filter(h, rmax * 0.07)
    gy, gx = np.gradient(h)
    n = np.dstack([-gx, -gy, np.ones_like(h)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    return n


def _vgrad(mask):
    ys = np.where(mask.max(1) > 0.5)[0]
    top, bot = (ys[0], ys[-1]) if len(ys) else (0, mask.shape[0])
    return np.clip((np.arange(mask.shape[0]) - top) / max(1, bot - top), 0, 1)[:, None] * np.ones_like(mask)


def chrome_face(mask, rmax):
    n = _normals(mask, rmax)
    u = 0.5 - 0.5 * n[..., 1] * 1.5 + (_vgrad(mask) - 0.5) * 0.9
    rgb = _ramp(np.clip(u, 0, 1), CHROME)
    lh = np.array([-0.45, -0.7, 0.55])
    lh /= np.linalg.norm(lh)
    spec = np.clip((n * lh).sum(2), 0, 1) ** 28
    rgb = rgb + spec[..., None] * 255 * 0.95
    return np.clip(rgb, 0, 255)


def balloon_face(mask, rmax, color):
    n = _normals(mask, rmax)
    lh = np.array([-0.4, -0.65, 0.65])
    lh /= np.linalg.norm(lh)
    lam = np.clip((n * lh).sum(2), 0, 1)
    base = np.array(color, dtype=float)
    shade = 0.55 + 0.65 * lam
    rgb = base * shade[..., None]
    spec = np.clip((n * lh).sum(2), 0, 1) ** 24
    rgb = rgb + spec[..., None] * 255 * 0.85
    rim = (1 - n[..., 2]) ** 2
    rgb = rgb + (255 - rgb) * (0.35 * rim)[..., None]
    return np.clip(rgb, 0, 255)


def _compose(mask, face_rgb, stroke, size, glow=True):
    d_out = ndi.distance_transform_edt(mask < 0.5)
    layers = []
    if glow:
        g = np.clip(1 - d_out / (size * 0.22), 0, 1) ** 2
        layers.append((np.array(stroke, float), g * 0.55))
    layers.append((np.array(stroke, float), (d_out <= size * 0.075).astype(float)))
    layers.append((np.array(WHITE, float), (d_out <= size * 0.028).astype(float)))
    h, w = mask.shape
    out = np.zeros((h, w, 4), float)
    for col, a in layers:
        a = ndi.gaussian_filter(a, 1.2)[..., None]
        out[..., :3] = out[..., :3] * (1 - a) + col * a
        out[..., 3:] = out[..., 3:] * (1 - a) + 255 * a
    a = ndi.gaussian_filter(mask, 0.8)[..., None]
    out[..., :3] = out[..., :3] * (1 - a) + face_rgb * a
    out[..., 3:] = out[..., 3:] * (1 - a) + 255 * a
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")


def text_mask(text, fpath, size, pad=None):
    f = font(fpath, size)
    pad = pad or int(size * 0.45)
    l, t, r, b = f.getbbox(text)
    img = Image.new("L", (r - l + pad * 2, b - t + pad * 2), 0)
    ImageDraw.Draw(img).text((pad - l, pad - t), text, font=f, fill=255)
    return np.asarray(img, float) / 255


def chrome_text(text, name, size=520, stroke=PINK, fpath=F_ROUND, kind="chrome", color=None):
    m = text_mask(text, fpath, size)
    rmax = size * 0.13
    face = chrome_face(m, rmax) if kind == "chrome" else balloon_face(m, rmax, color)
    save(_compose(m, face, stroke, size), name)


def shape_mask(kind, s=700):
    pad = int(s * 0.3)
    img = Image.new("L", (s + pad * 2, s + pad * 2), 0)
    d = ImageDraw.Draw(img)
    c = s / 2 + pad
    if kind == "heart":
        pts = []
        for i in range(400):
            t = i / 400 * 2 * math.pi
            x = 16 * math.sin(t) ** 3
            y = -(13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))
            pts.append((c + x * s / 36, c + y * s / 36 - s * 0.03))
        d.polygon(pts, fill=255)
    elif kind == "star":
        pts = []
        for i in range(10):
            r = s * 0.5 if i % 2 == 0 else s * 0.22
            a = -math.pi / 2 + i * math.pi / 5
            pts.append((c + r * math.cos(a), c + r * math.sin(a)))
        d.polygon(pts, fill=255)
        img = img.filter(ImageFilter.GaussianBlur(s * 0.025)).point(lambda v: 255 if v > 128 else 0)
    elif kind == "spark":
        pts = []
        for i in range(8):
            r = s * 0.5 if i % 2 == 0 else s * 0.07
            a = -math.pi / 2 + i * math.pi / 4
            pts.append((c + r * math.cos(a), c + r * math.sin(a)))
        d.polygon(pts, fill=255)
    return np.asarray(img, float) / 255


def chrome_shape(kind, name, stroke=PINK, s=700, color=None):
    m = shape_mask(kind, s)
    dmax = ndi.distance_transform_edt(m > 0.5).max()
    rmax = dmax * 0.9
    face = chrome_face(m, rmax) if color is None else balloon_face(m, rmax, color)
    save(_compose(m, face, stroke, s), name)


def sparkle(name, color, size=400):
    m = shape_mask("spark", size)
    img = Image.new("RGBA", m.shape[::-1], color + (0,))
    a = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
    img.putalpha(a)
    glow = Image.new("RGBA", img.size, color + (0,))
    glow.putalpha(a.filter(ImageFilter.GaussianBlur(size * 0.07)).point(lambda v: min(255, v * 2)))
    out = Image.alpha_composite(glow, img)
    save(out, name)


# ---------------------------------------------------------------- stickers
def barcode(name, w=520, h=190, fg=BLACK, bg=WHITE, label="2026 0214 1999"):
    img = Image.new("RGB", (w, h), bg)
    d = ImageDraw.Draw(img)
    rnd = random.Random(7)
    x = 24
    while x < w - 24:
        bw = rnd.choice([3, 3, 6, 9])
        d.rectangle([x, 16, x + bw - 1, h - 52], fill=fg)
        x += bw + rnd.choice([3, 6, 6, 9])
    d.text((w // 2, h - 28), label, font=font(F_BLACK, 24), fill=fg, anchor="mm")
    save(img, name)


def qr(name, n=25, cell=12, fg=BLACK, bg=WHITE):
    rnd = random.Random(3)
    s = n * cell + 2 * cell
    img = Image.new("RGB", (s, s), bg)
    d = ImageDraw.Draw(img)
    for i in range(n):
        for j in range(n):
            if rnd.random() < 0.5:
                d.rectangle([(i + 1) * cell, (j + 1) * cell, (i + 2) * cell - 1, (j + 2) * cell - 1], fill=fg)
    for ox, oy in [(0, 0), (n - 7, 0), (0, n - 7)]:
        x0, y0 = (ox + 1) * cell, (oy + 1) * cell
        d.rectangle([x0 - 2, y0 - 2, x0 + 7 * cell + 1, y0 + 7 * cell + 1], fill=bg)
        d.rectangle([x0, y0, x0 + 7 * cell - 1, y0 + 7 * cell - 1], fill=fg)
        d.rectangle([x0 + cell, y0 + cell, x0 + 6 * cell - 1, y0 + 6 * cell - 1], fill=bg)
        d.rectangle([x0 + 2 * cell, y0 + 2 * cell, x0 + 5 * cell - 1, y0 + 5 * cell - 1], fill=fg)
    save(img, name)


def _wobble(pts, amp=3, seed=1):
    rnd = random.Random(seed)
    return [(x + rnd.uniform(-amp, amp), y + rnd.uniform(-amp, amp)) for x, y in pts]


def _stroke(d, pts, color, width):
    d.line(pts, fill=color, width=width, joint="curve")
    r = width // 2
    for x, y in (pts[0], pts[-1]):
        d.ellipse([x - r, y - r, x + r, y + r], fill=color)


def doodle(kind, name, color, size=500, width=14):
    S = 4
    img = Image.new("RGBA", (size * S, size * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = size * S / 2
    k = size * S
    w = width * S
    if kind == "heart":
        pts = []
        for i in range(0, 361, 6):
            t = math.radians(i)
            pts.append((c + 16 * math.sin(t) ** 3 * k / 40,
                        c - (13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)) * k / 40))
        _stroke(d, _wobble(pts, 5, 2), color, w)
    elif kind == "star":
        order = [0, 2, 4, 1, 3, 0]
        pts = [(c + k * 0.42 * math.cos(-math.pi / 2 + i * 2 * math.pi / 5),
                c + k * 0.42 * math.sin(-math.pi / 2 + i * 2 * math.pi / 5)) for i in order]
        _stroke(d, _wobble(pts, 6, 4), color, w)
    elif kind == "arrow":
        pts = [(k * 0.08, k * 0.62)]
        for i in range(1, 30):
            t = i / 29
            pts.append((k * (0.08 + 0.8 * t), k * (0.62 - 0.3 * math.sin(t * math.pi * 0.8))))
        _stroke(d, _wobble(pts, 2, 5), color, w)
        ex, ey = pts[-1]
        _stroke(d, [(ex - k * 0.14, ey - k * 0.14), (ex, ey), (ex - k * 0.17, ey + k * 0.1)], color, w)
    elif kind == "swirl":
        pts = []
        for i in range(0, 900, 8):
            t = math.radians(i)
            r = k * 0.03 + k * 0.42 * i / 900
            pts.append((c + r * math.cos(t), c + r * math.sin(t)))
        _stroke(d, _wobble(pts, 3, 6), color, w)
    elif kind == "underline":
        pts = [(k * (0.04 + 0.92 * i / 40), k * 0.5 + k * 0.05 * math.sin(i * 0.9)) for i in range(41)]
        _stroke(d, _wobble(pts, 3, 8), color, w)
    elif kind == "flower":
        for i in range(6):
            a = i * math.pi / 3
            px, py = c + k * 0.22 * math.cos(a), c + k * 0.22 * math.sin(a)
            r = k * 0.15
            d.ellipse([px - r, py - r, px + r, py + r], outline=color, width=w)
        r = k * 0.09
        d.ellipse([c - r, c - r, c + r, c + r], fill=color)
    elif kind == "circle":
        pts = [(c + k * (0.44 + 0.02 * t / 360) * math.cos(math.radians(t + 200)),
                c + k * (0.40 + 0.02 * t / 360) * math.sin(math.radians(t + 200))) for t in range(0, 400, 8)]
        _stroke(d, _wobble(pts, 4, 9), color, w)
    elif kind == "zigzag":
        pts = [(k * (0.05 + 0.9 * i / 12), k * (0.35 if i % 2 else 0.65)) for i in range(13)]
        _stroke(d, _wobble(pts, 3, 10), color, w)
    img = img.resize((size, size), Image.LANCZOS)
    save(img, name)


def tape(name, color, w=520, h=130):
    img = Image.new("RGBA", (w, h), color + (200,))
    d = ImageDraw.Draw(img)
    for x in range(-h, w, 36):
        d.polygon([(x, h), (x + 14, h), (x + 14 + h, 0), (x + h, 0)], fill=(255, 255, 255, 70))
    zz = Image.new("L", (w, h), 255)
    zd = ImageDraw.Draw(zz)
    for y in range(0, h, 16):
        zd.polygon([(0, y), (12, y + 8), (0, y + 16)], fill=0)
        zd.polygon([(w, y), (w - 12, y + 8), (w, y + 16)], fill=0)
    img.putalpha(Image.fromarray(np.minimum(np.asarray(img.getchannel("A")), np.asarray(zz))))
    save(img, name)


def bubble(name, size=400):
    yy, xx = np.mgrid[0:size, 0:size]
    c = size / 2
    r = np.hypot(xx - c, yy - c) / (size * 0.48)
    a = np.clip((r - 0.7) / 0.3, 0, 1) ** 1.5 * (r <= 1)
    hue = (np.arctan2(yy - c, xx - c) / (2 * math.pi) + 0.5)
    rgb = np.stack([128 + 127 * np.sin(hue * 6.28), 128 + 127 * np.sin(hue * 6.28 + 2.1),
                    128 + 127 * np.sin(hue * 6.28 + 4.2)], -1)
    alpha = np.clip(a * 190 + (r <= 1) * 22, 0, 255)
    hl = np.exp(-(((xx - c * 0.65) / (size * 0.08)) ** 2 + ((yy - c * 0.6) / (size * 0.05)) ** 2)) * 255
    rgb = rgb * (1 - hl[..., None] / 255) + 255 * hl[..., None] / 255
    alpha = np.maximum(alpha, hl)
    save(Image.fromarray(np.dstack([rgb, alpha]).astype(np.uint8), "RGBA"), name)


# ---------------------------------------------------------------- backgrounds
def grad(c1, c2, angle=90, size=(W, H)):
    yy, xx = np.mgrid[0:size[1], 0:size[0]].astype(float)
    a = math.radians(angle)
    t = (xx * math.cos(a) + yy * math.sin(a))
    t = (t - t.min()) / (t.max() - t.min())
    return np.stack([c1[i] + (c2[i] - c1[i]) * t for i in range(3)], -1)


def checker(c1, c2, cell=120, warp=0.0, size=(W, H), ox=0, oy=0):
    yy, xx = np.mgrid[0:size[1], 0:size[0]].astype(float)
    if warp:
        xx2 = xx + warp * np.sin(yy / 160.0) * cell
        yy2 = yy + warp * np.sin(xx / 200.0) * cell
        xx, yy = xx2, yy2
    m = ((np.floor((xx + ox) / cell) + np.floor((yy + oy) / cell)) % 2).astype(float)[..., None]
    return np.array(c1, float) * (1 - m) + np.array(c2, float) * m


def halftone(base, color, spacing=34, rmax=13, mask_fn=None, angle=45):
    img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)).convert("RGBA")
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    ca, sa = math.cos(math.radians(angle)), math.sin(math.radians(angle))
    for i in range(-60, 100):
        for j in range(-60, 100):
            x = (i * ca - j * sa) * spacing + img.width / 2
            y = (i * sa + j * ca) * spacing + img.height / 2
            if not (-20 < x < img.width + 20 and -20 < y < img.height + 20):
                continue
            k = mask_fn(x / img.width, y / img.height) if mask_fn else 1
            r = rmax * k
            if r > 1:
                d.ellipse([x - r, y - r, x + r, y + r], fill=color + (255,))
    return Image.alpha_composite(img, layer).convert("RGB")


def scatter(img, items, seed=1):
    """items: list of (png name, count, min size, max size); keeps scatter away from nothing - decorative."""
    rnd = random.Random(seed)
    img = img.convert("RGBA")
    for nm, cnt, lo, hi in items:
        sp = Image.open(os.path.join(OUT, nm)).convert("RGBA")
        for _ in range(cnt):
            s = rnd.randint(lo, hi)
            t = sp.resize((s, int(s * sp.height / sp.width)), Image.LANCZOS)
            img.alpha_composite(t, (rnd.randint(0, W - s), rnd.randint(0, H - t.height)))
    return img.convert("RGB")


def grain(arr, amt=6, seed=0):
    rnd = np.random.RandomState(seed)
    return np.clip(arr + rnd.normal(0, amt, arr.shape[:2])[..., None], 0, 255)


def to_img(a):
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def grid_lines(img, color, step=60, alpha=40):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for x in range(0, W, step):
        d.line([(x, 0), (x, H)], fill=color + (alpha,), width=2)
    for y in range(0, H, step):
        d.line([(0, y), (W, y)], fill=color + (alpha,), width=2)
    return Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")


def glow_blob(img, cx, cy, r, color, a=0.6):
    arr = np.asarray(img, float)
    yy, xx = np.mgrid[0:H, 0:W]
    k = np.clip(1 - np.hypot(xx - cx, yy - cy) / r, 0, 1) ** 1.6 * a
    arr = arr * (1 - k[..., None]) + np.array(color, float) * k[..., None]
    return to_img(arr)


def diag_band(img, color, y0, y1, slope=0.18):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.polygon([(0, y0), (W, y0 - W * slope), (W, y1 - W * slope), (0, y1)], fill=color + (255,))
    return Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")


def make_backgrounds():
    bg = {}
    # 01 cover: hot pink + yellow rays + halftone
    a = grad((255, 20, 147), (255, 90, 190), 60)
    im = halftone(a, (255, 60, 170), 30, 12, lambda x, y: max(0, 1 - x * 1.4) if x < 0.7 else 0)
    im = glow_blob(im, 1500, 540, 760, YELLOW, 0.75)
    bg["01"] = im
    # 02 idea: black with pink + blue glows and grid
    im = to_img(grad((24, 16, 34), (12, 8, 20), 90))
    im = glow_blob(im, 300, 900, 700, PINK, 0.55)
    im = glow_blob(im, 1650, 120, 650, BLUE, 0.5)
    bg["02"] = grid_lines(im, (255, 255, 255), 80, 22)
    # 03 why now: lime
    a = grad((184, 255, 0), (225, 255, 80), 120)
    bg["03"] = halftone(a, (150, 230, 0), 36, 14, lambda x, y: max(0, y - 0.25) * 1.4)
    # 04 why vivi: pink x blue scrapbook checker
    a = checker((255, 20, 147), (54, 123, 255), 130, 0.5)
    bg["04"] = to_img(a)
    # 05 archive: baby pink/lavender
    a = grad((255, 212, 233), (201, 167, 255), 60)
    bg["05"] = halftone(a, (255, 255, 255), 40, 12, lambda x, y: min(1, max(0, x - 0.6) * 2.2 + max(0, y - 0.75) * 2.0))
    # 06 meet aira: yellow
    a = grad((249, 255, 0), (255, 240, 100), 90)
    bg["06"] = halftone(a, (255, 20, 147), 44, 9, lambda x, y: max(0, 0.7 - x) * 1.4, angle=30)
    # 07 how it works: electric blue + grid
    im = to_img(grad((54, 123, 255), (30, 70, 210), 90))
    bg["07"] = grid_lines(glow_blob(im, 1700, 900, 700, (120, 170, 255), 0.6), (255, 255, 255), 60, 34)
    # 08 AI x media: black + neon pink
    im = to_img(grad((20, 16, 25), (40, 14, 40), 45))
    im = glow_blob(im, 1700, 250, 650, PINK, 0.55)
    bg["08"] = glow_blob(im, 200, 1000, 600, LIME, 0.25)
    # 09 content ideas: lavender wavy checker
    a = checker((201, 167, 255), (225, 205, 255), 110, 0.35)
    bg["09"] = to_img(a)
    # 10 brand ambassador: pink gradient
    a = grad((255, 20, 147), (255, 120, 200), 135)
    bg["10"] = halftone(a, (255, 255, 255), 38, 9, lambda x, y: max(0, x - 0.55) * 1.5, angle=15)
    # 11 kodansha x dentsu: split lime / pink
    a = np.zeros((H, W, 3))
    a[:] = grad((184, 255, 0), (210, 255, 70), 90)
    left = a.copy()
    right = grad((255, 20, 147), (255, 80, 175), 90)
    yy, xx = np.mgrid[0:H, 0:W]
    m = (xx < (W / 2 + (H / 2 - yy) * 0.18))[..., None]
    bg["11"] = to_img(np.where(m, left, right))
    # 12 media network: black + blue grid
    im = to_img(grad((16, 12, 24), (24, 24, 70), 90))
    im = glow_blob(im, 900, 540, 900, BLUE, 0.35)
    bg["12"] = grid_lines(im, BLUE, 60, 60)
    # 13 business: yellow
    a = grad((249, 255, 0), (255, 247, 90), 100)
    bg["13"] = halftone(a, (255, 230, 0), 30, 11, lambda x, y: max(0, x - 0.4))
    # 14 hackathon: white-lilac OS desktop sky
    a = grad((225, 210, 255), (255, 214, 235), 80)
    im = glow_blob(to_img(a), 400, 200, 700, (255, 255, 255), 0.7)
    bg["14"] = glow_blob(im, 1600, 900, 600, (150, 190, 255), 0.5)
    # 15 final: pink to black
    a = grad((255, 20, 147), (60, 10, 60), 90)
    im = glow_blob(to_img(a), 1500, 300, 700, (255, 80, 190), 0.6)
    bg["15"] = grid_lines(im, (255, 255, 255), 90, 18)
    return bg


def main():
    os.makedirs(OUT, exist_ok=True)
    # chrome type
    chrome_text("HUMAN.", "chrome_human.png", 460)
    chrome_text("ViVi", "chrome_vivi.png", 420, stroke=BLUE)
    chrome_text("AIRA", "chrome_aira.png", 420)
    chrome_text("?", "chrome_q.png", 700)
    chrome_text("×", "chrome_x.png", 620, stroke=BLACK)
    chrome_text("ARCHIVE", "chrome_archive.png", 330, stroke=PINK)
    # shapes
    chrome_shape("heart", "chrome_heart.png")
    chrome_shape("star", "chrome_star.png", stroke=BLUE)
    chrome_shape("heart", "balloon_heart_pink.png", s=600, color=PINK, stroke=WHITE)
    chrome_shape("star", "balloon_star_lime.png", s=600, color=LIME, stroke=WHITE)
    chrome_shape("star", "balloon_star_yellow.png", s=600, color=YELLOW, stroke=WHITE)
    chrome_shape("heart", "balloon_heart_blue.png", s=600, color=BLUE, stroke=WHITE)
    for nm, col in [("white", WHITE), ("yellow", YELLOW), ("lime", LIME), ("pink", PINK), ("blue", BLUE)]:
        sparkle(f"sparkle_{nm}.png", col)
    barcode("barcode.png")
    barcode("barcode_dark.png", fg=WHITE, bg=BLACK)
    qr("qr.png")
    for kind in ["heart", "star", "arrow", "swirl", "underline", "flower", "circle", "zigzag"]:
        for nm, col in [("pink", PINK), ("black", BLACK), ("white", WHITE), ("blue", BLUE), ("lime", LIME)]:
            doodle(kind, f"doodle_{kind}_{nm}.png", col + (255,))
    tape("tape_yellow.png", YELLOW)
    tape("tape_lime.png", LIME)
    tape("tape_pink.png", PINK)
    bubble("bubble.png")
    for k, im in make_backgrounds().items():
        save(im, f"bg_{k}.png")
    # decorative scatter on a few backgrounds
    for k, items in {
        "01": [("sparkle_white.png", 14, 40, 90), ("sparkle_yellow.png", 6, 50, 100)],
        "02": [("sparkle_white.png", 18, 30, 80), ("sparkle_pink.png", 8, 50, 100)],
        "05": [("sparkle_white.png", 14, 40, 90)],
        "08": [("sparkle_white.png", 16, 30, 80), ("sparkle_lime.png", 6, 40, 80)],
        "15": [("sparkle_white.png", 18, 30, 90), ("sparkle_yellow.png", 8, 40, 90)],
        "14": [("sparkle_white.png", 14, 40, 90)],
    }.items():
        p = os.path.join(OUT, f"bg_{k}.png")
        save(scatter(Image.open(p), items, int(k)), f"bg_{k}.png")
    print("assets written to", OUT)


if __name__ == "__main__":
    main()
