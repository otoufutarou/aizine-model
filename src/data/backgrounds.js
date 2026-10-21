export const BACKGROUNDS = [
  {
    id: 'studio',
    name: 'ピンクスタジオ',
    en: 'PINK STUDIO',
    css: 'radial-gradient(circle at 50% 30%, #ffd3e8 0%, #ff8fc4 55%, #e0488f 100%)',
    floor: '#ffe6f1',
    ring: '#ff4fa3',
    swatch: ['#ffd3e8', '#ff4fa3'],
  },
  {
    id: 'night',
    name: 'ネオンナイト',
    en: 'NEON NIGHT',
    css: 'linear-gradient(180deg, #07060d 0%, #1b0f33 55%, #3a1456 100%)',
    floor: '#17131f',
    ring: '#38e8ff',
    swatch: ['#1b0f33', '#38e8ff'],
  },
  {
    id: 'silver',
    name: 'シルバーランウェイ',
    en: 'SILVER RUNWAY',
    css: 'linear-gradient(160deg, #f4f5fa 0%, #b3b6c4 50%, #6d7080 100%)',
    floor: '#d9dbe5',
    ring: '#ff4fa3',
    swatch: ['#f4f5fa', '#6d7080'],
  },
  {
    id: 'dream',
    name: 'ドリームポップ',
    en: 'DREAM POP',
    css: 'linear-gradient(180deg, #2a1b5e 0%, #8a5cf0 50%, #ffa6d5 100%)',
    floor: '#3a2a78',
    ring: '#ffe27a',
    swatch: ['#8a5cf0', '#ffa6d5'],
  },
];

export const DEFAULT_BG = 'studio';
export const getBackground = (id) => BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0];
