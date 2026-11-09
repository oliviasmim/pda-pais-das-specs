import { test, beforeEach, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { reset, SEED } from '../src/repo.js';
import { subir, pedir } from './helpers.js';

let api;
before(async () => { api = await subir(); });
after(async () => { await api.fechar(); });
beforeEach(() => reset());

const vagas = (caminho) => pedir(`${api.url}/mentores/${caminho}`);

test('404 quando o mentor não existe', async () => {
  assert.deepEqual(await vagas('999/vagas'), { status: 404, corpo: { erro: 'Mentor não encontrado' } });
});

test('400 quando a data é inválida (formato ou calendário)', async () => {
  for (const data of ['16-11-2026', '2026-02-30', 'amanha']) {
    assert.deepEqual(await vagas(`1/vagas?data=${data}`), { status: 400, corpo: { erro: 'data inválida' } });
  }
});

test('200 só vagas livres, em ordem, com e sem filtro de dia', async () => {
  const todas = await vagas('1/vagas');
  assert.deepEqual(todas.corpo.map((v) => v.id), [9, 1, 2, 4]);
  const doDia = await vagas('1/vagas?data=2026-11-16');
  assert.deepEqual(doDia.corpo, [
    { id: 9, inicio: '2026-11-16T08:00' },
    { id: 1, inicio: '2026-11-16T09:00' },
    { id: 2, inicio: '2026-11-16T10:00' },
  ]);
  assert.deepEqual((await vagas('4/vagas')).corpo, []);
});

test('NFR-2: 1.000 vagas, p95 abaixo de 50 ms', async () => {
  const mil = Array.from({ length: 1000 }, (_, i) => ({
    id: 100 + i, mentorId: 1, inicio: `2026-12-${String(1 + (i % 28)).padStart(2, '0')}T09:00`, livre: i % 2 === 0,
  }));
  reset({ ...SEED, vagas: mil });
  const tempos = [];
  for (let i = 0; i < 200; i++) {
    const inicio = performance.now();
    await vagas('1/vagas');
    tempos.push(performance.now() - inicio);
  }
  tempos.sort((a, b) => a - b);
  assert.ok(tempos[Math.ceil(0.95 * tempos.length) - 1] < 50);
});
