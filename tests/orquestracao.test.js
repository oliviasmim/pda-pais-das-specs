import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CENARIOS, compararTodos, gerarCenario, simular, veredito, JANELA, ZONA_SMART } from '../site/js/logic/orquestracao.js';

const cenario = (id) => CENARIOS.find((c) => c.id === id);

test('cada cenário pré-pronto tem uma recomendação esperada', () => {
  assert.equal(compararTodos(cenario('speedrun')).melhor, 'paralelo');
  assert.equal(compararTodos(cenario('bug')).melhor, 'unico');
  assert.equal(compararTodos(cenario('cadeia')).melhor, 'unico');
  assert.equal(compararTodos(cenario('review')).melhor, 'supervisor');
  assert.notEqual(compararTodos(cenario('mesmo-arquivo')).melhor, 'paralelo');
});

test('agente único entra na dumb zone quando o contexto passa de 40% da janela', () => {
  const r = simular(cenario('speedrun'), 'unico');
  assert.ok(r.picoContexto > JANELA * ZONA_SMART);
  assert.equal(r.dumb, 'T3');
  assert.ok(r.blocos.some((b) => b.tipo === 'dumb'));
});

test('subagents isolam o contexto: o pico de cada um fica bem abaixo do agente único', () => {
  const unico = simular(cenario('speedrun'), 'unico');
  const par = simular(cenario('speedrun'), 'paralelo');
  assert.ok(par.picoContexto < unico.picoContexto / 2);
});

test('paralelo em cadeia não ganha tempo: tasks não se sobrepõem', () => {
  const r = simular(cenario('cadeia'), 'paralelo');
  const tasks = r.blocos.filter((b) => b.tipo === 'task').sort((a, b) => a.inicio - b.inicio);
  for (let i = 1; i < tasks.length; i++) assert.ok(tasks[i].inicio >= tasks[i - 1].fim);
  assert.ok(r.notas.some((n) => /cadeia/.test(n)));
});

test('paralelo no mesmo arquivo gera conflitos sérios; supervisor serializa e zera', () => {
  const par = simular(cenario('mesmo-arquivo'), 'paralelo');
  assert.ok(par.conflitos.length >= 3);
  assert.ok(par.conflitos.every((c) => c.custo >= 5));
  const sup = simular(cenario('mesmo-arquivo'), 'supervisor');
  assert.equal(sup.conflitos.length, 0);
});

test('respeita o máximo de agentes simultâneos', () => {
  const r = simular(cenario('mesmo-arquivo'), 'paralelo');
  const tasks = r.blocos.filter((b) => b.tipo === 'task');
  const instantes = tasks.map((b) => b.inicio + 0.01);
  for (const t of instantes) {
    const ativos = tasks.filter((b) => b.inicio <= t && t < b.fim).length;
    assert.ok(ativos <= 3);
  }
});

test('sequencial não tem conflito e soma handoffs', () => {
  const r = simular(cenario('speedrun'), 'sequencial');
  assert.equal(r.conflitos.length, 0);
  assert.equal(r.overhead, 3 * 1 + 2 * 2);
});

test('veredito explica a diferença quando a escolha não é a melhor', () => {
  const v = veredito(cenario('bug'), 'supervisor');
  assert.equal(v.acertou, false);
  assert.match(v.texto, /min a mais/);
  assert.equal(veredito(cenario('bug'), 'unico').acertou, true);
});

test('gerarCenario respeita limites e cria cadeia', () => {
  const c = gerarCenario({ n: 10, dur: 1, deps: 'cadeia', compartilha: 'nenhum' });
  assert.equal(c.tasks.length, 6);
  assert.equal(c.tasks[0].dur, 2);
  assert.deepEqual(c.tasks[3].deps, ['S3']);
  assert.ok(c.tasks.every((t) => !t.arquivos.includes('src/app.js')));
});

test('dependência circular é detectada', () => {
  const c = { ...cenario('bug'), tasks: [{ id: 'A', nome: 'A', dur: 1, tokens: 1, deps: ['B'], arquivos: [] }, { id: 'B', nome: 'B', dur: 1, tokens: 1, deps: ['A'], arquivos: [] }] };
  assert.throws(() => simular(c, 'paralelo'), /circular/);
});
