import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARQUIVOS, CLASSES, avaliarResposta, responder, placar, stat } from '../site/js/logic/triagem-pr.js';

test('9 arquivos, ids únicos, classes válidas', () => {
  assert.equal(ARQUIVOS.length, 9);
  assert.equal(new Set(ARQUIVOS.map((a) => a.id)).size, 9);
  for (const a of ARQUIVOS) assert.ok(CLASSES[a.classe], a.id);
});

test('há pelo menos um arquivo de cada sinal e mais de um que cabe no pedido', () => {
  for (const c of ['escopo', 'teste', 'dependencia']) assert.ok(ARQUIVOS.some((a) => a.classe === c), c);
  assert.ok(ARQUIVOS.filter((a) => a.classe === 'ok').length >= 3);
});

test('avaliarResposta', () => {
  assert.equal(avaliarResposta('teste-velho', 'teste').nota, 1);
  assert.equal(avaliarResposta('teste-velho', 'ok').nota, 0);
  assert.equal(avaliarResposta('x', 'ok').correta, null);
});

test('responder não muta e ignora inválidos', () => {
  const r = {};
  assert.equal(responder(r, 'pacote', 'dependencia').pacote, 'dependencia');
  assert.deepEqual(r, {});
  assert.deepEqual(responder(r, 'pacote', 'nada'), {});
});

test('placar conta sinais achados e falsos alarmes', () => {
  const p = placar({ vagas: 'ok', agendamentos: 'escopo', readme: 'escopo', pacote: 'ok' });
  assert.equal(p.respondidas, 4);
  assert.equal(p.pontos, 2);
  assert.equal(p.sinaisAchados, 1);
  assert.equal(p.sinaisTotal, 4);
  assert.equal(p.falsosAlarmes, 1);
});

test('stat parece um git diff --stat e fecha a soma', () => {
  const s = stat();
  assert.match(s, /src\/rotas\/vagas\.js +\|/);
  assert.match(s, /9 files changed, 378 lines changed/);
});

test('nenhum texto usa o domínio proibido', () => {
  assert.doesNotMatch(JSON.stringify(ARQUIVOS), /carteira|saldo/i);
});
