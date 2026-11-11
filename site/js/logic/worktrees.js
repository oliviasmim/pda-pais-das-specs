export const RAIZ = '/agenda-mentorias';

export const TASKS = [
  {
    id: 'T1',
    chave: 'agend',
    titulo: 'Agendar mentoria',
    rota: 'POST /agendamentos',
    arquivo: 'src/routes/agendamentos.js',
    import: "import { agendamentosRouter } from './routes/agendamentos.js';",
    uso: '  app.use(agendamentosRouter);',
  },
  {
    id: 'T2',
    chave: 'cancel',
    titulo: 'Cancelar agendamento',
    rota: 'DELETE /agendamentos/:id',
    arquivo: 'src/routes/cancelamento.js',
    import: "import { cancelamentoRouter } from './routes/cancelamento.js';",
    uso: '  app.use(cancelamentoRouter);',
  },
  {
    id: 'T3',
    chave: 'vaga',
    titulo: 'Listar vagas livres',
    rota: 'GET /mentores/:id/vagas',
    arquivo: 'src/routes/vagas.js',
    import: "import { vagasRouter } from './routes/vagas.js';",
    uso: '  app.use(vagasRouter);',
  },
];

const BASE_SHA = 'a1b2c3d';

export function arquivoApp(ancoras) {
  return [
    "import express from 'express';",
    "import { mentoresRouter } from './routes/mentores.js';",
    ...ancoras.imports,
    '',
    'export function createApp() {',
    '  const app = express();',
    '  app.use(express.json());',
    '  app.use(mentoresRouter);',
    ...ancoras.usos,
    '  return app;',
    '}',
  ];
}

function ancorasVazias() {
  return { imports: [], usos: [] };
}

function copiarAncoras(a) {
  return { imports: [...a.imports], usos: [...a.usos] };
}

function iguais(a, b) {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

export function criarEstado() {
  return {
    cwd: RAIZ,
    worktrees: [{ dir: RAIZ, branch: 'main', principal: true }],
    branches: {
      main: { ancoras: ancorasVazias(), base: ancorasVazias(), commits: [], mesclada: false },
    },
    agentes: [],
    conflito: null,
    listouDepoisDosAgentes: false,
    shaSeq: 0,
  };
}

function clonar(estado) {
  return JSON.parse(JSON.stringify(estado));
}

function novoSha(estado) {
  estado.shaSeq += 1;
  const n = (0xc0ffee0 + estado.shaSeq * 7919).toString(16);
  return n.slice(-7);
}

export function resolverCaminho(cwd, alvo) {
  if (!alvo || alvo === '~') return RAIZ;
  const partes = alvo.startsWith('/') ? [] : cwd.split('/').filter(Boolean);
  for (const p of alvo.split('/')) {
    if (!p || p === '.') continue;
    if (p === '..') partes.pop();
    else partes.push(p);
  }
  return '/' + partes.join('/');
}

export function rotuloCaminho(dir) {
  if (dir === RAIZ) return 'agenda-mentorias';
  if (dir.startsWith(RAIZ + '/')) return dir.slice(RAIZ.length + 1);
  return dir.split('/').filter(Boolean).pop() || dir;
}

function worktreeEm(estado, dir) {
  return estado.worktrees.find((w) => w.dir === dir);
}

function worktreeAtual(estado) {
  return worktreeEm(estado, estado.cwd);
}

function tokenizar(linha) {
  return linha.trim().split(/\s+/).filter(Boolean);
}

function saida(estado, linhas, extra = {}) {
  return { estado, saida: Array.isArray(linhas) ? linhas : [linhas], ...extra };
}

function erro(estado, linhas) {
  return { estado, saida: Array.isArray(linhas) ? linhas : [linhas], erro: true };
}

function taskPara(estado, nome) {
  const livres = TASKS.filter((t) => !estado.agentes.some((a) => a.task === t.id));
  if (!livres.length) return null;
  const n = (nome || '').toLowerCase();
  return livres.find((t) => n.includes(t.chave)) || livres[0];
}

function criarWorktree(estado, dir, branch, novaBranch) {
  const main = estado.branches[worktreeAtual(estado).branch] || estado.branches.main;
  if (novaBranch) {
    estado.branches[branch] = {
      ancoras: copiarAncoras(main.ancoras),
      base: copiarAncoras(main.ancoras),
      commits: [],
      mesclada: false,
    };
  }
  estado.worktrees.push({ dir, branch, principal: false });
}

function iniciarAgente(estado, wt, nomePedido) {
  const task = taskPara(estado, nomePedido || wt.branch);
  if (!task) return { ok: false, msg: 'As 3 tasks já têm agente. Um quarto agente não teria task própria e só aumentaria o custo de coordenação.' };
  if (estado.agentes.some((a) => a.dir === wt.dir)) {
    return {
      ok: false,
      msg: 'Este worktree já tem um agente. Duas sessões na mesma pasta voltam ao problema da aba 1: uma grava por cima da outra.',
    };
  }
  const br = estado.branches[wt.branch];
  br.ancoras.imports.push(task.import);
  br.ancoras.usos.push(task.uso);
  const sha = novoSha(estado);
  br.commits.push({ sha, msg: `feat(${task.id}): ${task.rota}`, arquivos: [task.arquivo, 'src/app.js'] });
  br.mesclada = false;
  const agente = { id: estado.agentes.length + 1, dir: wt.dir, branch: wt.branch, task: task.id, sha };
  estado.agentes.push(agente);
  return { ok: true, agente, task, sha };
}

function cmdWorktree(estado, args) {
  const sub = args[0];
  if (sub === 'list') {
    if (estado.agentes.length >= 3) estado.listouDepoisDosAgentes = true;
    const largura = Math.max(...estado.worktrees.map((w) => w.dir.length)) + 2;
    return saida(
      estado,
      estado.worktrees.map((w) => {
        const br = estado.branches[w.branch];
        const sha = br.commits.length ? br.commits[br.commits.length - 1].sha : BASE_SHA;
        return `${w.dir.padEnd(largura)}${sha} [${w.branch}]`;
      }),
    );
  }
  if (sub === 'add') {
    const resto = args.slice(1);
    let branchNova = null;
    const posicionais = [];
    for (let i = 0; i < resto.length; i++) {
      if (resto[i] === '-b' || resto[i] === '-B') branchNova = resto[++i];
      else posicionais.push(resto[i]);
    }
    const [alvo, branchExistente] = posicionais;
    if (!alvo) return erro(estado, 'usage: git worktree add [-b <new-branch>] <path> [<commit-ish>]');
    if (args.includes('-b') && !branchNova) return erro(estado, "error: switch `b' requires a value");
    const dir = resolverCaminho(estado.cwd, alvo);
    if (worktreeEm(estado, dir)) return erro(estado, `fatal: '${alvo}' already exists`);
    if (branchNova) {
      if (estado.branches[branchNova]) return erro(estado, `fatal: a branch named '${branchNova}' already exists`);
      criarWorktree(estado, dir, branchNova, true);
      return saida(estado, [`Preparing worktree (new branch '${branchNova}')`, `HEAD is now at ${BASE_SHA} feat: base do projeto`]);
    }
    const nome = branchExistente || alvo.split('/').filter(Boolean).pop();
    if (!estado.branches[nome]) {
      if (branchExistente) return erro(estado, `fatal: invalid reference: ${branchExistente}`);
      criarWorktree(estado, dir, nome, true);
      return saida(estado, [`Preparing worktree (new branch '${nome}')`, `HEAD is now at ${BASE_SHA} feat: base do projeto`]);
    }
    const ocupado = estado.worktrees.find((w) => w.branch === nome);
    if (ocupado) {
      return erro(estado, [
        `fatal: '${nome}' is already used by worktree at '${ocupado.dir}'`,
        'dica: uma branch só pode estar em um worktree por vez. Crie uma branch nova com -b <nome>.',
      ]);
    }
    criarWorktree(estado, dir, nome, false);
    return saida(estado, [`Preparing worktree (checking out '${nome}')`]);
  }
  if (sub === 'remove') {
    const forcar = args.includes('--force') || args.includes('-f');
    const alvo = args.slice(1).find((a) => !a.startsWith('-'));
    if (!alvo) return erro(estado, 'usage: git worktree remove [--force] <worktree>');
    const dir = resolverCaminho(estado.cwd, alvo);
    const wt = worktreeEm(estado, dir);
    if (!wt) return erro(estado, `fatal: '${alvo}' is not a working tree`);
    if (wt.principal) return erro(estado, `fatal: '${alvo}' is a main working tree`);
    if (estado.cwd === dir) {
      return erro(estado, [
        `fatal: '${alvo}' is the current working tree`,
        'dica: você está dentro desse worktree. Volte para a pasta principal com cd e remova de lá.',
      ]);
    }
    const br = estado.branches[wt.branch];
    if (!br.mesclada && br.commits.length && !forcar) {
      estado.worktrees = estado.worktrees.filter((w) => w.dir !== dir);
      return saida(estado, [
        `(worktree removido; a branch '${wt.branch}' continua existindo)`,
        `dica: a branch '${wt.branch}' ainda não foi mesclada. O trabalho não se perdeu, mas confira antes de apagar a branch.`,
      ]);
    }
    estado.worktrees = estado.worktrees.filter((w) => w.dir !== dir);
    return saida(estado, []);
  }
  if (sub === 'prune') return saida(estado, []);
  return erro(estado, `git: '${['worktree', sub].join(' ')}' não é suportado neste simulador. Use add, list ou remove.`);
}

export function mesclar(estado, nomeBranch) {
  const atual = worktreeAtual(estado);
  const ours = estado.branches[atual.branch];
  const theirs = estado.branches[nomeBranch];
  const conflitos = [];
  const resultado = {};
  for (const chave of ['imports', 'usos']) {
    const o = ours.ancoras[chave];
    const t = theirs.ancoras[chave];
    const b = theirs.base[chave];
    if (iguais(t, b) || iguais(o, t)) resultado[chave] = [...o];
    else if (iguais(o, b)) resultado[chave] = [...t];
    else {
      resultado[chave] = null;
      conflitos.push({ chave, ours: [...o], theirs: [...t], base: [...b] });
    }
  }
  return { resultado, conflitos };
}

function cmdMerge(estado, args) {
  const nome = args.find((a) => !a.startsWith('-'));
  if (args.includes('--abort')) {
    if (!estado.conflito) return erro(estado, 'fatal: There is no merge to abort (MERGE_HEAD missing).');
    estado.conflito = null;
    return saida(estado, []);
  }
  if (!nome) return erro(estado, 'fatal: No remote for the current branch.');
  const atual = worktreeAtual(estado);
  if (!estado.branches[nome]) return erro(estado, `merge: ${nome} - not something we can merge`);
  if (nome === atual.branch) return saida(estado, 'Already up to date.');
  if (atual.branch !== 'main') {
    return saida(estado, [
      'Already up to date.',
      'dica: a integração acontece na main. Rode cd para a pasta principal antes do merge.',
    ]);
  }
  const theirs = estado.branches[nome];
  if (!theirs.commits.length || theirs.mesclada) return saida(estado, 'Already up to date.');
  const { resultado, conflitos } = mesclar(estado, nome);
  if (!conflitos.length) {
    estado.branches[atual.branch].ancoras = resultado;
    theirs.mesclada = true;
    const sha = novoSha(estado);
    estado.branches.main.commits.push({ sha, msg: `Merge branch '${nome}'`, arquivos: ['src/app.js'] });
    const task = estado.agentes.find((a) => a.branch === nome);
    const t = task ? TASKS.find((x) => x.id === task.task) : null;
    return saida(estado, [
      `Updating ${BASE_SHA}..${sha}`,
      'Fast-forward',
      ` src/app.js${' '.repeat(12)}| 2 ++`,
      t ? ` ${t.arquivo.padEnd(22)}| 40 ++++++++++++` : '',
      ` ${t ? 2 : 1} files changed`,
    ].filter(Boolean));
  }
  estado.conflito = { branch: nome, resultado, conflitos };
  return saida(
    estado,
    [
      'Auto-merging src/app.js',
      'CONFLICT (content): Merge conflict in src/app.js',
      'Automatic merge failed; fix conflicts and then commit the result.',
      'dica: as duas tasks adicionaram uma linha no mesmo ponto de src/app.js. Decida no painel abaixo o que fica.',
    ],
    { conflito: true },
  );
}

export function textoConflito(estado) {
  if (!estado.conflito) return null;
  const { branch, conflitos, resultado } = estado.conflito;
  const bloco = (chave, recuo = '') => {
    const c = conflitos.find((x) => x.chave === chave);
    if (!c) return resultado[chave];
    return [
      `${recuo}<<<<<<< HEAD`,
      ...c.ours,
      `${recuo}=======`,
      ...c.theirs,
      `${recuo}>>>>>>> ${branch}`,
    ];
  };
  return arquivoApp({ imports: bloco('imports'), usos: bloco('usos', '') });
}

export function resolverConflito(estado, escolha) {
  const novo = clonar(estado);
  if (!novo.conflito) return { estado: novo, ok: false, perdidas: [] };
  const { branch, conflitos, resultado } = novo.conflito;
  const final = { ...resultado };
  for (const c of conflitos) {
    const soDeles = c.theirs.filter((l) => !c.base.includes(l));
    if (escolha === 'ours') final[c.chave] = [...c.ours];
    else if (escolha === 'theirs') final[c.chave] = [...c.theirs];
    else final[c.chave] = [...c.ours, ...soDeles.filter((l) => !c.ours.includes(l))];
  }
  novo.branches.main.ancoras = final;
  novo.branches[branch].mesclada = true;
  novo.conflito = null;
  const sha = novoSha(novo);
  novo.branches.main.commits.push({ sha, msg: `Merge branch '${branch}'`, arquivos: ['src/app.js'] });
  const perdidas = rotasPerdidas(novo);
  return { estado: novo, ok: perdidas.length === 0, perdidas, sha };
}

export function rotasPerdidas(estado) {
  const main = estado.branches.main.ancoras;
  return TASKS.filter((t) => {
    const ag = estado.agentes.find((a) => a.task === t.id);
    if (!ag || !estado.branches[ag.branch] || !estado.branches[ag.branch].mesclada) return false;
    return !main.imports.includes(t.import) || !main.usos.includes(t.uso);
  }).map((t) => t.id);
}

function cmdStatus(estado) {
  const wt = worktreeAtual(estado);
  if (estado.conflito && wt.branch === 'main') {
    return saida(estado, [
      'On branch main',
      'You have unmerged paths.',
      '  (fix conflicts and run "git commit")',
      '',
      'Unmerged paths:',
      '        both modified:   src/app.js',
    ]);
  }
  return saida(estado, [`On branch ${wt.branch}`, 'nothing to commit, working tree clean']);
}

function cmdBranch(estado) {
  const atual = worktreeAtual(estado).branch;
  return saida(
    estado,
    Object.keys(estado.branches)
      .sort((a, b) => (a === 'main' ? -1 : b === 'main' ? 1 : a.localeCompare(b)))
      .map((b) => {
        if (b === atual) return `* ${b}`;
        if (estado.worktrees.some((w) => w.branch === b)) return `+ ${b}`;
        return `  ${b}`;
      }),
  );
}

function cmdLog(estado) {
  const wt = worktreeAtual(estado);
  const commits = [...estado.branches[wt.branch].commits].reverse();
  return saida(estado, [...commits.map((c) => `${c.sha} ${c.msg}`), `${BASE_SHA} feat: base do projeto`]);
}

function cmdCd(estado, args) {
  const alvo = args[0];
  const dir = resolverCaminho(estado.cwd, alvo);
  if (dir === RAIZ || worktreeEm(estado, dir)) {
    estado.cwd = dir;
    return saida(estado, []);
  }
  if (dir === RAIZ + '/.claude' || dir === RAIZ + '/.claude/worktrees') {
    return erro(estado, `cd: ${alvo}: entre direto em um worktree (ex.: cd .claude/worktrees/<nome>)`);
  }
  return erro(estado, `cd: no such file or directory: ${alvo}`);
}

function cmdClaude(estado, args) {
  const i = args.findIndex((a) => a === '-w' || a === '--worktree');
  if (i >= 0) {
    const nome = args[i + 1] && !args[i + 1].startsWith('-') ? args[i + 1] : `wt-${estado.worktrees.length}`;
    const dir = `${RAIZ}/.claude/worktrees/${nome}`;
    const branch = `worktree-${nome}`;
    if (estado.cwd !== RAIZ) {
      return erro(estado, 'dica: rode claude -w a partir da pasta principal do repositório (cd de volta para agenda-mentorias).');
    }
    let wt = worktreeEm(estado, dir);
    const linhas = [];
    if (!wt) {
      if (estado.branches[branch]) return erro(estado, `fatal: a branch named '${branch}' already exists`);
      criarWorktree(estado, dir, branch, true);
      wt = worktreeEm(estado, dir);
      linhas.push(`Criando worktree em .claude/worktrees/${nome} (branch ${branch})`);
    }
    const r = iniciarAgente(estado, wt, nome);
    if (!r.ok) return erro(estado, [...linhas, r.msg]);
    return saida(
      estado,
      [
        ...linhas,
        `✻ Claude Code · worktree .claude/worktrees/${nome}`,
        `> Agente ${r.agente.id} assumiu ${r.task.id} · ${r.task.titulo} (${r.task.rota})`,
        `  escreveu o teste de aceite (vermelho) → implementou → verde`,
        `  [${branch} ${r.sha}] feat(${r.task.id}): ${r.task.rota}`,
      ],
      { agente: r.agente },
    );
  }
  const wt = worktreeAtual(estado);
  if (wt.principal) {
    return erro(estado, [
      'dica: a pasta principal fica na main, só para integrar. Um agente aqui disputaria arquivo com o seu merge.',
      'Entre num worktree (cd <pasta>) e rode claude, ou use claude -w <nome>.',
    ]);
  }
  const r = iniciarAgente(estado, wt, wt.branch);
  if (!r.ok) return erro(estado, r.msg);
  return saida(
    estado,
    [
      `✻ Claude Code · ${rotuloCaminho(wt.dir)}`,
      `> Agente ${r.agente.id} assumiu ${r.task.id} · ${r.task.titulo} (${r.task.rota})`,
      `  escreveu o teste de aceite (vermelho) → implementou → verde`,
      `  [${wt.branch} ${r.sha}] feat(${r.task.id}): ${r.task.rota}`,
    ],
    { agente: r.agente },
  );
}

export const AJUDA = [
  'Comandos aceitos:',
  '  git worktree add <pasta> -b <branch>   cria um worktree numa branch nova',
  '  git worktree list                      lista os worktrees e suas branches',
  '  git worktree remove <pasta>            apaga a pasta (a branch fica)',
  '  cd <pasta>                             entra em outro worktree',
  '  claude                                 inicia um agente na pasta atual',
  '  claude -w <nome>                       cria worktree + inicia agente',
  '  git merge <branch>                     integra na main',
  '  git status | git branch | git log      inspeciona',
  '  clear                                  limpa o terminal',
];

export function executar(estadoAtual, linha) {
  const estado = clonar(estadoAtual);
  const tokens = tokenizar(linha);
  if (!tokens.length) return saida(estado, []);
  const [cmd, ...args] = tokens;
  if (cmd === 'help' || cmd === 'ajuda') return saida(estado, AJUDA);
  if (cmd === 'clear' || cmd === 'limpar') return saida(estado, [], { limpar: true });
  if (cmd === 'pwd') return saida(estado, estado.cwd);
  if (cmd === 'cd') return cmdCd(estado, args);
  if (cmd === 'claude') return cmdClaude(estado, args);
  if (cmd !== 'git') return erro(estado, `zsh: command not found: ${cmd} (digite help)`);
  const [sub, ...resto] = args;
  if (estado.conflito && !['status', 'merge', 'diff', 'log', 'branch'].includes(sub)) {
    return erro(estado, [
      'error: Merging is not possible because you have unmerged files.',
      'dica: resolva o conflito em src/app.js primeiro (painel abaixo do terminal).',
    ]);
  }
  if (sub === 'worktree') return cmdWorktree(estado, resto);
  if (sub === 'merge') {
    if (estado.conflito && !resto.includes('--abort')) {
      return erro(estado, 'error: Merging is not possible because you have unmerged files.');
    }
    return cmdMerge(estado, resto);
  }
  if (sub === 'status') return cmdStatus(estado);
  if (sub === 'branch') return cmdBranch(estado);
  if (sub === 'log') return cmdLog(estado);
  if (sub === 'checkout' || sub === 'switch') {
    const nome = resto.filter((a) => !a.startsWith('-')).pop();
    const ocupado = estado.worktrees.find((w) => w.branch === nome && w.dir !== estado.cwd);
    if (ocupado) return erro(estado, `fatal: '${nome}' is already used by worktree at '${ocupado.dir}'`);
    return erro(estado, 'dica: neste simulador, troque de worktree com cd em vez de trocar de branch.');
  }
  return erro(estado, `git: '${sub || ''}' não é suportado neste simulador (digite help).`);
}

export const PASSOS = [
  { id: 'criar', titulo: 'Crie três worktrees', dica: 'git worktree add ../wt-agendar -b agendar  (ou claude -w agendar)' },
  { id: 'agentes', titulo: 'Rode um agente em cada worktree', dica: 'cd ../wt-agendar e depois claude  (claude -w já faz os dois)' },
  { id: 'listar', titulo: 'Volte à pasta principal e liste os worktrees', dica: 'cd /agenda-mentorias e git worktree list' },
  { id: 'mesclar', titulo: 'Integre as três branches na main', dica: 'git merge agendar  (repita para as outras)' },
  { id: 'rotas', titulo: 'Resolva o conflito sem perder rota', dica: 'No conflito, mantenha as linhas das duas tasks.' },
  { id: 'limpar', titulo: 'Remova os worktrees', dica: 'git worktree remove ../wt-agendar' },
];

export function progressoMissao(estado) {
  const extras = estado.worktrees.filter((w) => !w.principal);
  const agentesEmWorktrees = new Set(estado.agentes.filter((a) => a.dir !== RAIZ).map((a) => a.dir)).size;
  const branchesTasks = estado.agentes.map((a) => estado.branches[a.branch]).filter(Boolean);
  const criados = extras.length >= 3 || estado.agentes.length >= 3;
  const agentes = agentesEmWorktrees >= 3;
  const listar = agentes && estado.listouDepoisDosAgentes;
  const mesclar = agentes && branchesTasks.length >= 3 && branchesTasks.every((b) => b.mesclada) && !estado.conflito;
  const rotas = mesclar && rotasPerdidas(estado).length === 0;
  const limpar = rotas && extras.length === 0;
  return { criar: criados, agentes, listar, mesclar, rotas, limpar };
}

export function simularMesmaPasta() {
  const base = ancorasVazias();
  const leituras = {};
  const eventos = [];
  let disco = copiarAncoras(base);
  const ordem = [
    ['A', 'le'],
    ['B', 'le'],
    ['C', 'le'],
    ['A', 'escreve'],
    ['B', 'testa'],
    ['B', 'escreve'],
    ['C', 'escreve'],
    ['A', 'testa'],
  ];
  const tarefa = { A: TASKS[0], B: TASKS[1], C: TASKS[2] };
  let t = 0;
  for (const [ag, acao] of ordem) {
    t += 1;
    const task = tarefa[ag];
    if (acao === 'le') {
      leituras[ag] = copiarAncoras(disco);
      eventos.push({ t, agente: ag, acao, arquivo: arquivoApp(disco), texto: `Agente ${ag} (${task.id}) lê src/app.js (${disco.usos.length} rotas novas)` });
    } else if (acao === 'escreve') {
      const versao = copiarAncoras(leituras[ag]);
      versao.imports.push(task.import);
      versao.usos.push(task.uso);
      const sobrescreveu = TASKS.filter((x) => disco.usos.includes(x.uso) && !versao.usos.includes(x.uso)).map((x) => x.id);
      disco = versao;
      eventos.push({
        t,
        agente: ag,
        acao,
        sobrescreveu,
        nova: task.uso,
        arquivo: arquivoApp(disco),
        texto: sobrescreveu.length
          ? `Agente ${ag} grava src/app.js a partir da versão que leu antes e apaga a rota de ${sobrescreveu.join(', ')}`
          : `Agente ${ag} grava src/app.js com a rota de ${task.id}`,
      });
    } else {
      eventos.push({
        t,
        agente: ag,
        acao,
        arquivo: arquivoApp(disco),
        texto:
          ag === 'B'
            ? 'Agente B roda os testes no meio da edição de A: falha em T1, e B tenta "consertar" um código que não é dele'
            : 'Agente A roda os testes: a rota de T1 sumiu. A acha que o próprio código quebrou e começa a reescrever',
      });
    }
  }
  const sobreviventes = TASKS.filter((x) => disco.usos.includes(x.uso)).map((x) => x.id);
  const perdidas = TASKS.filter((x) => !disco.usos.includes(x.uso)).map((x) => x.id);
  return { eventos, arquivoFinal: arquivoApp(disco), sobreviventes, perdidas };
}
