import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DESCRICOES, PEDIDOS, avaliar, dispara, palavras, descricaoPorId } from '../site/js/logic/disparo-skill.js';

test('palavras tira acento, caixa e pontuação', () => {
  assert.deepEqual(palavras('Corrija o código, já!'), ['corrija', 'o', 'codigo', 'ja']);
});

test('descrição vaga deixa de disparar nos pedidos certos e dispara no errado', () => {
  const r = avaliar('vaga');
  assert.equal(r.falsosNegativos, 4);
  assert.equal(r.falsosPositivos, 1);
});

test('descrição genérica dispara onde não deve', () => {
  const r = avaliar('generica');
  assert.ok(r.falsosPositivos >= 3);
  assert.ok(r.acertos < r.total);
});

test('descrição específica ainda erra um caso, a completa acerta todos', () => {
  const e = avaliar('especifica');
  assert.equal(e.falsosPositivos, 1);
  assert.equal(e.linhas.find((l) => l.id === 'p10').resultado, 'falso-positivo');
  const c = avaliar('completa');
  assert.equal(c.acertos, c.total);
});

test('a ordem de melhora é monotônica nos acertos', () => {
  const a = DESCRICOES.map((d) => avaliar(d.id).acertos);
  assert.ok(a[0] <= a[2] && a[1] <= a[2] && a[2] <= a[3]);
});

test('pedido de bug não dispara a skill completa e id inválido lança erro', () => {
  assert.equal(dispara(descricaoPorId('completa'), 'Corrija o bug no POST /agendamentos'), false);
  assert.throws(() => descricaoPorId('x'));
  assert.ok(PEDIDOS.length >= 8);
});
