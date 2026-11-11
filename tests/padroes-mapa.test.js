import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPA, bordaRetangulo, centroDe, padraoPorId, pontosDaSeta, validarMapa } from '../site/js/logic/padroes-mapa.js';

test('o mapa tem os quatro padrões, um por naipe', () => {
  assert.deepEqual(MAPA.map((p) => p.id), ['unico', 'sequencial', 'paralelo', 'supervisor']);
  assert.deepEqual(MAPA.map((p) => p.naipe), ['♠', '♣', '♦', '♥']);
});

test('o mapa passa na validação: nós dentro do quadro, setas e passos com ids existentes', () => {
  assert.deepEqual(validarMapa(), []);
});

test('a validação pega seta para nó que não existe', () => {
  const ruim = [{ id: 'x', nos: [{ id: 'a', x: 0, y: 0, w: 10, h: 10 }], setas: [{ de: 'a', para: 'b' }], passos: [{ ativos: ['a'] }] }];
  assert.equal(validarMapa(ruim).length, 1);
});

test('só o paralelo tem nó de integração e só o supervisor tem nó de supervisor', () => {
  const tipos = (id) => padraoPorId(id).nos.map((n) => n.tipo);
  assert.ok(tipos('paralelo').includes('integracao'));
  assert.ok(!tipos('sequencial').includes('integracao'));
  assert.ok(tipos('supervisor').includes('supervisor'));
  assert.ok(!tipos('paralelo').includes('supervisor'));
});

test('o paralelo tem três agentes e o supervisor tem três workers', () => {
  assert.equal(padraoPorId('paralelo').nos.filter((n) => n.tipo === 'agente').length, 3);
  assert.equal(padraoPorId('supervisor').nos.filter((n) => n.id.startsWith('w')).length, 3);
});

test('o supervisor usa setas de ida e volta', () => {
  assert.ok(padraoPorId('supervisor').setas.every((s) => s.duplo));
});

test('a borda de um retângulo fica sobre o contorno, na direção do alvo', () => {
  const n = { x: 0, y: 0, w: 100, h: 50 };
  assert.deepEqual(bordaRetangulo(n, 500, 25), { x: 100, y: 25 });
  assert.deepEqual(bordaRetangulo(n, 50, -500), { x: 50, y: 0 });
});

test('a seta começa fora do nó de origem e termina fora do nó de destino', () => {
  const p = padraoPorId('sequencial');
  const s = p.setas[0];
  const { x1, x2 } = pontosDaSeta(p, s);
  const a = p.nos.find((n) => n.id === s.de);
  const b = p.nos.find((n) => n.id === s.para);
  assert.ok(x1 > a.x + a.w - 1);
  assert.ok(x2 < b.x + 1);
  assert.ok(centroDe(a).x < centroDe(b).x);
});
