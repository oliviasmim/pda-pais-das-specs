import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PADRAO, canais, curva, ideal, leitura, melhorN, normalizar, tempo, tokens } from '../site/js/logic/custo-coordenacao.js';

test('canais de comunicação crescem com o quadrado: n(n-1)/2', () => {
  assert.deepEqual([1, 2, 3, 4, 6, 8].map(canais), [0, 1, 3, 6, 15, 28]);
});

test('um agente só leva o tempo total, sem custo nenhum', () => {
  assert.equal(tempo(PADRAO, 1), PADRAO.trabalho);
  assert.equal(tokens(PADRAO, 1), Math.round(PADRAO.trabalho * 2.5));
});

test('três agentes não fazem um terço do tempo', () => {
  assert.ok(tempo(PADRAO, 3) > ideal(PADRAO, 3));
  assert.ok(tempo(PADRAO, 3) < tempo(PADRAO, 1));
});

test('sem coordenação e sem parte serial, o tempo real é o ideal', () => {
  const p = { trabalho: 30, partes: 6, fracaoSerial: 0, subida: 0, atrito: 0 };
  for (const n of [2, 3, 6]) assert.equal(tempo(p, n), 30 / n);
});

test('agentes além das partes independentes ficam parados e só pioram o tempo', () => {
  const p = { ...PADRAO, partes: 3 };
  assert.ok(tempo(p, 4) > tempo(p, 3));
  assert.equal(curva(p)[4].parados, 2);
});

test('a curva tem forma de U: o tempo cai, chega a um mínimo e volta a subir', () => {
  const reais = curva(PADRAO).map((x) => x.real);
  const m = melhorN(PADRAO);
  assert.ok(m > 1 && m < 8);
  for (let i = 1; i < m; i++) assert.ok(reais[i] < reais[i - 1]);
  for (let i = m; i < reais.length; i++) assert.ok(reais[i] > reais[i - 1]);
});

test('tarefa de uma parte só: o melhor é um agente', () => {
  assert.equal(melhorN({ ...PADRAO, partes: 1 }), 1);
});

test('tarefa pequena com atrito alto não compensa paralelizar', () => {
  assert.equal(melhorN({ trabalho: 3, partes: 3, fracaoSerial: 0.3, subida: 1, atrito: 1 }), 1);
});

test('tokens crescem com cada agente novo, mesmo sem trabalho extra', () => {
  assert.ok(tokens(PADRAO, 3) > tokens(PADRAO, 2));
  assert.ok(tokens(PADRAO, 3) > tokens(PADRAO, 1));
});

test('normalizar limita valores absurdos', () => {
  const v = normalizar({ trabalho: -5, partes: 0, fracaoSerial: 5, subida: -1, atrito: -2 });
  assert.equal(v.trabalho, 1);
  assert.equal(v.partes, 1);
  assert.equal(v.fracaoSerial, 0.9);
  assert.equal(v.subida, 0);
  assert.equal(v.atrito, 0);
});

test('a leitura avisa quando o paralelo passou do agente único', () => {
  const p = { trabalho: 3, partes: 3, fracaoSerial: 0.3, subida: 1, atrito: 1 };
  assert.ok(leitura(p, 3).some((f) => /comeu todo o ganho/.test(f)));
  assert.ok(leitura(PADRAO, 8).some((f) => /melhor ponto/.test(f)));
  assert.equal(leitura(PADRAO, 1).length, 1);
});
