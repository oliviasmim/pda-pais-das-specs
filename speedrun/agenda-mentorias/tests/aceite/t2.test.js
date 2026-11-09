// NÃO EDITE. Ver tests/aceite/_aceite.js.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { reset } from '../../src/repo.js';
import { opcoesDaTask, subirApp, pedir } from './_aceite.js';

const opcoes = opcoesDaTask('T2');
let api;
before(async () => { api = await subirApp(); });
after(async () => { await api.fechar(); });
beforeEach(() => reset());

test('T2 funciona: agendamento confirmado é cancelado com 200', opcoes, async () => {
  const r = await pedir(`${api.url}/agendamentos/1`, { method: 'DELETE' });
  assert.equal(r.status, 200);
  assert.deepEqual(r.corpo, { id: 1, status: 'cancelado' });
});

test('T2 falha: agendamento já cancelado responde 409', opcoes, async () => {
  const r = await pedir(`${api.url}/agendamentos/3`, { method: 'DELETE' });
  assert.equal(r.status, 409);
  assert.deepEqual(r.corpo, { erro: 'Agendamento já cancelado' });
});
