"""Build output/AI_ViVi_MODEL_PROJECT.pptx (15 slides, 16:9). Simple, clean, fully editable.

    python3 scripts/build_presentation.py

All coordinates are in points on a 960 x 540 pt slide. Text, shapes, tables and diagrams are native
PowerPoint objects. Only the AIRA photos (assets/aira/) are pictures (cropped with picture crop).
"""
import os

from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_CONNECTOR, MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Pt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "output", "AI_ViVi_MODEL_PROJECT.pptx")
PORTRAIT = os.path.join(ROOT, "assets", "aira", "aira_portrait.png")

PINK, LIME, YELLOW, BLUE, LAV = "FF1493", "B8FF00", "F9FF00", "367BFF", "C9A7FF"
BLACK, WHITE, BABY = "141019", "FFFFFF", "FFD4E9"
GREY, LGREY = "5A5560", "F3F1F5"
JP, EN = "Yu Gothic", "Arial Black"
TOTAL = 15
RECT, RRECT = MSO_SHAPE.RECTANGLE, MSO_SHAPE.ROUNDED_RECTANGLE

prs = Presentation()
prs.slide_width, prs.slide_height = Pt(960), Pt(540)
WARN = []
_cur = {"n": 0}


def rgb(h):
    return RGBColor.from_string(h)


def _fit(paras, w, h, size, lh, ml, mr, mt, mb):
    """Rough overflow estimate (full-width chars = 1em, ASCII = 0.6em)."""
    total = 0
    for p in paras:
        runs = [(p, {})] if isinstance(p, str) else p
        text = "".join(t for t, _ in runs)
        sz = max([o.get("size", size) for _, o in runs] or [size])
        width = sum(sz * (0.6 if ord(c) < 256 else 1.0) for c in text)
        lines = max(1, -(-width // max(1, (w - ml - mr))))
        total += lines * sz * lh * 1.2
    if total > h - mt - mb + 2:
        WARN.append(f"slide {_cur['n']}: may overflow ({total:.0f}>{h - mt - mb:.0f}pt): {str(paras)[:40]}")


def _fill_tf(tf, paras, size, color, bold, font, align, lh, space_after):
    if isinstance(paras, str):
        paras = [paras]
    for i, p in enumerate(paras):
        para = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        para.alignment = {"l": PP_ALIGN.LEFT, "c": PP_ALIGN.CENTER, "r": PP_ALIGN.RIGHT}[align]
        para.line_spacing = lh
        para.space_after = Pt(space_after)
        runs = [(p, {})] if isinstance(p, str) else p
        for text, o in runs:
            r = para.add_run()
            r.text = text
            f = r.font
            f.size = Pt(o.get("size", size))
            f.bold = o.get("bold", bold)
            f.color.rgb = rgb(o.get("color", color))
            fn = o.get("font", font)
            f.name = fn
            rpr = r._r.get_or_add_rPr()
            rpr.append(rpr.makeelement(qn("a:ea"), {"typeface": JP}))


def tx(s, paras, x, y, w, h, size=18, color=BLACK, bold=True, font=JP, align="l", anchor="t", lh=1.2,
       space_after=0, rot=0):
    tb = s.shapes.add_textbox(Pt(x), Pt(y), Pt(w), Pt(h))
    tb.rotation = rot
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = {"t": MSO_ANCHOR.TOP, "m": MSO_ANCHOR.MIDDLE, "b": MSO_ANCHOR.BOTTOM}[anchor]
    _fill_tf(tf, paras, size, color, bold, font, align, lh, space_after)
    _fit([paras] if isinstance(paras, str) else paras, w, h, size, lh, 0, 0, 0, 0)
    return tb


def box(s, x, y, w, h, fill=None, line=None, lw=1.5, kind=RECT, paras=None, size=18, color=BLACK, bold=True,
        font=JP, align="l", anchor="m", lh=1.2, margin=12, space_after=0, rot=0, adj=None):
    sp = s.shapes.add_shape(kind, Pt(x), Pt(y), Pt(w), Pt(h))
    if fill:
        sp.fill.solid()
        sp.fill.fore_color.rgb = rgb(fill)
    else:
        sp.fill.background()
    if line:
        sp.line.color.rgb = rgb(line)
        sp.line.width = Pt(lw)
    else:
        sp.line.fill.background()
    if adj is not None:
        sp.adjustments[0] = adj
    sp.rotation = rot
    sp.shadow.inherit = False
    if paras is not None:
        tf = sp.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = Pt(margin)
        tf.margin_top = tf.margin_bottom = Pt(max(4, margin * 0.5))
        tf.vertical_anchor = {"t": MSO_ANCHOR.TOP, "m": MSO_ANCHOR.MIDDLE, "b": MSO_ANCHOR.BOTTOM}[anchor]
        _fill_tf(tf, paras, size, color, bold, font, align, lh, space_after)
        _fit([paras] if isinstance(paras, str) else paras, w, h, size, lh, margin, margin,
             max(4, margin * 0.5), max(4, margin * 0.5))
    return sp


def line(s, x1, y1, x2, y2, color=PINK, lw=2.5):
    c = s.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Pt(x1), Pt(y1), Pt(x2), Pt(y2))
    c.line.color.rgb = rgb(color)
    c.line.width = Pt(lw)
    return c


def arrow(s, x, y, w, h, color=PINK):
    return box(s, x, y, w, h, color, None, kind=MSO_SHAPE.RIGHT_ARROW)


def star(s, x, y, size=22, color=PINK):
    return box(s, x, y, size, size, color, None, kind=MSO_SHAPE.STAR_4_POINT, adj=0.3)


def heart(s, x, y, size=24, color=PINK):
    return box(s, x, y, size, size * 0.9, color, None, kind=MSO_SHAPE.HEART)


def photo(s, path, x, y, w, h, fx=0.5, fy=0.5, zoom=1.0, border=None, bw=0, rot=0):
    """Picture with crop-to-fill (aspect ratio preserved via real picture crop)."""
    im = Image.open(path)
    ar_i, ar_b = im.width / im.height, w / h
    if ar_i > ar_b:
        vw, vh = ar_b / ar_i / zoom, 1 / zoom
    else:
        vw, vh = 1 / zoom, ar_i / ar_b / zoom
    l, t = (1 - vw) * fx, (1 - vh) * fy
    p = s.shapes.add_picture(path, Pt(x), Pt(y), Pt(w), Pt(h))
    p.crop_left, p.crop_right = l, 1 - vw - l
    p.crop_top, p.crop_bottom = t, 1 - vh - t
    if border:
        p.line.color.rgb = rgb(border)
        p.line.width = Pt(bw)
    p.rotation = rot
    return p


def new_slide(n, kicker, bg=WHITE, notes=None):
    _cur["n"] = n
    s = prs.slides.add_slide(prs.slide_layouts[6])
    s.background.fill.solid()
    s.background.fill.fore_color.rgb = rgb(bg)
    dark = bg == BLACK
    if kicker:
        box(s, 0, 0, 14, 540, PINK)
        tx(s, f"{n:02d} / {kicker}", 48, 22, 700, 20, size=11, color=PINK, font=EN, lh=1.0)
    tx(s, f"{n:02d} / {TOTAL:02d}", 840, 514, 80, 16, size=10, color=WHITE if dark else GREY, font=EN, align="r", lh=1.0)
    if notes:
        s.notes_slide.notes_text_frame.text = notes
    return s


def title(s, text, y=48, size=34, color=BLACK, h=56):
    return tx(s, text, 48, y, 864, h, size=size, color=color, lh=1.1)


def note(s, text, y=508, color=GREY, x=48, w=780):
    return tx(s, text, x, y, w, 22, size=10, color=color, bold=False, lh=1.15)


def table(s, x, y, w, col_w, rows, row_h, size=16):
    gt = s.shapes.add_table(len(rows), len(rows[0]), Pt(x), Pt(y), Pt(w), Pt(sum(row_h)))
    t = gt.table
    for a in ("firstRow", "bandRow"):
        t._tbl.tblPr.set(a, "0")
    for j, cw in enumerate(col_w):
        t.columns[j].width = Pt(cw)
    for i, r in enumerate(rows):
        t.rows[i].height = Pt(row_h[i])
        for j, txt in enumerate(r):
            c = t.cell(i, j)
            c.margin_left = c.margin_right = Pt(10)
            c.margin_top = c.margin_bottom = Pt(5)
            c.vertical_anchor = MSO_ANCHOR.MIDDLE
            hdr = i == 0
            c.fill.solid()
            if hdr:
                c.fill.fore_color.rgb = rgb(PINK if j == len(r) - 1 else BLACK)
            else:
                c.fill.fore_color.rgb = rgb(BABY if j == 0 else WHITE)
            _fill_tf(c.text_frame, txt, size, WHITE if hdr else BLACK, hdr or j == 0, JP, "l", 1.15, 0)
            c.text_frame.word_wrap = True
            _fit([txt], col_w[j], row_h[i], size, 1.15, 10, 10, 5, 5)
    return gt


def s01():
    s = new_slide(1, "OPENING QUESTION", BLACK, "冒頭で弱点をあえて提示。AIRAビジュアルは出さない。")
    tx(s, "?", 560, -60, 400, 560, size=420, color=PINK, font=EN, align="c", lh=1.0)
    tx(s, ["そもそも、", "AIハッカソンで", "やる意味はあるのか。"], 48, 70, 560, 230, size=44, color=WHITE, lh=1.2)
    box(s, 48, 322, 420, 52, PINK, None, paras="私たち自身も、そう思いました。", size=22, color=WHITE, margin=16)
    tx(s, "AIモデルをつくるだけなら、もう特別なことではない。それでも、出版社が積み上げてきた資産を、新しい広告ビジネスへ転換する可能性を、聞いてほしい。",
       48, 396, 560, 90, size=18, color=WHITE, bold=False, lh=1.4)
    star(s, 640, 70, 30, YELLOW)
    note(s, "※AIRAは構想上のAIモデルです。ViViアーカイブの利用・講談社との共同事業は未確定です。", 500, WHITE)


def s02():
    s = new_slide(2, "REJECTED IDEA, REBORN", WHITE, "不採用の具体的理由は創作しない。")
    title(s, "一度、葬られたアイデア。")
    items = [("REJECTED", "以前のMTGで、採用に至らなかった「AIモデル」案。", LGREY, GREY),
             ("RETHINK", "以前案のままではなく、出版社固有の編集資産と結びつけて、新しい価値を生めないか考え直した。", BABY, BLACK),
             ("REBORN", "編集資産を背景に持つAIモデルとして、改めて提案する。", PINK, WHITE)]
    for i, (en, d, f, c) in enumerate(items):
        x = 48 + i * 300
        box(s, x, 140, 264, 70, f, None, paras=en, size=26, color=c, font=EN, align="c")
        tx(s, d, x + 4, 228, 256, 150, size=18, color=BLACK, bold=False, lh=1.4)
        if i < 2:
            arrow(s, x + 268, 160, 28, 30, BLACK)
    star(s, 860, 150, 36)
    box(s, 48, 410, 864, 64, BLACK, None,
        paras=[[("同じ「AIモデル」でも、考え直した軸は", {}), ("“出版社固有の編集資産”", {"color": LIME}), ("。", {})]], size=22, color=WHITE, margin=20)
    note(s, "※不採用の具体的な理由には触れず、案を再設計した経緯のみを示しています。", 492)


def s03():
    s = new_slide(3, "MAGAZINES ARE MADE BY PEOPLE", WHITE, "様々な職種の感性が一冊に集まる。")
    title(s, "雑誌は、人がつくってきた。")
    roles = [("編集者", "企画と視点を決める"), ("モデル", "誌面で世界観を体現する"), ("カメラマン", "瞬間と空気を切り取る"),
             ("スタイリスト", "服で時代を表現する"), ("ライター", "言葉で価値観を伝える"), ("読者", "反応で誌面を育てる")]
    for i, (t, d) in enumerate(roles):
        left = i < 3
        x = 48 if left else 612
        y = 124 + (i % 3) * 100
        line(s, x + 300 if left else x, y + 40, 370 if left else 590, y + 40, PINK, 2)
        box(s, x, y, 300, 80, WHITE, BLACK, 2, paras=[[(t, {"size": 20})], [(d, {"size": 16, "bold": False, "color": GREY})]], margin=16)
    box(s, 370, 124, 220, 280, BABY, PINK, 3,
        paras=[[("ViVi", {"size": 54, "font": EN, "color": PINK})], [("一冊に、感性が集まる", {"size": 16})],
               [("（誌面画像はプレースホルダー）", {"size": 11, "bold": False, "color": GREY})]], align="c", margin=10, lh=1.3)
    heart(s, 560, 112, 26)
    box(s, 48, 430, 864, 66, BLACK, None,
        paras="雑誌は情報の集合体ではなく、時代ごとのファッション・カルチャー・価値観・美意識を、編集し、蓄積してきたメディア。", size=19, color=WHITE, margin=20)


def s04():
    s = new_slide(4, "MAGAZINE MAKES HUMAN.", BLACK, "AIRAは構想上のAIモデル。ViViアーカイブ利用・共同事業は未確定。")
    box(s, 610, 70, 200, 330, WHITE, None, rot=-6,
        paras=[[("ViVi", {"size": 44, "font": EN, "color": PINK})], [("雑誌（イメージ）", {"size": 13, "color": GREY})]], align="c")
    photo(s, PORTRAIT, 690, 40, 230, 420, fy=0.2, border=PINK, bw=4, rot=3)
    star(s, 650, 30, 34, YELLOW)
    tx(s, ["MAGAZINE", "MAKES", [("HUMAN.", {"color": PINK})]], 48, 56, 540, 190, size=48, color=WHITE, font=EN, lh=1.05)
    tx(s, "人がつくった雑誌が、今度は人を生み出す。", 48, 262, 540, 80, size=26, color=YELLOW, lh=1.25)
    tx(s, "ViViの編集の歴史・ファッション観・カルチャー・価値観を、AIモデルの人格形成に活用する。ViViの感性を体現するAIRAを、メディア・広告の世界へ送り出す。",
       48, 352, 540, 100, size=16, color=WHITE, bold=False, lh=1.4)
    box(s, 48, 452, 540, 48, PINK, None, paras="単なるバーチャルモデル制作ではなく、雑誌ブランドの人格化による新しい広告IP事業の構想。", size=15, color=WHITE, margin=12)
    note(s, "※AIRAは構想上のAIモデルです。ViViアーカイブの利用・講談社との共同事業は未確定です。", 510, WHITE, w=640)


def s05():
    s = new_slide(5, "WHY MAGAZINE?", WHITE, "雑誌だけがこの資産を持つとは主張しない。雑誌の強みとしての整理。")
    title(s, "なぜ、雑誌なのか。", h=48)
    tx(s, "雑誌は、すでに人格を持っている。", 48, 100, 864, 40, size=26, color=PINK, lh=1.1)
    tx(s, "媒体ごとに、選ぶモデル・ファッション・言葉づかい・価値観が異なる。長年の固有の編集視点があり、二次元の誌面で表現された豊富なビジュアル資産と、言語化された編集資産の両方を持つ。",
       48, 148, 864, 60, size=16, bold=False, lh=1.35)
    cards = [("01", "ビジュアル資産", "表紙・誌面・ファッション写真・アートディレクション", PINK, WHITE),
             ("02", "編集資産", "特集・記事・編集方針・言葉づかい", BLACK, WHITE),
             ("03", "時間的資産", "過去から現在までのトレンド・価値観の蓄積", BABY, BLACK)]
    for i, (n, t, d, f, c) in enumerate(cards):
        box(s, 48 + i * 296, 226, 272, 190, f, None,
            paras=[[(n, {"size": 16, "font": EN})], [(t, {"size": 24})], [(" ", {"size": 6})], [(d, {"size": 17, "bold": False})]], color=c,
            margin=18, anchor="t", lh=1.3)
    box(s, 48, 432, 864, 56, BLACK, None, paras="これらをAI人格の背景にすることが、一般的なAIモデルとの差別化の出発点。", size=20, color=WHITE, margin=20)
    note(s, "※雑誌だけがこの資産を持つという主張ではなく、雑誌の強みとしての整理です。", 496)


def s06():
    s = new_slide(6, "MEET AIRA", WHITE, "細かいプロフィールは載せない。構想上のAIモデル。")
    photo(s, PORTRAIT, 540, 0, 420, 540, fy=0.25)
    box(s, 528, 0, 12, 540, PINK)
    tx(s, ["彼女は、", [("ViVi", {"font": EN, "color": PINK}), ("から生まれた。", {})]], 48, 70, 470, 130, size=38, lh=1.25)
    tx(s, "AIRAは、ViVi名を冠しただけのAIモデルではない。ViViのファッション観・編集の感性・カルチャーを、人格の背景に持つ存在として構想している。",
       48, 230, 450, 150, size=19, bold=False, lh=1.5)
    for i, t in enumerate(["ファッション観", "編集の感性", "カルチャー"]):
        box(s, 48 + i * 158, 400, 148, 44, [PINK, BLACK, BABY][i], None, kind=RRECT, adj=0.5, paras=t, size=16,
            color=[WHITE, WHITE, BLACK][i], align="c", margin=4)
    heart(s, 880, 470, 36)
    note(s, "※AIRAは構想上のAIモデルです。細かな人格設定は、編集部の監修を前提に今後検討します。", 490, w=470)


def s07():
    s = new_slide(7, "AIRA GOES EVERYWHERE", WHITE, "番組出演・広告契約はすべて構想上の企画例。")
    title(s, "ViViから生まれ、ViViの外へ。")
    tx(s, "将来の活動領域（構想）", 48, 100, 400, 20, size=13, color=PINK, lh=1.0)
    areas = ["ViVi本誌・Web・SNSへの登場", "リアルViViモデルとのコラボ", "テレビ・配信番組へのゲスト出演企画", "ファッション・美容イベント",
             "ブランドアンバサダー契約", "広告キャンペーン", "ViViの歴史・文化を活用した独自コンテンツ"]
    for i, t in enumerate(areas):
        box(s, 48, 126 + i * 52, 420, 44, BABY if i % 2 == 0 else LGREY, None, paras=t, size=16, margin=14)
    ideas = [("企画例 A", "時代を超えるファッション対談", "過去のViViの誌面を知るAIRAと、現役ViViモデルが、時代を超えてファッションを語る。"),
             ("企画例 B", "ブランド協賛型コンテンツ", "ViViの過去と現在の美意識をテーマに、ViViの編集文脈の中でブランドの世界観を表現する。")]
    for i, (a, h, d) in enumerate(ideas):
        y = 126 + i * 190
        box(s, 500, y, 412, 172, WHITE, BLACK, 2)
        box(s, 500, y, 412, 34, PINK if i == 0 else BLACK, None, paras=f"AIRAだから成立する{a}", size=14, color=WHITE, margin=14)
        tx(s, [[(h, {"size": 20})], [(" ", {"size": 6})], [(d, {"size": 16, "bold": False})]], 516, y + 46, 380, 120, lh=1.35)
    star(s, 880, 94, 22)
    note(s, "※番組出演・広告契約はすべて構想上の企画例で、決定事項ではありません。", 496)


def s08():
    s = new_slide(8, "WIN-WIN-WIN", WHITE, "広告主の需要は未検証。期待価値と確定メリットを混同しない。")
    title(s, [[("講談社・電通・広告主。", {}), ("三方良しのビジネス。", {"color": PINK})]], h=48)
    for x in (188, 480, 772):
        line(s, 480, 215, x, 290, PINK, 3)
    box(s, 200, 118, 560, 98, PINK, None, kind=RRECT, adj=0.2,
        paras=[[("中央の広告企画（例）", {"size": 13, "color": YELLOW})],
               [("ViViの過去と現在の美意識をテーマにした、AIRA×ViViのブランド協賛型コンテンツ", {"size": 19})]], color=WHITE, align="c", margin=18)
    cols = [("講談社", ["編集資産の新しい活用先", "ViViの活動領域の拡大", "IP収益機会の拡大"], BABY),
            ("広告主", ["ViViの世界観・編集文脈を持つAIモデルによる新しい広告表現", "タイアップ企画の検討"], LGREY),
            ("電通", ["AIモデル起点の広告商材", "メディア企画", "継続的なIPビジネス開発"], BABY)]
    for i, (h, its, f) in enumerate(cols):
        x = 48 + i * 292
        box(s, x, 290, 280, 196, f, BLACK, 2, anchor="t", margin=16, lh=1.3,
            paras=[[(h, {"size": 24, "color": PINK})]] + [[("● " + t, {"size": 16, "bold": False})] for t in its], space_after=4)
    note(s, "※広告主の需要は未検証です。ここに示すのは期待価値であり、確定したメリットではありません。", 496)


def s09():
    s = new_slide(9, "WHY JOINT OWNERSHIP?", WHITE, "共同保有は有力な選択肢の一つで最善とは限らない。販売権は別途契約設計。")
    title(s, "なぜ、共同保有なのか。", h=48)
    box(s, 48, 96, 424, 60, BABY, None, margin=14,
        paras=[[("講談社が提供", {"size": 13, "color": PINK})], [("ViViブランド・編集資産・編集監修", {"size": 16})]])
    box(s, 488, 96, 424, 60, BABY, None, margin=14,
        paras=[[("電通が提供", {"size": 13, "color": PINK})], [("メディア企画・広告主開拓・事業開発", {"size": 16})]])
    tx(s, "双方が長期投資しIP育成の動機を共有できるため、共同保有を有力な選択肢として検討する。ただし最善とは限らない。", 48, 166, 864, 40,
       size=16, lh=1.3)
    rows = [["", "A案：講談社・電通の共同保有", "B案：講談社が保有＋電通へ広告販売権を付与"],
            ["メリット", "双方がIP育成に長期投資しやすい／成長・収益を分かち合う設計にしやすい",
             "意思決定がシンプルで、ブランド管理を一元化できる／権利関係を整理しやすい"],
            ["デメリット", "意思決定・権利行使の調整が複雑になる／持分・収益配分の合意が必要（未決定）",
             "電通の長期投資インセンティブが弱まる可能性／販売権の範囲・期間・条件の設計が必要"]]
    table(s, 48, 218, 864, [110, 377, 377], rows, [34, 78, 78], size=15)
    box(s, 48, 420, 864, 80, PINK, None, margin=16, lh=1.3, color=WHITE,
        paras=[[("権利は区別して設計する：キャラクターIP／ViVi商標／過去誌面・写真／AIシステム", {"size": 15})],
               [("共同保有によって、電通が自動的に広告の独占販売権を得るわけではない。販売権は、別途の契約設計が必要。", {"size": 15})]])


def s10():
    s = new_slide(10, "WHY KODANSHA × DENTSU?", WHITE, "講談社単独でも制作可能。共同で何が追加されるかを示す。")
    title(s, "講談社が得るもの。電通が得るもの。", h=48)
    left = ["編集資産を活用した新規IP事業への参入", "広告主との接点の拡大", "媒体外への展開機会", "事業リスク・投資負担の分担可能性"]
    right = ["独自性のある広告商材", "IP育成への関与", "継続的な事業収益機会", "出版社との新しい共同事業モデルの構築"]
    box(s, 48, 100, 410, 34, BLACK, None, paras="講談社が得るもの", size=16, color=WHITE, margin=14)
    box(s, 502, 100, 410, 34, PINK, None, paras="電通が得るもの", size=16, color=WHITE, margin=14)
    for i in range(4):
        box(s, 48, 140 + i * 46, 410, 40, BABY, None, paras=left[i], size=16, margin=14)
        box(s, 502, 140 + i * 46, 410, 40, BABY, None, paras=right[i], size=16, margin=14)
    box(s, 462, 220, 36, 36, PINK, None, kind=MSO_SHAPE.MATH_MULTIPLY)
    tx(s, "講談社単独でも、AIモデルの制作は可能。だからこそ、電通と組むことで何が加わるのかを示す。", 48, 336, 864, 28, size=18, color=PINK, lh=1.1)
    box(s, 48, 374, 424, 120, LGREY, BLACK, 2, anchor="t", margin=16, lh=1.3, space_after=4,
        paras=[[("講談社単独で実施", {"size": 18, "color": GREY})],
               [("編集資産を活かした制作と、誌面・自社媒体での展開。広告主開拓や媒体横断の企画は、自前での構築が必要。", {"size": 15, "bold": False})]])
    box(s, 488, 374, 424, 120, WHITE, PINK, 3, anchor="t", margin=16, lh=1.3, space_after=4,
        paras=[[("電通との共同で実施", {"size": 18, "color": PINK})],
               [("広告主ネットワーク・メディア企画・事業開発が加わり、媒体外への展開と広告商品化までを一体で設計できる。", {"size": 15, "bold": False})]])


def s11():
    s = new_slide(11, "NOT JUST A VIRTUAL CHARACTER", WHITE, "差別化は設計思想上の仮説。既存バーチャルタレントを否定しない。")
    title(s, "キズナアイと、何が違うのか。", h=48)
    rows = [["比較軸", "既存のバーチャルタレント（VTuber等）", "AIRA（構想）"],
            ["人格の背景", "独自のキャラクター性・世界観", "ViViの編集資産・歴史・感性"],
            ["コンテンツの源泉", "本人（運営）の企画・活動・配信", "ViViの誌面・編集の蓄積と、編集部の視点"],
            ["メディアとの関係", "独自の活動を軸に、ファンを獲得してきた", "実在のメディアブランドと一体で展開する構想"],
            ["広告主への提供価値", "ファンコミュニティを通じた訴求", "ViViの編集文脈の中での表現・タイアップ"]]
    table(s, 48, 108, 864, [190, 337, 337], rows, [40, 62, 62, 62, 62], size=17)
    box(s, 48, 424, 864, 70, BLACK, None, margin=18, lh=1.3, color=WHITE, size=15,
        paras="差別化は設計思想上の仮説であり、実際の優位性はコンテンツと広告商品で証明する必要がある。既存バーチャルタレントの価値を否定するものではない。")


def s12():
    s = new_slide(12, "IS THERE A MARKET?", WHITE, "市場性に正面から答える。数字は書かない。")
    title(s, "そもそも、AIモデルに広告価値はあるのか。", size=30, h=44)
    tx(s, "AIモデルが存在することと、広告主が起用したいと思うことは別。", 48, 90, 864, 28, size=18, color=PINK, lh=1.1)
    cards = [("1  広告主の動機は？（仮説）", ["世界観をもつ人格にブランドを重ねられる", "一度きりでなく、継続的な物語・タイアップを組める", "新しい表現としての注目"]),
             ("2  独自の提供価値は？", ["時代・世界観を越える表現", "メディアが変わっても一貫した人格", "リアルモデル・VTuberと異なる、ViViの編集文脈という背景"])]
    for i, (h, its) in enumerate(cards):
        box(s, 48 + i * 292, 128, 280, 232, LGREY, None, anchor="t", margin=14, lh=1.3, space_after=3,
            paras=[[(h, {"size": 17, "color": PINK})]] + [[("・" + t, {"size": 15, "bold": False})] for t in its])
    box(s, 632, 128, 280, 232, PINK, None, anchor="t", margin=14, lh=1.3, color=WHITE, space_after=3,
        paras=[[("3  広告商品案", {"size": 17, "color": YELLOW})], [("AIRA × ViVi ARCHIVE タイアップ", {"size": 19})],
               [("過去のViViのファッション文化と、現代のブランド商品を結びつける編集型広告企画。", {"size": 15, "bold": False})]])
    box(s, 48, 376, 420, 120, WHITE, BLACK, 2, anchor="t", margin=14, lh=1.3, space_after=3,
        paras=[[("区別して考える", {"size": 16, "color": PINK})],
               [("・一般的な「AIモデル需要」", {"size": 15, "bold": False})],
               [("・AIRA固有の広告需要（ViVi文脈）", {"size": 15, "bold": False})],
               [("需要は未検証。数字は示さず、今後確認する。", {"size": 13, "bold": False, "color": GREY})]])
    box(s, 488, 376, 424, 120, WHITE, BLACK, 2, anchor="t", margin=14, lh=1.3, space_after=3,
        paras=[[("公開事例（参考）", {"size": 16, "color": PINK})],
               [("H&M：実在モデル30名の同意のもと、デジタルツインを広告・マーケで活用すると2025年3月に発表。", {"size": 14, "bold": False})],
               [("※AIキャラクター起用とは別の事例。", {"size": 12, "bold": False, "color": GREY})]])
    note(s, "出典: Futureweek「H&M Releases First Campaign with AI Models」futureweek.com/hm-releases-campaign-with-ai-models/ ／ 本資料に売上・市場規模の数値は含みません。", 502, w=800)


def s13():
    s = new_slide(13, "WHY MSE?", BLACK, "電通出版局/MSEが提案する意味。他媒体展開は各社の権利条件に応じて個別検討。")
    tx(s, "なぜ、MSEがやるのか。", 48, 42, 600, 30, size=22, color=PINK, lh=1.1)
    tx(s, [[("AIモデルをつくることが、私たちの仕事ではない。", {})], [("新しいメディア・広告ビジネスをつくることが、私たちの仕事だ。", {"color": YELLOW})]],
       48, 76, 864, 84, size=26, color=WHITE, lh=1.25)
    flow = [("出版社の編集資産", "ViViは第一弾候補", WHITE, BLACK), ("電通 MSE", "事業開発を主導", PINK, WHITE),
            ("メディア接点", "広告主・テレビ・配信・イベント・デジタル", WHITE, BLACK), ("新しい広告商品", "AIRA起点のIP事業", YELLOW, BLACK)]
    for i, (h, d, f, c) in enumerate(flow):
        x = 48 + i * 224
        box(s, x, 178, 188, 118, f, None, paras=[[(h, {"size": 20})], [(d, {"size": 14, "bold": False})]], color=c, align="c", margin=10, lh=1.25)
        if i < 3:
            arrow(s, x + 192, 223, 28, 28, PINK)
    tx(s, "MSEの役割（企画開発・提案・調整）", 48, 314, 600, 22, size=15, color=PINK, lh=1.1)
    roles = [("起点をつくる", "出版社の編集資産から、広告商品の種を見つける"), ("接点をつなぐ", "広告主・テレビ・配信・イベント・デジタルを横断して設計"),
             ("事業にする", "広告商品化・IP事業化を主導（出演枠は確約せず、企画・提案・調整）")]
    for i, (h, d) in enumerate(roles):
        box(s, 48 + i * 296, 342, 280, 106, None, WHITE, 1.5, anchor="t", margin=12, lh=1.3,
            paras=[[(h, {"size": 17, "color": YELLOW})], [(d, {"size": 14, "bold": False})]], color=WHITE, space_after=2)
    box(s, 48, 458, 864, 46, PINK, None,
        paras="単なるAIキャラクター制作でも出版社支援でもなく、電通メディア領域が主導する事業開発。将来は他の出版社にも応用可能性（各社の権利条件に応じて個別検討）。",
        size=13, color=WHITE, margin=12)


def s14():
    s = new_slide(14, "THE QUESTIONS WE MUST ANSWER", WHITE, "未解決を解決済みに見せない。検討すべき論点が明確な事業構想。")
    title(s, "もちろん、簡単な話ではない。", h=44)
    tx(s, "「不安がない事業」ではなく、「検討すべき論点が明確な事業構想」として。", 48, 88, 864, 24, size=16, color=PINK, lh=1.1)
    qs = [("ViViのアーカイブを本当に活用できるのか？", "編集資産の活用は構想段階。権利者の許諾が前提。", "利用範囲・条件の確認"),
          ("AIRAはファンを獲得できるのか？", "ViViの編集文脈が強みになる仮説。", "小規模な反応検証"),
          ("広告主は対価を払うのか？", "需要は未検証。企画例を元に打診・検討。", "広告主ヒアリング"),
          ("講談社は共同保有を望むのか？", "単独保有案との比較で検討。", "権利・収益条件の協議"),
          ("電通が事業として続ける合理性は？", "継続的な広告商材・IP事業の可能性。", "事業性の試算（数値は未定）"),
          ("不適切な発言・ブランド毀損への対応は？", "編集部と広告主の確認・監修を組み込む。", "運用ルール・監修体制")]
    for i, (q, a, b) in enumerate(qs):
        x, y = 48 + (i % 3) * 296, 124 + (i // 3) * 190
        box(s, x, y, 280, 176, LGREY, None, anchor="t", margin=12, lh=1.25, space_after=3,
            paras=[[(q, {"size": 17, "color": PINK})], [("考え方：" + a, {"size": 15, "bold": False})], [("確認事項：" + b, {"size": 15})]])


def s15():
    s = new_slide(15, None, BLACK, "最終ページ。冒頭の問いに戻って締める。")
    photo(s, PORTRAIT, 0, 0, 340, 540, fy=0.25)
    box(s, 340, 0, 10, 540, PINK)
    tx(s, "MAGAZINE MAKES", 384, 34, 540, 40, size=28, color=WHITE, font=EN, lh=1.0)
    tx(s, "HUMAN.", 384, 70, 540, 70, size=54, color=PINK, font=EN, lh=1.0)
    tx(s, "人がつくった雑誌が、今度は人を生み出す。", 384, 146, 540, 40, size=24, color=YELLOW, lh=1.1)
    tx(s, "AIモデルをつくるだけなら、AIハッカソンで提案する意味は薄いかもしれない。しかし、出版社が積み上げてきた知見や感性を新しい人格として世に送り出し、広告ビジネスへ発展させる。その可能性を、電通出版局から提案したい。",
       384, 200, 530, 140, size=17, color=WHITE, bold=False, lh=1.45)
    tx(s, "NEXT ACTION", 384, 356, 300, 20, size=13, color=PINK, font=EN, lh=1.0)
    acts = ["アーカイブ利用条件の確認", "共同事業の可否の検討", "広告・メディア企画の仮説検証", "権利・収益条件の整理"]
    for i, t in enumerate(acts):
        box(s, 384 + (i % 2) * 270, 382 + (i // 2) * 58, 260, 48, WHITE if i % 3 == 0 else BABY, None,
            paras=[[(f"{i + 1:02d}  ", {"color": PINK, "font": EN, "size": 13}), (t, {})]], size=15, margin=12)
    star(s, 880, 30, 28, YELLOW)
    note(s, "※AIRAは構想上のAIモデルです。ViViアーカイブの利用・講談社との共同事業は未確定です。", 508, WHITE, x=384, w=450)
    tx(s, "15 / 15", 840, 514, 80, 16, size=10, color=WHITE, font=EN, align="r", lh=1.0)


def main():
    for f in (s01, s02, s03, s04, s05, s06, s07, s08, s09, s10, s11, s12, s13, s14, s15):
        f()
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    prs.save(OUT)
    print("saved", OUT, "slides:", len(prs.slides))
    for w in WARN:
        print("WARN", w)


if __name__ == "__main__":
    main()
