// NÃO EDITE. Ver tests/aceite/_aceite.js.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { reset } from '../../src/repo.js';
import { opcoesDaTask, subirApp, pedir } from './_aceite.js';

const opcoes = opcoesDaTask('T1');
let api;
before(async () => { api = await subirApp(); });
after(async () => { await api.fechar(); });
beforeEach(() => reset());

test('T1 funciona: vaga livre é agendada com 201', opcoes, async () => {
  const r = await pedir(`${api.url}/agendamentos`, {
    method: 'POST',
    body: { vagaId: 1, jovemEmail: 'ana@pda.org' },
  });
  assert.equal(r.status, 201);
  assert.deepEqual(r.corpo, { id: 4, vagaId: 1, mentorId: 1, jovemEmail: 'ana@pda.org', status: 'confirmado' });
});

test('T1 falha: vaga ocupada responde 409', opcoes, async () => {
  const r = await pedir(`${api.url}/agendamentos`, {
    method: 'POST',
    body: { vagaId: 3, jovemEmail: 'ana@pda.org' },
  });
  assert.equal(r.status, 409);
  assert.deepEqual(r.corpo, { erro: 'Vaga indisponível' });
});
