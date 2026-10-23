// 提案エンジン（純粋関数。UI・保存先に依存しない）

export const DAY_START = 9 * 60;
export const DAY_END = 21 * 60;
export const MIN_GAP = 60;
export const AD_EVERY = 4; // コンテンツカード N 枚ごとに広告 1 枚

const pad = (n) => String(n).padStart(2, '0');
export const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
export const toHHMM = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

// 終日扱い（時刻なし）の予定は空き時間計算では一日を埋めるものとして扱う
export function findGaps(dayEvents, { start = DAY_START, end = DAY_END, min = MIN_GAP } = {}) {
  const busy = dayEvents
    .map((e) => (e.start ? [toMin(e.start), e.end ? toMin(e.end) : toMin(e.start) + 60] : [start, end]))
    .sort((a, b) => a[0] - b[0]);
  const gaps = [];
  let cur = start;
  for (const [s, e] of busy) {
    if (s - cur >= min) gaps.push({ start: cur, end: Math.min(s, end) });
    cur = Math.max(cur, e);
  }
  if (end - cur >= min) gaps.push({ start: cur, end });
  return gaps;
}

const MOMENTS = [
  { tag: 'gift', re: /会食|ディナー|ランチ会|お呼ばれ|訪問|挨拶|ホームパーティ|飲み会/ },
  { tag: 'birthday', re: /誕生日|バースデー|記念日/ },
  { tag: 'beach', re: /海|ビーチ|サーフ|BBQ|バーベキュー/ },
  { tag: 'date', re: /デート/ },
  { tag: 'trip', re: /旅行|旅|温泉|帰省/ },
];
export const detectMoments = (title = '') => MOMENTS.filter((m) => m.re.test(title)).map((m) => m.tag);

const score = (item, tags) => item.tags.filter((t) => tags.includes(t)).length;

// variant で同条件の候補をローテーションし、「違う」を押した後に新しい提案を出せるようにする
function pick(archive, { kind, slot, tags = [], exclude = new Set(), variant = 0 }) {
  const pool = archive
    .filter((a) => a.kind === kind && !exclude.has(a.id) && (!slot || a.slot === slot || a.slot === 'any'))
    .map((a) => ({ a, s: score(a, tags) }))
    .sort((x, y) => y.s - x.s || x.a.id.localeCompare(y.a.id));
  if (!pool.length) return null;
  return pool[variant % pool.length].a;
}

const slotOf = (min) => (min < 11 * 60 ? 'morning' : min < 14 * 60 ? 'lunch' : min < 17 * 60 ? 'afternoon' : min < 20 * 60 ? 'evening' : 'night');

function gapCard(date, gap, archive, variant, eventsToday) {
  const slot = slotOf(gap.start + Math.min(60, (gap.end - gap.start) / 2));
  const tags = eventsToday.flatMap((e) => detectMoments(e.title));
  const item = pick(archive, { kind: 'spot', slot, tags, variant, exclude: new Set() });
  if (!item) return null;
  return {
    id: `gap-${dateKey(date)}-${gap.start}-${item.id}`, type: 'gap', date: dateKey(date), item,
    label: `${toHHMM(gap.start)}–${toHHMM(gap.end)} の空き時間`,
    reason: '予定と予定のあいだ、ちょうどいい時間があります。',
  };
}

function dayPlanCard(date, archive, variant) {
  const used = new Set();
  const stops = [];
  for (const [slot, time] of [['morning', 9 * 60 + 30], ['lunch', 12 * 60], ['afternoon', 15 * 60], ['evening', 19 * 60]]) {
    const it = pick(archive, { kind: 'spot', slot, exclude: used, variant });
    if (it) { used.add(it.id); stops.push({ time: toHHMM(time), item: it }); }
  }
  if (!stops.length) return null;
  return {
    id: `plan-${dateKey(date)}-${variant}`, type: 'dayplan', date: dateKey(date), stops,
    label: '一日まるごとプラン', reason: '予定のない日。編集部がまるごと一日を組みました。',
  };
}

function momentCards(date, ev, archive, variant) {
  const out = [];
  const moments = detectMoments(ev.title);
  const make = (kind, tag, reason) => {
    const item = pick(archive, { kind, tags: [tag], variant });
    if (item) out.push({ id: `moment-${ev.id}-${item.id}`, type: 'moment', date: dateKey(date), item, label: `「${ev.title}」に`, reason, eventId: ev.id, tags: item.tags });
  };
  if (moments.includes('gift')) make('gift', 'gift', '手ぶらで行かないための、手土産の提案です。');
  if (moments.includes('birthday')) make('gift', 'birthday', '特別な日に添える贈り物。');
  if (moments.includes('beach')) make('goods', 'beach', '海の日に持っていきたいもの。');
  return out;
}

function farCards(today, events, archive, variant) {
  const target = addDays(today, 60);
  const near = (tag) => events.some((e) => { const d = parseKey(e.date); return detectMoments(e.title).includes(tag) && d >= addDays(today, 45) && d <= addDays(today, 90); });
  const out = [];
  for (const kind of ['trip', 'date']) {
    if (near(kind)) continue;
    const item = pick(archive, { kind, variant });
    if (item) out.push({ id: `far-${kind}-${item.id}`, type: 'far', date: dateKey(target), item, label: kind === 'trip' ? '2か月先の旅行プラン' : '2か月先のデートプラン', reason: '予約が取りやすい今のうちに、先の楽しみを。' });
  }
  return out;
}

export function pickAd(ads, prevTags, seen = new Set(), n = 0) {
  const pool = ads.filter((a) => !seen.has(a.id));
  const list = pool.length ? pool : ads;
  const ranked = [...list].sort((a, b) => score(b, prevTags) - score(a, prevTags) || a.id.localeCompare(b.id));
  return ranked[n % ranked.length] || null;
}

export function injectAds(cards, ads, every = AD_EVERY) {
  const out = [];
  const seen = new Set();
  let content = 0;
  for (const c of cards) {
    out.push(c);
    content++;
    if (content % every === 0) {
      const tags = c.item?.tags || c.stops?.flatMap((s) => s.item.tags) || [];
      const ad = pickAd(ads, tags, seen, content / every);
      if (ad) { seen.add(ad.id); out.push({ id: `ad-${ad.id}-${content}`, type: 'ad', ad, label: 'PR', reason: 'スポンサー提供' }); }
    }
  }
  return out;
}

// 編集部エージェント：特定の日の予定ごとの提案（カレンダー画面で使う）
export function agentForDay(date, events, archive, ads, variant = 0) {
  const dayEvents = events.filter((e) => e.date === dateKey(date));
  const cards = dayEvents.flatMap((e) => momentCards(date, e, archive, variant));
  if (!dayEvents.length) { const p = dayPlanCard(date, archive, variant); if (p) cards.push(p); }
  else for (const g of findGaps(dayEvents)) { const c = gapCard(date, g, archive, variant, dayEvents); if (c) cards.push(c); }
  if (cards.length) {
    const tags = cards.flatMap((c) => c.item?.tags || c.stops?.flatMap((s) => s.item.tags) || []);
    const ad = pickAd(ads, tags);
    if (ad) cards.push({ id: `ad-${ad.id}-${dateKey(date)}`, type: 'ad', ad, label: 'PR', reason: 'スポンサー提供' });
  }
  return cards;
}

// 提案タブのデッキ生成：今日から 14 日分 + 2か月先
export function generateDeck({ events, today, archive, ads, variant = 0, horizon = 14 }) {
  const cards = [];
  for (let i = 0; i < horizon; i++) {
    const date = addDays(today, i);
    const dayEvents = events.filter((e) => e.date === dateKey(date));
    if (!dayEvents.length) {
      if (i % 3 === 0) { const p = dayPlanCard(date, archive, variant + i); if (p) cards.push(p); }
      continue;
    }
    cards.push(...dayEvents.flatMap((e) => momentCards(date, e, archive, variant)));
    for (const g of findGaps(dayEvents)) { const c = gapCard(date, g, archive, variant + i, dayEvents); if (c) cards.push(c); }
  }
  cards.push(...farCards(today, events, archive, variant));
  return injectAds(cards, ads);
}
