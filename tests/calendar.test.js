import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARCHIVE, ADS } from '../calendar/archive.js';
import { ARTICLES, articleFor } from '../calendar/articles.js';
import { findGaps, detectMoments, categoryOf, dayTimeline, outingDeck, prepDeck, AD_EVERY } from '../calendar/engine.js';

const ev = (date, title, start, end) => ({ id: `${date}${title}`, date, title, start, end });

test('全アーカイブに記事が紐づく', () => {
  for (const it of ARCHIVE) { assert.ok(ARTICLES[it.id], it.id); assert.ok(articleFor(it).p.length >= 1); }
});

test('findGaps: 予定の間の空きを返す', () => {
  assert.deepEqual(findGaps([{ start: '10:00', end: '11:00' }, { start: '15:00', end: '16:00' }]), [{ start: 540, end: 600 }, { start: 660, end: 900 }, { start: 960, end: 1260 }]);
  assert.deepEqual(findGaps([{ title: '出張' }]), []);
});

test('モーメントとカテゴリ', () => {
  assert.deepEqual(detectMoments('取引先と会食'), ['gift']);
  assert.ok(detectMoments('海でBBQ').includes('beach'));
  assert.equal(categoryOf('定例会議'), 'work');
  assert.equal(categoryOf('デート'), 'date');
});

test('1日: 予定の間に提案が時系列で入り、会食には手土産の準備提案', () => {
  const day = new Date(2026, 9, 23);
  const events = [ev('2026-10-23', '朝ミーティング', '10:00', '11:00'), ev('2026-10-23', '取引先と会食', '19:00', '21:00')];
  const { rows, ad } = dayTimeline(day, events, ARCHIVE, ADS);
  assert.ok(rows.some((r) => r.type === 'gap'));
  assert.deepEqual(rows.map((r) => r.start), [...rows.map((r) => r.start)].sort((a, b) => a - b));
  const dinner = rows.find((r) => r.type === 'event' && r.e.title.includes('会食'));
  assert.ok(dinner.prep.some((c) => c.item.kind === 'gift'));
  assert.ok(ad);
});

test('海の予定にはサングラス等の準備提案', () => {
  const { rows } = dayTimeline(new Date(2026, 9, 24), [ev('2026-10-24', '海でBBQ', '11:00', '16:00')], ARCHIVE, ADS);
  assert.ok(rows[0].prep.some((c) => c.item.id === 'b01'));
});

test('空いている日は一日プラン', () => {
  const { rows } = dayTimeline(new Date(2026, 9, 25), [], ARCHIVE, ADS);
  assert.equal(rows[0].type, 'dayplan');
});

test('おでかけデッキ: イベント・2か月先・広告を含み、広告は連続しない', () => {
  const today = new Date(2026, 9, 23);
  const events = [ev('2026-10-23', '会食', '19:00', '21:00')];
  const a = outingDeck({ events, today, archive: ARCHIVE, ads: ADS });
  const b = outingDeck({ events, today, archive: ARCHIVE, ads: ADS, variant: 1 });
  for (const t of ['event', 'far', 'ad']) assert.ok(a.some((c) => c.type === t), t);
  assert.notDeepEqual(a.map((c) => c.id), b.map((c) => c.id));
  let streak = 0;
  for (const c of a) { streak = c.type === 'ad' ? 0 : streak + 1; assert.ok(streak <= AD_EVERY); }
});

test('準備デッキ: 予定に紐づく提案のみ', () => {
  const today = new Date(2026, 9, 23);
  const d = prepDeck({ events: [ev('2026-10-23', '取引先と会食', '19:00', '21:00')], today, archive: ARCHIVE, ads: ADS });
  assert.ok(d.filter((c) => c.type === 'prep').every((c) => c.item.kind === 'gift'));
  assert.ok(d.length >= 2);
});
