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
  { tag: 'gift', re: /会食|ディナー|お呼ばれ|訪問|挨拶|ホームパーティ|飲み|接待|懇親/ },
  { tag: 'birthday', re: /誕生日|バースデー|記念日/ },
  { tag: 'beach', re: /海|ビーチ|サーフ|BBQ|バーベキュー/ },
  { tag: 'date', re: /デート/ },
  { tag: 'trip', re: /旅行|旅|温泉|帰省|出張/ },
  { tag: 'work', re: /会議|ミーティング|打ち合わせ|打合せ|商談|クライアント|出社|面談|定例/ },
  { tag: 'beauty', re: /美容院|ネイル|エステ|ヘア|サロン/ },
  { tag: 'sport', re: /ジム|ラン|ヨガ|スポーツ|運動|トレーニング|筋トレ|ゴルフ|テニス/ },
  { tag: 'shop', re: /買い物|ショッピング/ },
  { tag: 'family', re: /母|父|家族|友達|友人|友だち|祖父|祖母|お祝い/ },
];
export const detectMoments = (title = '') => MOMENTS.filter((m) => m.re.test(title)).map((m) => m.tag);

// 予定の色分け用カテゴリ
const CATS = [
  ['date', /デート/], ['beach', /海|ビーチ|BBQ|サーフ/], ['party', /会食|ディナー|誕生日|飲み会|パーティ|飲み/],
  ['work', /会議|ミーティング|打ち合わせ|打合せ|出張|面談|商談|クライアント|出社|定例/], ['beauty', /美容|ネイル|エステ|ヘア/], ['trip', /旅/], ['lunch', /ランチ/],
  ['sport', /ジム|ラン|ヨガ|スポーツ|運動|トレーニング|筋トレ|ゴルフ|テニス/], ['shop', /買い物|ショッピング/], ['family', /母|父|家族|友達|友人|友だち|祖父|祖母/],
];
export const categoryOf = (title = '') => (CATS.find(([, re]) => re.test(title)) || ['other'])[0];

// LIFE / WORK の区分。予定に cal があればそれ、なければタイトルから推定
export const calOf = (e) => e.cal || (categoryOf(e.title) === 'work' ? 'work' : 'life');
export const inScope = (e, scope = 'all') => scope === 'all' || calOf(e) === scope;

const score = (item, tags) => item.tags.filter((t) => tags.includes(t)).length;

// variant で同条件の候補をローテーションし、「違う」を押した後に新しい提案を出せるようにする
function pick(archive, { kind, slot, tags = [], exclude = new Set(), variant = 0, maxMin, onlyTag, notTag, notTags = [] }) {
  const pool = archive
    .filter((a) => a.kind === kind && !exclude.has(a.id)
      && (!slot || a.slot === slot || a.slot === 'any')
      && (!maxMin || !a.minutes || a.minutes <= maxMin)
      && (!onlyTag || a.tags.includes(onlyTag)) && (!notTag || !a.tags.includes(notTag)) && !notTags.some((t) => a.tags.includes(t)))
    .map((a) => ({ a, s: score(a, tags) }))
    .sort((x, y) => y.s - x.s || x.a.id.localeCompare(y.a.id));
  return pool.length ? pool[variant % pool.length].a : null;
}

const slotOf = (min) => (min < 11 * 60 ? 'morning' : min < 14 * 60 ? 'lunch' : min < 17 * 60 ? 'afternoon' : min < 20 * 60 ? 'evening' : 'night');

const NO_GAP = ['event', 'prep'];
const LEAD = ['予定のあいだ、ちょうどいい時間です。', 'この空き時間、寄り道にぴったり。', '予定と予定の間に、小さな冒険を。', '帰り道に、いいお店を見つけました。'];

function gapCard(date, gap, archive, variant, dayEvents, used, scope = 'all', busy = dayEvents) {
  const len = gap.end - gap.start;
  const slot = slotOf(gap.start + Math.min(60, len / 2));
  const tags = dayEvents.flatMap((e) => detectMoments(e.title));
  if (scope === 'work') tags.push('work');
  const base = { kind: 'spot', tags, variant, maxMin: len, notTags: NO_GAP };
  const item = pick(archive, { ...base, slot, exclude: used }) || pick(archive, { ...base, exclude: used }) || pick(archive, { ...base });
  if (!item) return null;
  used.add(item.id);
  const prev = busy.find((e) => e.end && toMin(e.end) === gap.start);
  const next = busy.find((e) => e.start && toMin(e.start) === gap.end);
  const reason = next ? `「${next.title}」の前に、ひと息。` : prev ? `「${prev.title}」のあとに、ひと息。` : LEAD[(variant + gap.start) % LEAD.length];
  return { id: `gap-${dateKey(date)}-${gap.start}-${item.id}`, type: 'gap', date: dateKey(date), item, gap, label: `${toHHMM(gap.start)}–${toHHMM(gap.end)}（${fmtDur(len)}）の空き`, reason: item.note ? `${reason} ${item.note}` : reason };
}

function eventCard(date, archive, variant, used) {
  const item = pick(archive, { kind: 'spot', onlyTag: 'event', variant, exclude: used }) || pick(archive, { kind: 'spot', onlyTag: 'event', variant });
  if (!item) return null;
  used.add(item.id);
  return { id: `event-${dateKey(date)}-${item.id}`, type: 'event', date: dateKey(date), item, label: item.when || 'イベント', reason: 'あなたの予定の近くで開催されます。' };
}

function dayPlanCard(date, archive, variant, global = new Set()) {
  const used = new Set();
  const stops = [];
  for (const [slot, time] of [['morning', 9 * 60 + 30], ['lunch', 12 * 60], ['afternoon', 15 * 60], ['evening', 19 * 60]]) {
    const it = pick(archive, { kind: 'spot', slot, exclude: new Set([...used, ...global]), variant, notTags: NO_GAP }) || pick(archive, { kind: 'spot', slot, exclude: used, variant, notTags: NO_GAP });
    if (it) { used.add(it.id); global.add(it.id); stops.push({ time: toHHMM(time), item: it }); }
  }
  if (!stops.length) return null;
  return { id: `plan-${dateKey(date)}-${variant}`, type: 'dayplan', date: dateKey(date), stops, label: '一日まるごとプラン', reason: '予定のない日。編集部が一日を組みました。' };
}

// 予定の種類ごとの準備プラン。pin は常に出す。その他は variant で回して毎回違う切り口にする
const PLAN = {
  gift: [{ kind: 'gift', tag: 'gift', l: '手土産', r: '手ぶらで行かないための手土産。', pin: 1 }, { kind: 'spot', tag: 'second', l: '二軒目', r: '会場から歩ける、静かな二軒目。' }, { kind: 'style', tag: 'gift', l: '服装', r: '相手とお店に合う装い。' }, { kind: 'talk', tag: 'gift', l: '会話のネタ', r: '今夜の話題に。' }, { kind: 'spot', tag: 'pre', l: '事前準備', r: '早めに着いて、気持ちを整える場所。' }, { kind: 'care', tag: 'gift', l: '翌日のケア', r: '翌日の自分にやさしい一手。' }],
  birthday: [{ kind: 'gift', tag: 'birthday', l: '贈り物', r: '特別な日に添える贈り物。', pin: 1 }, { kind: 'spot', tag: 'birthday', l: 'お祝いの席', r: 'お祝いにふさわしい一軒。' }],
  beach: [{ kind: 'goods', tag: 'beach', l: '準備', r: '日差しと砂への備え。', pin: 1 }, { kind: 'goods', tag: 'beach', l: '準備', r: '日差しと砂への備え。', pin: 1 }, { kind: 'goods', tag: 'beach', l: '準備', r: '日差しと砂への備え。', pin: 1 }],
  date: [{ kind: 'spot', tag: 'date', l: 'デート', r: '前後に足すと、デートが締まる一軒。' }, { kind: 'spot', tag: 'date', l: 'デート', r: 'いつもと違う、意外な行き先。' }, { kind: 'gift', tag: 'date', l: 'ギフト', r: 'さりげなく渡せる小さな贈り物。' }, { kind: 'style', tag: 'date', l: '服装・ヘア', r: 'デート向けの仕上げ。' }, { kind: 'spot', tag: 'second', l: 'デート後', r: '帰る前の、もう一軒。' }, { kind: 'spot', tag: 'rain', l: '雨の日の代替', r: '雨でも楽しめるプランB。' }, { kind: 'spot', tag: 'night', l: 'デート後', r: '夜景で締める。' }],
  work: [{ kind: 'spot', tag: 'work', l: '仕事前後', r: '仕事の前後に立ち寄れる一軒。' }, { kind: 'gift', tag: 'work', l: '手土産', r: '商談に持っていける手土産。' }, { kind: 'goods', tag: 'work', l: '仕事道具', r: '仕事が楽しくなる道具。' }, { kind: 'style', tag: 'work', l: '服装', r: 'ビジネスシーンの装い。' }, { kind: 'talk', tag: 'work', l: '話題', r: '会議の雑談に使えるネタ。' }],
  trip: [{ kind: 'spot', tag: 'trip', l: '旅先', r: '定番じゃない、旅先のとっておき。' }, { kind: 'gift', tag: 'trip', l: 'お土産', r: '帰りの駅で選ぶご当地の一品。' }, { kind: 'goods', tag: 'trip', l: '持ち物', r: '旅の前に整えておきたいもの。' }, { kind: 'talk', tag: 'trip', l: '移動中', r: '移動時間を楽しむ読みもの。' }, { kind: 'care', tag: 'trip', l: '旅のあと', r: '帰宅後のケア。' }],
  beauty: [{ kind: 'style', tag: 'beauty', l: '美容', r: 'サロンの前に仕入れたいヒント。' }, { kind: 'goods', tag: 'beauty', l: 'コスメ', r: '編集部おすすめのコスメ。' }, { kind: 'spot', tag: 'beauty', l: 'サロン帰り', r: 'サロンの帰りに立ち寄る一軒。' }],
  sport: [{ kind: 'spot', tag: 'sport', l: '運動後', r: '運動のあとの楽しみ。' }, { kind: 'goods', tag: 'sport', l: 'ギア', r: '続けるための道具。' }, { kind: 'care', tag: 'sport', l: 'ケア', r: '回復を早めるケア。' }],
  shop: [{ kind: 'spot', tag: 'shop', l: '買い物', r: '買い物の途中に寄りたい一軒。' }, { kind: 'spot', tag: 'shop', l: '買い物', r: '買い物の途中に寄りたい一軒。' }, { kind: 'spot', tag: 'shop', l: '買い物', r: '買い物の途中に寄りたい一軒。' }],
  family: [{ kind: 'gift', tag: 'family', l: '贈り物', r: '相手を思い浮かべて選ぶ贈り物。' }, { kind: 'spot', tag: 'family', l: 'ご一緒に', r: '一緒に楽しめる場所。' }],
};

// 既存の予定を「もっと良く」する準備提案（予定1件につき最大3枚。各予定の切り口を variant で回す）
export function prepCards(date, ev, archive, variant) {
  const moments = detectMoments(ev.title).filter((m) => PLAN[m]);
  if (!moments.length) return [];
  const lists = moments.map((m) => {
    const steps = PLAN[m];
    const pinned = steps.filter((x) => x.pin);
    const rest = steps.filter((x) => !x.pin);
    const k = rest.length ? variant % rest.length : 0;
    return [...pinned, ...rest.slice(k), ...rest.slice(0, k)];
  });
  const queue = [];
  for (let r = 0; queue.length < 12 && lists.some((l) => r < l.length); r++) lists.forEach((l) => { if (l[r]) queue.push(l[r]); });
  const used = new Set();
  const out = [];
  const t = `「${ev.title}」`;
  for (const st of queue) {
    if (out.length >= 3) break;
    const item = pick(archive, { kind: st.kind, tags: [st.tag], onlyTag: st.tag, variant, exclude: used });
    if (!item) continue;
    used.add(item.id);
    out.push({ id: `prep-${ev.id}-${item.id}`, type: 'prep', date: dateKey(date), item, eventId: ev.id, label: `${t}の${st.l}`, reason: item.note || st.r });
  }
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

// 1日ビュー：予定と空き時間提案を時系列に並べる。予定ごとの準備提案は row.prep に入る。
// scope: all / life / work。空き時間は全カレンダーの予定を避けて計算し、表示と提案の切り口だけ scope で絞る。
export function dayTimeline(date, events, archive, ads, variant = 0, scope = 'all') {
  const k = dateKey(date);
  const busy = events.filter((e) => e.date === k);
  const dayEvents = busy.filter((e) => inScope(e, scope));
  const rows = [];
  if (!busy.length) {
    const p = scope === 'work' ? null : dayPlanCard(date, archive, variant);
    if (p) rows.push({ type: 'dayplan', start: DAY_START, card: p });
  } else {
    const used = new Set();
    for (const e of dayEvents) rows.push({ type: 'event', start: e.start ? toMin(e.start) : -1, e, prep: prepCards(date, e, archive, variant) });
    for (const g of findGaps(busy)) {
      const c = gapCard(date, g, archive, variant, dayEvents, used, scope, busy);
      if (c) rows.push({ type: 'gap', start: g.start, card: c });
    }
  }
  rows.sort((a, b) => a.start - b.start);
  const tags = rows.flatMap((r) => (r.card ? tagsOf(r.card) : []));
  const ad = rows.length ? pickAd(ads, tags) : null;
  return { rows, ad: ad ? adCard(ad, k) : null };
}

// 提案タブ「おでかけ」：予定を踏まえた お店・イベント・一日プラン・2か月先
export function outingDeck({ events, today, archive, ads, variant = 0, horizon = 10, scope = 'all' }) {
  const cards = [];
  const usedAll = new Set();
  for (let i = 0; i < horizon; i++) {
    const date = addDays(today, i);
    const busy = events.filter((e) => e.date === dateKey(date));
    const dayEvents = busy.filter((e) => inScope(e, scope));
    if (!busy.length) {
      const p = scope === 'work' ? null : dayPlanCard(date, archive, variant + i, usedAll);
      if (p) cards.push(p);
    } else {
      for (const g of findGaps(busy)) { const c = gapCard(date, g, archive, variant + i, dayEvents, usedAll, scope, busy); if (c) cards.push(c); }
    }
    if (scope !== 'work' && i % 2 === 1) { const c = eventCard(date, archive, variant + i, usedAll); if (c) { usedAll.add(c.item.id); cards.push(c); } }
  }
  const far = scope === 'work' ? [] : farCards(today, events, archive, variant);
  return injectAds([...cards.slice(0, 14), ...far], ads);
}

// 提案タブ「予定をもっと良く」：会食→手土産、海→サングラスなど
export function prepDeck({ events, today, archive, ads, variant = 0, horizon = 21, scope = 'all' }) {
  const cards = [];
  for (let i = 0; i < horizon; i++) {
    const date = addDays(today, i);
    for (const e of events.filter((x) => x.date === dateKey(date) && inScope(x, scope))) cards.push(...prepCards(date, e, archive, variant));
  }
  return injectAds(cards.slice(0, 24), ads);
}
