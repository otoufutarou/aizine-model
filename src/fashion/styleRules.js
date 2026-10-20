// Styling rules for AIRA's four ViVi-inspired style lines.
// Rules are data only: outfits.js must satisfy them (checked by validateOutfit + tests),
// and the chat parser reads `keywords` from here. See docs/AIRA_FASHION_GUIDE.md.

export const SLOTS = ['hat', 'top', 'bottom', 'shoes', 'accessories'];

export const SOURCES = {
  kbrand: { url: 'https://www.vivi.tv/post493932/', note: 'K-BRAND特集（馬蹄バッグ、ファーハット、ヘルシーぎゃる）' },
  kcore: { url: 'https://www.vivi.tv/post493390/', note: '4大K-CORE（シティオンニ／Y2K日本ギャル／レトロドリーム／スポーツMIX）' },
  offrunway: { url: 'https://www.vivi.tv/post491428/', note: 'オフランウェイHOT LIST（でかジャケ×ジャージ、シャカシャカ、手袋）' },
  snap: { url: 'https://www.vivi.tv/post481674/', note: 'ビビッとストリート（バッグ相棒、腰回りレイヤード）' },
};

export const STYLE_RULES = {
  kstreet: {
    id: 'kstreet',
    name: 'K-STREET',
    ja: 'Kストリート',
    keywords: ['kストリート', 'k-street', 'kstreet', '韓国', 'k-pop', 'kpop', 'バギー', '猫耳', '耳付き', '耳つき'],
    mood: 'ゆるいのに主役感。ボリュームボトム×短いトップスで体のラインにメリハリ。',
    silhouette: '短丈トップス + 極太バギー + 大きな厚底（下に重心）',
    allowed: {
      hat: ['beanie'],
      top: ['crop'],
      bottom: ['baggy'],
      shoes: ['sneaker'],
    },
    requires: { hatEars: true, accessories: ['bag'] },
    palette: { base: ['白', '淡いデニムブルー'], accent: ['アイスブルー', 'イエロー', 'ピンク'] },
    sources: ['kbrand', 'snap'],
    reply: 'Kストリートに着替えたよ！ バギーデニムと厚底でゆるっと決めてみた♪',
  },
  gyaru: {
    id: 'gyaru',
    name: 'NEO GYARU',
    ja: 'ネオギャル',
    keywords: ['ネオギャル', 'ギャル', 'y2k', 'ミニスカ', 'ミニスカート', '厚底ブーツ', 'ブーツ'],
    mood: 'Y2Kの盛りを今っぽく。甘辛、ピンクは小物で効かせる。',
    silhouette: '超ミニ + ショート丈ジャケット + 脚長に見せる厚底ブーツ',
    allowed: {
      hat: ['beanie'],
      top: ['shortJacket'],
      bottom: ['mini'],
      shoes: ['boot'],
    },
    requires: { accessories: ['heart', 'clip', 'choker', 'bagCharm'] },
    palette: { base: ['黒', 'ホワイト'], accent: ['ホットピンク', 'ベビーピンク'] },
    sources: ['kcore', 'snap'],
    reply: 'ネオギャルにチェンジ！ ピンク小物でちゃんと盛ってきたよ♡',
  },
  sporty: {
    id: 'sporty',
    name: 'SPORTY MIX',
    ja: 'スポーツMIX',
    keywords: ['スポーツmix', 'スポーツミックス', 'スポーツ', 'スポーティ', 'トラックジャケット', 'ジャージ', 'パラシュート', 'シャカシャカ'],
    mood: 'ハイテク素材のシャカシャカ。スポーツ小物と腰巻きでレイヤード。',
    silhouette: '光沢トラックジャケット + 膝が膨らみ裾が絞れるパラシュートパンツ',
    allowed: {
      hat: ['beanie'],
      top: ['track'],
      bottom: ['parachute'],
      shoes: ['sneaker'],
    },
    requires: { accessories: ['wristband', 'waistWrap'] },
    palette: { base: ['シルバーグレー', 'ブラック'], accent: ['ネオンピンク', 'ホワイト'] },
    sources: ['kcore', 'offrunway', 'snap'],
    reply: 'スポーツMIXに着替えたよ！ シャカシャカ素材で動きやすい♪',
  },
  city: {
    id: 'city',
    name: 'CITY MODE',
    ja: 'シティモード',
    keywords: ['シティモード', 'シティ', 'オンニ', '都会', 'オーバーサイズ', 'でかジャケ', 'ワイドデニム', '差し色', 'きれいめ'],
    mood: '都会的でこなれた抜け感。大きいジャケットに細いインナー、差し色バッグ1点。',
    silhouette: '腰まであるオーバーサイズジャケット + ストレートのワイドデニム',
    allowed: {
      hat: ['beanie'],
      top: ['oversize'],
      bottom: ['wide'],
      shoes: ['sneaker'],
    },
    requires: { accessories: ['bag'] },
    palette: { base: ['ブラウン', 'ダークデニム', 'ベージュ'], accent: ['ビビッドオレンジ', 'ブルー'] },
    sources: ['offrunway', 'kcore'],
    reply: 'シティモードにしたよ。大人っぽく、差し色バッグだけ主役にしてみた！',
  },
};

export const STYLE_IDS = Object.keys(STYLE_RULES);

// Returns a list of human-readable problems; empty means the outfit follows its style's rules.
export function validateOutfit(outfit) {
  const rule = STYLE_RULES[outfit.id];
  if (!rule) return [`${outfit.id}: no style rule`];
  const issues = [];
  SLOTS.forEach((slot) => {
    if (outfit[slot] === undefined) issues.push(`${outfit.id}: missing slot "${slot}"`);
  });
  ['hat', 'top', 'bottom', 'shoes'].forEach((slot) => {
    const type = outfit[slot]?.type;
    if (!rule.allowed[slot].includes(type)) issues.push(`${outfit.id}: ${slot} type "${type}" not in [${rule.allowed[slot]}]`);
  });
  if (rule.requires.hatEars && outfit.hat?.ears === false) issues.push(`${outfit.id}: hat must have ears`);
  const types = (outfit.accessories ?? []).map((a) => a.type);
  (rule.requires.accessories ?? []).forEach((t) => {
    if (!types.includes(t)) issues.push(`${outfit.id}: missing accessory "${t}"`);
  });
  return issues;
}

// Two styles must not share the same top + bottom pair, so silhouettes stay distinguishable on small screens.
export function findSilhouetteClashes(outfits) {
  const seen = new Map();
  const clashes = [];
  outfits.forEach((o) => {
    const key = `${o.top.type}/${o.bottom.type}`;
    if (seen.has(key)) clashes.push([seen.get(key), o.id]);
    else seen.set(key, o.id);
  });
  return clashes;
}
