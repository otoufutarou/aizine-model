import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARCHIVE, ADS } from '../calendar/archive.js';
import { findGaps, detectMoments, generateDeck, agentForDay, AD_EVERY } from '../calendar/engine.js';

test('findGaps: 予定の間の空きを返す', () => {
  const gaps = findGaps([{ start: '10:00', end: '11:00' }, { start: '15:00', end: '16:00' }]);
  assert.deepEqual(gaps, [{ start: 540, end: 600 }, { start: 660, end: 900 }, { start: 960, end: 1260 }]);
});

test('findGaps: 終日予定は空きなし', () => {
  assert.deepEqual(findGaps([{ title: '出張' }]), []);
});

test('detectMoments', () => {
  assert.deepEqual(detectMoments('取引先と会食'), ['gift']);
  assert.ok(detectMoments('海でBBQ').includes('beach'));
});

test('会食の予定に手土産提案が出る', () => {
  const day = new Date(2026, 9, 24);
  const cards = agentForDay(day, [{ id: 'e1', date: '2026-10-24', title: '会食', start: '19:00', end: '21:00' }], ARCHIVE, ADS);
  assert.ok(cards.some((c) => c.type === 'moment' && c.item.kind === 'gift'));
  assert.ok(cards.some((c) => c.type === 'ad'));
});

test('空いている日は一日プラン', () => {
  const cards = agentForDay(new Date(2026, 9, 24), [], ARCHIVE, ADS);
  assert.equal(cards[0].type, 'dayplan');
  assert.ok(cards[0].stops.length >= 3);
});

test('デッキ: 2か月先の提案と広告が入る / variant で内容が変わる', () => {
  const today = new Date(2026, 9, 23);
  const a = generateDeck({ events: [], today, archive: ARCHIVE, ads: ADS });
  const b = generateDeck({ events: [], today, archive: ARCHIVE, ads: ADS, variant: 1 });
  assert.ok(a.some((c) => c.type === 'far'));
  assert.ok(a.some((c) => c.type === 'ad'));
  assert.notDeepEqual(a.map((c) => c.id), b.map((c) => c.id));
  let streak = 0;
  for (const c of a) { streak = c.type === 'ad' ? 0 : streak + 1; assert.ok(streak <= AD_EVERY); }
});
