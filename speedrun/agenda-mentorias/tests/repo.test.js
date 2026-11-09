import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { reset, repo, SEED } from '../src/repo.js';

beforeEach(() => reset());

test('buscarMentor devolve o mentor ou undefined', async () => {
  assert.equal((await repo.buscarMentor(1))?.nome, 'Carla Souza');
  assert.equal(await repo.buscarMentor(999), undefined);
});

test('listarVagasDoMentor devolve livres e ocupadas do mentor', async () => {
  const vagas = await repo.listarVagasDoMentor(1);
  assert.deepEqual(vagas.map((v) => v.id).sort((a, b) => a - b), [1, 2, 3, 4, 9]);
});

test('atualizarVaga altera o banco e devolve cópia', async () => {
  const vaga = await repo.atualizarVaga(1, { livre: false });
  assert.equal(vaga?.livre, false);
  assert.equal((await repo.buscarVaga(1))?.livre, false);
  assert.equal(await repo.atualizarVaga(999, { livre: false }), undefined);
});

test('objetos devolvidos são cópias', async () => {
  const vaga = await repo.buscarVaga(2);
  if (vaga) vaga.livre = false;
  assert.equal((await repo.buscarVaga(2))?.livre, true);
});

test('criarAgendamento gera ids sequenciais a partir do seed', async () => {
  const a = await repo.criarAgendamento({ vagaId: 1, mentorId: 1, jovemEmail: 'x@pda.org', status: 'confirmado' });
  const b = await repo.criarAgendamento({ vagaId: 2, mentorId: 1, jovemEmail: 'y@pda.org', status: 'confirmado' });
  assert.equal(a.id, 4);
  assert.equal(b.id, 5);
  assert.equal((await repo.buscarAgendamento(5))?.jovemEmail, 'y@pda.org');
});

test('atualizarAgendamento altera status ou devolve undefined', async () => {
  assert.equal((await repo.atualizarAgendamento(1, { status: 'cancelado' }))?.status, 'cancelado');
  assert.equal(await repo.atualizarAgendamento(999, { status: 'cancelado' }), undefined);
});

test('reset aceita um seed próprio', async () => {
  reset({ mentores: [], vagas: [], agendamentos: [] });
  assert.deepEqual(await repo.listarMentores(), []);
  reset();
  assert.equal((await repo.listarMentores()).length, SEED.mentores.length);
});
