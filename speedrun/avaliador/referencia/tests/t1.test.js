import { test, beforeEach, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { reset, repo } from '../src/repo.js';
import { subir, pedir } from './helpers.js';

let api;
before(async () => { api = await subir(); });
after(async () => { await api.fechar(); });
beforeEach(() => reset());

const agendar = (body) => pedir(`${api.url}/agendamentos`, { method: 'POST', body });

test('400 quando vagaId está ausente ou não é inteiro', async () => {
  for (const body of [{ jovemEmail: 'ana@pda.org' }, { vagaId: '1', jovemEmail: 'ana@pda.org' }, {}]) {
    assert.deepEqual(await agendar(body), { status: 400, corpo: { erro: 'vagaId é obrigatório' } });
  }
});

test('400 quando jovemEmail está ausente ou vazio', async () => {
  for (const body of [{ vagaId: 1 }, { vagaId: 1, jovemEmail: '' }]) {
    assert.deepEqual(await agendar(body), { status: 400, corpo: { erro: 'jovemEmail é obrigatório' } });
  }
});

test('400 quando jovemEmail não tem formato a@b.c', async () => {
  assert.deepEqual(await agendar({ vagaId: 1, jovemEmail: 'ana.pda.org' }), { status: 400, corpo: { erro: 'jovemEmail inválido' } });
});

test('404 quando a vaga não existe', async () => {
  assert.deepEqual(await agendar({ vagaId: 999, jovemEmail: 'ana@pda.org' }), { status: 404, corpo: { erro: 'Vaga não encontrada' } });
});

test('409 quando a vaga está ocupada', async () => {
  assert.deepEqual(await agendar({ vagaId: 3, jovemEmail: 'ana@pda.org' }), { status: 409, corpo: { erro: 'Vaga indisponível' } });
});

test('201 confirma e ocupa a vaga', async () => {
  const r = await agendar({ vagaId: 1, jovemEmail: 'ana@pda.org' });
  assert.deepEqual(r, { status: 201, corpo: { id: 4, vagaId: 1, mentorId: 1, jovemEmail: 'ana@pda.org', status: 'confirmado' } });
  assert.equal((await repo.buscarVaga(1))?.livre, false);
});

test('NFR-1: dez pedidos simultâneos para a mesma vaga, exatamente um 201', async () => {
  const respostas = await Promise.all(
    Array.from({ length: 10 }, (_, i) => agendar({ vagaId: 2, jovemEmail: `j${i}@pda.org` })),
  );
  assert.equal(respostas.filter((r) => r.status === 201).length, 1);
  assert.equal(respostas.filter((r) => r.status === 409).length, 9);
});
