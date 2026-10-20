// Outfit definitions. The procedural avatar reads these; a GLB avatar toggles
// nodes named `<outfitId>_*` (see README).
export const OUTFITS = [
  {
    id: 'street',
    name: 'ストリート',
    en: 'STREET',
    desc: 'クロップド×カーゴ×厚底スニーカー',
    swatch: ['#1c1c22', '#8d8f99', '#ff4fa3'],
    top: { type: 'crop', color: '#1d1d24', accent: '#c9ccd6' },
    bottom: { type: 'cargo', color: '#3a3b44', accent: '#c9ccd6' },
    shoes: { type: 'sneaker', upper: '#f4f4f8', sole: '#ff4fa3', accent: '#1d1d24' },
    sleeve: 'none',
    extras: ['chain', 'hoops'],
  },
  {
    id: 'girly',
    name: 'ガーリー',
    en: 'GIRLY',
    desc: 'フリルトップス×プリーツスカート',
    swatch: ['#ffb3d6', '#ffffff', '#ff4fa3'],
    top: { type: 'frill', color: '#ffc2dd', accent: '#ffffff' },
    bottom: { type: 'skirt', color: '#ff7fbc', accent: '#ffffff' },
    shoes: { type: 'maryjane', upper: '#26202b', sole: '#ffd6ea', accent: '#c9ccd6' },
    sleeve: 'puff',
    socks: '#ffffff',
    extras: ['ribbon', 'hoops'],
  },
  {
    id: 'mode',
    name: 'モード',
    en: 'MODE',
    desc: 'ロングコート×シルバーパンツ',
    swatch: ['#0f0f14', '#c9ccd6', '#ff4fa3'],
    top: { type: 'bodysuit', color: '#15151b', accent: '#c9ccd6' },
    bottom: { type: 'slim', color: '#b9bcc8', accent: '#ffffff' },
    shoes: { type: 'boot', upper: '#15151b', sole: '#c9ccd6', accent: '#ff4fa3' },
    sleeve: 'long',
    coat: { color: '#17171e', accent: '#ff4fa3' },
    extras: ['choker', 'glasses', 'hoops'],
  },
];

export const DEFAULT_OUTFIT = 'street';
export const getOutfit = (id) => OUTFITS.find((o) => o.id === id) ?? OUTFITS[0];
