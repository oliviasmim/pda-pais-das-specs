import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FICHAS, BASE, JANELA, avaliar, zona, formatarTokens } from '../site/js/logic/faxina-contexto.js';

const todas = FICHAS.map((f) => f.id);
const essenciais = FICHAS.filter((f) => f.papel === 'essencial').map((f) => f.id);
const uteis = FICHAS.filter((f) => f.papel === 'util').map((f) => f.id);

test('ids únicos e toda ficha essencial ou útil explica a falta', () => {
  assert.equal(new Set(todas).size, todas.length);
  for (const f of FICHAS) if (f.papel !== 'ruido') assert.ok(f.falta.length > 10);
});

test('sem nada selecionado, só a base ocupa a janela e falta o essencial', () => {
  const r = avaliar([]);
  assert.equal(r.tokens, BASE);
  assert.equal(r.faltando.length, essenciais.length);
  assert.equal(r.veredito, 'vazio');
});

test('essenciais mais úteis, sem ruído, é o ideal e fica na smart zone', () => {
  const r = avaliar([...essenciais, ...uteis]);
  assert.equal(r.veredito, 'ideal');
  assert.equal(r.zona, 'smart');
});

test('só o essencial é bom', () => {
  assert.equal(avaliar(essenciais).veredito, 'bom');
});

test('tudo dentro passa dos 40% e vira poluído', () => {
  const r = avaliar(todas);
  assert.ok(r.fracao > 0.4);
  assert.equal(r.veredito, 'poluido');
  assert.equal(r.ruido.length, 5);
});

test('ruído sem o essencial é parcial', () => {
  assert.equal(avaliar(['lock', 'docs-express', 'log-bruto']).veredito, 'parcial');
});

test('zona respeita o limite de 40% e o de janela cheia', () => {
  assert.equal(zona(0.4), 'smart');
  assert.equal(zona(0.41), 'dumb');
  assert.equal(zona(0.95), 'cheia');
  assert.ok(JANELA > 0);
  assert.equal(formatarTokens(1500), '1.5k');
  assert.equal(formatarTokens(500), '500');
});
