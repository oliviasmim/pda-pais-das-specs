import { test, beforeEach, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { reset, repo } from '../src/repo.js';
import { subir, pedir } from './helpers.js';

let api;
before(async () => { api = await subir(); });
after(async () => { await api.fechar(); });
beforeEach(() => reset());

const cancelar = (id) => pedir(`${api.url}/agendamentos/${id}`, { method: 'DELETE' });

test('404 quando o agendamento não existe', async () => {
  assert.deepEqual(await cancelar(999), { status: 404, corpo: { erro: 'Agendamento não encontrado' } });
  assert.deepEqual(await cancelar('abc'), { status: 404, corpo: { erro: 'Agendamento não encontrado' } });
});

test('409 quando já está cancelado', async () => {
  assert.deepEqual(await cancelar(3), { status: 409, corpo: { erro: 'Agendamento já cancelado' } });
});

test('200 cancela e libera a vaga', async () => {
  assert.deepEqual(await cancelar(1), { status: 200, corpo: { id: 1, status: 'cancelado' } });
  assert.equal((await repo.buscarVaga(3))?.livre, true);
  assert.equal((await repo.buscarAgendamento(1))?.status, 'cancelado');
});
