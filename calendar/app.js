import { ARCHIVE, ADS } from './archive.js';
import { generateDeck, agentForDay, dateKey, parseKey, addDays } from './engine.js';

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const today = new Date(new Date().setHours(0, 0, 0, 0));
const state = {
  tab: 'calendar',
  month: new Date(today.getFullYear(), today.getMonth(), 1),
  selected: dateKey(today),
  adding: false,
  events: load('hima.events', []),
  saved: load('hima.saved', []),
  variant: 0,
  deck: null,
  agentVariant: 0,
};
const persist = () => { save('hima.events', state.events); save('hima.saved', state.saved); };

const view = $('#view');
const DOW = ['日', '月', '火', '水', '木', '金', '土'];
const fmtDate = (k) => { const d = parseKey(k); return `${d.getMonth() + 1}/${d.getDate()}（${DOW[d.getDay()]}）`; };

function render() {
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === state.tab));
  if (state.tab === 'calendar') renderCalendar();
  else if (state.tab === 'suggest') renderSuggest();
  else renderSaved();
}

// ---------- 提案カード（共通） ----------
function cardBody(c) {
  if (c.type === 'ad') {
    return `<span class="pr">PR</span><span class="mag">${esc(c.ad.brand)}</span>
      <div class="emoji">${c.ad.emoji}</div><h3>${esc(c.ad.title)}</h3><p>${esc(c.ad.body)}</p>
      <a class="cta" href="#" onclick="return false">${esc(c.ad.cta)}</a>`;
  }
  if (c.type === 'dayplan') {
    return `<span class="mag">編集部の一日プラン</span><span class="when">${fmtDate(c.date)}</span>
      <h3>${fmtDate(c.date)}を、まるごと。</h3><p class="reason">${esc(c.reason)}</p>
      ${c.stops.map((s) => `<div class="stop"><b>${s.time}</b><div>${s.item.emoji} ${esc(s.item.title)}<small>${esc(s.item.mag)}「${esc(s.item.issue)}」・${esc(s.item.area)}</small></div></div>`).join('')}`;
  }
  const i = c.item;
  return `<span class="mag">${esc(i.mag)}</span><span class="when">${fmtDate(c.date)}</span>
    <div class="emoji">${i.emoji}</div><div class="meta">${esc(c.label)}</div>
    <h3>${esc(i.title)}</h3><p>${esc(i.body)}</p>
    <p class="reason">${esc(c.reason)}</p><div class="meta">${esc(i.mag)}「${esc(i.issue)}」より（サンプル）・${esc(i.area)}</div>`;
}

// ---------- カレンダー ----------
function renderCalendar() {
  const y = state.month.getFullYear(), m = state.month.getMonth();
  const first = new Date(y, m, 1);
  const start = addDays(first, -first.getDay());
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i), k = dateKey(d);
    const evs = state.events.filter((e) => e.date === k);
    cells.push(`<div class="cell ${d.getMonth() !== m ? 'out' : ''} ${k === dateKey(today) ? 'today' : ''} ${k === state.selected ? 'sel' : ''}" data-d="${k}">
      <span class="n">${d.getDate()}</span>${evs.slice(0, 2).map((e) => `<span class="chip">${esc(e.title)}</span>`).join('')}${evs.length > 2 ? `<span class="chip">+${evs.length - 2}</span>` : ''}</div>`);
  }
  const dayEvents = state.events.filter((e) => e.date === state.selected).sort((a, b) => (a.start || '').localeCompare(b.start || ''));
  const agent = agentForDay(parseKey(state.selected), state.events, ARCHIVE, ADS, state.agentVariant);

  view.innerHTML = `
    <div class="nav"><button id="prev">‹</button><h2>${y}年${m + 1}月</h2><button id="next">›</button></div>
    <div class="grid">${DOW.map((d) => `<div class="dow">${d}</div>`).join('')}${cells.join('')}</div>
    <section class="day">
      <h3>${fmtDate(state.selected)}<button class="btn primary" id="add">＋ 予定</button></h3>
      ${state.adding ? `<form class="add" id="form">
        <input name="title" placeholder="予定（例：会食、海、デート）" required maxlength="60" />
        <div class="row"><input type="time" name="start" /><input type="time" name="end" /></div>
        <div class="row"><button class="btn primary" type="submit">追加</button><button class="btn" type="button" id="cancel">キャンセル</button></div>
      </form>` : ''}
      ${dayEvents.length ? dayEvents.map((e) => `<div class="ev"><span>${e.start ? `${e.start}${e.end ? '–' + e.end : ''} ` : '終日 '}${esc(e.title)}</span><button data-del="${e.id}" aria-label="削除">✕</button></div>`).join('') : '<p class="empty">予定はありません</p>'}
    </section>
    <section class="agent">
      <h4>編集部エージェントからの提案</h4>
      ${agent.map((c) => `<div class="card ${c.type === 'ad' ? 'ad' : ''}" style="margin-bottom:16px">${cardBody(c)}</div>`).join('')}
      <button class="btn" id="reroll">別の提案を見る</button>
    </section>`;

  $('#prev').onclick = () => { state.month = new Date(y, m - 1, 1); render(); };
  $('#next').onclick = () => { state.month = new Date(y, m + 1, 1); render(); };
  view.querySelectorAll('.cell').forEach((c) => (c.onclick = () => { state.selected = c.dataset.d; state.adding = false; state.agentVariant = 0; render(); }));
  $('#add').onclick = () => { state.adding = true; render(); };
  $('#reroll').onclick = () => { state.agentVariant++; render(); };
  view.querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => { state.events = state.events.filter((e) => e.id !== b.dataset.del); state.deck = null; persist(); render(); }));
  if (state.adding) {
    $('#cancel').onclick = () => { state.adding = false; render(); };
    $('#form').onsubmit = (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      const title = String(f.get('title')).trim();
      if (!title) return;
      state.events.push({ id: crypto.randomUUID(), date: state.selected, title, start: f.get('start') || '', end: f.get('end') || '' });
      state.adding = false; state.deck = null; persist(); render();
    };
  }
}

// ---------- 提案（スワイプ） ----------
function renderSuggest() {
  if (!state.deck) state.deck = generateDeck({ events: state.events, today, archive: ARCHIVE, ads: ADS, variant: state.variant });
  const [top, next] = state.deck;
  if (!top) {
    view.innerHTML = `<p class="empty" style="text-align:center;margin-top:60px">今日の提案は以上です。</p><p style="text-align:center"><button class="btn primary" id="more">新しい提案をもらう</button></p>`;
    $('#more').onclick = () => { state.variant++; state.deck = null; render(); };
    return;
  }
  view.innerHTML = `
    <div class="deck">
      ${next ? `<div class="card under ${next.type === 'ad' ? 'ad' : ''}">${cardBody(next)}</div>` : ''}
      <div class="card top ${top.type === 'ad' ? 'ad' : ''}" id="top">
        <div class="stamp like">気になる</div><div class="stamp nope">違う</div>${cardBody(top)}
      </div>
    </div>
    <div class="actions"><button id="nope" aria-label="違う">✕</button><button id="like" aria-label="気になる">♥</button></div>
    <p class="hint">右へスワイプ＝気になる ／ 左へスワイプ＝違う（次の提案へ）</p>`;

  const el = $('#top');
  const decide = (like) => {
    if (like && top.type !== 'ad') state.saved.unshift({ id: top.id, date: top.date, card: top });
    state.saved = state.saved.filter((s, i, a) => a.findIndex((x) => x.id === s.id) === i);
    state.deck = state.deck.slice(1);
    persist();
    el.style.transform = `translateX(${like ? 600 : -600}px) rotate(${like ? 25 : -25}deg)`;
    setTimeout(render, 180);
  };
  let sx = null;
  const setDrag = (dx) => {
    el.style.transition = 'none';
    el.style.transform = `translateX(${dx}px) rotate(${dx / 20}deg)`;
    el.querySelector('.like').style.opacity = Math.min(1, Math.max(0, dx / 100));
    el.querySelector('.nope').style.opacity = Math.min(1, Math.max(0, -dx / 100));
  };
  el.onpointerdown = (e) => { if (e.target.closest('a')) return; sx = e.clientX; el.setPointerCapture(e.pointerId); };
  el.onpointermove = (e) => { if (sx !== null) setDrag(e.clientX - sx); };
  el.onpointerup = (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx; sx = null;
    el.style.transition = '';
    if (Math.abs(dx) > 100) decide(dx > 0);
    else { el.style.transform = ''; el.querySelectorAll('.stamp').forEach((s) => (s.style.opacity = 0)); }
  };
  $('#like').onclick = () => decide(true);
  $('#nope').onclick = () => decide(false);
}

// ---------- 保存 ----------
function renderSaved() {
  view.innerHTML = `<div class="nav"><h2>気になる</h2></div>` + (state.saved.length
    ? state.saved.map((s) => {
      const c = s.card;
      const title = c.type === 'dayplan' ? `${fmtDate(c.date)}の一日プラン` : c.item.title;
      const src = c.type === 'dayplan' ? c.stops.map((x) => x.item.mag).join(' / ') : `${c.item.mag}「${c.item.issue}」`;
      return `<div class="saved-item">${c.type === 'dayplan' ? '🗓️' : c.item.emoji} ${esc(title)}<small>${fmtDate(c.date)}・${esc(src)}</small></div>`;
    }).join('')
    : '<p class="empty">提案タブで右にスワイプすると、ここに溜まります。</p>');
}

document.querySelectorAll('.tabs button').forEach((b) => (b.onclick = () => { state.tab = b.dataset.tab; render(); }));
render();
