import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPRESSIONS, EYE, BROW } from '../src/avatar/expressions.js';
import { POSES } from '../src/data/poses.js';

test('four expressions, every one draws both eyes and brows from shared params', () => {
  assert.deepEqual(EXPRESSIONS.map((e) => e.id), ['normal', 'smile', 'wink', 'cool']);
  for (const e of EXPRESSIONS) {
    assert.ok(e.brow.angle > 0, `${e.id}: tsuri-mayu keeps outer end up`);
    assert.ok(e.eyes.left && e.eyes.right);
    if (Object.values(e.eyes).includes('closed')) assert.ok(e.arc.rise > 0);
    if (Object.values(e.eyes).includes('open')) assert.ok(e.open.lidCtrl < 0);
  }
  assert.ok(EYE.w > 0 && BROW.half > 0);
});

test('poses no longer carry a face', () => {
  assert.ok(POSES.every((p) => !('face' in p)));
});
