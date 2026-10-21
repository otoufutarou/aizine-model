// ViVi 2026 styling knowledge for the in-browser chat (no external AI).
// Short paraphrased notes from the four reference articles in styleRules.js SOURCES; no article text or brand names are copied.
// Chat intent order: explicit outfit words > SCENES (mood/occasion -> outfit) > TOPICS (advice only) > fallback.

import { STYLE_RULES } from './styleRules.js';

export const TOPICS = [
  {
    id: 'overview',
    words: ['vivi', 'ビビ', 'トレンド', '流行', '今年', '最新', 'はやり', '韓国ファッション', 'k-core', 'kcore'],
    answers: [
      'ViViの今年のキーワードは4大K-CORE！ 都会的なシティオンニ、Y2K日本ギャル、甘いレトロドリーム、ハイテクなスポーツMIXだよ。AIRAは「Kストリート・ネオギャル・スポーツMIX・シティモード」で着られるよ♪',
      '今の気分は「ゆる×甘」と「抜け感」。きっちり決めすぎず、どこかをラフに外すのがViVi流だよ。気になる系統を言ってくれたらコーデするね！',
    ],
  },
  {
    id: 'balance',
    words: ['抜け感', 'こなれ', 'バランス', 'おしゃれに見え', '垢抜け', 'あかぬけ', '上級者'],
    answers: [
      '抜け感のコツは「きちんとアイテムを1か所だけラフに外す」こと。でかジャケにはワイドパンツ、タイトな半端丈、色シャツをちら見せ…みたいにね！ シティモードがお手本だよ。',
      '甘いアイテムにはスポーティなスニーカーで外すと、頑張りすぎてない可愛さになるよ♡',
    ],
  },
  {
    id: 'bag',
    words: ['バッグ', 'かばん', 'チャーム', 'キーホルダー', 'ぬいぐるみ', '相棒'],
    answers: [
      'ViViのスナップでは「バッグに相棒キャラを付ける」のが当たり前！ 一人1キャラの時代だよ。KストリートはアイスブルーのバッグにイエローのチャームをAIRAも付けてるよ。',
      'コーデの主役はバッグ1点でもOK。シティモードの差し色オレンジのバッグみたいに、色はそこだけに効かせるとおしゃれ！',
    ],
  },
  {
    id: 'layer',
    words: ['レイヤード', '重ね', '腰巻', '腰回り', '腰まわり', 'ウエスト'],
    answers: [
      '今は腰回りに何か重ねるのがブーム！ スウェットやスカーフを巻くだけでこなれるよ。スポーツMIXの腰巻きがそれ♪ ごちゃつかないように無地を1枚はさむのがコツ。',
      '甘いものは全部重ねるのがレトロドリーム流。パールのネックレスを2連、3連にするのも可愛いよ。',
    ],
  },
  {
    id: 'accent',
    words: ['差し色', '色合わせ', '配色', '色味', 'カラー', '色の'],
    answers: [
      '色は「ベース + 差し色1〜2色」が基本。ネオギャルは黒×ホットピンク、シティモードはブラウン×ビビッドオレンジ、Kストリートは白×アイスブルーだよ。',
      '秋は淡いピンクをダークブラウンでタイトに合わせると一気に今っぽくなるよ。',
    ],
  },
  {
    id: 'shoes',
    words: ['靴', 'くつ', '足元', 'シューズ'],
    answers: [
      '足元は大きめの厚底が気分！ KストリートとスポーツMIXは厚底スニーカー、ネオギャルは脚長ブーツだよ。ブーツのブラウンを差し色にするのも秋っぽい！',
    ],
  },
  {
    id: 'hat',
    words: ['帽子', 'ぼうし', 'ハット', 'ビーニー', 'ニット帽'],
    answers: [
      '帽子は「主役級の相棒」。ファーハットは暗くなりがちなコーデを一気に華やかにしてくれるよ。AIRAは耳付きビーニーがトレードマークで、Kストリートで一番目立つよ♪',
    ],
  },
];

// A mood / occasion maps to one of the four ViVi lines or the classic looks.
export const SCENES = [
  { words: ['ゆめかわ', 'レトロ', 'ドリーム', '甘い', '甘め', 'ゆる甘', 'ロマンティック', 'ふんわり'], outfit: 'girly', reply: 'ゆる甘レトロドリームの気分だね♡ フリルとリボンのガーリーにしたよ。足元はスニーカーで甘さを引き算するのがViVi流！' },
  { words: ['デート', 'お出かけ', 'おでかけ', 'ランチ'], outfit: 'girly', reply: 'デートならやさしい甘さのガーリーで決まり♡ ふわっとかわいくしてみたよ！' },
  { words: ['ライブ', 'フェス', '推し', 'アイドル', 'ヲタ活', 'おたく'], outfit: 'kstreet', reply: '推し活ならKストリート！ 動きやすいバギーと厚底、耳付き帽子でライブ映えするよ♪' },
  { words: ['オフィス', '仕事', '会社', '就活', 'きれいめ', '上品', '大人っぽ', '都会'], outfit: 'city', reply: '大人っぽくならシティモード！ でかジャケに差し色バッグ1点で、都会的なこなれ感を出したよ。' },
  { words: ['秋', '冬', '寒い', 'あったか'], outfit: 'city', reply: '秋冬はシティモード！ オーバーサイズのジャケットでシルエットに余裕を出すのが今っぽいよ。' },
  { words: ['運動', 'ジム', 'ヨガ', 'ランニング', '動きやすい', 'アクティブ', '体育'], outfit: 'sporty', reply: 'アクティブな日はスポーツMIX！ シャカシャカ素材で動きやすくて、腰巻きでおしゃれも忘れないよ♪' },
  { words: ['盛りたい', '盛れ', 'めっちゃ盛', 'パーティ', 'クラブ', 'ぱーりー', '誕生日'], outfit: 'gyaru', reply: '今日は盛っちゃおう！ ネオギャルにチェンジ♡ ピンク小物でちゃんと目立つよ。' },
];

const pickFrom = (arr, rand) => arr[Math.floor(rand() * arr.length)] ?? arr[0];

// "今のコーデのポイントは？" - explains the current look from its style rule.
const CLASSIC = {
  street: '今はストリート！ ポイントは短丈トップス×カーゴ×厚底スニーカーで、下に重心を置いたラフなバランスだよ。',
  girly: '今はガーリー！ ポイントはフリルとリボンの甘さ。ViViのレトロドリーム流に、足元は厚底スニーカーで甘さを引き算するともっと今っぽいよ。',
  mode: '今はモード！ ポイントはブラック×シルバーでまとめた大人っぽさ。差し色を1点だけ足すと、ViViのシティオンニ風になるよ。',
};

export function explainOutfit(outfitId) {
  const r = STYLE_RULES[outfitId];
  if (!r) return CLASSIC[outfitId] ?? '今のコーデはAIRAの定番スタイルだよ。「Kストリート」「ネオギャル」「スポーツMIX」「シティモード」にも着替えられるよ！';
  return `今は${r.name}（${r.ja}）！ ポイントは「${r.mood}」。シルエットは${r.silhouette}。色は${r.palette.base.join('・')}をベースに、${r.palette.accent.join('・')}を差し色にしてるよ。`;
}

export const EXPLAIN_WORDS = ['ポイント', 'こだわり', 'このコーデ', '今のコーデ', '今の服', '解説', '説明して', 'どういうコーデ', 'どんなコーデ'];
export const ADVICE_WORDS = ['おすすめ', 'オススメ', 'お勧め', '何着', 'なに着', 'どれがいい', '迷', 'コーデ考えて', 'コーデして'];
export const STYLE_WORDS = ['コツ', 'こつ', '教えて', 'アドバイス', 'ヒント', 'どうすれば'];

export function topicAnswer(topic, rand = Math.random) {
  return pickFrom(topic.answers, rand);
}
