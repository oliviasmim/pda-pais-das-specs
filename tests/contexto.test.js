import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simular, comparar, zona, ACOES, JANELA, BASE_PRINCIPAL } from '../site/js/logic/contexto.js';

test('zonas: smart até 40%, dumb depois, cheia a partir de 90%', () => {
  assert.equal(zona(0.4), 'smart');
  assert.equal(zona(0.41), 'dumb');
  assert.equal(zona(0.95), 'cheia');
});

test('sem delegar, o principal acumula todos os tokens', () => {
  const r = simular({ delegar: false });
  const soma = BASE_PRINCIPAL + ACOES.reduce((s, a) => s + a.tokens, 0);
  assert.equal(r.principalFinal, soma);
  assert.equal(r.gastoSubagents, 0);
  assert.equal(r.zonaFinal, 'dumb');
  assert.ok(r.primeiroDumb > 0);
});

test('delegando investigação, o principal fica na smart zone', () => {
  const r = simular({ delegar: true });
  assert.ok(r.fracaoFinal <= 0.4, `fração ${r.fracaoFinal}`);
  assert.equal(r.zonaFinal, 'smart');
  assert.ok(r.passos.some((p) => p.delegada));
  assert.ok(r.passos.filter((p) => p.acao.tipo === 'implementar').every((p) => !p.delegada));
});

test('subagent economiza janela mas custa mais tokens no total', () => {
  const c = comparar();
  assert.ok(c.economiaPrincipal > 0);
  assert.ok(c.custoExtra > 0);
  assert.ok(c.com.gastoTotal > c.sem.gastoTotal);
});

test('delegar um conjunto escolhido só delega aqueles ids', () => {
  const r = simular({ delegar: new Set(['log-concorrencia', 'implementar']) });
  const delegadas = r.passos.filter((p) => p.delegada).map((p) => p.acao.id);
  assert.deepEqual(delegadas, ['log-concorrencia']);
  assert.ok(r.picoSubagent < JANELA);
});
