"""Build output/AI_ViVi_MODEL_PROJECT.pptx (15 slides, 16:9, editable) with python-pptx.

Canvas is designed in 1920x1080 "px"; 1px = 6350 EMU (so the slide is exactly 13.333in x 7.5in).
Font sizes are given in pt (960pt wide slide), so 1pt = 2px on the canvas.

Usage:
    python3 scripts/gen_assets.py          # (re)generate assets/gen/*.png  (only when needed)
    python3 scripts/build_presentation.py  # build the pptx
"""
import math
import os
import subprocess
import sys

from lxml import etree
from PIL import Image, ImageFont
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.dml import MSO_LINE
from pptx.enum.shapes import MSO_CONNECTOR, MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Emu, Pt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEN = os.path.join(ROOT, "assets", "gen")
AIRA = os.path.join(ROOT, "assets", "aira")
OUT = os.path.join(ROOT, "output", "AI_ViVi_MODEL_PROJECT.pptx")
PORTRAIT = os.path.join(AIRA, "aira_portrait.png")
LANDSCAPE = os.path.join(AIRA, "aira_landscape.png")

PX = 6350


def E(v):
    return Emu(int(round(v * PX)))


def C(rgb):
    return RGBColor(*rgb)


PINK = (255, 20, 147)
LIME = (184, 255, 0)
YELLOW = (249, 255, 0)
BLUE = (54, 123, 255)
LAV = (201, 167, 255)
BLACK = (20, 16, 25)
WHITE = (255, 255, 255)
BABY = (255, 212, 233)
GREY = (90, 82, 100)

JP = "Yu Gothic"
EN = "Arial Black"
YU_TTC = "/Applications/Microsoft PowerPoint.app/Contents/Resources/DFonts/YuGothB.ttc"
ARIAL_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"

TOTAL = 15
WARN = []

prs = Presentation()
prs.slide_width = Emu(12192000)
prs.slide_height = Emu(6858000)
BLANK = prs.slide_layouts[6]
_fonts = {}
_cur = {"n": 0}


# ------------------------------------------------------------------ low-level helpers
def _measure_font(name, size_px):
    key = (name, size_px)
    if key not in _fonts:
        path = ARIAL_BLACK if name == EN else YU_TTC
        try:
            _fonts[key] = ImageFont.truetype(path, int(size_px))
        except Exception:
            _fonts[key] = None
    return _fonts[key]


def _wrap_lines(text, font, width):
    if font is None:
        return 1
    lines, cur = 1, 0.0
    for ch in text:
        w = font.getlength(ch)
        if cur + w > width:
            lines += 1
            cur = w
        else:
            cur += w
    return lines


def _no_effects(shape):
    spPr = shape._element.spPr
    if spPr.find(qn("a:effectLst")) is None:
        etree.SubElement(spPr, qn("a:effectLst"))


def _set_fonts(run, latin, ea=JP):
    run.font.name = latin
    rPr = run._r.get_or_add_rPr()
    for tag_ in ("a:ea", "a:cs"):
        el = rPr.find(qn(tag_))
        if el is None:
            el = etree.SubElement(rPr, qn(tag_))
        el.set("typeface", ea if tag_ == "a:ea" else latin)


def _fill_text(tf, paras, size, color, bold, font, align, lh, space_after=0):
    if isinstance(paras, str):
        paras = paras.split("\n")
    first = True
    for para in paras:
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        runs = para if isinstance(para, list) else [para]
        p.alignment = {"l": PP_ALIGN.LEFT, "c": PP_ALIGN.CENTER, "r": PP_ALIGN.RIGHT}[align]
        psize = size
        for r in runs:
            txt, o = (r, {}) if isinstance(r, str) else r
            run = p.add_run()
            run.text = txt
            _set_fonts(run, o.get("font", font))
            run.font.size = Pt(o.get("size", size))
            run.font.bold = o.get("bold", bold)
            run.font.color.rgb = C(o.get("color", color))
            psize = max(psize, o.get("size", size))
        p.line_spacing = Pt(psize * lh)
        p.space_after = Pt(space_after)
        p.space_before = Pt(0)


def _check_fit(paras, w, h, size, font, lh, ml, mr, mt, mb):
    if isinstance(paras, str):
        paras = paras.split("\n")
    total = 0.0
    for para in paras:
        runs = para if isinstance(para, list) else [para]
        txt = "".join(r if isinstance(r, str) else r[0] for r in runs)
        psize = max([size] + [r[1].get("size", size) for r in runs if not isinstance(r, str)])
        fnt = font
        for r in runs:
            if not isinstance(r, str) and r[1].get("font"):
                fnt = r[1]["font"]
        n = _wrap_lines(txt, _measure_font(fnt, psize * 2), w - ml - mr)
        total += n * psize * lh * 2
    if total > (h - mt - mb) + 6:
        WARN.append(f"slide {_cur['n']}: text may overflow ({total:.0f}>{h - mt - mb:.0f}px): {str(paras)[:50]}")


def new_slide(n, bg=None, notes=None):
    _cur["n"] = n
    s = prs.slides.add_slide(BLANK)
    if bg:
        pic(s, os.path.join(GEN, f"bg_{bg}.png"), 0, 0, 1920, 1080)
    if notes:
        s.notes_slide.notes_text_frame.text = notes
    return s


def pic(s, path, x, y, w=None, h=None, rot=0):
    im = Image.open(path)
    ar = im.width / im.height
    if w is None:
        w = h * ar
    if h is None:
        h = w / ar
    p = s.shapes.add_picture(path, E(x), E(y), E(w), E(h))
    p.rotation = rot
    return p


def gen(s, name, x, y, w=None, h=None, rot=0):
    return pic(s, os.path.join(GEN, name), x, y, w, h, rot)


def photo(s, path, x, y, w, h, fx=0.5, fy=0.5, zoom=1.0, rot=0, border=WHITE, bw=10, shadow=14, oval=False):
    """Picture with crop-to-fill (real picture crop, aspect ratio preserved)."""
    im = Image.open(path)
    ar_i, ar_b = im.width / im.height, w / h
    if ar_i > ar_b:
        vw, vh = ar_b / ar_i / zoom, 1 / zoom
    else:
        vw, vh = 1 / zoom, ar_i / ar_b / zoom
    l = (1 - vw) * fx
    t = (1 - vh) * fy
    if shadow:
        sh = s.shapes.add_shape(MSO_SHAPE.OVAL if oval else MSO_SHAPE.RECTANGLE, E(x + shadow), E(y + shadow), E(w), E(h))
        sh.fill.solid()
        sh.fill.fore_color.rgb = C(BLACK)
        sh.line.fill.background()
        sh.rotation = rot
        _no_effects(sh)
    p = s.shapes.add_picture(path, E(x), E(y), E(w), E(h))
    p.crop_left, p.crop_right = l, 1 - vw - l
    p.crop_top, p.crop_bottom = t, 1 - vh - t
    if oval:
        p.auto_shape_type = MSO_SHAPE.OVAL
    if border and bw:
        p.line.color.rgb = C(border)
        p.line.width = Pt(bw / 2)
    p.rotation = rot
    return p


def shp(s, kind, x, y, w, h, fill=None, line=None, lw=0, rot=0, adj=None, dash=False, text=None, **tk):
    sp = s.shapes.add_shape(kind, E(x), E(y), E(w), E(h))
    if fill is None:
        sp.fill.background()
    else:
        sp.fill.solid()
        sp.fill.fore_color.rgb = C(fill)
    if line:
        sp.line.color.rgb = C(line)
        sp.line.width = Pt(lw / 2)
        if dash:
            sp.line.dash_style = MSO_LINE.DASH
    else:
        sp.line.fill.background()
    if adj is not None:
        sp.adjustments[0] = adj
    sp.rotation = rot
    _no_effects(sp)
    if text is not None:
        _shape_text(sp, text, w, h, **tk)
    return sp


def _shape_text(sp, text, w, h, size=16, color=BLACK, bold=True, font=JP, align="c", anchor="m", lh=1.25,
                margin=(14, 8, 14, 8), space_after=0):
    tf = sp.text_frame
    tf.word_wrap = True
    ml, mt, mr, mb = margin
    tf.margin_left, tf.margin_top, tf.margin_right, tf.margin_bottom = E(ml), E(mt), E(mr), E(mb)
    tf.vertical_anchor = {"t": MSO_ANCHOR.TOP, "m": MSO_ANCHOR.MIDDLE, "b": MSO_ANCHOR.BOTTOM}[anchor]
    _fill_text(tf, text, size, color, bold, font, align, lh, space_after)
    _check_fit(text, w, h, size, font, lh, ml, mr, mt, mb)


def T(s, paras, x, y, w, h, size=16, color=BLACK, bold=True, font=JP, align="l", anchor="t", lh=1.3, rot=0,
      shadow=None, margin=(0, 0, 0, 0), space_after=0):
    """Editable text box. shadow=(dx, dy, color) adds a hard offset copy behind it."""
    if shadow:
        T(s, paras, x + shadow[0], y + shadow[1], w, h, size, shadow[2], bold, font, align, anchor, lh, rot,
          None, margin, space_after)
    tb = s.shapes.add_textbox(E(x), E(y), E(w), E(h))
    tb.rotation = rot
    tf = tb.text_frame
    tf.word_wrap = True
    ml, mt, mr, mb = margin
    tf.margin_left, tf.margin_top, tf.margin_right, tf.margin_bottom = E(ml), E(mt), E(mr), E(mb)
    tf.vertical_anchor = {"t": MSO_ANCHOR.TOP, "m": MSO_ANCHOR.MIDDLE, "b": MSO_ANCHOR.BOTTOM}[anchor]
    _fill_text(tf, paras, size, color, bold, font, align, lh, space_after)
    if not shadow:
        _check_fit(paras, w, h, size, font, lh, ml, mr, mt, mb)
    return tb


def sticker(s, text, x, y, w, h, fill=YELLOW, color=BLACK, size=16, rot=0, shadow=8, kind=MSO_SHAPE.ROUNDED_RECTANGLE,
            line=BLACK, lw=4, adj=0.25, **tk):
    rr = kind == MSO_SHAPE.ROUNDED_RECTANGLE
    if shadow:
        shp(s, kind, x + shadow, y + shadow, w, h, BLACK, None, 0, rot, adj if rr else None)
    return shp(s, kind, x, y, w, h, fill, line, lw, rot, adj if rr else None, text=text, size=size, color=color, **tk)


def win(s, x, y, w, h, title, accent=LAV, body=WHITE, shadow=12, tb=58, title_color=BLACK):
    """OS-window panel. Returns (inner_x, inner_y, inner_w, inner_h)."""
    if shadow:
        shp(s, MSO_SHAPE.ROUNDED_RECTANGLE, x + shadow, y + shadow, w, h, BLACK, None, 0, 0, 0.05)
    shp(s, MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h, body, BLACK, 4, 0, 0.05)
    bar = shp(s, MSO_SHAPE.ROUND_2_SAME_RECTANGLE, x, y, w, tb, accent, BLACK, 4)
    bar.adjustments[0] = 0.35
    T(s, title, x + 24, y, w - 220, tb, size=11, color=title_color, font=EN, anchor="m", lh=1.0)
    for i, g in enumerate(["–", "□", "×"]):
        bx = x + w - 52 - (2 - i) * 46
        shp(s, MSO_SHAPE.RECTANGLE, bx, y + 14, 32, 30, WHITE, BLACK, 3, text=g, size=10, color=BLACK, font=EN,
            margin=(0, 0, 0, 0), lh=1.0)
    return x + 28, y + tb + 20, w - 56, h - tb - 40


def line(s, x1, y1, x2, y2, color=BLACK, lw=6, dash=False):
    c = s.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, E(x1), E(y1), E(x2), E(y2))
    c.line.color.rgb = C(color)
    c.line.width = Pt(lw / 2)
    if dash:
        c.line.dash_style = MSO_LINE.DASH
    return c


def tag(s, n, label, dark=False, x=70, y=34):
    fill, col = (BLACK, YELLOW) if not dark else (WHITE, BLACK)
    sticker(s, f"{n:02d}  /  {label}", x, y, 60 + len(label) * 21 + 80, 54, fill, col, 11, 0, 5, font=EN,
            line=None, lw=0, adj=0.5, margin=(10, 0, 10, 0), lh=1.0)
    T(s, f"{n:02d} / {TOTAL:02d}", 1700, 1022, 170, 40, size=10, color=(WHITE if dark else BLACK), font=EN, align="r",
      lh=1.0)


def note(s, text, x, y, w, h=44, color=BLACK, size=10, align="l"):
    return T(s, text, x, y, w, h, size=size, color=color, bold=False, lh=1.3, align=align)


# ------------------------------------------------------------------ slides
def s01():
    s = new_slide(1, "01", "COVER. 全体は構想段階の企画提案。AIRA画像は正規AIRAビジュアル。")
    photo(s, PORTRAIT, 1070, 70, 690, 950, fy=0.3, rot=3, bw=16, shadow=24)
    gen(s, "balloon_star_yellow.png", 1630, 30, 250, rot=12)
    gen(s, "chrome_heart.png", 1560, 760, 280, rot=-10)
    gen(s, "chrome_aira.png", 830, 800, 430, rot=-8)
    gen(s, "sparkle_white.png", 1000, 120, 110)
    gen(s, "sparkle_yellow.png", 1810, 600, 100)
    sticker(s, "AI ViVi PROJECT", 70, 60, 470, 70, BLACK, LIME, 17, -2, 6, font=EN, line=None, adj=0.5)
    T(s, "電通出版局　社内AIハッカソン　提案", 70, 148, 700, 36, size=12, color=WHITE, lh=1.0)
    T(s, ["MAGAZINE", "MAKES", [("HUMAN.", {"color": YELLOW})]], 64, 215, 1000, 470, size=70, color=WHITE,
      font=EN, lh=0.98, shadow=(10, 10, BLACK))
    sticker(s, "雑誌は、人をつくる。", 70, 690, 880, 130, YELLOW, BLACK, 42, -3, 10, adj=0.2)
    T(s, "ViViの編集資産から生まれるAI人格 ―― AIRA", 70, 835, 740, 76, size=17, color=WHITE, lh=1.3)
    gen(s, "barcode.png", 70, 912, 330)
    T(s, "ISSUE 01 / 2026　構想提案", 440, 960, 520, 40, size=11, color=WHITE, font=EN, lh=1.0)
    T(s, "01 / 15", 1700, 1022, 170, 40, size=10, color=WHITE, font=EN, align="r", lh=1.0)


def s02():
    s = new_slide(2, "02", "THE IDEA. 編集資産(誌面・記事・トレンド・編集の視点)から新しいAI人格が生まれ、雑誌と人をつなぐ循環。")
    tag(s, 2, "THE IDEA", dark=True)
    T(s, ["人が雑誌をつくり、", [("雑誌が人をつくる。", {"color": LIME})]], 70, 130, 1100, 240, size=52, color=WHITE,
      lh=1.18, shadow=(6, 6, PINK))
    gen(s, "doodle_underline_lime.png", 70, 330, 760, 80)
    ix, iy, iw, ih = win(s, 70, 470, 940, 450, "IDEA.exe", LAV)
    T(s, [[("人間が積み上げた", {}), ("編集資産", {"color": PINK}), ("から、", {})],
          "新しいAI人格が生まれる。", "",
          [("誌面・記事・トレンド・編集の視点。", {"size": 15, "bold": False})],
          [("その人格が、雑誌と人を、もう一度つなぐ。", {"size": 15, "bold": False})]],
      ix + 6, iy + 6, iw - 12, ih - 12, size=22, color=BLACK, lh=1.4)
    nodes = {"A": (1480, 300, PINK, WHITE, "HUMAN", "編集部・読者"),
             "B": (1740, 790, YELLOW, BLACK, "MAGAZINE", "編集資産"),
             "C": (1230, 790, LIME, BLACK, "AI HUMAN", "AI人格 AIRA")}
    R = 135
    cen = (1480, 625)

    def arrow(p, q, label, col):
        (x1, y1), (x2, y2) = p, q
        d = math.hypot(x2 - x1, y2 - y1)
        ang = math.degrees(math.atan2(y2 - y1, x2 - x1))
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        ln = d - 2 * R - 30
        shp(s, MSO_SHAPE.RIGHT_ARROW, mx - ln / 2, my - 38, ln, 76, col, BLACK, 4, ang, 0.5)
        nx, ny = mx - cen[0], my - cen[1]
        nn = math.hypot(nx, ny)
        sx, sy = mx + nx / nn * 105, my + ny / nn * 105
        sticker(s, label, sx - 140, sy - 24, 280, 48, WHITE, BLACK, 11, 0, 4, adj=0.5, margin=(6, 0, 6, 0), lh=1.0)

    P = {k: (v[0], v[1]) for k, v in nodes.items()}
    arrow(P["A"], P["B"], "編集する・蓄積する", WHITE)
    arrow(P["B"], P["C"], "AIで人格化する", WHITE)
    arrow(P["C"], P["A"], "社会・読者へ送り出す", WHITE)
    for k, (cx, cy, f, c, name, sub) in nodes.items():
        shp(s, MSO_SHAPE.OVAL, cx - R + 10, cy - R + 10, 2 * R, 2 * R, BLACK)
        shp(s, MSO_SHAPE.OVAL, cx - R, cy - R, 2 * R, 2 * R, f, WHITE, 6,
            text=[[(name, {"font": EN, "size": 14})], [(sub, {"size": 12, "bold": False})]], color=c,
            margin=(8, 8, 8, 8), lh=1.35)
    gen(s, "chrome_star.png", 1690, 90, 170, rot=15)
    gen(s, "sparkle_pink.png", 1150, 120, 90)
    note(s, "※概念図です。AIRAは構想段階のAI人格で、ViViのアーカイブはまだ接続・学習していません。", 70, 960, 1100, 40, WHITE)


def s03():
    s = new_slide(3, "03", "WHY NOW. 見た目のリアルさだけでは差別化できない。人格の根拠が重要。")
    tag(s, 3, "WHY NOW?")
    gen(s, "chrome_q.png", 1330, 60, h=900, rot=6)
    T(s, "AIで人を作れる時代。", 70, 120, 1250, 130, size=54, color=BLACK, lh=1.15)
    T(s, ["何をもって、", "その人らしさを作るのか？"], 70, 250, 1250, 260, size=48, color=PINK, lh=1.2,
      shadow=(5, 5, BLACK))
    gen(s, "doodle_underline_black.png", 70, 480, 800, 70)
    sticker(s, [[("見た目がリアルなAIモデル", {"size": 19})],
                [("生成技術の進化で、誰でも作れる。", {"size": 14, "bold": False})],
                [("＝ それだけでは差別化にならない", {"size": 14, "bold": False})]],
            70, 620, 600, 280, WHITE, BLACK, 16, -2, 10, line=BLACK, margin=(26, 20, 26, 20), lh=1.5, align="l",
            anchor="m")
    shp(s, MSO_SHAPE.OVAL, 590, 560, 100, 100, PINK, WHITE, 5, 8, text="×", size=32, color=WHITE, font=EN,
        margin=(0, 0, 0, 0), lh=1.0)
    shp(s, MSO_SHAPE.RIGHT_ARROW, 700, 710, 90, 90, BLACK, WHITE, 4, 0, 0.5)
    sticker(s, [[("その人らしさの“根拠”", {"size": 22, "color": LIME})],
                [("背景・知識・価値観・人格。", {"size": 16, "color": WHITE})],
                [("それを何で支えるかが、勝負どころ。", {"size": 14, "bold": False, "color": WHITE})]],
            810, 600, 730, 300, BLACK, WHITE, 16, 2, 10, line=WHITE, margin=(30, 20, 30, 20), lh=1.5, align="l",
            anchor="m")
    gen(s, "sparkle_white.png", 1480, 560, 100)
    note(s, "※AI人格の「根拠」を、ViViの編集資産に求めるのが本企画の出発点。", 70, 960, 1200)


def s04():
    s = new_slide(4, "04", "WHY ViVi. 過去表紙・アーカイブ画像は権利確認が前提のため、画像はプレースホルダー。ViViの歴史・実績の具体的な数字は要確認。")
    shp(s, MSO_SHAPE.RECTANGLE, 70, 50, 1780, 980, WHITE, BLACK, 5, 0)
    for gx in range(110, 1850, 62):
        line(s, gx, 60, gx, 1020, (225, 235, 250), 2)
    for gy in range(110, 1030, 62):
        line(s, 80, gy, 1840, gy, (225, 235, 250), 2)
    gen(s, "tape_yellow.png", 120, 20, 300, rot=-8)
    gen(s, "tape_pink.png", 1500, 20, 300, rot=6)
    tag(s, 4, "WHY ViVi?", x=120, y=84)
    T(s, ["ViViには、", [("長年積み重ねてきた", {"color": PINK}), ("感性がある。", {})]], 120, 160, 1350, 210, size=46, color=BLACK, lh=1.2)
    gen(s, "chrome_vivi.png", 1480, 120, 330, rot=6)
    for i, (x, y, r) in enumerate([(130, 400, -4), (400, 440, 3)]):
        shp(s, MSO_SHAPE.RECTANGLE, x + 8, y + 8, 240, 330, BLACK, None, 0, r)
        shp(s, MSO_SHAPE.RECTANGLE, x, y, 240, 330, BABY if i == 0 else LAV, BLACK, 4, r, dash=True,
            text=[[("ViVi", {"font": EN, "size": 18})], [("過去表紙・誌面", {"size": 12})],
                  [("画像プレースホルダー", {"size": 11, "bold": False})]], color=BLACK, margin=(8, 8, 8, 8), lh=1.4)
    note(s, ["権利確認後に差し替え", "出典：講談社 ViVi（要確認）"], 130, 770, 500, 60)
    items = [("過去の誌面", "号を重ねて残る、ファッション・ヘア・メイクの記録", PINK, WHITE),
             ("ファッション特集", "シーズンごとの提案と、編集部ならではの切り口", LIME, BLACK),
             ("トレンド", "流行が生まれ、移り変わっていく過程の蓄積", YELLOW, BLACK),
             ("モデル文化", "読者に愛されるモデルとともに育ってきた文化", BLUE, WHITE),
             ("編集の視点", "何を選び、どう見せるか。ViViらしさの判断軸", LAV, BLACK)]
    pos = [(700, 400), (1260, 420), (700, 570), (1260, 590), (980, 745)]
    rots = [-1.5, 1.5, 1.2, -1.2, -0.8]
    for (t, d, f, c), (x, y), r in zip(items, pos, rots):
        sticker(s, [[(t, {"size": 20})], [(d, {"size": 11, "bold": False})]], x, y, 540, 140, f, c, 14, r, 7,
                align="l", margin=(24, 8, 20, 8), lh=1.35)
    sticker(s, "編集資産を使う必然性：ViViらしさの“根拠”は、一般的な学習データではなく、ViViが積み上げた編集の蓄積にある。",
            120, 905, 1480, 70, BLACK, WHITE, 13, 0, 0, line=None, align="l", margin=(26, 6, 26, 6), lh=1.35)
    gen(s, "balloon_heart_pink.png", 1650, 880, 150, rot=10)
    note(s, "※過去表紙・アーカイブ画像は権利確認が取れるまで使用しません。ViViの歴史・実績は要確認。", 120, 982, 1450, 28, GREY, 10)


def s05():
    s = new_slide(5, "05", "ViVi ARCHIVE. アーカイブ参照は構想。現時点で学習済み・接続済みのアーカイブはない。")
    tag(s, 5, "ViVi ARCHIVE", x=70)
    T(s, "過去のViViが、未来のAIRAをつくる。", 70, 130, 1780, 110, size=48, color=BLACK, lh=1.2, shadow=(5, 5, WHITE))
    cards = [(70, 330, PINK, WHITE, "ARCHIVE", "雑誌アーカイブ・Web記事・編集コンテンツ", "許諾が取れたものを、AIが参照する構想。", -2),
             (690, 360, BLUE, WHITE, "INTELLIGENCE", "ViViらしい価値観・ファッション観・カルチャーの理解", "データを溜めるだけでなく、“読み解く”。", 1.5),
             (1310, 330, LIME, BLACK, "PERSONALITY", "AI人格「AIRA」の考え方・語り口・好み", "編集部の監修のもと、一貫した人格へ。", -1.5)]
    for x, y, f, c, en, jp, sub, r in cards:
        shp(s, MSO_SHAPE.RECTANGLE, x + 12, y + 12, 540, 480, BLACK, None, 0, r)
        shp(s, MSO_SHAPE.RECTANGLE, x, y, 540, 480, f, WHITE, 8, r,
            text=[[(en, {"font": EN, "size": 22})], [(" ", {"size": 8})], [(jp, {"size": 20})],
                  [(" ", {"size": 8})], [(sub, {"size": 14, "bold": False})]],
            color=c, align="l", anchor="m", margin=(36, 24, 30, 24), lh=1.4)
    photo(s, LANDSCAPE, 1640, 800, 200, 200, fx=0.62, fy=0.35, zoom=1.3, rot=6, bw=10, shadow=8, oval=True)
    for ax in (620, 1240):
        shp(s, MSO_SHAPE.RIGHT_ARROW, ax, 540, 80, 100, YELLOW, BLACK, 5, 0, 0.5)
    sticker(s, "AIが参照する“構想”です。現時点で、ViViのアーカイブを学習・接続した事実はありません。", 70, 880, 1260, 80, BLACK, YELLOW, 14, 0, 0,
            line=None, align="l", margin=(28, 6, 28, 6), lh=1.4)
    gen(s, "balloon_star_lime.png", 1380, 790, 150, rot=-10)
    gen(s, "chrome_heart.png", 1450, 880, 150, rot=12)
    note(s, "※アーカイブの利用は、権利者の許諾・利用条件の確認が前提です。", 70, 985, 1400)


def s06():
    s = new_slide(6, "06", "MEET AIRA. 仮設定の項目は未確定。写真はAIRAの宣材ビジュアル(AI生成)。")
    photo(s, PORTRAIT, 70, 60, 620, 930, fy=0.25, rot=-2, bw=14, shadow=18)
    gen(s, "tape_pink.png", 230, 30, 300, rot=-4)
    photo(s, LANDSCAPE, 440, 770, 290, 190, fx=0.65, fy=0.4, rot=5, bw=12, shadow=12)
    gen(s, "chrome_aira.png", 60, 800, 420, rot=-6)
    tag(s, 6, "MEET AIRA", x=770)
    T(s, ["彼女は、", [("ViVi", {"font": EN}), ("から生まれた。", {})]], 770, 120, 1080, 260, size=54, color=BLACK, lh=1.2,
      shadow=(6, 6, WHITE))
    ix, iy, iw, ih = win(s, 770, 400, 700, 560, "AIRA_PROFILE.exe", PINK, title_color=WHITE)
    rows = [("NAME", "AIRA", None), ("ORIGIN", "ViViの編集資産から生まれたAI人格", None),
            ("LOOK", "黒髪ロング／黄色チェックの耳付きニット帽／AIRAロゴのチューブトップ", None),
            ("WORLD", "ストリート×Y2K。ViViらしい“かわいい”", "仮設定"),
            ("VOICE", "語り口・価値観は編集部監修で今後形成", "仮設定")]
    y = iy
    for k, v, badge in rows:
        hh = 102 if k == "LOOK" else 84
        T(s, k, ix, y + 4, 130, 40, size=11, color=PINK, font=EN, lh=1.0)
        T(s, v, ix + 140, y, iw - 140 - (110 if badge else 0), hh, size=13, color=BLACK, lh=1.35)
        if badge:
            sticker(s, badge, ix + iw - 100, y + 2, 100, 40, LIME, BLACK, 10, 0, 3, adj=0.5, margin=(2, 0, 2, 0), lh=1.0,
                    line=BLACK, lw=3)
        y += hh
    sticker(s, [[("単なるAIモデルとの違い", {"size": 15, "color": YELLOW})],
                [("見た目だけでなく、ViViの価値観が“根拠”", {"size": 13, "bold": False, "color": WHITE})]],
            1510, 410, 350, 220, BLACK, WHITE, 13, 2, 8, align="l", margin=(22, 10, 18, 10), lh=1.4, line=None)
    sticker(s, [[("VTuberとの違い", {"size": 15})],
                [("設定の創作ではなく、編集資産が人格の拠りどころ", {"size": 13, "bold": False})]],
            1510, 670, 350, 220, PINK, WHITE, 13, -2, 8, align="l", margin=(22, 10, 18, 10), lh=1.4, line=None)
    gen(s, "balloon_heart_blue.png", 1700, 880, 140, rot=10)
    gen(s, "sparkle_white.png", 1500, 150, 100)
    note(s, "※「仮設定」は未確定の項目です。AIRAは実在しないAI人格で、写真は宣材ビジュアル(AI生成)です。", 770, 975, 1100)


def s07():
    s = new_slide(7, "07", "HOW IT WORKS. 実装済みはAIRA Fashion Studio(3Dサイト)とスタイリングルールの試作のみ。RAG・根拠紐付け・映像/発話生成は構想段階。")
    tag(s, 7, "HOW IT WORKS", dark=True)
    T(s, ["ViViの感性を、", "どうAI人格に変えるのか？"], 70, 120, 780, 290, size=38, color=WHITE, lh=1.2, shadow=(5, 5, BLACK))
    ix, iy, iw, ih = win(s, 70, 430, 740, 520, "STATUS.exe", YELLOW)
    T(s, [[("● 実装済み（このリポジトリ）", {"color": PINK, "size": 15})],
          [("AIRA Fashion Studio：3Dアバターの衣装・ポーズ・表情を制御（容姿は固定、衣装のみ可変）", {"size": 12.5, "bold": False})],
          [("ViVi公式Web記事4本を参考に、手作業で要約したスタイリングルール（出典URL付き）", {"size": 12.5, "bold": False})],
          [("", {"size": 6})],
          [("● 構想段階（未実装）", {"color": BLUE, "size": 15})],
          [("許諾済みアーカイブのRAG検索／発言と根拠の紐付け／映像・音声・発話の生成", {"size": 12.5, "bold": False})]],
      ix, iy, iw, ih, size=14, lh=1.45, space_after=4)
    steps = [("1", "許諾済みアーカイブを検索・参照", "RAG方式。権利確認が取れた誌面・記事のみを、AIが検索して参照する。", "構想段階", YELLOW),
             ("2", "編集部監修の人格ルール", "ViViらしい言葉づかい・価値観・NG表現を編集部が決め、AIに守らせる。", "一部試作", LIME),
             ("3", "発言とアーカイブの根拠の紐付け", "AIRAの発言ごとに、どの誌面・記事に基づくかを辿れるようにする。", "一部試作", LIME),
             ("4", "ビジュアル・映像・発話の生成", "容姿・声・人格を保ったまま、静止画・映像・音声へ展開する。", "3Dのみ実装", YELLOW)]
    for i, (n, t, d, st, col) in enumerate(steps):
        y = 120 + i * 212
        shp(s, MSO_SHAPE.ROUNDED_RECTANGLE, 880 + 10, y + 10, 970, 190, BLACK, None, 0, 0, 0.12)
        shp(s, MSO_SHAPE.ROUNDED_RECTANGLE, 880, y, 970, 190, WHITE, BLACK, 4, 0, 0.12)
        shp(s, MSO_SHAPE.OVAL, 910, y + 40, 110, 110, PINK, BLACK, 4, text=n, size=30, color=WHITE, font=EN,
            margin=(0, 0, 0, 0), lh=1.0)
        T(s, t, 1050, y + 26, 560, 60, size=18, color=BLACK, lh=1.3)
        T(s, d, 1050, y + 98, 780, 80, size=13, color=BLACK, bold=False, lh=1.4)
        sticker(s, st, 1630, y + 22, 200, 50, col, BLACK, 10.5, 2, 4, adj=0.5, margin=(4, 0, 4, 0), lh=1.0, line=BLACK,
                lw=3)
    gen(s, "sparkle_yellow.png", 760, 380, 100)
    note(s, "※実装状況はこのリポジトリのREADME・docs・srcを確認した範囲です。", 70, 985, 1200, 36, WHITE)


def s08():
    s = new_slide(8, "08", "AI × MEDIA. 出演先・企画はすべて構想段階で、出演・提携は確定していない。")
    tag(s, 8, "AI × MEDIA", dark=True)
    T(s, ["ViViという人格が、", [("メディアに出演する。", {"color": PINK})]], 70, 120, 980, 260, size=42, color=WHITE, lh=1.25)
    sticker(s, "単に出演するのではなく、ViViの歴史・カルチャーを語れる存在として。", 70, 400, 900, 170, LIME, BLACK, 22, -1.5, 10,
            align="l", margin=(34, 14, 30, 14), lh=1.45, line=WHITE)
    ix, iy, iw, ih = win(s, 70, 630, 900, 310, "企画の一例.exe", PINK, BLACK, title_color=WHITE)
    T(s, [[("過去のファッションと、現代のトレンドを並べて比べる。", {"size": 18, "color": WHITE})],
          [("ViViが積み重ねた“かわいい”の変遷を、AIRAが語る番組企画。", {"size": 13, "bold": False, "color": WHITE})]],
      ix, iy + 10, iw, ih - 20, lh=1.5)
    shp(s, MSO_SHAPE.ROUNDED_RECTANGLE, 1040 + 14, 90 + 14, 810, 520, PINK, None, 0, 0, 0.06)
    shp(s, MSO_SHAPE.ROUNDED_RECTANGLE, 1040, 90, 810, 520, BLACK, WHITE, 8, 0, 0.06)
    photo(s, LANDSCAPE, 1070, 118, 750, 464, fx=0.6, fy=0.3, border=None, bw=0, shadow=0)
    sticker(s, "● ON AIR（イメージ）", 1070, 118, 270, 46, PINK, WHITE, 10.5, 0, 0, adj=0.5, line=None, margin=(4, 0, 4, 0),
            lh=1.0, font=EN)
    chans = [("TV", "トーク番組のゲスト", PINK, WHITE), ("SNS", "誌面の世界観を日常投稿に", LIME, BLACK),
             ("配信番組", "企画の主役・語り手", YELLOW, BLACK), ("EVENT", "リアル会場でバーチャル出演", BLUE, WHITE)]
    for i, (t, d, f, c) in enumerate(chans):
        sticker(s, [[(t, {"size": 17, "font": EN if t.isascii() else JP})], [(d, {"size": 11.5, "bold": False})]],
                1040 + i * 208, 680, 195, 190, f, c, 12, [-2, 1.5, -1.5, 2][i], 6, margin=(10, 10, 10, 10), lh=1.5)
    gen(s, "sparkle_lime.png", 1760, 640, 100)
    note(s, "※構想段階です。特定の媒体への出演・提携は確定していません。", 1040, 900, 810, 40, WHITE)


def s09():
    s = new_slide(9, "09", "MEDIA CONTENT IDEAS. 番組名は企画イメージ。出演・提携・打診は一切未確定。実現には番組の演出・出演条件・権利確認が前提。")
    tag(s, 9, "MEDIA CONTENT IDEAS")
    T(s, "AIRAだから成立する番組企画。", 70, 110, 1500, 110, size=52, color=BLACK, lh=1.2, shadow=(6, 6, WHITE))
    gen(s, "chrome_star.png", 1640, 60, 190, rot=10)
    ideas = [("IDEA 01", "過去誌面で語る、ファッション年代記", "ViVi過去誌面をもとに、時代ごとのファッションをAIRAが語る。", PINK, WHITE, -1),
             ("IDEA 02", "時代を超えるファッション対談", "リアルなViViモデルとAIRAが、時代を超えたファッションを語り合う。", BLUE, WHITE, 1),
             ("IDEA 03", "トーク番組に、AI人格として登場", "『踊る！さんま御殿!!』のようなトーク番組に、ゲストとして登場する構想例。", LIME, BLACK, 1),
             ("IDEA 04", "恋愛リアリティ番組と連動した特別企画", "『今日、好きになりました。』のような番組と連動した企画の構想例。", YELLOW, BLACK, -1)]
    for i, (n, t, d, f, c, r) in enumerate(ideas):
        x = 70 + (i % 2) * 905
        y = 260 + (i // 2) * 330
        shp(s, MSO_SHAPE.RECTANGLE, x + 12, y + 12, 860, 300, BLACK, None, 0, r)
        shp(s, MSO_SHAPE.RECTANGLE, x, y, 860, 300, WHITE, BLACK, 5, r)
        shp(s, MSO_SHAPE.RECTANGLE, x, y, 860, 70, f, BLACK, 5, r, text=n, size=14, color=c, font=EN,
            align="l", margin=(28, 0, 28, 0), lh=1.0)
        T(s, "構想例", x + 700, y + 14, 130, 42, size=11, color=c, align="r", lh=1.0, rot=r)
        T(s, t, x + 34, y + 90, 800, 80, size=22, color=BLACK, lh=1.3, rot=r)
        T(s, d, x + 34, y + 180, 790, 100, size=14, color=BLACK, bold=False, lh=1.45, rot=r)
    sticker(s, "※『踊る！さんま御殿!!』『今日、好きになりました。』は企画イメージを伝えるための例です。出演・提携・打診は確定しておらず、"
               "実現には番組の演出・出演条件・権利の確認が前提です。", 70, 925, 1780, 90, BLACK, WHITE, 11.5, 0, 0, line=None,
            align="l", margin=(26, 6, 26, 6), lh=1.4)


def s10():
    s = new_slide(10, "10", "BRAND AMBASSADOR. 業種は想定であり、特定企業との契約・交渉の事実はない。広告表現は編集部・広告主の確認・監修が前提。")
    tag(s, 10, "BRAND AMBASSADOR", dark=True)
    photo(s, PORTRAIT, 1280, 90, 560, 840, fy=0.3, rot=3, bw=14, shadow=20)
    gen(s, "chrome_heart.png", 1170, 760, 250, rot=-12)
    gen(s, "balloon_star_yellow.png", 1700, 40, 200, rot=12)
    T(s, ["ViViの感性を、", [("ブランドの顔", {"color": YELLOW}), ("に。", {})]], 70, 100, 1180, 250, size=56, color=WHITE, lh=1.2,
      shadow=(6, 6, BLACK))
    T(s, "想定する業種", 70, 375, 300, 40, size=12, color=WHITE, font=JP, lh=1.0)
    for i, (t, f, c) in enumerate([("美容", WHITE, PINK), ("ファッション", LIME, BLACK), ("飲料", YELLOW, BLACK), ("通信", BLUE, WHITE)]):
        sticker(s, t, 70 + i * 290, 415, 260, 80, f, c, 17, [-2, 1.5, -1, 2][i], 6, adj=0.5, line=BLACK)
    ix, iy, iw, ih = win(s, 70, 545, 1100, 270, "COLLAB.exe", YELLOW)
    T(s, [[("● AIタレントではなく、ViViの編集的視点を持つ存在として起用", {})],
          [("● ViVi編集部と一緒に、ブランドの世界観に沿った企画を考える", {})],
          [("● 広告出演・年間アンバサダー・キャンペーンなど、関わり方を設計", {})]],
      ix, iy + 4, iw, ih - 10, size=15, color=BLACK, lh=1.5, space_after=6)
    sticker(s, "広告表現には、編集部と広告主の確認・監修を組み込む。", 70, 850, 1100, 100, BLACK, LIME, 18, -1, 8, line=None,
            adj=0.2, margin=(26, 6, 26, 6))
    note(s, "※業種は想定です。特定企業との契約・交渉・合意の事実はありません。", 70, 975, 1100, 36, WHITE)


def s11():
    s = new_slide(11, "11", "WHY KODANSHA × DENTSU. 講談社単独でも制作可能。電通の経済的メリットの具体的な配分は未決定。")
    T(s, "講談社の編集資産 × 電通のメディア・広告事業化力", 70, 40, 1780, 90, size=34, color=BLACK, lh=1.2, align="c")
    gen(s, "chrome_x.png", 790, 120, 340)
    sticker(s, "講談社", 80, 150, 340, 90, BLACK, LIME, 30, -2, 6, adj=0.3, line=None)
    sticker(s, "電通", 1500, 150, 340, 90, BLACK, YELLOW, 30, 2, 6, adj=0.3, line=None)
    left = ["ViViブランド", "アーカイブ", "編集監修", "モデル文化"]
    right = ["メディア企画", "番組連動", "広告主ネットワーク", "事業開発", "AI実装推進"]
    for i, t in enumerate(left):
        sticker(s, t, 80 + (i % 2) * 40, 290 + i * 112, 560, 92, WHITE, BLACK, 20, [-1.5, 1, -1, 1.5][i], 6, adj=0.4)
    for i, t in enumerate(right):
        sticker(s, t, 1280 - (i % 2) * 40, 270 + i * 100, 560, 82, WHITE, BLACK, 20, [1.5, -1, 1, -1.5, 1][i], 6, adj=0.4)
    cols = [("講談社単独でも可能", "AIRAの制作・ViViでの展開・編集監修は、講談社だけでも進められる。", BLACK, WHITE),
            ("共同で広がる領域", "テレビ・配信・イベントへの展開と、広告主への商品化まで一気通貫で設計できる。", PINK, WHITE),
            ("電通の参加メリット", "広告商品の企画・販売のフィー、IP事業への参画による収益。配分は未決定。", YELLOW, BLACK)]
    for i, (t, d, f, c) in enumerate(cols):
        sticker(s, [[(t, {"size": 17})], [(d, {"size": 12.5, "bold": False})]], 70 + i * 600, 790, 580, 230, f, c, 13,
                [-1, 0.8, -0.8][i], 8, align="l", margin=(26, 12, 22, 12), lh=1.45, adj=0.1, line=WHITE if f == BLACK else BLACK)
    T(s, "11 / 15", 1700, 1042, 170, 30, size=10, color=BLACK, font=EN, align="r", lh=1.0)


def s12():
    s = new_slide(12, "12", "DENTSU MEDIA NETWORK. 電通は出演を確約する立場ではなく、企画開発・提案・調整を担う。出演可否は各媒体社の判断。")
    tag(s, 12, "DENTSU MEDIA NETWORK", dark=True)
    T(s, ["ViViの外へ、", [("AIRAの活動領域", {"color": LIME}), ("を広げる。", {})]], 70, 110, 1500, 230, size=44, color=WHITE, lh=1.2,
      shadow=(5, 5, PINK))
    shp(s, MSO_SHAPE.OVAL, 90, 430, 520, 520, None, LIME, 6, 0, dash=True)
    photo(s, PORTRAIT, 150, 490, 400, 400, fy=0.3, border=WHITE, bw=12, shadow=14, oval=True)
    sticker(s, "ViVi", 400, 420, 150, 70, PINK, WHITE, 18, 6, 5, font=EN, adj=0.5)
    sticker(s, ["電通", "企画開発・提案・調整"], 650, 610, 350, 130, YELLOW, BLACK, 15, -2, 8, adj=0.2, margin=(14, 8, 14, 8), lh=1.35)
    rows = [("テレビ", "番組連動企画の開発・提案"), ("配信", "配信番組・ショートコンテンツの企画"),
            ("デジタル", "SNS・Webでの展開設計"), ("イベント", "リアルとバーチャルをつなぐ出演機会の提案"),
            ("広告主", "広告主ネットワークとの接点づくり")]
    for i, (t, d) in enumerate(rows):
        y = 350 + i * 120
        line(s, 590, 690, 1060, y + 50, LIME, 5, dash=True)
    for i, (t, d) in enumerate(rows):
        y = 350 + i * 120
        shp(s, MSO_SHAPE.ROUNDED_RECTANGLE, 1060 + 8, y + 8, 790, 100, BLACK, None, 0, 0, 0.3)
        shp(s, MSO_SHAPE.ROUNDED_RECTANGLE, 1060, y, 790, 100, [PINK, BLUE, LAV, LIME, YELLOW][i], WHITE, 4, 0, 0.3)
        T(s, t, 1100, y, 200, 100, size=19, color=WHITE if i < 2 else BLACK, anchor="m", lh=1.0)
        T(s, d, 1310, y, 520, 100, size=15, color=WHITE if i < 2 else BLACK, bold=False, anchor="m", lh=1.3)
    sticker(s, "媒体横断のタレント育成戦略：各媒体の特性に合わせて役割を設計する", 70, 975, 1100, 56, BLACK, WHITE, 12.5, 0, 0, line=WHITE, lw=3, adj=0.5)
    note(s, "※電通はメディア出演を確約する立場ではありません。出演可否は各媒体社の判断です。", 1200, 965, 640, 44, WHITE, 10)


def s13():
    s = new_slide(13, "13", "BUSINESS MODEL & RIGHTS. 数字は示していない。収益配分は未決定。共同保有だけでは広告販売の独占権は生まれない。")
    tag(s, 13, "BUSINESS MODEL & RIGHTS")
    T(s, "編集資産から、新しい収益源を生む。", 70, 100, 1780, 110, size=52, color=BLACK, lh=1.2, shadow=(6, 6, WHITE))
    T(s, "REVENUE", 70, 235, 400, 36, size=12, color=PINK, font=EN, lh=1.0)
    revs = [("広告出演料", "AIRAの広告起用に対する出演料"), ("年間アンバサダー契約", "ブランドとの継続的な起用"),
            ("番組・イベント出演", "出演機会の企画・調整"), ("IPライセンス", "キャラクターの使用許諾"),
            ("コラボ", "ブランド・商品とのコラボ企画")]
    for i, (t, d) in enumerate(revs):
        y = 285 + i * 112
        shp(s, MSO_SHAPE.OVAL, 70 + 6, y + 6, 92, 92, BLACK)
        shp(s, MSO_SHAPE.OVAL, 70, y, 92, 92, PINK, WHITE, 5, text=str(i + 1), size=22, color=WHITE, font=EN,
            margin=(0, 0, 0, 0), lh=1.0)
        sticker(s, [[(t, {"size": 18})], [(d, {"size": 12, "bold": False})]], 190, y, 660, 96, WHITE, BLACK, 13,
                [-1, 0.8, -0.6, 1, -0.8][i], 6, adj=0.3, align="l", margin=(26, 6, 20, 6), lh=1.35)
    T(s, "RIGHTS DESIGN", 940, 235, 400, 36, size=12, color=PINK, font=EN, lh=1.0)
    for i, (n, t, d, f) in enumerate([("A案", "共同保有", "キャラクターIPを講談社と電通で共同保有する。", LAV),
                                      ("B案", "講談社が保有", "講談社がIPを保有し、電通は広告販売権等を契約で確保する。", LIME)]):
        x = 940 + i * 465
        ix, iy, iw, ih = win(s, x, 285, 445, 300, f"PLAN_{n}.exe", f)
        T(s, [[(t, {"size": 20, "color": PINK})], [(d, {"size": 13.5, "bold": False})]], ix, iy + 4, iw, ih, size=14, lh=1.45)
    sticker(s, [[("権利は分けて設計する", {"size": 16, "color": YELLOW})],
                [("アーカイブ／商標／キャラクター／AIシステム", {"size": 14, "bold": False, "color": WHITE})]],
            940, 630, 910, 120, BLACK, WHITE, 14, 0, 0, line=None, align="l", margin=(28, 10, 20, 10), lh=1.45, adj=0.15)
    sticker(s, "共同保有だけでは、広告販売の独占権は生まれない。販売権は契約で別途設計する。", 940, 780, 910, 100, PINK, WHITE, 15, -1, 8,
            align="l", margin=(28, 8, 24, 8), lh=1.45, adj=0.15)
    gen(s, "chrome_heart.png", 1700, 880, 160, rot=10)
    note(s, "※収益配分は未決定です。売上・費用などの数値は、検証前のため示していません。", 70, 975, 1500)


def s14():
    s = new_slide(14, "14", "WHY AI HACKATHON. 現状はAIRA Fashion Studioとルールの試作のみ。ViViアーカイブの検索・参照は未実装、アーカイブも未提供。")
    tag(s, 14, "WHY AI HACKATHON?")
    T(s, ["これはキャラクター制作ではない。", [("編集資産の人格化技術の実証だ。", {"color": PINK})]], 70, 100, 1780, 190, size=40, color=BLACK,
      lh=1.2, shadow=(5, 5, WHITE))
    pocs = [("1", "ViViアーカイブの検索・分析", "未着手（構想）", YELLOW),
            ("2", "編集部の価値観を反映する人格設計", "一部試作（ルール化）", LIME),
            ("3", "根拠を持った発言生成", "未着手（構想）", YELLOW),
            ("4", "容姿・声・人格の一貫性維持", "容姿は3Dで一部実装", LIME),
            ("5", "メディア出演用コンテンツ生成", "未着手（構想）", YELLOW)]
    for i, (n, t, st, col) in enumerate(pocs):
        x = 70 + i * 360
        r = [-1.5, 1, -1, 1.5, -1][i]
        shp(s, MSO_SHAPE.RECTANGLE, x + 8, 320 + 8, 336, 330, BLACK, None, 0, r)
        shp(s, MSO_SHAPE.RECTANGLE, x, 320, 336, 330, WHITE, BLACK, 4, r)
        shp(s, MSO_SHAPE.OVAL, x + 20, 336, 86, 86, PINK, BLACK, 4, r, text=n, size=24, color=WHITE, font=EN,
            margin=(0, 0, 0, 0), lh=1.0)
        T(s, t, x + 22, 440, 296, 120, size=17, color=BLACK, lh=1.3, rot=r)
        sticker(s, st, x + 22, 580, 292, 50, col, BLACK, 11, r, 0, adj=0.5, margin=(4, 0, 4, 0), lh=1.0, line=BLACK, lw=3)
    ix, iy, iw, ih = win(s, 70, 690, 880, 280, "CHALLENGES.exe", PINK, title_color=WHITE)
    T(s, [[("● 許諾範囲の管理と、根拠なき発言の抑制", {})], [("● 容姿・声・人格を、長期にわたり一貫させる", {})],
          [("● 編集部の監修フローの設計", {})]], ix, iy, iw, ih, size=14, lh=1.5, space_after=2)
    ix, iy, iw, ih = win(s, 990, 690, 860, 280, "SUCCESS_CRITERIA.exe", LIME)
    T(s, [[("● 発言の根拠を、アーカイブまで辿れる", {})], [("● 編集部が「ViViらしい」と判断できる", {})],
          [("● 複数のメディアで、同じ人物と認識できる", {})]], ix, iy, iw, ih, size=14, lh=1.5, space_after=2)
    note(s, "※実装済みはAIRA Fashion Studio（3D）とスタイリングルールのみ。評価基準は案で、数値目標はPoCで設定します。", 70, 985, 1700, 36)


def s15():
    s = new_slide(15, "15", "FINAL. 次のアクションはいずれも提案段階。")
    photo(s, PORTRAIT, 0, 0, 760, 1080, fy=0.3, border=None, bw=0, shadow=0)
    shp(s, MSO_SHAPE.RECTANGLE, 760, 0, 14, 1080, YELLOW)
    gen(s, "chrome_aira.png", 380, 880, 430, rot=-6)
    gen(s, "balloon_star_yellow.png", 60, 60, 200, rot=-12)
    T(s, "MAGAZINE MAKES", 840, 70, 1000, 90, size=44, color=WHITE, font=EN, lh=1.0, shadow=(5, 5, BLACK))
    gen(s, "chrome_human.png", 830, 150, 700)
    T(s, ["人がつくった雑誌が、", [("今度は人を生み出す。", {"color": YELLOW})]], 840, 340, 1030, 170, size=38, color=WHITE, lh=1.25,
      shadow=(5, 5, BLACK))
    T(s, "ViViの編集資産をAI人格へ転換し、電通と講談社が共同で、新しいメディア・広告ビジネスを構築する。", 840, 565, 1000, 110,
      size=16, color=WHITE, bold=False, lh=1.5)
    T(s, "NEXT ACTION", 840, 690, 400, 40, size=14, color=YELLOW, font=EN, lh=1.0)
    acts = [("01", "アーカイブ利用条件の確認", YELLOW, BLACK), ("02", "共同PoC", LIME, BLACK),
            ("03", "メディア企画の検証", WHITE, BLACK), ("04", "権利・収益条件の整理", BLUE, WHITE)]
    for i, (n, t, f, c) in enumerate(acts):
        x = 840 + (i % 2) * 520
        y = 750 + (i // 2) * 130
        sticker(s, [[(n + "  ", {"font": EN, "size": 14, "color": PINK if f != BLUE else YELLOW}), (t, {"size": 15})]], x, y, 500, 100, f, c, 15,
                [-1.5, 1, 1, -1][i], 7, adj=0.3, align="l", margin=(26, 6, 18, 6))
    T(s, "15 / 15", 1700, 1022, 170, 40, size=10, color=WHITE, font=EN, align="r", lh=1.0)


def main():
    if not os.path.exists(os.path.join(GEN, "bg_01.png")):
        subprocess.check_call([sys.executable, os.path.join(ROOT, "scripts", "gen_assets.py")])
    for f in (s01, s02, s03, s04, s05, s06, s07, s08, s09, s10, s11, s12, s13, s14, s15):
        f()
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    prs.save(OUT)
    print("saved", OUT, "slides:", len(prs.slides))
    for w in WARN:
        print("WARN", w)


if __name__ == "__main__":
    main()
