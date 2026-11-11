import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACHADOS, REVISORES, avaliarAchado, pontuacao, matriz, bloqueios, achado } from '../site/js/logic/triagem-achados.js';

test('todo achado tem revisores e prioridade válidos', () => {
  const ids = REVISORES.map((r) => r.id);
  for (const a of ACHADOS) {
    assert.ok(a.pegam.length > 0, a.id);
    for (const p of a.pegam) assert.ok(ids.includes(p), `${a.id}: ${p}`);
    assert.ok(['bloqueia', 'nao-bloqueia'].includes(a.prioridade), a.id);
  }
});

test('o vazamento só é pego por quem conhece o contexto', () => {
  assert.deepEqual(achado('vazamento').pegam, ['contexto']);
  const m = matriz();
  assert.ok(m.unicos.some((u) => u.achado === 'vazamento' && u.so === 'contexto'));
  assert.ok(m.unicos.some((u) => u.achado === 'assert-tautologico' && u.so === 'camadas'));
});

test('nenhum revisor pega tudo sozinho', () => {
  assert.equal(matriz().ninguemSozinho, true);
});

test('avaliarAchado separa certos, errados e faltantes', () => {
  const r = avaliarAchado('dependencia', { pegam: ['seguranca', 'sinais'], prioridade: 'bloqueia' });
  assert.deepEqual(r.certos, ['seguranca']);
  assert.deepEqual(r.errados, ['sinais']);
  assert.deepEqual(r.faltaram, ['camadas']);
  assert.equal(r.quem, false);
  assert.equal(r.prioridade, true);
});

test('pontuação máxima é 2 por achado', () => {
  const certas = Object.fromEntries(ACHADOS.map((a) => [a.id, { pegam: a.pegam, prioridade: a.prioridade }]));
  assert.deepEqual(pontuacao(certas), { pontos: ACHADOS.length * 2, max: ACHADOS.length * 2 });
  assert.deepEqual(pontuacao({}), { pontos: 0, max: ACHADOS.length * 2 });
});

test('o PR não usa o domínio proibido e só bloqueia o que muda comportamento ou expõe dado', () => {
  const texto = JSON.stringify(ACHADOS).toLowerCase();
  assert.equal(/saldo|carteira/.test(texto), false);
  assert.deepEqual(bloqueios().sort(), ['assert-tautologico', 'dependencia', 'lint', 'teste-vermelho', 'vazamento']);
});
