#!/usr/bin/env node
// Teste do próprio avaliador (sensor do sensor).
// 1. Projeto inicial sem nenhuma task: nenhum caso de T1-T3/NFR pode passar.
// 2. Referência (projeto inicial + referencia/), com commits test(Tn) antes de feat(Tn): nota máxima.
// 3. Referência com um teste de aceite alterado: rosa pintada detectada (-30).
// Pré-requisito: `npm install` em speedrun/agenda-mentorias.
// Use --gates para rodar também `npm run gates` na referência.
import { cpSync, existsSync, mkdtempSync, rmSync, symlinkSync, writeFileSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const inicial = path.resolve(aqui, '../agenda-mentorias');
const referencia = path.join(aqui, 'referencia');
const rodarGates = process.argv.includes('--gates');

if (!existsSync(path.join(inicial, 'node_modules'))) {
  console.error('Rode `npm install` em speedrun/agenda-mentorias antes.');
  process.exit(1);
}

const temporarios = [];
function copiarInicial() {
  const destino = mkdtempSync(path.join(tmpdir(), 'avaliador-'));
  temporarios.push(destino);
  cpSync(inicial, destino, {
    recursive: true,
    filter: (origem) => !origem.includes(`${path.sep}node_modules`) && !origem.includes(`${path.sep}.git${path.sep}`),
  });
  symlinkSync(path.join(inicial, 'node_modules'), path.join(destino, 'node_modules'), 'dir');
  return destino;
}

function git(pasta, ...args) {
  return execFileSync('git', ['-C', pasta, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function commitar(pasta, mensagem) {
  git(pasta, 'add', '-A');
  git(pasta, '-c', 'user.name=Avaliador', '-c', 'user.email=avaliador@pda.local', 'commit', '-q', '-m', mensagem);
}

function copiar(relativo, destino) {
  cpSync(path.join(referencia, relativo), path.join(destino, relativo));
}

function avaliar(pasta) {
  const saida = execFileSync(process.execPath, [path.join(aqui, 'avaliar.mjs'), pasta], { encoding: 'utf8' });
  const linha = saida.trim().split('\n').at(-1);
  if (!linha.startsWith('PLACAR ')) throw new Error(`saída sem PLACAR:\n${saida}`);
  return { saida, placar: JSON.parse(linha.slice('PLACAR '.length)) };
}

let falhas = 0;
function conferir(condicao, mensagem) {
  console.log(`${condicao ? '✔' : '✘'} ${mensagem}`);
  if (!condicao) falhas++;
}

try {
  // 1. Projeto inicial
  const vazio = copiarInicial();
  const r1 = avaliar(vazio);
  conferir(r1.placar.casos.passaram === 0, `projeto inicial: 0 casos passam (passaram ${r1.placar.casos.passaram}/${r1.placar.casos.total})`);
  conferir(r1.placar.rosas.length === 0, 'projeto inicial: nenhuma rosa pintada');
  conferir(Object.values(r1.placar.tdd).every((v) => v === false), 'projeto inicial: sem git, TDD não visível');

  // 2. Referência com histórico TDD
  const ref = copiarInicial();
  git(ref, 'init', '-q', '-b', 'main');
  commitar(ref, 'chore: projeto inicial');
  const etapas = [
    ['T1', 'tests/t1.test.js', ['src/repo.js', 'src/rotas/agendamento.js']],
    ['T2', 'tests/t2.test.js', ['src/rotas/cancelamento.js']],
    ['T3', 'tests/t3.test.js', ['src/rotas/vagas.js', 'src/app.js']],
  ];
  for (const [task, teste, codigo] of etapas) {
    copiar(teste, ref);
    writeFileSync(path.join(ref, `tests/aceite/${task}.ativa`), '');
    commitar(ref, `test(${task}): casos da tabela`);
    for (const arquivo of codigo) copiar(arquivo, ref);
    commitar(ref, `feat(${task}): implementa ${task}`);
  }
  const r2 = avaliar(ref);
  const maximo = r2.placar.casos.total * 2 + 30;
  conferir(r2.placar.casos.passaram === r2.placar.casos.total, `referência: ${r2.placar.casos.passaram}/${r2.placar.casos.total} casos`);
  conferir(r2.placar.pontos.total === maximo, `referência: nota máxima ${r2.placar.pontos.total}/${maximo}`);
  if (r2.placar.pontos.total !== maximo) console.log(r2.saida);

  if (rodarGates) {
    try {
      execFileSync('npm', ['run', 'gates'], { cwd: ref, stdio: 'inherit' });
      conferir(true, 'referência: npm run gates verde (com testes de aceite ativados)');
    } catch {
      conferir(false, 'referência: npm run gates falhou');
    }
  }

  // 3. Rosa pintada
  appendFileSync(path.join(ref, 'tests/aceite/t1.test.js'), '\n// só um ajustezinho\n');
  const r3 = avaliar(ref);
  conferir(
    r3.placar.rosas.length === 1 && r3.placar.pontos.rosas === -30,
    `rosa pintada detectada: ${r3.placar.rosas.join(', ') || 'nenhuma'}`,
  );
} finally {
  for (const pasta of temporarios) rmSync(pasta, { recursive: true, force: true });
}

console.log(falhas === 0 ? '\nAvaliador OK.' : `\n${falhas} verificação(ões) falharam.`);
process.exit(falhas === 0 ? 0 : 1);
