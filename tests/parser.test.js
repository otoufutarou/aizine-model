import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCommand } from '../src/chat/parser.js';

const ids = (t) => parseCommand(t).actions.map((a) => `${a.type}:${a.id ?? a.value}`);

test('outfit keywords', () => {
  assert.deepEqual(ids('ガーリーにして'), ['outfit:girly']);
  assert.deepEqual(ids('かっこいいモードがいい'), ['outfit:mode']);
  assert.deepEqual(ids('ストリートに着替えて'), ['outfit:street']);
  assert.deepEqual(ids('ピンクのスカートにして'), ['outfit:girly']);
});
test('pose keywords', () => {
  assert.deepEqual(ids('ピースして'), ['pose:peace']);
  assert.deepEqual(ids('手を振って'), ['pose:wave']);
  assert.deepEqual(ids('ランウェイ歩きして'), ['pose:runway']);
});
test('background keywords disambiguate', () => {
  assert.deepEqual(ids('背景をピンクにして'), ['bg:studio']);
  assert.deepEqual(ids('夜の街の背景'), ['bg:night']);
  assert.deepEqual(ids('背景をシルバーに'), ['bg:silver']);
  assert.deepEqual(ids('ネオン'), ['bg:night']);
});
test('combined, spin, reset, fallback', () => {
  assert.deepEqual(ids('モードにしてピースして'), ['outfit:mode', 'pose:peace']);
  assert.deepEqual(ids('くるくる回って'), ['spin:true']);
  assert.deepEqual(ids('回転止めて'), ['spin:false']);
  assert.deepEqual(ids('リセット'), ['reset:undefined']);
  assert.equal(parseCommand('あいうえお').actions.length, 0);
});

test('expression keywords are independent of pose and outfit', () => {
  assert.deepEqual(ids('笑って'), ['expression:smile']);
  assert.deepEqual(ids('ウインクして'), ['expression:wink']);
  assert.deepEqual(ids('クールな顔して'), ['expression:cool']);
  assert.deepEqual(ids('ピースして'), ['pose:peace']);
  assert.deepEqual(ids('ウインクしてピース'), ['expression:wink', 'pose:peace']);
});
