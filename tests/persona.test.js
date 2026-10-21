import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PERSONA, checkPost } from '../src/editor/persona.js';

test('on-brand casual post scores high', () => {
  const r = checkPost(DEFAULT_PERSONA, '今日は厚底スニーカーで抜け感出してみたよ♡ みんなはどっち派？');
  assert.ok(r.score >= 80);
});

test('NG word caps the score and polite tone is flagged', () => {
  const r = checkPost(DEFAULT_PERSONA, 'この服は絶対おすすめです。');
  assert.ok(r.score <= 40);
  assert.equal(r.checks.find((c) => c.id === 'ng').status, 'fail');
  assert.equal(r.checks.find((c) => c.id === 'tone').status, 'fail');
});

test('empty draft yields no checks', () => {
  assert.equal(checkPost(DEFAULT_PERSONA, '  ').checks.length, 0);
});
