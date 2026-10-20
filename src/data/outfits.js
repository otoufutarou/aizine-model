// Outfit definitions for the low-poly AIRA model. The procedural avatar reads these;
// a GLB avatar toggles nodes named `<outfitId>_*` (see README).
export const OUTFITS = [
  {
    id: 'street',
    name: 'ストリート',
    en: 'STREET',
    desc: 'クロップドカーディガン×水色カーゴ×厚底スニーカー',
    swatch: ['#f5e9df', '#8db7e3', '#fadb55'],
    hat: { palette: ['#f9d54a', '#fbe27a', '#fff0b0', '#f7c630'], pink: '#ff9fb8', ear: '#fbe38a', earIn: '#ff8fae' },
    top: { type: 'cardigan', color: '#f5e9df', accent: '#e3d3c4', emblem: 'Vivi', emblemColor: '#ff5f9a' },
    sleeve: 'wide',
    bottom: { type: 'cargo', color: '#8db7e3', light: '#b6d2ee', accent: '#ff6fa3' },
    shoes: { sole: '#f2e4d0', upper: '#fadb55', accent: '#ff6fa3' },
    extras: [],
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
    extras: ['ribbon'],
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
    extras: ['choker'],
  },
];

export const DEFAULT_OUTFIT = 'street';
export const getOutfit = (id) => OUTFITS.find((o) => o.id === id) ?? OUTFITS[0];
