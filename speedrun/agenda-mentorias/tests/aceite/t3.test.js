// NÃO EDITE. Ver tests/aceite/_aceite.js.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { reset } from '../../src/repo.js';
import { opcoesDaTask, subirApp, pedir } from './_aceite.js';

const opcoes = opcoesDaTask('T3');
let api;
before(async () => { api = await subirApp(); });
after(async () => { await api.fechar(); });
beforeEach(() => reset());

test('T3 funciona: vagas livres do dia, em ordem de horário', opcoes, async () => {
  const r = await pedir(`${api.url}/mentores/1/vagas?data=2026-11-16`);
  assert.equal(r.status, 200);
  assert.deepEqual(r.corpo, [
    { id: 9, inicio: '2026-11-16T08:00' },
    { id: 1, inicio: '2026-11-16T09:00' },
    { id: 2, inicio: '2026-11-16T10:00' },
  ]);
});

test('T3 falha: mentor inexistente responde 404', opcoes, async () => {
  const r = await pedir(`${api.url}/mentores/999/vagas`);
  assert.equal(r.status, 404);
  assert.deepEqual(r.corpo, { erro: 'Mentor não encontrado' });
});
