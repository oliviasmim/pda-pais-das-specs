import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITENS, corrigir, placar } from '../site/js/logic/guias-sensores.js';

test('tem entre 12 e 16 itens com ids únicos e explicação', () => {
  assert.ok(ITENS.length >= 12 && ITENS.length <= 16);
  assert.equal(new Set(ITENS.map((i) => i.id)).size, ITENS.length);
  for (const i of ITENS) assert.ok(i.explicacao.length > 20);
});

test('agente de review e hook são sensores; skill é guia', () => {
  assert.equal(corrigir('review-agent', 'sensor').certo, true);
  assert.equal(corrigir('hook', 'sensor').certo, true);
  assert.equal(corrigir('skill', 'guia').certo, true);
  assert.equal(corrigir('skill', 'sensor').certo, false);
});

test('teste escrito antes é os dois; escolher só um lado é parcial', () => {
  assert.equal(corrigir('teste-antes', 'ambos').certo, true);
  const r = corrigir('teste-antes', 'guia');
  assert.equal(r.certo, false);
  assert.equal(r.parcial, true);
});

test('item desconhecido lança erro', () => {
  assert.throws(() => corrigir('nao-existe', 'guia'));
});

test('placar conta certos, parciais e respondidos', () => {
  const p = placar({ skill: 'guia', lint: 'guia', 'teste-antes': 'sensor' });
  assert.deepEqual(p, { certos: 1, parciais: 1, respondidos: 3, total: ITENS.length });
});
