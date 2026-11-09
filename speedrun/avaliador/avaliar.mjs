#!/usr/bin/env node
// Avaliador oficial do Speedrun da Semana 10 (agenda-mentorias).
// Uso: node avaliar.mjs <caminho-do-projeto>
// Imprime um cartão de pontuação e, na última linha, "PLACAR {...}" para colar no site.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const PONTOS_POR_CASO = 2;
const PONTOS_TDD = 10;
const PONTOS_ROSA = -30;
const TIMEOUT_MS = 3000;

const HASHES_ORIGINAIS = {
  'tests/aceite/_aceite.js': '8d0d49b55368a3aaf4f717f2a9b77f4116d75139c2b0df2df97b9906d73df5cd',
  'tests/aceite/t1.test.js': 'ddd598ebb8df61deb0acb1a33ac1f56d5d66430acf59b8fc717193315effeeda',
  'tests/aceite/t2.test.js': '53b227ecc516b1eeb364d6601f055f3cc1c4076005dbfd508c8e5813c26aa2fd',
  'tests/aceite/t3.test.js': '98b3e0b7394dfcd36061d75623093a9988373e504320eabd5cfd57f4b1c292a9',
};

const SEED_OFICIAL = {
  mentores: [
    { id: 1, nome: 'Carla Souza', area: 'Back-end' },
    { id: 2, nome: 'Diego Lima', area: 'Dados' },
    { id: 3, nome: 'Aline Ferreira', area: 'Front-end' },
    { id: 4, nome: 'Bruno Tavares', area: 'DevOps' },
  ],
  vagas: [
    { id: 1, mentorId: 1, inicio: '2026-11-16T09:00', livre: true },
    { id: 2, mentorId: 1, inicio: '2026-11-16T10:00', livre: true },
    { id: 3, mentorId: 1, inicio: '2026-11-17T09:00', livre: false },
    { id: 4, mentorId: 1, inicio: '2026-11-18T14:00', livre: true },
    { id: 5, mentorId: 2, inicio: '2026-11-16T09:00', livre: true },
    { id: 6, mentorId: 2, inicio: '2026-11-19T15:00', livre: true },
    { id: 7, mentorId: 3, inicio: '2026-11-17T10:00', livre: false },
    { id: 8, mentorId: 3, inicio: '2026-11-20T11:00', livre: true },
    { id: 9, mentorId: 1, inicio: '2026-11-16T08:00', livre: true },
    { id: 10, mentorId: 2, inicio: '2026-11-21T09:00', livre: true },
  ],
  agendamentos: [
    { id: 1, vagaId: 3, mentorId: 1, jovemEmail: 'jovem1@pda.org', status: 'confirmado' },
    { id: 2, vagaId: 7, mentorId: 3, jovemEmail: 'jovem2@pda.org', status: 'confirmado' },
    { id: 3, vagaId: 10, mentorId: 2, jovemEmail: 'jovem3@pda.org', status: 'cancelado' },
  ],
};

function seedComMilVagas() {
  const vagas = [];
  for (let i = 0; i < 1000; i++) {
    const dia = String(1 + (i % 28)).padStart(2, '0');
    const hora = String(8 + (Math.floor(i / 28) % 12)).padStart(2, '0');
    const minuto = String((Math.floor(i / 336) * 15) % 60).padStart(2, '0');
    vagas.push({ id: 1000 + i, mentorId: 1, inicio: `2026-12-${dia}T${hora}:${minuto}`, livre: i % 2 === 0 });
  }
  return { ...structuredClone(SEED_OFICIAL), vagas };
}

const TASKS = {
  T1: 'Agendar mentoria',
  T2: 'Cancelar agendamento',
  T3: 'Listar vagas livres',
  NFR: 'Requisitos não funcionais',
};

const EMAIL = 'ana@pda.org';
const post = (body) => ({ method: 'POST', caminho: '/agendamentos', body });

/** Casos declarativos: requisição → status e corpo exatos. */
const CASOS_SIMPLES = [
  ['T1', '400 quando vagaId está ausente', post({ jovemEmail: EMAIL }), 400, { erro: 'vagaId é obrigatório' }],
  ['T1', '400 quando vagaId é texto', post({ vagaId: '1', jovemEmail: EMAIL }), 400, { erro: 'vagaId é obrigatório' }],
  ['T1', '400 quando vagaId não é inteiro', post({ vagaId: 1.5, jovemEmail: EMAIL }), 400, { erro: 'vagaId é obrigatório' }],
  ['T1', '400 vagaId vem antes de jovemEmail (corpo vazio)', post({}), 400, { erro: 'vagaId é obrigatório' }],
  ['T1', '400 quando jovemEmail está ausente', post({ vagaId: 1 }), 400, { erro: 'jovemEmail é obrigatório' }],
  ['T1', '400 quando jovemEmail está vazio', post({ vagaId: 1, jovemEmail: '' }), 400, { erro: 'jovemEmail é obrigatório' }],
  ['T1', '400 quando jovemEmail não tem formato a@b.c', post({ vagaId: 1, jovemEmail: 'ana.pda.org' }), 400, { erro: 'jovemEmail inválido' }],
  ['T1', '404 quando a vaga não existe', post({ vagaId: 999, jovemEmail: EMAIL }), 404, { erro: 'Vaga não encontrada' }],
  ['T1', '409 quando a vaga está ocupada', post({ vagaId: 3, jovemEmail: EMAIL }), 409, { erro: 'Vaga indisponível' }],
  ['T2', '404 quando o agendamento não existe', { method: 'DELETE', caminho: '/agendamentos/999' }, 404, { erro: 'Agendamento não encontrado' }],
  ['T2', '409 quando já está cancelado', { method: 'DELETE', caminho: '/agendamentos/3' }, 409, { erro: 'Agendamento já cancelado' }],
  ['T2', '200 ao cancelar um agendamento confirmado', { method: 'DELETE', caminho: '/agendamentos/1' }, 200, { id: 1, status: 'cancelado' }],
  ['T3', '404 quando o mentor não existe', { caminho: '/mentores/999/vagas' }, 404, { erro: 'Mentor não encontrado' }],
  ['T3', '400 quando a data está fora do formato', { caminho: '/mentores/1/vagas?data=16-11-2026' }, 400, { erro: 'data inválida' }],
  ['T3', '400 quando a data não existe no calendário', { caminho: '/mentores/1/vagas?data=2026-02-30' }, 400, { erro: 'data inválida' }],
  ['T3', '200 lista só vagas livres, em ordem', { caminho: '/mentores/1/vagas' }, 200, [
    { id: 9, inicio: '2026-11-16T08:00' },
    { id: 1, inicio: '2026-11-16T09:00' },
    { id: 2, inicio: '2026-11-16T10:00' },
    { id: 4, inicio: '2026-11-18T14:00' },
  ]],
  ['T3', '200 filtra pelo dia', { caminho: '/mentores/1/vagas?data=2026-11-16' }, 200, [
    { id: 9, inicio: '2026-11-16T08:00' },
    { id: 1, inicio: '2026-11-16T09:00' },
    { id: 2, inicio: '2026-11-16T10:00' },
  ]],
  ['T3', '200 com lista vazia para mentor sem vagas', { caminho: '/mentores/4/vagas' }, 200, []],
  ['T3', '200 com lista vazia para dia sem vagas', { caminho: '/mentores/1/vagas?data=2026-12-25' }, 200, []],
].map(([task, nome, req, status, corpo]) => ({
  task,
  nome,
  async executar(ctx) {
    const r = await ctx.pedir(req);
    return compararResposta(r, status, corpo);
  },
}));

const CASOS_ESPECIAIS = [
  {
    task: 'T1',
    nome: '201 com o agendamento confirmado (corpo exato)',
    async executar(ctx) {
      const r = await ctx.pedir(post({ vagaId: 1, jovemEmail: EMAIL }));
      if (r.status !== 201) return falha(`esperado 201, veio ${r.status} ${resumo(r.corpo)}`);
      const corpo = r.corpo ?? {};
      const chaves = Object.keys(corpo).sort().join(',');
      if (chaves !== 'id,jovemEmail,mentorId,status,vagaId') return falha(`campos esperados id,vagaId,mentorId,jovemEmail,status; vieram ${chaves}`);
      if (typeof corpo.id !== 'number') return falha('id deveria ser número');
      const { id: _id, ...resto } = corpo;
      return compararResposta({ status: 201, corpo: resto }, 201, { vagaId: 1, mentorId: 1, jovemEmail: EMAIL, status: 'confirmado' });
    },
  },
  {
    task: 'T1',
    nome: '409 ao agendar a mesma vaga duas vezes',
    async executar(ctx) {
      await ctx.pedir(post({ vagaId: 1, jovemEmail: EMAIL }));
      const r = await ctx.pedir(post({ vagaId: 1, jovemEmail: 'bia@pda.org' }));
      return compararResposta(r, 409, { erro: 'Vaga indisponível' });
    },
  },
  {
    task: 'T1',
    nome: 'a vaga agendada passa a livre: false',
    async executar(ctx) {
      await ctx.pedir(post({ vagaId: 1, jovemEmail: EMAIL }));
      const vaga = await ctx.repo.buscarVaga(1);
      return vaga?.livre === false ? ok() : falha(`vaga 1 ficou ${resumo(vaga)}`);
    },
  },
  {
    task: 'T2',
    nome: 'a vaga volta a livre: true depois do cancelamento',
    async executar(ctx) {
      await ctx.pedir({ method: 'DELETE', caminho: '/agendamentos/1' });
      const vaga = await ctx.repo.buscarVaga(3);
      return vaga?.livre === true ? ok() : falha(`vaga 3 ficou ${resumo(vaga)}`);
    },
  },
  {
    task: 'T2',
    nome: '409 ao cancelar duas vezes',
    async executar(ctx) {
      await ctx.pedir({ method: 'DELETE', caminho: '/agendamentos/1' });
      const r = await ctx.pedir({ method: 'DELETE', caminho: '/agendamentos/1' });
      return compararResposta(r, 409, { erro: 'Agendamento já cancelado' });
    },
  },
  {
    task: 'NFR',
    nome: 'NFR-1 · 10 pedidos simultâneos para a mesma vaga: exatamente um 201',
    async executar(ctx) {
      const respostas = await Promise.all(
        Array.from({ length: 10 }, (_, i) => ctx.pedir(post({ vagaId: 2, jovemEmail: `jovem${i}@pda.org` }))),
      );
      const criados = respostas.filter((r) => r.status === 201).length;
      const recusados = respostas.filter((r) => r.status === 409).length;
      return criados === 1 && recusados === 9 ? ok() : falha(`${criados} × 201 e ${recusados} × 409`);
    },
  },
  {
    task: 'NFR',
    nome: 'NFR-2 · 1.000 vagas: p95 < 50 ms em GET /mentores/1/vagas',
    seed: seedComMilVagas,
    async executar(ctx) {
      const primeira = await ctx.pedir({ caminho: '/mentores/1/vagas' });
      if (primeira.status !== 200 || !Array.isArray(primeira.corpo) || primeira.corpo.length !== 500) {
        return falha(`esperado 200 com 500 vagas livres, veio ${primeira.status} ${resumo(primeira.corpo)}`);
      }
      const tempos = [];
      for (let i = 0; i < 210; i++) {
        const inicio = performance.now();
        await ctx.pedir({ caminho: '/mentores/1/vagas' });
        const ms = performance.now() - inicio;
        if (ms > 500) return falha(`uma requisição levou ${Math.round(ms)} ms (procure repositório chamado dentro de loop)`);
        if (i >= 10) tempos.push(ms);
      }
      tempos.sort((a, b) => a - b);
      const p95 = tempos[Math.ceil(0.95 * tempos.length) - 1];
      const texto = `p95 = ${p95.toFixed(1)} ms`;
      return p95 < 50 ? ok(texto) : falha(texto);
    },
  },
];

const CASOS = [...CASOS_SIMPLES, ...CASOS_ESPECIAIS].sort(
  (a, b) => Object.keys(TASKS).indexOf(a.task) - Object.keys(TASKS).indexOf(b.task),
);

function ok(detalhe = '') {
  return { passou: true, detalhe };
}
function falha(detalhe) {
  return { passou: false, detalhe };
}
function resumo(valor) {
  const texto = typeof valor === 'string' ? valor.replace(/\s+/g, ' ') : JSON.stringify(valor);
  return texto === undefined ? 'sem corpo' : texto.length > 90 ? `${texto.slice(0, 87)}...` : texto;
}
function compararResposta(r, status, corpo) {
  const igual = r.status === status && JSON.stringify(r.corpo) === JSON.stringify(corpo);
  return igual ? ok() : falha(`esperado ${status} ${resumo(corpo)}, veio ${r.status} ${resumo(r.corpo)}`);
}

function hashNormalizado(arquivo) {
  const texto = readFileSync(arquivo, 'utf8').replace(/\r\n/g, '\n');
  return createHash('sha256').update(texto).digest('hex');
}

export function procurarRosas(raiz) {
  return Object.entries(HASHES_ORIGINAIS)
    .filter(([relativo, hash]) => {
      const arquivo = path.join(raiz, relativo);
      return !existsSync(arquivo) || hashNormalizado(arquivo) !== hash;
    })
    .map(([relativo]) => relativo);
}

/** TDD visível: um commit test(Tn) antes do primeiro feat(Tn). */
export function lerTdd(assuntos) {
  const resultado = {};
  for (const task of ['T1', 'T2', 'T3']) {
    const teste = assuntos.findIndex((s) => new RegExp(`^test\\(${task}\\)`, 'i').test(s));
    const feat = assuntos.findIndex((s) => new RegExp(`^feat\\(${task}\\)`, 'i').test(s));
    resultado[task] = teste !== -1 && feat !== -1 && teste < feat;
  }
  return resultado;
}

function assuntosDoGit(raiz) {
  try {
    return execFileSync('git', ['-C', raiz, 'log', '--reverse', '--format=%s'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split('\n')
      .filter(Boolean);
  } catch {
    return null;
  }
}

async function rodarCasos(raiz) {
  const { createApp } = await import(pathToFileURL(path.join(raiz, 'src/app.js')).href);
  const modRepo = await import(pathToFileURL(path.join(raiz, 'src/repo.js')).href);
  const servidor = createApp().listen(0);
  await new Promise((resolve) => servidor.once('listening', resolve));
  const porta = servidor.address().port;
  const base = `http://127.0.0.1:${porta}`;

  const ctx = {
    repo: modRepo.repo,
    async pedir({ method = 'GET', caminho, body }) {
      try {
        const resposta = await fetch(base + caminho, {
          method,
          headers: body === undefined ? {} : { 'content-type': 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        const texto = await resposta.text();
        let corpo;
        try {
          corpo = texto ? JSON.parse(texto) : undefined;
        } catch {
          corpo = texto;
        }
        return { status: resposta.status, corpo };
      } catch (erro) {
        return { status: 0, corpo: `sem resposta (${erro.name})` };
      }
    },
  };

  const resultados = [];
  for (const caso of CASOS) {
    let resultado;
    try {
      modRepo.reset(caso.seed ? caso.seed() : structuredClone(SEED_OFICIAL));
      resultado = await caso.executar(ctx);
    } catch (erro) {
      resultado = falha(`erro: ${erro.message}`);
    }
    resultados.push({ task: caso.task, nome: caso.nome, ...resultado });
  }
  servidor.closeAllConnections?.();
  await new Promise((resolve) => servidor.close(resolve));
  return resultados;
}

async function main() {
  const alvo = process.argv[2];
  if (!alvo) {
    console.error('Uso: node avaliar.mjs <caminho-do-projeto>');
    process.exit(1);
  }
  const raiz = path.resolve(alvo);
  const linhas = [];
  const escrever = (texto = '') => linhas.push(texto);

  let resultados = [];
  let erroDeCarga = null;
  try {
    resultados = await rodarCasos(raiz);
  } catch (erro) {
    erroDeCarga = erro.message;
    resultados = CASOS.map((c) => ({ task: c.task, nome: c.nome, passou: false, detalhe: 'app não carregou' }));
  }

  const assuntos = assuntosDoGit(raiz);
  const tdd = assuntos ? lerTdd(assuntos) : { T1: false, T2: false, T3: false };
  const rosas = procurarRosas(raiz);

  const passaram = resultados.filter((r) => r.passou).length;
  const pontosCasos = passaram * PONTOS_POR_CASO;
  const pontosTdd = Object.values(tdd).filter(Boolean).length * PONTOS_TDD;
  const pontosRosas = rosas.length * PONTOS_ROSA;
  const total = pontosCasos + pontosTdd + pontosRosas;

  escrever('┌─────────────────────────────────────────────────────────┐');
  escrever('│  Avaliador oficial · Speedrun agenda-mentorias          │');
  escrever('└─────────────────────────────────────────────────────────┘');
  escrever(`Projeto: ${raiz}`);
  if (erroDeCarga) escrever(`\n✘ O app não carregou: ${erroDeCarga}`);

  const porTask = {};
  for (const task of Object.keys(TASKS)) {
    const daTask = resultados.filter((r) => r.task === task);
    const ok = daTask.filter((r) => r.passou).length;
    porTask[task] = { passaram: ok, total: daTask.length };
    escrever(`\n${task} · ${TASKS[task]} — ${ok}/${daTask.length}`);
    for (const r of daTask) {
      const extra = r.detalhe ? `  → ${r.detalhe}` : '';
      escrever(`  ${r.passou ? '✔' : '✘'} ${r.nome}${extra}`);
    }
  }

  escrever('\nTDD visível (test(Tn) antes de feat(Tn) no git log)');
  if (!assuntos) escrever('  ✘ não é um repositório git ou não há commits');
  else for (const [task, visivel] of Object.entries(tdd)) escrever(`  ${visivel ? '✔' : '✘'} ${task}`);

  escrever('\nRosas pintadas (testes de aceite alterados)');
  if (rosas.length === 0) escrever('  ✔ nenhuma: os testes de aceite estão intactos');
  else for (const r of rosas) escrever(`  🌹 ${r}  (${PONTOS_ROSA})`);

  escrever('\nPontos');
  escrever(`  casos  ${passaram}/${resultados.length} × ${PONTOS_POR_CASO} = ${pontosCasos}`);
  escrever(`  TDD    ${pontosTdd}`);
  escrever(`  rosas  ${pontosRosas}`);
  escrever(`  total  ${total}`);
  escrever('\nCopie a linha abaixo e cole no placar do site (#/speedrun):');

  const placar = {
    versao: 1,
    casos: { passaram, total: resultados.length },
    porTask,
    tdd,
    rosas,
    pontos: { casos: pontosCasos, tdd: pontosTdd, rosas: pontosRosas, total },
  };
  escrever(`PLACAR ${JSON.stringify(placar)}`);
  console.log(linhas.join('\n'));
  process.exit(0);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await main();
}
