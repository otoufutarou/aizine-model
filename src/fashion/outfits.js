// Outfit definitions, split into the five slots: hat / top / bottom / shoes / accessories.
// The procedural avatar reads these; a GLB avatar toggles nodes named `<outfitId>_*` (see README).
// The four trend style lines (STYLE_OUTFITS) must satisfy src/fashion/styleRules.js.
import { STYLE_RULES } from './styleRules.js';

const HAT_ICE = { palette: ['#f9d54a', '#fbe27a', '#fff0b0', '#f7c630'], pink: '#9fd8f5' };

export const STYLE_OUTFITS = [
  {
    id: 'kstreet',
    name: STYLE_RULES.kstreet.name,
    en: 'K-POP STREET',
    desc: 'クロップドトップス×極太バギーデニム×厚底スニーカー×耳付き帽子',
    swatch: ['#ffffff', '#7fa6d8', '#9fd8f5'],
    hat: { type: 'beanie', ...HAT_ICE, ears: true, ear: '#fbe38a', earIn: '#ff8fae' },
    top: { type: 'crop', color: '#ffffff', accent: '#9fd8f5', emblem: 'AIRA', emblemColor: '#ff5f9a' },
    sleeve: 'short',
    bottom: { type: 'baggy', color: '#7fa6d8', light: '#a9c6ea', accent: '#ffffff' },
    shoes: { type: 'sneaker', sole: '#ffffff', upper: '#fdfdfd', accent: '#9fd8f5' },
    accessories: [{ type: 'bag', color: '#9fe0f6', charm: '#ffcf3f' }],
  },
  {
    id: 'gyaru',
    name: STYLE_RULES.gyaru.name,
    en: 'Y2K GYARU',
    desc: 'ミニスカート×ショート丈ジャケット×厚底ブーツ×ピンク小物',
    swatch: ['#18181d', '#ff5fa5', '#ffd1e6'],
    hat: { type: 'beanie', palette: ['#ff7fb8', '#ffb5d6', '#ffe3ef', '#ff5fa5'], pink: '#ffffff', ears: true, ear: '#ffb5d6', earIn: '#ff4fa3' },
    top: { type: 'shortJacket', color: '#18181d', accent: '#ff4fa3', inner: '#ffd1e6' },
    sleeve: 'jacket',
    bottom: { type: 'mini', color: '#ff5fa5', light: '#ffa5cd', accent: '#18181d' },
    shoes: { type: 'boot', sole: '#ffe0ee', upper: '#18181d', accent: '#ff4fa3' },
    accessories: [
      { type: 'heart', color: '#ff3d93' },
      { type: 'clip', color: '#ff4fa3' },
      { type: 'choker', color: '#ff4fa3' },
      { type: 'bagCharm', color: '#ffb3d6' },
    ],
  },
  {
    id: 'sporty',
    name: STYLE_RULES.sporty.name,
    en: 'SPORTY MIX',
    desc: 'トラックジャケット×パラシュートパンツ×スポーツ小物',
    swatch: ['#c8ccd8', '#23242c', '#ff4fa3'],
    hat: { type: 'beanie', palette: ['#2c3a57', '#ffffff', '#dfe3ec', '#ff4fa3'], pink: '#ff4fa3', ears: true, ear: '#dfe3ec', earIn: '#ff4fa3' },
    top: { type: 'track', color: '#c8ccd8', accent: '#ff4fa3', inner: '#18181d' },
    sleeve: 'track',
    bottom: { type: 'parachute', color: '#23242c', light: '#8a8ea0', accent: '#ff4fa3' },
    shoes: { type: 'sneaker', sole: '#ffffff', upper: '#c9ccd6', accent: '#ff4fa3' },
    accessories: [
      { type: 'wristband', color: '#ff4fa3' },
      { type: 'waistWrap', color: '#3a4a6e' },
    ],
  },
  {
    id: 'city',
    name: STYLE_RULES.city.name,
    en: 'CITY ONNI',
    desc: 'オーバーサイズジャケット×ワイドデニム×差し色バッグ',
    swatch: ['#7a5a3c', '#4d6690', '#ff8a1f'],
    hat: { type: 'beanie', palette: ['#8a6b4a', '#a98563', '#c9a982', '#5a4332'], pink: '#ff8a1f', ears: false, ear: '#8a6b4a', earIn: '#ff8a1f' },
    top: { type: 'oversize', color: '#7a5a3c', accent: '#c9a982', inner: '#ffffff' },
    sleeve: 'oversize',
    bottom: { type: 'wide', color: '#4d6690', light: '#6f89b4', accent: '#e8d7b0' },
    shoes: { type: 'sneaker', sole: '#ede6d8', upper: '#2b2b30', accent: '#ff8a1f' },
    accessories: [{ type: 'bag', color: '#ff8a1f' }],
  },
];

// Original three looks, kept as-is.
export const CLASSIC_OUTFITS = [
  {
    id: 'street',
    name: 'ストリート',
    en: 'STREET',
    desc: 'クロップドカーディガン×水色カーゴ×厚底スニーカー',
    swatch: ['#f5e9df', '#8db7e3', '#fadb55'],
    hat: { palette: ['#f9d54a', '#fbe27a', '#fff0b0', '#f7c630'], pink: '#ff9fb8', ear: '#fbe38a', earIn: '#ff8fae' },
    top: { type: 'cardigan', color: '#f5e9df', accent: '#e3d3c4', emblem: 'AIRA', emblemColor: '#ff5f9a' },
    sleeve: 'wide',
    bottom: { type: 'cargo', color: '#8db7e3', light: '#b6d2ee', accent: '#ff6fa3' },
    shoes: { sole: '#f2e4d0', upper: '#fadb55', accent: '#ff6fa3' },
    accessories: [],
  },
  {
    id: 'girly',
    name: 'ガーリー',
    en: 'GIRLY',
    desc: 'フリルトップス×プリーツスカート',
    swatch: ['#ffd6e8', '#ff8cc0', '#ffffff'],
    hat: { palette: ['#ffc2dd', '#ffd9ea', '#fff0f6', '#ffb0d2'], pink: '#ff7fb0', ear: '#ffd0e4', earIn: '#ff7fb0' },
    top: { type: 'frill', color: '#ffd6e8', accent: '#ffffff' },
    sleeve: 'puff',
    bottom: { type: 'skirt', color: '#ff8cc0', light: '#ffb3d6', accent: '#ffffff' },
    socks: '#ffffff',
    shoes: { sole: '#ffffff', upper: '#ffb3d6', accent: '#ff4fa3' },
    accessories: [{ type: 'ribbon' }],
  },
  {
    id: 'mode',
    name: 'モード',
    en: 'MODE',
    desc: 'ロングコート×シルバーパンツ',
    swatch: ['#17171d', '#c9ccd6', '#ff4fa3'],
    hat: { palette: ['#2b2b34', '#3a3a46', '#4a4a58', '#c9ccd6'], pink: '#ff4fa3', ear: '#3a3a46', earIn: '#ff4fa3' },
    top: { type: 'bodysuit', color: '#17171d', accent: '#c9ccd6' },
    sleeve: 'coat',
    bottom: { type: 'slim', color: '#b9bcc8', light: '#d9dbe6', accent: '#ffffff' },
    shoes: { sole: '#c9ccd6', upper: '#17171d', accent: '#ff4fa3' },
    coat: { color: '#1d1d25', accent: '#ff4fa3' },
    accessories: [{ type: 'choker', color: '#ff4fa3' }],
  },
];

export const OUTFITS = [...STYLE_OUTFITS, ...CLASSIC_OUTFITS];
export const DEFAULT_OUTFIT = 'kstreet';
export const getOutfit = (id) => OUTFITS.find((o) => o.id === id) ?? OUTFITS[0];
export const getAccessory = (outfit, type) => outfit.accessories.find((a) => a.type === type);
