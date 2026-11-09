import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarRng, simular, percentil, estatisticas, histograma, fracaoAfetada, frase } from '../site/js/logic/percentis.js';

test('rng com mesma semente é determinístico', () => {
  const a = criarRng(7);
  const b = criarRng(7);
  for (let i = 0; i < 5; i++) assert.equal(a(), b());
  const c = criarRng(8);
  assert.notEqual(criarRng(7)(), c());
});

test('simular devolve a quantidade pedida e é reprodutível', () => {
  const x = simular({ requisicoes: 500, semente: 3 });
  const y = simular({ requisicoes: 500, semente: 3 });
  assert.equal(x.length, 500);
  assert.deepEqual(x, y);
});

test('percentil usa o método nearest-rank', () => {
  const ordenados = Array.from({ length: 100 }, (_, i) => i + 1);
  assert.equal(percentil(ordenados, 50), 50);
  assert.equal(percentil(ordenados, 95), 95);
  assert.equal(percentil(ordenados, 99), 99);
  assert.equal(percentil(ordenados, 100), 100);
  assert.equal(percentil([], 50), 0);
});

test('estatisticas: média é puxada pela cauda, p50 não', () => {
  const tempos = [...Array(98).fill(10), 1000, 1000];
  const s = estatisticas(tempos);
  assert.equal(s.p50, 10);
  assert.equal(s.p99, 1000);
  assert.ok(s.media > 25 && s.media < 35);
});

test('fan-out amplifica a cauda: p99 e p95 sobem com mais chamadas', () => {
  const um = estatisticas(simular({ requisicoes: 3000, fanout: 1, cauda: 0.02, semente: 11 }));
  const dez = estatisticas(simular({ requisicoes: 3000, fanout: 10, cauda: 0.02, semente: 11 }));
  assert.ok(dez.p95 > um.p95 * 2, `p95 ${dez.p95} deveria ser bem maior que ${um.p95}`);
  assert.ok(dez.p50 > um.p50);
});

test('fracaoAfetada segue 1 - 0,99^n', () => {
  assert.ok(Math.abs(fracaoAfetada(1) - 0.01) < 1e-9);
  assert.ok(Math.abs(fracaoAfetada(5) - (1 - 0.99 ** 5)) < 1e-9);
  assert.ok(fracaoAfetada(100) > 0.63);
});

test('histograma soma todas as amostras (dentro + fora do gráfico)', () => {
  const tempos = [1, 2, 3, 50, 99, 150];
  const h = histograma(tempos, { faixas: 10, limite: 100 });
  const dentro = h.contagens.reduce((a, b) => a + b, 0);
  assert.equal(dentro + h.foraDoGrafico, tempos.length);
  assert.equal(h.foraDoGrafico, 1);
});

test('frase cita o fan-out e a porcentagem afetada', () => {
  const stats = { media: 50, p99: 400 };
  assert.match(frase({ fanout: 5, stats }), /fan-out 5, 5%/);
  assert.match(frase({ fanout: 1, stats }), /1%/);
});
