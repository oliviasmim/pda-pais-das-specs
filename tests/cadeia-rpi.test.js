import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ETAPAS, DEFEITOS, avaliar, responder, alcanceDoErro, placar } from '../site/js/logic/cadeia-rpi.js';

test('há 6 defeitos e cada etapa nasce em pelo menos dois', () => {
  assert.equal(DEFEITOS.length, 6);
  for (const e of Object.keys(ETAPAS)) {
    assert.ok(DEFEITOS.filter((d) => d.nasceu === e).length >= 2, e);
  }
});

test('ids únicos e etapa de origem válida', () => {
  const ids = new Set(DEFEITOS.map((d) => d.id));
  assert.equal(ids.size, DEFEITOS.length);
  for (const d of DEFEITOS) assert.ok(ETAPAS[d.nasceu], d.id);
});

test('avaliar dá 1 para a etapa certa e 0 para as outras', () => {
  assert.equal(avaliar('vaga-livre', 'implement').nota, 1);
  assert.equal(avaliar('vaga-livre', 'plan').nota, 0);
  assert.equal(avaliar('vaga-livre', 'plan').correta, 'implement');
  assert.equal(avaliar('inexistente', 'plan').nota, 0);
});

test('responder ignora id ou etapa inválidos e não muta', () => {
  const r0 = {};
  const r1 = responder(r0, 'email', 'research');
  assert.deepEqual(r0, {});
  assert.equal(r1.email, 'research');
  assert.deepEqual(responder(r1, 'email', 'nada'), r1);
});

test('alcance do erro cresce de implement para research', () => {
  assert.ok(ETAPAS.research.ordem > ETAPAS.plan.ordem && ETAPAS.plan.ordem > ETAPAS.implement.ordem);
  assert.match(alcanceDoErro('email'), /milhares/);
  assert.match(alcanceDoErro('vaga-livre'), /fatia/);
});

test('placar conta acertos por etapa', () => {
  const r = { email: 'research', concorrencia: 'implement', mensagem: 'implement' };
  const p = placar(r);
  assert.equal(p.pontos, 2);
  assert.equal(p.respondidas, 3);
  assert.equal(p.completo, false);
  assert.equal(p.porEtapa.research.acertos, 1);
});

test('nenhum texto usa o domínio proibido', () => {
  const texto = JSON.stringify(DEFEITOS);
  assert.doesNotMatch(texto, /carteira|saldo/i);
});
