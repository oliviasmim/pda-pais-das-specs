import { test, beforeEach, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { reset } from '../src/repo.js';
import { subir, pedir } from './helpers.js';

let api;
before(async () => { api = await subir(); });
after(async () => { await api.fechar(); });
beforeEach(() => reset());

test('GET /health responde 200 com status ok', async () => {
  const { status, corpo } = await pedir(`${api.url}/health`);
  assert.equal(status, 200);
  assert.deepEqual(corpo, { status: 'ok' });
});

test('GET /mentores lista os mentores ordenados por nome', async () => {
  const { status, corpo } = await pedir(`${api.url}/mentores`);
  assert.equal(status, 200);
  assert.deepEqual(corpo.map((m) => m.nome), ['Aline Ferreira', 'Bruno Tavares', 'Carla Souza', 'Diego Lima']);
  assert.deepEqual(corpo[0], { id: 3, nome: 'Aline Ferreira', area: 'Front-end' });
});

test('JSON malformado responde 400 com mensagem de erro', async () => {
  const resposta = await fetch(`${api.url}/mentores`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"quebrado":',
  });
  assert.equal(resposta.status, 400);
  assert.deepEqual(await resposta.json(), { erro: 'JSON inválido' });
});
