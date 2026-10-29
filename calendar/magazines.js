// 架空の雑誌10誌（デモ用）。実在の雑誌・出版社とは無関係。
// font: 誌名ロゴの書体 / c: 誌のテーマ色 / bg: 写真まわりの淡い色
export const MAGS = {
  lumi:   { name: 'LUMI',      kana: 'ルミ',       genre: 'ライフスタイル', tag: '暮らしを、ほんの少し明るく。', c: '#e8a317', bg: '#fff4d6', font: 'serif', emoji: '🕯️', domain: 'lumi-mag.example' },
  petale: { name: 'Pétale',    kana: 'ペタル',     genre: '美容',           tag: '肌と気分を、ととのえる。',     c: '#d6457f', bg: '#ffe3ee', font: 'serif', emoji: '🌸', domain: 'petale-beauty.example' },
  soto:   { name: 'SOTO',      kana: 'ソト',       genre: 'アウトドア',     tag: '外で過ごす時間が、いちばん長い。', c: '#2f8f5b', bg: '#dff5e6', font: 'sans',  emoji: '🏕️', domain: 'soto-outdoor.example' },
  passage:{ name: 'Passage',   kana: 'パッサージュ', genre: '旅行',         tag: '次の週末を、旅にする。',       c: '#2b7fc4', bg: '#dcedfb', font: 'serif', emoji: '🧳', domain: 'passage-travel.example' },
  umami:  { name: 'UMAMI note', kana: 'ウマミノート', genre: '食',          tag: '一皿の理由を、書きとめる。',   c: '#d9531e', bg: '#ffe6d9', font: 'sans',  emoji: '🍴', domain: 'umami-note.example' },
  hako:   { name: 'HAKO',      kana: 'ハコ',       genre: '建物・建築',     tag: '街の箱を、歩いて読む。',       c: '#5a6b7b', bg: '#e6ebf0', font: 'mono',  emoji: '🏛️', domain: 'hako-arch.example' },
  margin: { name: 'Marginalia', kana: 'マージナリア', genre: 'カルチャー',   tag: '本と映画と、ページの余白。',   c: '#7a4fb8', bg: '#eee5fa', font: 'serif', emoji: '🎞️', domain: 'marginalia.example' },
  hanger: { name: 'Hanger',    kana: 'ハンガー',   genre: 'ファッション',   tag: '一着で、街の見え方が変わる。', c: '#1f1f1f', bg: '#ececec', font: 'sans',  emoji: '👕', domain: 'hanger-style.example' },
  soak:   { name: 'ととのい',   kana: 'ととのい',   genre: 'ウェルネス',     tag: '湯と休息の、小さな習慣。',     c: '#0f9aa8', bg: '#d9f4f6', font: 'rounded', emoji: '♨️', domain: 'totonoi.example' },
  tsutsumi:{ name: 'Tsutsumi', kana: 'ツツミ',     genre: 'ギフト',         tag: '包みひとつで、気持ちが届く。', c: '#c0392b', bg: '#fbe0dd', font: 'serif', emoji: '🎀', domain: 'tsutsumi-gift.example' },
};

// 記事id → [誌, 形式(print=誌面 / web=WEB記事), 発行/公開の日付ラベル]
export const ASSIGN = {
  a01: ['umami', 'web', '2026.10.04'], a02: ['margin', 'print', '2026年11月号'], a03: ['hanger', 'print', '2026年11月号'],
  a04: ['soto', 'web', '2026.10.12'], a05: ['petale', 'print', '2026年11月号'], a06: ['petale', 'web', '2026.10.19'],
  a07: ['umami', 'print', '2026年10月号'], a08: ['umami', 'web', '2026.09.27'], a09: ['umami', 'print', '2026年11月号'],
  a10: ['margin', 'web', '2026.10.08'], a11: ['soak', 'print', '2026年11月号'], a12: ['hako', 'print', '2026年10月号'],
  e01: ['lumi', 'web', '2026.10.15'], e02: ['soto', 'web', '2026.10.21'], e03: ['umami', 'web', '2026.10.23'],
  g01: ['tsutsumi', 'print', '2026年11月号'], g02: ['tsutsumi', 'web', '2026.10.02'], g03: ['tsutsumi', 'print', '2026年10月号'],
  g04: ['petale', 'web', '2026.10.10'], g05: ['tsutsumi', 'web', '2026.10.16'],
  b01: ['soto', 'print', '2026年夏号'], b02: ['soto', 'web', '2026.07.18'], b03: ['petale', 'print', '2026年夏号'],
  t01: ['passage', 'print', '2026年11月号'], t02: ['passage', 'web', '2026.10.06'], t03: ['passage', 'web', '2026.10.14'],
  d01: ['lumi', 'print', '2026年11月号'], d02: ['lumi', 'web', '2026.10.11'], d03: ['hako', 'web', '2026.10.20'],
};

export const FORMAT_NAME = { print: '誌面', web: 'WEB記事' };

// 記事冒頭から最大2文を「引用文」として返す
export function quoteOf(text) {
  const ss = (text || '').match(/[^。！？]*[。！？]/g) || [text || ''];
  let q = ss[0];
  if (q.length < 24 && ss[1]) q += ss[1];
  return q;
}
