import { test } from 'node:test';
import assert from 'node:assert/strict';
import { passos, resumo, proximo, anterior, NOS } from '../site/js/logic/ciclo-harness.js';

test('harness completo passa pelos quatro nós e termina verde', () => {
  const p = passos({ guias: true, sensores: true });
  const usados = new Set(p.flatMap((x) => x.ativos));
  for (const n of NOS) assert.ok(usados.has(n));
  assert.equal(p.at(-1).ok, true);
  assert.ok(p.some((x) => x.falha));
});

test('sem sensores o fim é um "pronto" sem conferência', () => {
  const p = passos({ guias: true, sensores: false });
  assert.equal(p.at(-1).id, 'pronto');
  assert.ok(!p.some((x) => x.papel === 'sensor'));
});

test('sem guias o primeiro passo não usa o nó de guias', () => {
  const p = passos({ guias: false, sensores: true });
  assert.ok(!p.some((x) => x.ativos.includes('guias')));
});

test('ids únicos, ativos válidos e navegação limitada', () => {
  for (const g of [true, false]) for (const s of [true, false]) {
    const p = passos({ guias: g, sensores: s });
    assert.equal(new Set(p.map((x) => x.id)).size, p.length);
    for (const x of p) for (const a of x.ativos) assert.ok(NOS.includes(a));
    assert.ok(resumo({ guias: g, sensores: s }).length > 20);
  }
  assert.equal(proximo(4, 5), 4);
  assert.equal(anterior(0), 0);
});
