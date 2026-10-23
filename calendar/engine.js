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
export const fmtDur = (min) => (min >= 60 ? `${Math.floor(min / 60)}時間${min % 60 ? `${min % 60}分` : ''}` : `${min}分`);

const evRange = (e) => [toMin(e.start), e.end ? toMin(e.end) : toMin(e.start) + 60];

// 時刻なしの予定は空き時間計算では一日を埋めるものとして扱う
export function findGaps(dayEvents, { start = DAY_START, end = DAY_END, min = MIN_GAP } = {}) {
  const busy = dayEvents.map((e) => (e.start ? evRange(e) : [start, end])).sort((a, b) => a[0] - b[0]);
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
  { tag: 'gift', re: /会食|ディナー|お呼ばれ|訪問|挨拶|ホームパーティ/ },
  { tag: 'birthday', re: /誕生日|バースデー|記念日/ },
  { tag: 'beach', re: /海|ビーチ|サーフ|BBQ|バーベキュー/ },
  { tag: 'date', re: /デート/ },
  { tag: 'trip', re: /旅行|旅|温泉|帰省/ },
];
export const detectMoments = (title = '') => MOMENTS.filter((m) => m.re.test(title)).map((m) => m.tag);

// 予定の色分け用カテゴリ
const CATS = [
  ['date', /デート/], ['beach', /海|ビーチ|BBQ|サーフ/], ['party', /会食|ディナー|誕生日|飲み会|パーティ/],
  ['work', /会議|ミーティング|打ち合わせ|打合せ|出張|面談/], ['beauty', /美容|ネイル|エステ/], ['trip', /旅/], ['lunch', /ランチ/],
];
export const categoryOf = (title = '') => (CATS.find(([, re]) => re.test(title)) || ['other'])[0];

const score = (item, tags) => item.tags.filter((t) => tags.includes(t)).length;

// variant で同条件の候補をローテーションし、「違う」を押した後に新しい提案を出せるようにする
function pick(archive, { kind, slot, tags = [], exclude = new Set(), variant = 0, maxMin, onlyTag, notTag }) {
  const pool = archive
    .filter((a) => a.kind === kind && !exclude.has(a.id)
      && (!slot || a.slot === slot || a.slot === 'any')
      && (!maxMin || !a.minutes || a.minutes <= maxMin)
      && (!onlyTag || a.tags.includes(onlyTag)) && (!notTag || !a.tags.includes(notTag)))
    .map((a) => ({ a, s: score(a, tags) }))
    .sort((x, y) => y.s - x.s || x.a.id.localeCompare(y.a.id));
  return pool.length ? pool[variant % pool.length].a : null;
}

const slotOf = (min) => (min < 11 * 60 ? 'morning' : min < 14 * 60 ? 'lunch' : min < 17 * 60 ? 'afternoon' : min < 20 * 60 ? 'evening' : 'night');

function gapCard(date, gap, archive, variant, dayEvents, used) {
  const len = gap.end - gap.start;
  const slot = slotOf(gap.start + Math.min(60, len / 2));
  const tags = dayEvents.flatMap((e) => detectMoments(e.title));
  const item = pick(archive, { kind: 'spot', slot, tags, variant, exclude: used, maxMin: len, notTag: 'event' })
    || pick(archive, { kind: 'spot', tags, variant, exclude: used, maxMin: len, notTag: 'event' });
  if (!item) return null;
  used.add(item.id);
  return { id: `gap-${dateKey(date)}-${gap.start}-${item.id}`, type: 'gap', date: dateKey(date), item, gap, label: `${toHHMM(gap.start)}–${toHHMM(gap.end)}（${fmtDur(len)}）の空き`, reason: '予定のあいだ、ちょうどいい時間です。' };
}

function eventCard(date, archive, variant, used) {
  const item = pick(archive, { kind: 'spot', onlyTag: 'event', variant, exclude: used });
  if (!item) return null;
  used.add(item.id);
  return { id: `event-${dateKey(date)}-${item.id}`, type: 'event', date: dateKey(date), item, label: item.when || 'イベント', reason: 'あなたの予定の近くで開催されます。' };
}

function dayPlanCard(date, archive, variant) {
  const used = new Set();
  const stops = [];
  for (const [slot, time] of [['morning', 9 * 60 + 30], ['lunch', 12 * 60], ['afternoon', 15 * 60], ['evening', 19 * 60]]) {
    const it = pick(archive, { kind: 'spot', slot, exclude: used, variant, notTag: 'event' });
    if (it) { used.add(it.id); stops.push({ time: toHHMM(time), item: it }); }
  }
  if (!stops.length) return null;
  return { id: `plan-${dateKey(date)}-${variant}`, type: 'dayplan', date: dateKey(date), stops, label: '一日まるごとプラン', reason: '予定のない日。編集部が一日を組みました。' };
}

// 既存の予定を「もっと良く」する準備提案
function prepCards(date, ev, archive, variant) {
  const out = [];
  const moments = detectMoments(ev.title);
  const add = (kind, tag, label, reason, n, extra = {}) => {
    const used = new Set();
    for (let i = 0; i < n; i++) {
      const item = pick(archive, { kind, tags: [tag], variant: variant + i, exclude: used, ...extra });
      if (!item) break;
      used.add(item.id);
      out.push({ id: `prep-${ev.id}-${item.id}`, type: 'prep', date: dateKey(date), item, eventId: ev.id, label, reason });
    }
  };
  const t = `「${ev.title}」`;
  if (moments.includes('gift')) add('gift', 'gift', `${t}の準備`, '手ぶらで行かないための手土産。', 2);
  if (moments.includes('birthday')) add('gift', 'birthday', `${t}の準備`, '特別な日に添える贈り物。', 1);
  if (moments.includes('beach')) add('goods', 'beach', `${t}の準備`, '日差しと砂への備え。', 3);
  if (moments.includes('date')) add('spot', 'date', `${t}をもっと良く`, '前後に足すと、デートが締まる一軒。', 1, { slot: 'evening', notTag: 'event' });
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

const tagsOf = (c) => c.item?.tags || c.stops?.flatMap((s) => s.item.tags) || [];

export function pickAd(ads, prevTags, seen = new Set(), n = 0) {
  const list = ads.filter((a) => !seen.has(a.id));
  const pool = list.length ? list : ads;
  const ranked = [...pool].sort((a, b) => score(b, prevTags) - score(a, prevTags) || a.id.localeCompare(b.id));
  return ranked[n % ranked.length] || null;
}
const adCard = (ad, key) => ({ id: `ad-${ad.id}-${key}`, type: 'ad', ad, label: 'PR', reason: 'スポンサー提供' });

export function injectAds(cards, ads, every = AD_EVERY) {
  const out = [];
  const seen = new Set();
  cards.forEach((c, i) => {
    out.push(c);
    if ((i + 1) % every === 0) {
      const ad = pickAd(ads, tagsOf(c), seen, (i + 1) / every);
      if (ad) { seen.add(ad.id); out.push(adCard(ad, i)); }
    }
  });
  return out;
}

// 1日ビュー：予定と空き時間提案を時系列に並べる。予定ごとの準備提案は row.prep に入る
export function dayTimeline(date, events, archive, ads, variant = 0) {
  const k = dateKey(date);
  const dayEvents = events.filter((e) => e.date === k);
  const rows = [];
  if (!dayEvents.length) {
    const p = dayPlanCard(date, archive, variant);
    if (p) rows.push({ type: 'dayplan', start: DAY_START, card: p });
  } else {
    const used = new Set();
    for (const e of dayEvents) rows.push({ type: 'event', start: e.start ? toMin(e.start) : -1, e, prep: prepCards(date, e, archive, variant) });
    for (const g of findGaps(dayEvents)) {
      const c = gapCard(date, g, archive, variant, dayEvents, used);
      if (c) rows.push({ type: 'gap', start: g.start, card: c });
    }
  }
  rows.sort((a, b) => a.start - b.start);
  const tags = rows.flatMap((r) => (r.card ? tagsOf(r.card) : []));
  const ad = rows.length ? pickAd(ads, tags) : null;
  return { rows, ad: ad ? adCard(ad, k) : null };
}

// 提案タブ「おでかけ」：予定を踏まえた お店・イベント・一日プラン・2か月先
export function outingDeck({ events, today, archive, ads, variant = 0, horizon = 10 }) {
  const cards = [];
  for (let i = 0; i < horizon; i++) {
    const date = addDays(today, i);
    const dayEvents = events.filter((e) => e.date === dateKey(date));
    const used = new Set();
    if (!dayEvents.length) {
      const p = dayPlanCard(date, archive, variant + i);
      if (p) cards.push(p);
    } else {
      for (const g of findGaps(dayEvents)) { const c = gapCard(date, g, archive, variant + i, dayEvents, used); if (c) cards.push(c); }
    }
    if (i % 2 === 1) { const c = eventCard(date, archive, variant + i, new Set()); if (c) cards.push(c); }
  }
  return injectAds([...cards.slice(0, 14), ...farCards(today, events, archive, variant)], ads);
}

// 提案タブ「予定をもっと良く」：会食→手土産、海→サングラスなど
export function prepDeck({ events, today, archive, ads, variant = 0, horizon = 21 }) {
  const cards = [];
  for (let i = 0; i < horizon; i++) {
    const date = addDays(today, i);
    for (const e of events.filter((x) => x.date === dateKey(date))) cards.push(...prepCards(date, e, archive, variant));
  }
  return injectAds(cards, ads);
}
