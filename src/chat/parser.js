import { OUTFITS, getOutfit } from '../data/outfits.js';
import { STYLE_IDS, STYLE_RULES } from '../fashion/styleRules.js';
import { POSES, getPose } from '../data/poses.js';
import { EXPRESSIONS, getExpression } from '../avatar/expressions.js';
import { TOPICS, SCENES, EXPLAIN_WORDS, ADVICE_WORDS, explainOutfit, topicAnswer } from '../fashion/knowledge.js';
import { BACKGROUNDS, getBackground } from '../data/backgrounds.js';

// Normalise: full/half width, case, and katakana -> hiragana so one keyword matches both.
export function normalize(text) {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

// ViVi style lines come first so specific words ("ミニスカ", "スポーツ") win over the classic looks' broader ones.
const OUTFIT_RULES = [
  ...STYLE_IDS.map((id) => ({ id, words: STYLE_RULES[id].keywords })),
  { id: 'street', words: ['ストリート', 'カーゴ', 'スニーカー', 'ヒップホップ', 'カジュアル', 'ラフ', '初期', '元の', 'もとの', '元に'], ambiguous: ['ストリート'] },
  { id: 'girly', words: ['ガーリー', 'かわいい', '可愛い', 'スカート', 'リボン', 'フリル', 'ふわふわ', 'ラブリー', 'フェミニン', 'ピンク'], ambiguous: ['ピンク'] },
  { id: 'mode', words: ['モード', 'クール', 'かっこいい', 'カッコいい', 'コート', 'シック', '大人', 'ブラック', '黒', 'シルバー'], ambiguous: ['クール', 'シルバー', 'ブラック', '黒'] },
];

const POSE_RULES = [
  { id: 'peace', words: ['ピース', 'vサイン', 'Vサイン', '自撮り', 'セルフィー'] },
  { id: 'wave', words: ['手を振', '手振', 'バイバイ', 'こんにちは', 'こんにちわ', 'はろー', 'ハロー', 'やっほー', 'ヤッホー', '挨拶'] },
  { id: 'hip', words: ['腰', 'ハンドオンヒップ', '決めポーズ', 'ポーズ決め', 'どや', 'ドヤ'] },
  { id: 'runway', words: ['ランウェイ', 'ウォーキング', '歩', 'キャットウォーク', 'モデル立ち', 'モデルポーズ'] },
  { id: 'stand', words: ['直立', '立って', '立つ', '普通のポーズ', '基本ポーズ', '通常', 'スタンド'] },
];

const BG_RULES = [
  { id: 'studio', words: ['ピンク', 'スタジオ'] },
  { id: 'night', words: ['夜', 'ネオン', '街', 'ストリート', 'ナイト'], strong: ['夜', 'ネオン', 'ナイト'] },
  { id: 'silver', words: ['シルバー', '銀', 'メタル', 'クローム', 'ランウェイ'] },
  { id: 'dream', words: ['ドリーム', '夢', 'ゆめ', '星', '宇宙', 'パステル', '紫'], strong: ['ドリーム', '宇宙', '星空'] },
];

const ASKING_WORDS = ['コツ', 'こつ', '教えて', 'とは', 'って何', 'ってなに', 'どうすれ', 'ポイント', 'アドバイス', 'ヒント', '?'];
const BG_INTENT = ['背景', 'バック', '場所', '景色', '舞台', 'ステージ', '空間'];
const has = (n, words) => words.find((w) => n.includes(normalize(w)));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function parseCommand(input, rand = pick, ctx = {}) {
  const raw = input.trim();
  const n = normalize(raw);
  const actions = [];
  const lines = [];
  if (!n) return { actions, lines: ['なにか話しかけてね♡'] };

  if (has(n, ['ヘルプ', '使い方', 'できること', '何ができ', 'つかいかた'])) {
    return {
      actions,
      lines: ['「ガーリーにして」「ピースして」「夜の背景」「笑って」みたいに話しかけてね！ 「デートっぽく」「秋っぽく」の気分指定や、「ViViのトレンドは？」「抜け感のコツは？」「今のコーデのポイントは？」「おすすめは？」も答えるよ♪'],
    };
  }

  if (has(n, ['リセット', '最初から', 'はじめから'])) {
    actions.push({ type: 'reset' });
    return { actions, lines: ['ぜんぶ最初のスタイルに戻したよ！'] };
  }

  if (has(n, ['ランダム', 'おまかせ', 'お任せ'])) {
    const outfit = rand(OUTFITS).id;
    const pose = rand(POSES).id;
    const bg = rand(BACKGROUNDS).id;
    actions.push({ type: 'outfit', id: outfit }, { type: 'pose', id: pose }, { type: 'bg', id: bg });
    return {
      actions,
      lines: [`おまかせ！ ${getOutfit(outfit).name}の服で、${getPose(pose).name}、背景は${getBackground(bg).name}にしてみたよ♡`],
    };
  }

  const bgIntent = BG_INTENT.some((w) => n.includes(normalize(w)));

  // Background
  for (const rule of BG_RULES) {
    const hit = has(n, bgIntent ? rule.words : rule.strong ?? []);
    if (hit) {
      actions.push({ type: 'bg', id: rule.id });
      lines.push(`背景を「${getBackground(rule.id).name}」にチェンジ！`);
      break;
    }
  }

  // Expression: its phrase is removed so "クールな顔" is not read as the CITY MODE outfit
  let rest = n;
  for (const e of EXPRESSIONS) {
    const hit = has(rest, e.keywords);
    if (hit) {
      actions.push({ type: 'expression', id: e.id });
      lines.push(`「${getExpression(e.id).name}」の表情にしたよ！`);
      rest = rest.replace(normalize(hit), '');
      break;
    }
  }

  // Styling questions ("差し色のコツは？") get advice instead of an outfit change
  if (has(rest, ASKING_WORDS)) {
    const topic = TOPICS.find((t) => has(rest, t.words));
    if (topic) {
      lines.push(topicAnswer(topic, () => Math.random()));
      return { actions, lines };
    }
  }

  // Outfit (ambiguous words belong to the background when a background intent is present)
  for (const rule of OUTFIT_RULES) {
    const words = rule.words.filter((w) => !(bgIntent && rule.ambiguous?.includes(w)));
    if (has(rest, words)) {
      actions.push({ type: 'outfit', id: rule.id });
      lines.push(STYLE_RULES[rule.id]?.reply ?? `${getOutfit(rule.id).name}コーデに着替えたよ！ どう？`);
      break;
    }
  }

  // Mood / occasion -> outfit (only when no explicit outfit was requested)
  if (!actions.some((x) => x.type === 'outfit')) {
    const scene = SCENES.find((sc) => has(rest, sc.words));
    if (scene && !bgIntent) {
      actions.push({ type: 'outfit', id: scene.outfit });
      lines.push(scene.reply);
    }
  }

  // Pose (skip "ランウェイ" when it is a background request)
  for (const rule of POSE_RULES) {
    const words = rule.words.filter((w) => !(bgIntent && w === 'ランウェイ'));
    if (has(rest, words)) {
      actions.push({ type: 'pose', id: rule.id });
      lines.push(`「${getPose(rule.id).name}」のポーズ、決めるね！`);
      break;
    }
  }

  if (has(n, ['回転', '回って', 'くるくる', 'まわって', 'ぐるぐる'])) {
    const stop = has(n, ['止め', 'とめ', 'ストップ', 'やめ']);
    actions.push({ type: 'spin', value: !stop });
    lines.push(stop ? '回転ストップ！' : 'くるくる〜♪ 360°チェックしてね！');
  }

  // ViVi advice: explain the current look, recommend one, or answer a styling topic
  if (!actions.length) {
    if (has(rest, EXPLAIN_WORDS)) {
      lines.push(explainOutfit(ctx.outfit));
    } else if (has(rest, ADVICE_WORDS)) {
      const id = rand(STYLE_IDS.filter((x) => x !== ctx.outfit));
      actions.push({ type: 'outfit', id });
      lines.push(`ViViの4大K-COREならこれ！ ${STYLE_RULES[id].reply}`);
    } else {
      const topic = TOPICS.find((t) => has(rest, t.words));
      if (topic) lines.push(topicAnswer(topic, () => Math.random()));
    }
  }

  let unknown = false;
  if (!actions.length && !lines.length) {
    if (has(n, ['ありがとう', 'ありがと', 'さんきゅ'])) lines.push('えへへ、うれしい♡ ほかのコーデも試してみて！');
    else if (has(n, ['名前', 'だれ', '誰', '自己紹介'])) lines.push('AIRA、20歳のバーチャルモデルだよ。ファッションが大好き！ よろしくね♡');
    else if (has(n, ['おはよう', 'こんばんは'])) lines.push('やっほー！ 今日はどんなコーデにする？');
    else {
      unknown = true;
      lines.push('うーん、まだ分からないみたい…。「ガーリーにして」「ピースして」「夜の背景」みたいに言ってみてね！');
    }
  }

  return { actions, lines, unknown };
}
