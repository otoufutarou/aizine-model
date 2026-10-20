import test from 'node:test';
import assert from 'node:assert/strict';
import { STYLE_IDS, validateOutfit, findSilhouetteClashes } from '../src/fashion/styleRules.js';
import { OUTFITS, STYLE_OUTFITS, getOutfit } from '../src/fashion/outfits.js';
import { parseCommand } from '../src/chat/parser.js';

test('four style outfits exist and satisfy their rules', () => {
  assert.deepEqual(STYLE_OUTFITS.map((o) => o.id), STYLE_IDS);
  STYLE_OUTFITS.forEach((o) => assert.deepEqual(validateOutfit(o), []));
});
test('silhouettes are distinct and ids unique', () => {
  assert.deepEqual(findSilhouetteClashes(OUTFITS), []);
  assert.equal(new Set(OUTFITS.map((o) => o.id)).size, OUTFITS.length);
});
test('validator catches a broken outfit', () => {
  const bad = { ...getOutfit('gyaru'), bottom: { type: 'baggy' }, accessories: [] };
  assert.ok(validateOutfit(bad).length >= 2);
});
test('every outfit has the five slots', () => {
  OUTFITS.forEach((o) => ['hat', 'top', 'bottom', 'shoes', 'accessories'].forEach((k) => assert.ok(o[k] !== undefined, `${o.id}.${k}`)));
});
test('chat selects the new styles', () => {
  const id = (t) => parseCommand(t).actions.map((a) => `${a.type}:${a.id}`);
  assert.deepEqual(id('Kストリートにして'), ['outfit:kstreet']);
  assert.deepEqual(id('ネオギャルにして'), ['outfit:gyaru']);
  assert.deepEqual(id('ミニスカートがいい'), ['outfit:gyaru']);
  assert.deepEqual(id('スポーツmixにして'), ['outfit:sporty']);
  assert.deepEqual(id('シティモードに着替えて'), ['outfit:city']);
});
