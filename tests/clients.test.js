import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PERSONA } from '../src/editor/persona.js';
import { matchClients, buildRoadmap, planText, CATEGORIES } from '../src/editor/clients.js';

test('default persona fits fashion better than finance', () => {
  const m = matchClients(DEFAULT_PERSONA);
  assert.equal(m.length, CATEGORIES.length);
  const idx = (id) => m.findIndex((x) => x.id === id);
  assert.ok(idx('fashion') < idx('finance'));
  assert.ok(m.every((x, i) => i === 0 || m[i - 1].score >= x.score));
});

test('changing persona axes changes the ranking', () => {
  const calm = { ...DEFAULT_PERSONA, axes: { trend: 30, friendly: 50, mature: 80, edge: 10, active: 50 } };
  const top = matchClients(calm)[0].id;
  assert.notEqual(top, matchClients(DEFAULT_PERSONA)[0].id);
});

test('roadmap has four phases and the plan text lists top categories', () => {
  const m = matchClients(DEFAULT_PERSONA);
  const r = buildRoadmap(DEFAULT_PERSONA, m);
  assert.equal(r.length, 4);
  const text = planText(DEFAULT_PERSONA, m, r);
  assert.ok(text.includes(m[0].name));
});
