import { ARCHIVE, ADS } from './archive.js';
import { articleFor } from './articles.js';
import { MAGS, FORMAT_NAME } from './magazines.js';
import { photoUrl } from './photos.js';
import { outingDeck, prepDeck, dayTimeline, findGaps, categoryOf, calOf, inScope, dateKey, parseKey, addDays, toHHMM, toMin } from './engine.js';

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const store = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const uid = () => Math.random().toString(36).slice(2, 10);
// 1:1 サムネ：被写体が中央に収まるよう、正方形に切り出した画像をそのまま <img> で表示する
const thumb = (i) => `<div class="em"><img class="sq" src="${photoUrl(i, 0, 240, 240)}" alt="" loading="lazy" draggable="false" onerror="this.remove()"></div>`;
const hero = (i, n = 0) => `<div class="hero"><img src="${photoUrl(i, n, 900, 600)}" alt="" loading="lazy" draggable="false" onerror="this.remove()"></div>`;
const magStyle = (i) => `--mc:${MAGS[i.magId].c};--mb:${MAGS[i.magId].bg}`;
const srcChip = (i) => `<span class="srcchip f-${MAGS[i.magId].font}" style="${magStyle(i)}"><b>${esc(i.mag)}</b> ${FORMAT_NAME[i.format]}より引用</span>`;

const today = new Date(new Date().setHours(0, 0, 0, 0));
const DOW = ['日', '月', '火', '水', '木', '金', '土'];
const fmtDate = (k) => { const d = parseKey(k); return `${d.getMonth() + 1}/${d.getDate()}（${DOW[d.getDay()]}）`; };
const CAT_NAMES = { work: '仕事', party: '会食・パーティ', beach: '海・アウトドア', date: 'デート', beauty: '美容', trip: '旅行', lunch: 'ランチ', sport: '運動', shop: '買い物', family: '友人・家族', other: 'その他' };
const TYPE_NAMES = { gap: '空き時間', event: 'イベント', prep: '予定の準備', far: '2か月先', dayplan: '一日プラン', ad: 'PR' };

// デモ用の架空の予定（今日からの相対日付）
function demoEvents() {
  const e = (off, title, start, end, cal = 'life') => ({ id: uid(), date: dateKey(addDays(today, off)), title, start, end, cal });
  return [
    e(0, '朝ミーティング', '10:00', '11:00', 'work'), e(0, '企画の打ち合わせ', '14:00', '15:30', 'work'), e(0, '取引先と会食', '19:00', '21:00', 'work'),
    e(1, '海でBBQ', '11:00', '16:00'),
    e(2, 'ジム', '19:00', '20:30'), e(2, '定例会議', '10:00', '11:00', 'work'),
    e(3, '友だちとランチ', '12:00', '13:30'),
    e(4, 'デート', '18:30', '21:00'),
    e(5, '渋谷で買い物', '13:00', '16:00'),
    e(6, '友人の誕生日会', '19:00', '22:00'),
    e(8, '美容院', '11:00', '12:30'), e(8, '定例会議', '15:00', '16:00', 'work'),
    e(9, '母とランチ', '12:00', '13:30'),
  ];
}

const state = {
  tab: ['suggest', 'saved'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'calendar', view: 'day', cursor: dateKey(today), monthPick: dateKey(today),
  events: load('editime.events', null) || load('maglife.events', null) || demoEvents(),
  saved: load('editime.saved', load('maglife.saved', [])),
  mode: 'outing', variant: 0, decks: {}, scope: load('editime.scope', 'all'),
};
const persist = () => { store('editime.events', state.events); store('editime.saved', state.saved); store('editime.scope', state.scope); };
persist();

const view = $('#view');
const sheet = $('#sheet');
const isSaved = (id) => state.saved.some((s) => s.id === id);
const touched = () => { state.decks = {}; persist(); };

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 1600);
}

// ---------- シート ----------
// tab: 雑誌のインデックスタブ（誌名・テーマ色）。後ろに他誌の小さなタブがのぞく
function openSheet(html, bind, tab = { label: 'Editime', sub: '', c: '#111', font: 'serif' }) {
  sheet.hidden = false; sheet.classList.remove('closing');
  const ghosts = Object.values(MAGS).filter((m) => m.c !== tab.c).slice(2, 4);
  sheet.innerHTML = `<div class="wrap" style="--mc:${tab.c}">
    <div class="mtabs"><div class="mtab f-${tab.font}"><b>${esc(tab.label)}</b>${tab.sub ? `<em>${esc(tab.sub)}</em>` : ''}</div>${ghosts.map((m) => `<div class="mtab ghost" style="--mc:${m.c}"></div>`).join('')}</div>
    <div class="panel"><div class="grab"></div>${html}</div></div>`;
  sheet.onclick = (e) => { if (e.target === sheet) closeSheet(); };
  bind?.(sheet);
}

// 保存したときの紙吹雪
function burst(el) {
  const ph = $('.phone').getBoundingClientRect();
  const r = el ? el.getBoundingClientRect() : { left: ph.left + ph.width / 2, top: ph.top + ph.height * 0.6, width: 0, height: 0 };
  const x = r.left - ph.left + r.width / 2, y = r.top - ph.top + r.height / 2;
  const colors = ['#ff3b30', '#ff7a1a', '#ffc21a', '#17b26a', '#00b4d8', '#3d6bff', '#9b5de5', '#ff4d8d'];
  for (let n = 0; n < 22; n++) {
    const p = document.createElement('i');
    p.className = 'confetti';
    p.style.cssText = `left:${x}px;top:${y}px;background:${colors[n % colors.length]}`;
    $('.phone').appendChild(p);
    const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 90;
    p.animate([
      { transform: 'translate(0,0) rotate(0)', opacity: 1 },
      { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d - 40}px) rotate(${Math.random() * 540}deg)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${Math.cos(a) * d * 1.1}px,${Math.sin(a) * d + 70}px) rotate(${Math.random() * 720}deg)`, opacity: 0 },
    ], { duration: 900 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.4,1)' }).onfinish = () => p.remove();
  }
}
function closeSheet() {
  sheet.classList.add('closing');
  setTimeout(() => { sheet.hidden = true; sheet.classList.remove('closing'); sheet.innerHTML = ''; }, 230);
}

const SLOT_START = { morning: '09:30', lunch: '12:00', afternoon: '15:00', evening: '19:00', night: '20:00' };
function addableEvent(card, item) {
  if (!card || card.type === 'prep' || card.type === 'ad') return null;
  let start = card.gap ? toHHMM(card.gap.start) : SLOT_START[item.slot] || '10:00';
  let len = item.minutes || 60;
  if (card.gap) len = Math.min(len, card.gap.end - card.gap.start);
  const end = toHHMM(toMin(start) + len);
  return { id: uid(), date: card.date, title: item.title.replace(/^【.*?】/, '').slice(0, 20), start, end, cal: state.scope === 'work' ? 'work' : 'life' };
}

function openArticle(item, card) {
  const a = articleFor(item);
  const ev = addableEvent(card, item);
  const t = card?.type || 'gap';
  openSheet(`<div class="art t-${t}" style="--mc:${a.magInfo.c};--mb:${a.magInfo.bg}">
    <div class="mast f-${a.magInfo.font}"><b>${esc(a.mag)}</b><small>${a.format === 'web' ? 'WEB記事' : '誌面'}・${esc(a.date)}${a.page ? ' ' + esc(a.page) : ''}</small></div>
    <div class="quote">${esc(a.mag)} の${a.format === 'web' ? 'WEB記事' : '誌面'}より引用<q>${esc(a.quote)}</q></div>
    ${a.format === 'web' ? `<div class="urlbar">https:// ${esc(a.url.replace('https://', ''))}</div>` : ''}
    <div class="photo ${a.format}"><img src="${photoUrl(item, 0, 900, 600)}" alt="" onerror="this.remove()"><i>${esc(a.issue)}</i></div>
    <div class="cap">Photo: ${esc(a.mag)}編集部（Unsplash）</div>
    <h2>${esc(a.headline)}</h2><div class="by">${esc(a.by)}（架空の記事）</div>
    ${a.p.map((p) => `<p>${esc(p)}</p>`).join('')}
    ${a.info.length ? `<dl>${a.info.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : ''}
    <div class="acts"><button class="btn ghost press" id="sv">${isSaved(card?.id) ? '♥ 保存済み' : '♡ 保存'}</button>
      ${ev ? `<button class="btn press" id="ad">予定に追加</button>` : ''}</div></div>`, (s) => {
    $('#sv', s).onclick = (e) => { if (card) toggleSave(card); e.target.textContent = isSaved(card?.id) ? '♥ 保存済み' : '♡ 保存'; e.target.classList.add('heart-pop'); if (isSaved(card?.id)) burst(e.target); };
    if (ev) $('#ad', s).onclick = () => { state.events.push(ev); touched(); closeSheet(); toast(`${fmtDate(ev.date)} ${ev.start} に追加しました`); setTimeout(render, 220); };
  }, { label: a.mag, sub: `${a.format === 'web' ? 'WEB' : 'PRINT'} ${a.date}`, c: a.magInfo.c, font: a.magInfo.font });
}

function openPlan(card) {
  openSheet(`<div class="art t-dayplan"><div class="mast f-serif"><b>Day Plan</b><small>${fmtDate(card.date)}</small></div>
    <h2 style="margin-top:14px">${fmtDate(card.date)}をまるごと</h2><div class="by">編集部が各誌の記事から組みました</div>
    ${card.stops.map((s, i) => `<div class="sug-card t-gap press" data-i="${i}" style="margin-bottom:8px">${thumb(s.item)}<div class="tx"><div class="lb">${s.time}</div><div class="ti">${esc(s.item.title)}</div><div class="src">${srcChip(s.item)}</div></div><span class="go">›</span></div>`).join('')}
    <div class="acts"><button class="btn ghost press" id="sv">${isSaved(card.id) ? '♥ 保存済み' : '♡ 保存'}</button></div></div>`, (s) => {
    s.querySelectorAll('[data-i]').forEach((el) => (el.onclick = () => { const st = card.stops[el.dataset.i]; openArticle(st.item, { ...card, type: 'gap', id: `${card.id}-${st.item.id}`, gap: { start: toMin(st.time), end: toMin(st.time) + (st.item.minutes || 60) } }); }));
    $('#sv', s).onclick = (e) => { toggleSave(card); e.target.textContent = isSaved(card.id) ? '♥ 保存済み' : '♡ 保存'; e.target.classList.add('heart-pop'); if (isSaved(card.id)) burst(e.target); };
  }, { label: 'Day Plan', sub: 'EDITIME', c: '#f5a300', font: 'serif' });
}
const openCard = (c) => (c.type === 'dayplan' ? openPlan(c) : c.type === 'ad' ? null : openArticle(c.item, c));

function toggleSave(card) {
  if (card.type === 'ad') return;
  if (isSaved(card.id)) state.saved = state.saved.filter((s) => s.id !== card.id);
  else { state.saved.unshift({ id: card.id, card }); toast('保存しました ♥'); }
  persist();
}

// 予定の追加・編集（ev があれば編集）
function openEventForm(ev) {
  const cal = ev ? calOf(ev) : state.scope === 'all' ? 'life' : state.scope;
  openSheet(`<h2 style="margin:6px 0 14px;font-family:var(--serif);font-size:24px">${ev ? '予定を編集' : '予定を追加'}</h2><form class="form" id="f">
    <input name="title" placeholder="予定（例：会食、海、デート、ジム）" required maxlength="40" value="${ev ? esc(ev.title) : ''}" />
    <input type="date" name="date" value="${ev ? ev.date : state.cursor}" required />
    <div class="r"><input type="time" name="start" value="${ev?.start || ''}" /><input type="time" name="end" value="${ev?.end || ''}" /></div>
    <label>カレンダー</label>
    <div class="calpick"><label><input type="radio" name="cal" value="life" ${cal === 'life' ? 'checked' : ''}><span>LIFE</span></label><label><input type="radio" name="cal" value="work" ${cal === 'work' ? 'checked' : ''}><span>WORK</span></label></div>
    <button class="btn press" type="submit">${ev ? '保存する' : '追加する'}</button>
    ${ev ? '<button class="btn danger press" type="button" id="del">この予定を削除</button>' : ''}</form>`, (s) => {
    $('#f', s).onsubmit = (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const start = f.get('start') || '', end = f.get('end') || '';
      if (start && end && end <= start) { toast('終了は開始より後にしてください'); return; }
      const data = { title: String(f.get('title')).trim(), date: f.get('date'), start, end, cal: f.get('cal') };
      if (ev) Object.assign(ev, data); else state.events.push({ id: uid(), ...data });
      state.cursor = data.date; touched(); closeSheet(); toast(ev ? '予定を更新しました' : '予定を追加しました'); setTimeout(render, 220);
    };
    if (ev) $('#del', s).onclick = () => { state.events = state.events.filter((x) => x.id !== ev.id); touched(); closeSheet(); toast('削除しました'); setTimeout(render, 220); };
  }, { label: ev ? 'Edit' : 'New', sub: 'EDITIME', c: cal === 'work' ? '#3d6bff' : '#ff4d8d', font: 'serif' });
}
const openAddForm = () => openEventForm();

// ---------- 提案カード部品 ----------
function sugCard(c, extra = '') {
  const i = c.item;
  return `<div class="sug-card t-${c.type} ${extra} press" data-card="${c.id}">${thumb(i)}
    <div class="tx"><div class="lb">${esc(c.label)}</div><div class="ti">${esc(i.title)}</div><div class="src">${srcChip(i)}</div></div><span class="go">›</span></div>`;
}

// ---------- カレンダー ----------
const evOf = (k) => state.events.filter((e) => e.date === k && inScope(e, state.scope)).sort((a, b) => (a.start || '').localeCompare(b.start || ''));
const calChip = (e) => (state.scope === 'all' ? `<span class="calchip">${calOf(e).toUpperCase()}</span>` : '');
const timeLabel = (e) => (e.start ? `${e.start}${e.end ? '–' + e.end : ''}` : '終日');

function renderCalendar() {
  const cur = parseKey(state.cursor);
  let title, prev, next;
  if (state.view === 'day') { title = fmtDate(state.cursor); prev = () => addDays(cur, -1); next = () => addDays(cur, 1); }
  else if (state.view === 'week') {
    const s = addDays(cur, -cur.getDay()), e = addDays(s, 6);
    title = `${s.getMonth() + 1}/${s.getDate()} – ${e.getMonth() + 1}/${e.getDate()}`; prev = () => addDays(cur, -7); next = () => addDays(cur, 7);
  } else { title = `${cur.getFullYear()}年${cur.getMonth() + 1}月`; prev = () => new Date(cur.getFullYear(), cur.getMonth() - 1, 1); next = () => new Date(cur.getFullYear(), cur.getMonth() + 1, 1); }

  const body = state.view === 'day' ? dayView() : state.view === 'week' ? weekView() : monthView();
  view.innerHTML = `
    <div class="seg">${[['day', '日'], ['week', '週'], ['month', '月']].map(([k, l]) => `<button data-v="${k}" class="${state.view === k ? 'on' : ''}">${l}</button>`).join('')}</div>
    <div class="nav"><h2>${title}</h2><div class="arrows"><button id="prev">‹</button><button id="today">●</button><button id="next">›</button></div></div>
    <div class="rise">${body}</div>
    <button class="fab" id="fab" aria-label="予定を追加">＋</button>`;

  view.querySelectorAll('.seg button').forEach((b) => (b.onclick = () => { state.view = b.dataset.v; render(); }));
  $('#prev').onclick = () => { state.cursor = dateKey(prev()); render(); };
  $('#next').onclick = () => { state.cursor = dateKey(next()); render(); };
  $('#today').onclick = () => { state.cursor = dateKey(today); render(); };
  $('#fab').onclick = openAddForm;
  view.querySelectorAll('[data-del]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); state.events = state.events.filter((x) => x.id !== b.dataset.del); touched(); toast('削除しました'); render(); }));
  view.querySelectorAll('[data-edit]').forEach((el) => (el.onclick = (e) => { if (e.target.closest('[data-del]')) return; const ev = state.events.find((x) => x.id === el.dataset.edit); if (ev) openEventForm(ev); }));
  view.querySelectorAll('[data-goday]').forEach((el) => (el.onclick = () => { state.cursor = el.dataset.goday; state.view = 'day'; render(); }));
  view.querySelectorAll('[data-pick]').forEach((el) => (el.onclick = () => { state.cursor = el.dataset.pick; render(); }));
  bindCards(view);
}

const cardIndex = new Map();
function bindCards(root) {
  root.querySelectorAll('[data-card]').forEach((el) => (el.onclick = (e) => { if (e.target.closest('[data-del]')) return; const c = cardIndex.get(el.dataset.card); if (c) openCard(c); }));
}
const reg = (c) => { cardIndex.set(c.id, c); return c; };

function dayView() {
  const { rows, ad } = dayTimeline(parseKey(state.cursor), state.events, ARCHIVE, ADS, state.variant, state.scope);
  const html = rows.map((r) => {
    if (r.type === 'event') {
      const e = r.e;
      return `<div class="row"><div class="time">${e.start || '終日'}</div><div>
        <div class="evbox c-${categoryOf(e.title)} press" data-edit="${e.id}"><div>${esc(e.title)}${calChip(e)}<small>${timeLabel(e)}</small></div><div class="ed"><span class="pen">編集</span><button data-del="${e.id}" aria-label="削除">✕</button></div></div>
        ${r.prep.length ? `<div class="prephead c-${categoryOf(e.title)}">PREPARATION ・ もっと良くする準備</div>` : ''}${r.prep.map((c) => sugCard(reg(c), 'in-event')).join('')}</div></div>`;
    }
    if (r.type === 'gap') return `<div class="row"><div class="time">${toHHMM(r.card.gap.start)}</div><div>${sugCard(reg(r.card))}</div></div>`;
    const c = reg(r.card);
    return `<div class="row"><div class="time">終日</div><div><div class="sug-card t-dayplan press" data-card="${c.id}">${thumb(c.stops[0].item)}<div class="tx"><div class="lb">予定のない日</div><div class="ti">一日まるごとプランを提案</div><div class="src"><span class="srcchip" style="--mc:#f5a300;--mb:#fff3cf">全${c.stops.length}スポット</span></div></div><span class="go">›</span></div></div></div>`;
  }).join('');
  const adHtml = ad ? `<div class="sug-card t-ad" style="margin-top:6px"><div class="em ad">PR</div><div class="tx"><div class="lb">${esc(ad.ad.brand)}</div><div class="ti">${esc(ad.ad.title)}</div></div></div>` : '';
  return `<div class="tl">${html || `<div class="empty">${state.scope === 'work' ? 'WORKの予定はありません' : '予定はありません'}</div>`}${adHtml}</div>
    <div class="legend">${Object.entries(CAT_NAMES).map(([k, v]) => `<span class="c-${k}"><i></i>${v}</span>`).join('')}</div>`;
}

function weekView() {
  const cur = parseKey(state.cursor);
  const start = addDays(cur, -cur.getDay());
  let out = '';
  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i), k = dateKey(d);
    const { rows } = dayTimeline(d, state.events, ARCHIVE, ADS, state.variant, state.scope);
    const evs = rows.filter((r) => r.type === 'event').map((r) => `<span class="pill c-${categoryOf(r.e.title)}"><small>${r.e.start || ''}</small>${esc(r.e.title)}</span>`).join('');
    const sugs = rows.filter((r) => r.type === 'gap').slice(0, 2).map((r) => `<span class="pill sug t-gap"><small>${toHHMM(r.card.gap.start)}</small>${esc(r.card.item.title)}</span>`).join('');
    const plan = rows.find((r) => r.type === 'dayplan') ? `<span class="pill sug t-dayplan">一日まるごとプランあり</span>` : '';
    out += `<div class="wk press ${k === dateKey(today) ? 'today' : ''}" data-goday="${k}"><div class="d ${d.getDay() === 0 ? 'sun' : d.getDay() === 6 ? 'sat' : ''}"><small>${DOW[d.getDay()]}</small><b>${d.getDate()}</b></div><div>${evs}${sugs}${plan}</div></div>`;
  }
  return out;
}

function monthView() {
  const cur = parseKey(state.cursor);
  const y = cur.getFullYear(), m = cur.getMonth();
  const first = new Date(y, m, 1);
  const start = addDays(first, -first.getDay());
  let cells = DOW.map((d) => `<div class="dow">${d}</div>`).join('');
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i), k = dateKey(d);
    const dots = evOf(k).slice(0, 6).map((e) => `<i class="c-${categoryOf(e.title)}"></i>`).join('');
    cells += `<div class="cell press ${d.getMonth() !== m ? 'out' : ''} ${k === dateKey(today) ? 'today' : ''} ${k === state.cursor ? 'sel' : ''}" data-pick="${k}"><span class="n">${d.getDate()}</span><span class="dots">${dots}</span></div>`;
  }
  const evs = evOf(state.cursor);
  return `<div class="grid">${cells}</div>
    <div class="dayhead">${fmtDate(state.cursor)}</div>
    ${evs.map((e) => `<div class="evbox c-${categoryOf(e.title)} press" data-edit="${e.id}" style="margin-bottom:6px"><div>${esc(e.title)}${calChip(e)}<small>${timeLabel(e)}</small></div><div class="ed"><span class="pen">編集</span></div></div>`).join('') || '<div class="empty" style="padding:10px">予定はありません</div>'}
    <div style="text-align:center;margin-top:10px"><button class="btn press" data-goday="${state.cursor}">この日の提案を見る ›</button></div>`;
}

// ---------- 提案（スワイプ） ----------
function cardBody(c) {
  if (c.type === 'ad') {
    return `<div class="hero">${esc(c.ad.brand)}</div><span class="badge">PR</span>
      <h3>${esc(c.ad.title)}</h3><p>${esc(c.ad.body)}</p><a class="cta" href="#" onclick="return false">${esc(c.ad.cta)}</a>`;
  }
  if (c.type === 'dayplan') {
    return `${hero(c.stops[0].item)}<span class="badge">DAY PLAN</span><span class="badge" style="--fg:#111">${fmtDate(c.date)}</span>
      <h3>${fmtDate(c.date)}を、まるごと。</h3>
      ${c.stops.map((s) => `<div class="stop"><b>${s.time}</b><div>${esc(s.item.title)}<div style="margin-top:3px">${srcChip(s.item)}</div></div></div>`).join('')}
      <div class="more">タップして記事を読む</div>`;
  }
  const i = c.item;
  const art = articleFor(i);
  return `${hero(i)}<span class="badge">${TYPE_NAMES[c.type]}</span>
    <h3>${esc(i.title)}</h3><p>${esc(i.body)}</p><blockquote class="qt" style="${magStyle(i)}">“${esc(art.quote)}”${srcChip(i)}</blockquote><p class="reason">${esc(c.label)}｜${esc(c.reason)}</p>
    <div class="more">${esc(i.mag)} の記事を読む</div>`;
}

// ---------- 編集部（架空の10誌） ----------
function shelf() {
  return `<div class="shelf">${Object.entries(MAGS).map(([id, m]) => `<button class="cover f-${m.font} press" data-mag="${id}" style="--mc:${m.c};--mb:${m.bg}"><span class="cn">${esc(m.name)}</span><span class="cg">${esc(m.genre)}</span></button>`).join('')}</div>`;
}

// 画面上部の「編集部からのおすすめ」マーキー
const TICKER_IDS = ['e03', 'b01', 'g01', 'a09', 'e01', 'd03', 't01', 'a05', 'e02', 'a07'];
function renderTicker() {
  const items = TICKER_IDS.map((id) => ARCHIVE.find((x) => x.id === id)).filter(Boolean);
  const one = items.map((x) => `<button data-tk="${x.id}" style="--c:${MAGS[x.magId].c}"><i class="f-${MAGS[x.magId].font}">${esc(x.mag)}</i>${esc(x.title.replace(/^【.*?】/, ''))}</button>`).join('');
  $('#ticker').innerHTML = `<span class="lbl">EDITOR'S PICK</span><div class="mw"><div class="track">${one}${one}</div></div>`;
  $('#ticker').querySelectorAll('[data-tk]').forEach((b) => (b.onclick = () => openArticle(ARCHIVE.find((x) => x.id === b.dataset.tk), null)));
}

function openMag(id) {
  const m = MAGS[id];
  const items = ARCHIVE.filter((x) => x.magId === id);
  openSheet(`<div class="art" style="--mc:${m.c};--mb:${m.bg}">
    <div class="mast f-${m.font}"><b>${esc(m.name)}</b><small>${esc(m.genre)}</small></div>
    <div class="photo print"><img src="${photoUrl(items[0], 1, 900, 600)}" alt="" onerror="this.remove()"><i>${esc(m.tag)}</i></div>
    <div class="by">${esc(m.kana)}（架空の雑誌）｜収録 ${items.length} 本</div>
    ${items.map((x) => `<div class="sug-card t-gap press" data-it="${x.id}" style="margin-top:8px">${thumb(x)}<div class="tx"><div class="ti">${esc(x.title)}</div><div class="src">${srcChip(x)}</div></div><span class="go">›</span></div>`).join('')}</div>`, (s) => {
  }, { label: m.name, sub: m.genre, c: m.c, font: m.font });
}

function renderSuggest() {
  const build = state.mode === 'outing' ? outingDeck : prepDeck;
  if (!state.decks[state.mode]) state.decks[state.mode] = build({ events: state.events, today, archive: ARCHIVE, ads: ADS, variant: state.variant, scope: state.scope });
  const deck = state.decks[state.mode];
  const [top, next] = deck;
  const seg = `<div class="seg"><button data-m="outing" class="${state.mode === 'outing' ? 'on' : ''}">おでかけ提案</button><button data-m="prep" class="${state.mode === 'prep' ? 'on' : ''}">予定をもっと良く</button></div>`;
  const sub = state.mode === 'outing' ? '予定のすき間に合う、お店・イベントを編集部が選びました。' : '会食→手土産、海→サングラスなど、予定に必要な準備を提案します。';
  view.innerHTML = seg + shelf() + `<p class="hint" style="margin:0 0 10px">${sub}</p>` + (top ? `
    <div class="deck">
      ${next ? `<div class="card under t-${next.type}">${cardBody(next)}</div>` : ''}
      <div class="card front pop t-${top.type}" id="top"><div class="stamp like">保存 ♥</div><div class="stamp nope">違う</div>${cardBody(top)}</div>
    </div>
    <div class="actions"><button class="n" id="nope" aria-label="違う">✕</button><button class="y" id="like" aria-label="保存">♥</button></div>
    <p class="hint">← 左スワイプで却下 ／ 右スワイプで保存 →　（タップで記事）</p>`
    : `<div class="empty">この予定への提案は以上です。<br><br><button class="btn press" id="more">新しい提案をもらう</button></div>`);

  view.querySelectorAll('.seg button').forEach((b) => (b.onclick = () => { state.mode = b.dataset.m; render(); }));
  view.querySelectorAll('.cover').forEach((b) => (b.onclick = () => openMag(b.dataset.mag)));
  if (!top) { $('#more').onclick = () => { state.variant++; state.decks = {}; render(); }; return; }

  const el = $('#top');
  const decide = (like) => {
    if (like) toggleSaveOnly(top);
    state.decks[state.mode] = deck.slice(1);
    el.style.transform = `translateX(${like ? 520 : -520}px) rotate(${like ? 22 : -22}deg)`;
    el.style.opacity = '0'; el.style.transition = 'transform .25s ease-in, opacity .25s';
    setTimeout(render, 230);
  };
  let sx = null, moved = 0;
  const drag = (dx) => {
    el.style.transition = 'none'; el.style.animation = 'none';
    el.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
    $('.like', el).style.opacity = Math.min(1, Math.max(0, dx / 90));
    $('.nope', el).style.opacity = Math.min(1, Math.max(0, -dx / 90));
  };
  el.onpointerdown = (e) => { if (e.target.closest('a')) return; sx = e.clientX; moved = 0; el.setPointerCapture(e.pointerId); };
  el.onpointermove = (e) => { if (sx === null) return; moved = e.clientX - sx; if (Math.abs(moved) > 6) drag(moved); };
  el.onpointerup = () => {
    if (sx === null) return;
    sx = null; el.style.transition = '';
    if (Math.abs(moved) > 100) return decide(moved > 0);
    el.style.transform = ''; el.querySelectorAll('.stamp').forEach((s) => (s.style.opacity = 0));
    if (Math.abs(moved) <= 6) openCard(top);
  };
  el.onpointercancel = () => { sx = null; el.style.transform = ''; };
  $('#like').onclick = () => decide(true);
  $('#nope').onclick = () => decide(false);
}
function toggleSaveOnly(c) { if (c.type !== 'ad' && !isSaved(c.id)) { state.saved.unshift({ id: c.id, card: c }); persist(); toast('保存しました ♥'); burst(); } }

// ---------- 保存 ----------
function renderSaved() {
  const items = state.saved.map((s) => {
    const c = s.card; cardIndex.set(c.id, c);
    const em = thumb(c.type === 'dayplan' ? c.stops[0].item : c.item);
    const ti = c.type === 'dayplan' ? `${fmtDate(c.date)}の一日プラン` : c.item.title;
    const src = c.type === 'dayplan' ? [...new Set(c.stops.map((x) => x.item.mag))].join(' / ') : `${c.item.mag} ${FORMAT_NAME[c.item.format]}`;
    return `<div class="saved t-${c.type} press rise" data-card="${c.id}">${em}<div><div class="ti">${esc(ti)}</div><small>${fmtDate(c.date)}・${esc(src)}</small></div></div>`;
  }).join('');
  view.innerHTML = `<div class="nav"><h2>♥ 保存した提案</h2></div>${items || '<div class="empty">提案タブで右にスワイプすると、ここに溜まります。</div>'}
    <button class="resetbtn" id="reset">デモ用の予定にリセット</button>`;
  bindCards(view);
  $('#reset').onclick = () => { state.events = demoEvents(); state.saved = []; touched(); toast('デモの予定に戻しました'); render(); };
}

function renderScope() {
  const el = $('#scope');
  el.innerHTML = [['life', 'LIFE'], ['work', 'WORK'], ['all', 'BOTH']].map(([k, l]) => `<button data-s="${k}" class="${state.scope === k ? 'on' : ''}">${l}</button>`).join('');
  el.querySelectorAll('button').forEach((b) => (b.onclick = () => { state.scope = b.dataset.s; touched(); render(); }));
}
function render() {
  renderScope();
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === state.tab));
  view.scrollTop = 0;
  if (state.tab === 'calendar') renderCalendar(); else if (state.tab === 'suggest') renderSuggest(); else renderSaved();
}
document.querySelectorAll('.tabs button').forEach((b) => (b.onclick = () => { state.tab = b.dataset.tab; render(); }));
renderTicker();
render();
// #article=a01 / #mag=umami で記事・雑誌シートを直接開く（共有・確認用）
{
  const [k, v] = location.hash.slice(1).split('=');
  if (k === 'article' && ARCHIVE.some((x) => x.id === v)) openArticle(ARCHIVE.find((x) => x.id === v), null);
  if (k === 'mag' && MAGS[v]) openMag(v);
}