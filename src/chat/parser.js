import { OUTFITS, getOutfit } from '../data/outfits.js';
import { STYLE_IDS, STYLE_RULES } from '../fashion/styleRules.js';
import { POSES, getPose } from '../data/poses.js';
import { EXPRESSIONS, getExpression } from '../avatar/expressions.js';
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

const BG_INTENT = ['背景', 'バック', '場所', '景色', '舞台', 'ステージ', '空間'];
const has = (n, words) => words.find((w) => n.includes(normalize(w)));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function parseCommand(input, rand = pick) {
  const raw = input.trim();
  const n = normalize(raw);
  const actions = [];
  const lines = [];
  if (!n) return { actions, lines: ['なにか話しかけてね♡'] };

  if (has(n, ['ヘルプ', '使い方', 'できること', '何ができ', 'つかいかた'])) {
    return {
      actions,
      lines: ['「ガーリーにして」「ピースして」「夜の背景」みたいに話しかけてね！ 「おまかせ」「くるくる回って」「リセット」も使えるよ♪'],
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

  // Outfit (ambiguous words belong to the background when a background intent is present)
  for (const rule of OUTFIT_RULES) {
    const words = rule.words.filter((w) => !(bgIntent && rule.ambiguous?.includes(w)));
    if (has(rest, words)) {
      actions.push({ type: 'outfit', id: rule.id });
      lines.push(STYLE_RULES[rule.id]?.reply ?? `${getOutfit(rule.id).name}コーデに着替えたよ！ どう？`);
      break;
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

  if (!actions.length) {
    if (has(n, ['ありがとう', 'ありがと', 'さんきゅ'])) lines.push('えへへ、うれしい♡ ほかのコーデも試してみて！');
    else if (has(n, ['名前', 'だれ', '誰', '自己紹介'])) lines.push('AIRA、20歳のバーチャルモデルだよ。ファッションが大好き！ よろしくね♡');
    else if (has(n, ['おはよう', 'こんばんは'])) lines.push('やっほー！ 今日はどんなコーデにする？');
    else lines.push('うーん、まだ分からないみたい…。「ガーリーにして」「ピースして」「夜の背景」みたいに言ってみてね！');
  }

  return { actions, lines };
}
