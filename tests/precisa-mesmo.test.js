import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CENARIOS, OPCOES, avaliarEscolha, avaliarJustificativa, resumo } from '../site/js/logic/precisa-mesmo.js';

test('entre 6 e 8 cenários, todos com recomendação válida', () => {
  assert.ok(CENARIOS.length >= 6 && CENARIOS.length <= 8);
  for (const c of CENARIOS) {
    assert.ok(OPCOES[c.recomendada], c.id);
    for (const a of c.aceitaveis) assert.ok(OPCOES[a], `${c.id}:${a}`);
  }
});

test('a maioria dos cenários tem recusa como resposta (treina dizer não)', () => {
  const recusas = CENARIOS.filter((c) => c.recomendada === 'unico').length;
  assert.ok(recusas >= 3);
});

test('avaliarEscolha diferencia recomendada, aceitável e diferente', () => {
  assert.equal(avaliarEscolha('typo', 'unico').resultado, 'recomendada');
  assert.equal(avaliarEscolha('speedrun', 'supervisor').resultado, 'aceitavel');
  assert.equal(avaliarEscolha('crud', 'paralelo').resultado, 'diferente');
});

test('justificativa precisa ter tamanho e critério', () => {
  assert.equal(avaliarJustificativa('porque sim'), 'curta');
  assert.equal(avaliarJustificativa('acho que fica mais bonito desse jeito'), 'sem-criterio');
  assert.equal(avaliarJustificativa('as tasks são independentes e cabem em paralelo'), 'ok');
});

test('resumo conta recusas corretas', () => {
  const r = resumo({ typo: { escolha: 'unico' }, crud: { escolha: 'paralelo' }, speedrun: { escolha: 'paralelo' } });
  assert.equal(r.respondidas, 3);
  assert.equal(r.recomendadas, 2);
  assert.equal(r.recusas, 1);
});
