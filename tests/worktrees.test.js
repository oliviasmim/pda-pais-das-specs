import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  criarEstado,
  executar,
  progressoMissao,
  resolverConflito,
  resolverCaminho,
  rotasPerdidas,
  simularMesmaPasta,
  textoConflito,
  RAIZ,
} from '../site/js/logic/worktrees.js';

function rodar(estado, ...linhas) {
  let r = { estado };
  for (const l of linhas) r = executar(r.estado, l);
  return r;
}

test('resolverCaminho entende .., absoluto e relativo', () => {
  assert.equal(resolverCaminho(RAIZ, '../wt-a'), '/wt-a');
  assert.equal(resolverCaminho('/wt-a', '/agenda-mentorias'), RAIZ);
  assert.equal(resolverCaminho(RAIZ, '.claude/worktrees/x'), `${RAIZ}/.claude/worktrees/x`);
  assert.equal(resolverCaminho('/wt-a', ''), RAIZ);
});

test('git worktree add cria branch nova e lista', () => {
  const r = rodar(criarEstado(), 'git worktree add ../wt-agendar -b agendar', 'git worktree list');
  assert.equal(r.erro, undefined);
  assert.equal(r.saida.length, 2);
  assert.match(r.saida[1], /\/wt-agendar\s+a1b2c3d \[agendar\]/);
});

test('branch repetida e branch em uso dão erro realista', () => {
  let r = rodar(criarEstado(), 'git worktree add ../wt-a -b agendar', 'git worktree add ../wt-b -b agendar');
  assert.equal(r.erro, true);
  assert.match(r.saida[0], /a branch named 'agendar' already exists/);
  r = rodar(r.estado, 'git worktree add ../wt-c agendar');
  assert.equal(r.erro, true);
  assert.match(r.saida[0], /'agendar' is already used by worktree at '\/wt-a'/);
  r = rodar(r.estado, 'git worktree add ../wt-d main');
  assert.match(r.saida[0], /'main' is already used by worktree/);
});

test('claude na pasta principal é recusado; claude -w cria worktree e agente', () => {
  let r = rodar(criarEstado(), 'claude');
  assert.equal(r.erro, true);
  r = rodar(r.estado, 'claude -w agendar');
  assert.equal(r.erro, undefined);
  assert.equal(r.estado.agentes[0].task, 'T1');
  assert.equal(r.estado.agentes[0].branch, 'worktree-agendar');
  assert.ok(r.estado.worktrees.some((w) => w.dir === `${RAIZ}/.claude/worktrees/agendar`));
});

test('duas sessões no mesmo worktree são recusadas', () => {
  const r = rodar(criarEstado(), 'git worktree add ../wt-a -b a', 'cd ../wt-a', 'claude', 'claude');
  assert.equal(r.erro, true);
  assert.match(r.saida[0], /já tem um agente/);
});

test('fluxo completo: 3 worktrees, merges com conflito, resolver mantendo as duas, limpar', () => {
  let r = rodar(
    criarEstado(),
    'claude -w agendar',
    'claude -w cancelar',
    'claude -w vagas',
    'git worktree list',
    'git merge worktree-agendar',
  );
  assert.equal(r.erro, undefined);
  assert.deepEqual(progressoMissao(r.estado).listar, true);
  r = rodar(r.estado, 'git merge worktree-cancelar');
  assert.equal(r.conflito, true);
  assert.ok(textoConflito(r.estado).some((l) => l.startsWith('<<<<<<< HEAD')));
  const bloqueado = executar(r.estado, 'git worktree add ../x -b x');
  assert.equal(bloqueado.erro, true);
  let res = resolverConflito(r.estado, 'ambas');
  assert.equal(res.ok, true);
  r = rodar(res.estado, 'git merge worktree-vagas');
  assert.equal(r.conflito, true);
  res = resolverConflito(r.estado, 'ambas');
  assert.equal(res.ok, true);
  assert.equal(res.estado.branches.main.ancoras.usos.length, 3);
  assert.equal(progressoMissao(res.estado).rotas, true);
  r = rodar(
    res.estado,
    'git worktree remove .claude/worktrees/agendar',
    'git worktree remove .claude/worktrees/cancelar',
    'git worktree remove .claude/worktrees/vagas',
  );
  const p = progressoMissao(r.estado);
  assert.deepEqual(Object.values(p), [true, true, true, true, true, true]);
});

test('resolver escolhendo só um lado perde rota', () => {
  let r = rodar(criarEstado(), 'claude -w agendar', 'claude -w cancelar', 'git merge worktree-agendar', 'git merge worktree-cancelar');
  const res = resolverConflito(r.estado, 'ours');
  assert.equal(res.ok, false);
  assert.deepEqual(res.perdidas, ['T2']);
  assert.deepEqual(rotasPerdidas(res.estado), ['T2']);
});

test('não remove worktree em que você está nem a principal', () => {
  let r = rodar(criarEstado(), 'git worktree add ../wt-a -b a', 'cd ../wt-a', 'git worktree remove ../wt-a');
  assert.equal(r.erro, true);
  r = rodar(r.estado, 'git worktree remove /agenda-mentorias');
  assert.match(r.saida[0], /main working tree/);
});

test('merge fora da main avisa que a integração é na main', () => {
  const r = rodar(criarEstado(), 'git worktree add ../wt-a -b a', 'cd ../wt-a', 'claude', 'git worktree add ../wt-b -b b', 'git merge b');
  assert.ok(r.saida.some((l) => /integração acontece na main/.test(l)));
});

test('comando desconhecido orienta a usar help', () => {
  const r = executar(criarEstado(), 'npm test');
  assert.equal(r.erro, true);
  assert.match(r.saida[0], /help/);
});

test('mesma pasta: só a última escrita sobrevive', () => {
  const s = simularMesmaPasta();
  assert.deepEqual(s.sobreviventes, ['T3']);
  assert.deepEqual(s.perdidas, ['T1', 'T2']);
  assert.ok(s.eventos.some((e) => e.sobrescreveu && e.sobrescreveu.length));
});
