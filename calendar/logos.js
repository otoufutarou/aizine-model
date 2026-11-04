// 架空10誌のロゴ（文字＋SVGだけで作った簡易ワードマーク）。色は currentColor / --mc に従う。
const svg = (d, extra = '') => `<svg class="mk" viewBox="0 0 24 24" ${extra} aria-hidden="true">${d}</svg>`;

const MARKS = {
  lumi: `<span class="ml-t">Lumi</span>${svg('<circle cx="12" cy="12" r="4.2" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></g>')}`,
  petale: `${svg('<g fill="currentColor"><ellipse cx="12" cy="6.5" rx="3" ry="5"/><ellipse cx="12" cy="6.5" rx="3" ry="5" transform="rotate(72 12 12)"/><ellipse cx="12" cy="6.5" rx="3" ry="5" transform="rotate(144 12 12)"/><ellipse cx="12" cy="6.5" rx="3" ry="5" transform="rotate(216 12 12)"/><ellipse cx="12" cy="6.5" rx="3" ry="5" transform="rotate(288 12 12)"/></g>')}<span class="ml-t">Pétale</span>`,
  soto: `${svg('<path d="M1 20L9 6l4 7 3-4 7 11z" fill="currentColor"/>')}<span class="ml-t">SOTO</span>`,
  passage: `<span class="ml-t">PASSAGE</span>`,
  umami: `<span class="ml-t">UMAMI</span><span class="ml-n">note</span>`,
  hako: `<span class="ml-t">HAKO</span>`,
  margin: `<span class="ml-t">Marginalia</span>`,
  hanger: `<span class="ml-t">HANGER</span>`,
  soak: `<span class="ml-t">ととのい</span>${svg('<path d="M2 14c3-4 5 4 8 0s5 4 8 0 3 2 4 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>')}`,
  tsutsumi: `${svg('<path d="M12 12c-3-5-9-5-9-1s6 4 9 1zM12 12c3-5 9-5 9-1s-6 4-9 1zM12 12l-4 9M12 12l4 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>')}<span class="ml-t">Tsutsumi</span>`,
};

// font-size は親の指定に従う（em 基準）
export const logo = (magId) => `<span class="ml ml-${magId}">${MARKS[magId] || ''}</span>`;
// カードの上端に付くタブ
export const logoTab = (magId, color) => `<span class="mtag" style="--mc:${color}">${logo(magId)}</span>`;
