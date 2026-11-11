import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OPCOES, QUADRANTES, SITUACOES, avaliar, recomendar, resumo } from '../site/js/logic/eixos-isolamento.js';

test('os dois eixos dão quatro respostas', () => {
  assert.equal(recomendar({ arquivos: false, contexto: false }), 'nenhum');
  assert.equal(recomendar({ arquivos: true, contexto: false }), 'worktree');
  assert.equal(recomendar({ arquivos: false, contexto: true }), 'subagent');
  assert.equal(recomendar({ arquivos: true, contexto: true }), 'ambos');
});

test('as situações cobrem as quatro respostas', () => {
  const respostas = new Set(SITUACOES.map(recomendar));
  assert.deepEqual([...respostas].sort(), Object.keys(OPCOES).sort());
});

test('ids de situação são únicos e todas explicam o porquê', () => {
  assert.equal(new Set(SITUACOES.map((s) => s.id)).size, SITUACOES.length);
  assert.ok(SITUACOES.every((s) => s.porque.length > 30));
});

test('cada quadrante é único', () => {
  const chaves = Object.values(QUADRANTES).map((q) => `${q.col}${q.row}`);
  assert.equal(new Set(chaves).size, 4);
});

test('avaliar compara com a recomendação e devolve o porquê', () => {
  const r = avaliar('tres-tasks', 'subagent');
  assert.equal(r.acertou, false);
  assert.equal(r.certa, 'worktree');
  assert.ok(r.porque);
  assert.equal(avaliar('tres-tasks', 'worktree').acertou, true);
});

test('avaliar rejeita situação ou opção que não existe', () => {
  assert.throws(() => avaliar('x', 'nenhum'));
  assert.throws(() => avaliar('tres-tasks', 'swarm'));
});

test('resumo conta só as respostas reveladas', () => {
  const r = resumo({ 'tres-tasks': { escolha: 'worktree', revelado: true }, pesquisa: { escolha: 'nenhum', revelado: true }, 'um-status': { escolha: 'nenhum' } });
  assert.deepEqual(r, { feitas: 2, acertos: 1, total: SITUACOES.length });
});
