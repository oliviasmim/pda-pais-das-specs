import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VAZIO, calcular, gerarMarkdown, leituraAposta } from '../site/js/logic/log-paralelo.js';

const tasks = (a, b, c) => [
  { id: 'T1', nome: 'Agendar', minutos: a },
  { id: 'T2', nome: 'Cancelar', minutos: b },
  { id: 'T3', nome: 'Listar vagas', minutos: c },
];
const base = { tasks: tasks(14, 10, 12), aposta: 20, real: 30, integracao: 8, conflito: 'sim', diffs: 3, verde: true };

test('soma das tasks sozinhas, ganho e diferença da aposta', () => {
  const r = calcular(base);
  assert.equal(r.somaSozinhas, 36);
  assert.equal(r.ganho, 6);
  assert.equal(r.ganhoPct, 17);
  assert.equal(r.diferenca, 10);
  assert.equal(r.erroAposta, 50);
  assert.equal(r.maisLonga, 14);
  assert.equal(r.coordenacao, 16);
});

test('ganho de 17% empata; 20% ou mais vale; até 5% pede agente único', () => {
  assert.equal(calcular(base).veredito, 'empatou');
  assert.equal(calcular({ ...base, real: 20 }).veredito, 'valeu');
  assert.equal(calcular({ ...base, real: 35 }).veredito, 'unico');
  assert.equal(calcular({ ...base, real: 40 }).veredito, 'unico');
});

test('paralelo mais lento que a soma sozinha tem ganho negativo', () => {
  const r = calcular({ ...base, real: 44 });
  assert.equal(r.ganho, -8);
  assert.equal(r.veredito, 'unico');
});

test('sem teste 100% verde não há veredito', () => {
  const r = calcular({ ...base, real: 20, verde: false });
  assert.equal(r.veredito, 'incompleto');
  assert.ok(r.avisos.length >= 1);
});

test('entradas faltando ou inválidas viram erro, não NaN', () => {
  assert.equal(calcular(VAZIO).ok, false);
  assert.equal(calcular({ ...base, real: '' }).ok, false);
  assert.equal(calcular({ ...base, aposta: -1 }).ok, false);
  assert.equal(calcular({ ...base, tasks: tasks(-3, 10, 12) }).ok, false);
});

test('task sem minutos fica fora da soma e gera aviso', () => {
  const r = calcular({ ...base, tasks: tasks(14, 10, null) });
  assert.equal(r.somaSozinhas, 24);
  assert.ok(r.avisos.some((a) => /sem minutos/.test(a)));
});

test('aceita números digitados como texto', () => {
  const r = calcular({ ...base, tasks: tasks('14', '10', '12'), aposta: '20', real: '30' });
  assert.equal(r.somaSozinhas, 36);
});

test('conflito sem tempo de integração gera aviso', () => {
  const r = calcular({ ...base, integracao: null });
  assert.ok(r.avisos.some((a) => /integração/.test(a)));
});

test('leitura da aposta fala em subestimar ou superestimar', () => {
  assert.match(leituraAposta(calcular(base)), /subestimaram/);
  assert.match(leituraAposta(calcular({ ...base, aposta: 40 })), /superestimaram/);
  assert.match(leituraAposta(calcular({ ...base, aposta: 30 })), /bateu/);
});

test('o markdown só traz números do log e deixa o texto livre para a pessoa', () => {
  const md = gerarMarkdown(base);
  assert.match(md, /Tempo apostado: 20 min/);
  assert.match(md, /\| \(a\) Tasks sozinhas, somadas \(T1 14 \+ T2 10 \+ T3 12\) \| 36 \|/);
  assert.match(md, /Empatou/);
  assert.match(md, /Para escrever à mão/);
  assert.equal(gerarMarkdown(VAZIO), '');
});
