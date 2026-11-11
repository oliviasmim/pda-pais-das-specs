import { test } from 'node:test';
import assert from 'node:assert/strict';
import { softmax, distribuicao, rng, rodar, leitura, CANDIDATOS } from '../site/js/logic/temperatura.js';

test('softmax soma 1 e preserva a ordem', () => {
  const p = softmax([3, 2, 1], 1);
  assert.ok(Math.abs(p.reduce((a, b) => a + b, 0) - 1) < 1e-9);
  assert.ok(p[0] > p[1] && p[1] > p[2]);
});

test('temperatura 0 escolhe só o token mais provável', () => {
  const r = rodar({ temperatura: 0, vezes: 5, semente: 7 });
  assert.equal(r.distintas, 1);
  assert.equal(r.saidas[0], CANDIDATOS[0].token);
});

test('temperatura alta achata a distribuição', () => {
  const baixa = distribuicao(0.3)[0].p;
  const alta = distribuicao(2)[0].p;
  assert.ok(alta < baixa);
  assert.ok(distribuicao(2).at(-1).p > distribuicao(0.3).at(-1).p);
});

test('mesma semente, mesmas saídas', () => {
  assert.deepEqual(rodar({ temperatura: 1.2, semente: 3 }).saidas, rodar({ temperatura: 1.2, semente: 3 }).saidas);
  const a = rng(5);
  assert.ok(a() >= 0 && a() < 1);
});

test('em temperatura alta aparece mais de uma saída em muitas rodadas', () => {
  assert.ok(rodar({ temperatura: 2, vezes: 30, semente: 11 }).distintas > 1);
});

test('softmax sem candidatos lança erro e leitura responde ao caso 0', () => {
  assert.throws(() => softmax([], 1));
  assert.match(leitura({ distintas: 1, vezes: 5 }, 0), /Temperatura 0/);
});
