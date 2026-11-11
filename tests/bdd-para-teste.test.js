import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerCenario, avaliarCenario, gerarTeste, CENARIOS } from '../site/js/logic/bdd-para-teste.js';

test('lê nome, Dado, Quando, Então e continuações', () => {
  const c = lerCenario(CENARIOS[0].texto);
  assert.equal(c.nome, 'jovem agenda uma vaga livre');
  assert.equal(c.dado.length, 1);
  assert.equal(c.quando.length, 1);
  assert.equal(c.entao.length, 2);
  assert.match(c.entao[1], /livre: false/);
});

test('aceita Given/When/Then', () => {
  const c = lerCenario('Scenario: x\nGiven a\nWhen b\nThen c 1');
  assert.deepEqual([c.dado, c.quando, c.entao], [['a'], ['b'], ['c 1']]);
});

test('cenários do exemplo: bons sem aviso, defeituosos com o aviso esperado', () => {
  for (const ex of CENARIOS) {
    const tipos = avaliarCenario(lerCenario(ex.texto)).map((a) => a.tipo);
    assert.deepEqual([...new Set(tipos)].sort(), [...ex.esperado].sort(), ex.id);
  }
});

test('cenário incompleto lista o que falta', () => {
  const campos = avaliarCenario(lerCenario('Cenário: só nome')).map((a) => a.campo);
  assert.deepEqual(campos, ['dado', 'quando', 'entao']);
});

test('gera um teste por cenário com o nome do cenário', () => {
  const codigo = gerarTeste(lerCenario(CENARIOS[1].texto));
  assert.match(codigo, /test\("vaga já reservada não pode ser agendada de novo"/);
  assert.match(codigo, /\/\/ Dado: que a vaga 1 está com livre: false/);
  assert.match(codigo, /\/\/ Então: a resposta é 409/);
  assert.equal((codigo.match(/^test\(/gm) || []).length, 1);
});
