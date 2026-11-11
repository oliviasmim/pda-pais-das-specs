// Máquina FIG_WT · Por dentro do Chá Maluco (git worktrees).
// Três agentes, três tasks. Na mesma pasta eles se atropelam. Em worktrees, cada um tem a sua xícara,
// mas a porta do servidor, o node_modules e o merge final continuam sendo problema seu.

const TASKS = [
  { id: 't1', branch: 't1-agendar', pasta: '../wt-agendar', rota: "app.post('/agendamentos', agendar)", arquivo: 'src/rotas/agendamento.js' },
  { id: 't2', branch: 't2-cancelar', pasta: '../wt-cancelar', rota: "app.delete('/agendamentos/:id', cancelar)", arquivo: 'src/rotas/cancelamento.js' },
  { id: 't3', branch: 't3-vagas', pasta: '../wt-vagas', rota: "app.get('/mentores/:id/vagas', vagas)", arquivo: 'src/rotas/vagas.js' },
];

const MB = { git: 40, nodeModules: 180, codigo: 2 };

export const motion = {
  id: 'motion-worktrees',
  fig: 'FIG_WT',
  titulo: 'Por dentro do Chá Maluco',
  lead: 'Worktree nada mais é do que mais uma pasta de trabalho ligada ao mesmo .git. Uma xícara limpa para cada agente.',
  dica: 'Ponha os três na mesma pasta. Tente a mesma branch duas vezes. Esqueça o npm install.',
  ideia:
    'O worktree isola arquivos e branch. Ele não isola a porta do servidor, o banco nem o merge final. Três agentes em paralelo continuam sendo três pessoas usando o mesmo computador.',
  pronto: 'Aperte Rodar. No centro fica o .git (o histórico). Em volta, as pastas de trabalho. Cada pacote é um agente.',
  razaoIntro: 'O que cada xícara tem só para si, o que todas continuam dividindo e os comandos que a máquina rodou.',
  nota:
    'Isto é uma simulação. Os comandos e mensagens são do git e do Node reais (a mensagem de branch em uso varia um pouco entre versões do git). Os tamanhos em MB são do projeto do speedrun, arredondados.',
  estacoes: [
    {
      id: 'git',
      rotulo: '.git',
      tipo: 'repo',
      x: 0,
      y: 0,
      w: 2.4,
      d: 2.4,
      h: 1.6,
      camadas: ['objetos', 'branches', 'worktrees/'],
      oQueE: 'O histórico do projeto: commits, branches e objetos. Todo worktree aponta para este mesmo .git. Por isso criar um worktree é rápido e não duplica o histórico.',
      arquivo: { nome: 'git worktree list', texto: '~/agenda        a1b2c3d [main]\n~/wt-agendar    a1b2c3d [t1-agendar]\n~/wt-cancelar   a1b2c3d [t2-cancelar]\n~/wt-vagas      a1b2c3d [t3-vagas]' },
    },
    {
      id: 'principal',
      rotulo: 'Pasta principal',
      tipo: 'pasta',
      x: 4.4,
      y: 0,
      w: 2.2,
      d: 2.2,
      h: 1.1,
      camadas: ['main', 'node_modules'],
      oQueE: 'A pasta onde você clonou o projeto, na main. É daqui que você cria os worktrees e é aqui que você integra no fim.',
    },
    {
      id: 'wt1',
      rotulo: 'wt-agendar',
      tipo: 'pasta',
      x: 9.2,
      y: -3.8,
      w: 2,
      d: 2,
      h: 1,
      camadas: ['t1-agendar', 'node_modules?'],
      oQueE: 'Uma pasta irmã com a branch t1-agendar. Arquivos próprios, branch própria. node_modules e .env não vêm junto: são ignorados pelo git.',
      nomeComercial: 'git worktree, claude -w',
    },
    { id: 'wt2', rotulo: 'wt-cancelar', tipo: 'pasta', x: 9.2, y: 0, w: 2, d: 2, h: 1, camadas: ['t2-cancelar', 'node_modules?'], oQueE: 'A xícara da T2. O git recusa abrir aqui uma branch que já está aberta em outro worktree.' },
    { id: 'wt3', rotulo: 'wt-vagas', tipo: 'pasta', x: 9.2, y: 3.8, w: 2, d: 2, h: 1, camadas: ['t3-vagas', 'node_modules?'], oQueE: 'A xícara da T3.' },
    {
      id: 'porta',
      rotulo: 'Porta 3000',
      tipo: 'ferramenta',
      x: 13.6,
      y: -3.8,
      w: 1.6,
      d: 1.6,
      h: 0.7,
      camadas: ['localhost:3000'],
      oQueE: 'Recurso da máquina, não do repositório. Se os três agentes sobem o servidor na mesma porta, dois quebram, com ou sem worktree.',
    },
    {
      id: 'merge',
      rotulo: 'Merge',
      tipo: 'humano',
      x: 14,
      y: 0,
      w: 2,
      d: 2,
      h: 1,
      camadas: ['git merge', 'conflito?'],
      oQueE: 'De volta na pasta principal, você integra as branches uma por uma e roda os testes entre elas. Conflito é o git se recusando a adivinhar.',
    },
    { id: 'ci', rotulo: 'Gates', tipo: 'sensor', x: 17.4, y: 0, w: 2, d: 2, h: 1.1, camadas: ['npm run gates'], oQueE: 'Os cinco sensores rodando sobre o resultado integrado. É aqui que você descobre se apagou a rota de alguém no merge.' },
    { id: 'limpa', rotulo: 'Lavar xícaras', tipo: 'saida', x: 20.8, y: 0, w: 1.8, d: 1.8, h: 0.7, camadas: ['git worktree remove'], oQueE: 'git worktree remove apaga a pasta. A branch e os commits continuam no .git.' },
  ],
  trilhos: [
    ['git', 'principal'],
    ['principal', 'wt1'],
    ['principal', 'wt2'],
    ['principal', 'wt3'],
    ['wt1', 'merge'],
    ['wt2', 'merge'],
    ['wt3', 'merge'],
    ['wt1', 'porta'],
    ['merge', 'ci'],
    ['ci', 'limpa'],
    ['principal', 'merge', { desvio: 3.2 }],
  ],
  montagem: [
    {
      id: 'modo',
      rotulo: 'Onde trabalham',
      padrao: 'worktrees',
      opcoes: [
        { valor: 'worktrees', rotulo: '3 worktrees' },
        { valor: 'mesma-pasta', rotulo: 'mesma pasta' },
        { valor: 'clones', rotulo: '3 clones' },
      ],
    },
    {
      id: 'arquivos',
      rotulo: 'Arquivos',
      opcoes: [
        { valor: 'app-js', rotulo: 'todas mexem em src/app.js' },
        { valor: 'separados', rotulo: 'arquivos separados' },
      ],
    },
  ],
  avarias: [
    { id: 'mesma-branch', estacao: 'wt2', rotulo: 'Mesma branch duas vezes', descricao: 'O segundo worktree tenta abrir t1-agendar, que já está aberta no primeiro.' },
    { id: 'sem-install', estacao: 'wt1', rotulo: 'Sem npm install', descricao: 'O agente roda npm test direto no worktree novo, que não tem node_modules.' },
    { id: 'mesma-porta', estacao: 'porta', rotulo: 'Todos na porta 3000', descricao: 'Os três agentes sobem o servidor para o smoke test na mesma porta.' },
  ],
  quebraPadrao: 'mesma-branch',
  legenda: [
    { tipo: 'isolado', rotulo: 'Isolado', cor: 'folha', descricao: 'cada xícara tem o seu' },
    { tipo: 'compartilhado', rotulo: 'Compartilhado', cor: 'ouro', descricao: 'todas continuam dividindo' },
    { tipo: 'atropelo', rotulo: 'Atropelo', cor: 'copas', descricao: 'um agente desfez o trabalho de outro' },
    { tipo: 'comando', rotulo: 'Comando', cor: 'tinta', descricao: 'o que rodou no terminal' },
  ],
  metricas: [
    { id: 'perdidas', rotulo: 'Edições perdidas' },
    { id: 'conflitos', rotulo: 'Conflitos no merge' },
    { id: 'erros', rotulo: 'Erros de ambiente' },
    { id: 'disco', rotulo: 'Disco extra' },
    { id: 'tempo', rotulo: 'Tempo' },
    { id: 'rotas', rotulo: 'Rotas na main' },
  ],
  licoes: [
    { titulo: 'Troque de pasta, não de branch.', texto: 'Na mesma pasta, um git checkout de um agente puxa o chão dos outros dois. Com worktrees, cada agente tem branch e arquivos próprios e ninguém precisa trocar nada.' },
    { titulo: 'O git recusar é a proteção funcionando.', texto: 'A mesma branch não abre em dois worktrees. Se aparecer "is already used by worktree", crie uma branch nova com -b.' },
    { titulo: 'Cada xícara se serve sozinha.', texto: 'node_modules, .env e a porta do servidor não são isolados pelo worktree. npm install em cada pasta e uma porta por agente.' },
    { titulo: 'Conflito é o git se recusando a adivinhar.', texto: 'Quando as três tasks registram rota em src/app.js, o merge para e pergunta. A resposta certa é manter as linhas de todas e rodar os testes.' },
  ],
  desafios: [
    {
      pergunta: 'Três agentes na mesma pasta, cada um na sua task. O que dá errado primeiro?',
      opcoes: ['Nada, o git separa por branch', 'Um git checkout ou git add de um agente leva junto o trabalho de outro', 'O Claude Code recusa abrir três sessões', 'O merge final'],
      correta: 1,
      explicacao: 'Existe uma pasta de trabalho só. Se um agente troca de branch, os arquivos mudam para os três. Se um faz git add ., leva o trabalho pela metade dos outros.',
      montagem: { modo: 'mesma-pasta', arquivos: 'app-js' },
    },
    {
      pergunta: 'Você cria o segundo worktree na mesma branch do primeiro. O que o git faz?',
      opcoes: ['Abre normalmente', 'Recusa com "is already used by worktree"', 'Apaga o primeiro', 'Cria um conflito'],
      correta: 1,
      explicacao: 'Uma branch, uma xícara. O git não deixa duas pastas mexendo na mesma branch ao mesmo tempo.',
      montagem: { modo: 'worktrees', arquivos: 'app-js' },
      avarias: ['mesma-branch'],
    },
    {
      pergunta: 'Worktree novo e o agente roda npm test direto. O que acontece?',
      opcoes: ['Passa, o node_modules é compartilhado', 'Cannot find module: o node_modules não vem junto', 'O git copia o node_modules', 'Roda os testes da main'],
      correta: 1,
      explicacao: 'node_modules está no .gitignore. O worktree só traz o que o git versiona. Rode npm install em cada xícara.',
      montagem: { modo: 'worktrees', arquivos: 'separados' },
      avarias: ['sem-install'],
    },
    {
      pergunta: 'As três tasks registram rota em src/app.js. Quantos conflitos aparecem no merge com worktrees?',
      opcoes: ['Nenhum', 'Um', 'Três', 'Depende do modelo'],
      correta: 1,
      explicacao: 'A primeira branch entra limpa. A segunda bate no mesmo ponto de src/app.js e o git para. Resolvido com as duas linhas, a terceira entra limpa, como na cola de comandos da lição.',
      montagem: { modo: 'worktrees', arquivos: 'app-js' },
    },
  ],
  simular,
};

export function simular(montagem, avarias = new Set()) {
  const modo = montagem.modo;
  const appJs = montagem.arquivos === 'app-js';
  const wts = ['wt1', 'wt2', 'wt3'];
  let perdidas = 0;
  let conflitos = 0;
  let erros = 0;
  let disco = 0;
  let tempo = 0;
  let rotas = 0;
  const passos = [];
  const metr = () => ({
    perdidas,
    'perdidas:tom': perdidas ? 'falha' : 'ok',
    conflitos,
    'conflitos:tom': conflitos ? 'alerta' : 'ok',
    erros,
    'erros:tom': erros ? 'alerta' : 'ok',
    disco: `${disco} MB`,
    tempo: `${tempo} min`,
    rotas: `${rotas}/3`,
    'rotas:tom': rotas === 3 ? 'ok' : rotas ? 'alerta' : '',
  });

  const desligadas = [];
  if (modo === 'mesma-pasta') desligadas.push(...wts);
  if (!avarias.has('mesma-porta')) desligadas.push('porta');

  passos.push({
    estacao: 'git',
    titulo: 'O histórico',
    narracao: 'Tudo começa no .git: commits, branches e objetos. Ele é o mesmo para todas as pastas que você criar com worktree.',
    dentro: { titulo: '.git', linhas: ['main · a1b2c3d', `${MB.git} MB de histórico`] },
    metricas: metr(),
    razao: [{ tipo: 'compartilhado', texto: '.git (histórico e objetos): um só, para todas as pastas.' }],
    rastro: 'repositório na main',
  });

  /* ---------- mesma pasta ---------- */
  if (modo === 'mesma-pasta') {
    passos.push({
      estacao: 'principal',
      pacotes: ['principal', 'principal', 'principal'],
      titulo: 'Três na mesma pasta',
      marca: 'alerta',
      narracao: 'Três sessões do Claude Code abertas na mesma pasta. Dois fantasminhas e mais um usando o mesmo computador: os arquivos que um vê são os que o outro está editando.',
      dentro: { titulo: '~/agenda', linhas: ['sessão A: T1', 'sessão B: T2', 'sessão C: T3', 'uma pasta, uma branch de cada vez'] },
      metricas: metr(),
      razao: [
        { tipo: 'compartilhado', texto: 'Pasta de trabalho: uma para os três agentes.' },
        { tipo: 'compartilhado', texto: 'Branch atual (HEAD): uma para os três.' },
      ],
      rastro: '3 sessões em ~/agenda',
    });
    tempo += 6;
    perdidas += 1;
    passos.push({
      estacao: 'principal',
      pacotes: ['principal', 'principal', 'principal'],
      titulo: 'git checkout',
      marca: 'falha',
      narracao: 'O agente C roda git checkout -b t3-vagas para separar o trabalho dele. Os arquivos da pasta mudam para os três. O agente A estava no meio de um Edit e perde a mudança.',
      dentro: { titulo: 'terminal do agente C', linhas: ['$ git checkout -b t3-vagas', 'M src/app.js (levado junto)', 'agente A: "o arquivo mudou desde a última leitura"'], tom: 'falha' },
      metricas: metr(),
      razao: [{ tipo: 'atropelo', texto: 'git checkout do agente C mudou os arquivos dos agentes A e B.' }, { tipo: 'comando', texto: 'git checkout -b t3-vagas' }],
      rastro: 'agente C: git checkout -b t3-vagas (puxou o chão dos outros)',
    });
    tempo += 6;
    perdidas += 1;
    passos.push({
      estacao: 'principal',
      pacotes: ['principal', 'principal', 'principal'],
      titulo: 'git add .',
      marca: 'falha',
      narracao: 'O agente B termina a T2 e faz git add . && git commit. Junto com a T2, vai a T1 pela metade, sem teste.',
      dentro: { titulo: 'terminal do agente B', linhas: ['$ git add . && git commit -m "feat: cancelar"', ' src/rotas/cancelamento.js', ' src/rotas/agendamento.js   ← T1 pela metade'], tom: 'falha' },
      metricas: metr(),
      razao: [{ tipo: 'atropelo', texto: 'git add . do agente B levou a T1 pela metade no commit da T2.' }, { tipo: 'comando', texto: 'git add . && git commit' }],
      rastro: 'agente B: git add . (levou a T1 pela metade)',
    });
    if (avarias.has('mesma-porta')) {
      erros += 1;
      passos.push({
        estacao: 'porta',
        ativos: ['principal'],
        titulo: 'Porta ocupada',
        marca: 'falha',
        narracao: 'Dois agentes sobem o servidor para o smoke test ao mesmo tempo. O segundo cai.',
        dentro: { titulo: 'npm run smoke', linhas: ['Error: listen EADDRINUSE: address already in use :::3000'], tom: 'falha' },
        metricas: metr(),
        razao: [{ tipo: 'compartilhado', texto: 'Porta 3000: uma para a máquina inteira.' }],
        rastro: 'smoke: EADDRINUSE :3000',
      });
    }
    rotas = 2;
    tempo += 8;
    passos.push({
      estacao: 'merge',
      pacotes: ['merge'],
      titulo: 'Sem merge',
      marca: 'falha',
      narracao: 'Não há o que integrar: tudo já está misturado numa branch só. Você passa 8 minutos separando à mão o que é de cada task. Uma rota se perdeu no caminho.',
      dentro: { titulo: 'git log', linhas: ['feat: cancelar (com T1 pela metade)', 'wip', 'wip'], tom: 'falha' },
      metricas: metr(),
      rastro: 'integração manual: 2 de 3 rotas',
    });
  } else {
    /* ---------- worktrees ou clones ---------- */
    const clones = modo === 'clones';
    const cmds = [];
    TASKS.forEach((t, k) => {
      const recusa = !clones && k === 1 && avarias.has('mesma-branch');
      if (recusa) {
        erros += 1;
        tempo += 1;
        passos.push({
          estacao: wts[k],
          titulo: 'Branch em uso',
          marca: 'alerta',
          narracao: 'O segundo worktree tenta abrir t1-agendar, que já está aberta em ../wt-agendar. O git recusa. Isso é a proteção funcionando: duas pastas na mesma branch se atropelariam.',
          dentro: { titulo: 'terminal', linhas: [`$ git worktree add ${t.pasta} t1-agendar`, "fatal: 't1-agendar' is already used by worktree at '../wt-agendar'"], tom: 'alerta' },
          metricas: metr(),
          razao: [{ tipo: 'comando', texto: `git worktree add ${t.pasta} t1-agendar (recusado)` }],
          rastro: 'git recusou a mesma branch em dois worktrees',
        });
      }
      const cmd = clones ? `git clone ~/agenda ../clone-${t.id} && git -C ../clone-${t.id} switch -c ${t.branch}` : `git worktree add ${t.pasta} -b ${t.branch}`;
      cmds.push(cmd);
      disco += clones ? MB.git + MB.codigo : MB.codigo;
      tempo += clones ? 1 : 0;
      passos.push({
        estacao: wts[k],
        trilhos: [['principal', wts[k]]],
        titulo: clones ? `Clone ${t.id.toUpperCase()}` : `Xícara ${t.id.toUpperCase()}`,
        narracao: clones
          ? `Um clone inteiro para a ${t.id.toUpperCase()}: copia o histórico de novo (${MB.git} MB). Funciona, mas cada clone é um repositório separado.`
          : `${recusa ? 'Agora com branch nova: ' : ''}uma pasta irmã com a branch ${t.branch}. O histórico não é copiado: a pasta aponta para o mesmo .git.`,
        dentro: { titulo: 'terminal', linhas: [`$ ${cmd}`, clones ? `Cloning into '../clone-${t.id}'...` : `Preparing worktree (new branch '${t.branch}')`] },
        metricas: metr(),
        razao: [
          { tipo: 'comando', texto: cmd },
          { tipo: 'isolado', texto: `${clones ? `../clone-${t.id}` : t.pasta}: arquivos e branch ${t.branch} só dela.` },
          ...(clones ? [{ tipo: 'isolado', texto: `.git copiado de novo (+${MB.git} MB).` }] : []),
        ],
        rastro: cmd,
      });
    });

    // install
    if (avarias.has('sem-install')) {
      erros += 1;
      tempo += 2;
      passos.push({
        estacao: 'wt1',
        titulo: 'Sem node_modules',
        marca: 'falha',
        narracao: 'O agente da T1 roda npm test direto. O worktree só trouxe o que o git versiona, e node_modules está no .gitignore.',
        dentro: { titulo: 'npm test em ../wt-agendar', linhas: ["Error: Cannot find module 'express'", '$ npm install   # agora sim'], tom: 'falha' },
        metricas: metr(),
        razao: [{ tipo: 'isolado', texto: 'node_modules: cada pasta precisa do seu (npm install em cada uma).' }],
        rastro: 'wt-agendar: Cannot find module, depois npm install',
      });
    }
    disco += 3 * MB.nodeModules;
    tempo += 2;
    passos.push({
      estacao: 'wt1',
      ativos: wts,
      pacotes: wts,
      titulo: 'Três agentes',
      narracao: 'npm install em cada xícara e uma sessão do Claude Code em cada terminal. Os três trabalham ao mesmo tempo sem ver os arquivos uns dos outros.',
      dentro: { titulo: 'três terminais', linhas: TASKS.map((t) => `${clones ? `../clone-${t.id}` : t.pasta}$ npm install && claude`) },
      metricas: metr(),
      razao: [
        { tipo: 'isolado', texto: `node_modules em cada pasta (+${3 * MB.nodeModules} MB).` },
        { tipo: 'compartilhado', texto: 'CPU, memória e a cota de tokens: a mesma máquina e a mesma conta.' },
      ],
      rastro: 'npm install && claude em cada pasta',
    });
    tempo += 12;

    if (avarias.has('mesma-porta')) {
      erros += 1;
      tempo += 2;
      passos.push({
        estacao: 'porta',
        ativos: ['wt1', 'wt2'],
        pacotes: ['porta', 'porta'],
        titulo: 'Porta ocupada',
        marca: 'falha',
        narracao: 'Os agentes da T1 e da T2 sobem o servidor para o smoke test na porta 3000. O worktree isolou os arquivos, não a porta. O segundo cai.',
        dentro: { titulo: 'npm run smoke em ../wt-cancelar', linhas: ['Error: listen EADDRINUSE: address already in use :::3000', 'correção: PORT=3002 npm run smoke'], tom: 'falha' },
        metricas: metr(),
        razao: [{ tipo: 'compartilhado', texto: 'Porta 3000: uma para a máquina inteira. Uma porta por agente (PORT=3001, 3002...).' }],
        rastro: 'smoke: EADDRINUSE :3000, corrigido com PORT por agente',
      });
    }

    passos.push({
      estacao: 'wt3',
      ativos: wts,
      pacotes: wts,
      titulo: 'Commits',
      marca: 'ok',
      narracao: 'Cada agente faz commit na própria branch. Nenhum precisou de git checkout, git switch ou git stash.',
      dentro: { titulo: 'git log --oneline --all', linhas: TASKS.map((t) => `${t.branch}: feat(${t.id.toUpperCase()})`) },
      metricas: metr(),
      rastro: 'commits em t1-agendar, t2-cancelar, t3-vagas',
    });

    // merge
    if (clones) {
      tempo += 2;
      passos.push({
        estacao: 'principal',
        titulo: 'Buscar os clones',
        marca: 'alerta',
        narracao: 'Os clones são repositórios separados. Antes de integrar, você precisa trazer cada branch para a pasta principal.',
        dentro: { titulo: 'terminal', linhas: TASKS.map((t) => `$ git fetch ../clone-${t.id} ${t.branch}:${t.branch}`) },
        metricas: metr(),
        razao: TASKS.map((t) => ({ tipo: 'comando', texto: `git fetch ../clone-${t.id} ${t.branch}:${t.branch}` })),
        rastro: 'git fetch de cada clone',
      });
    }
    TASKS.forEach((t, k) => {
      const conflito = appJs && k === 1;
      rotas += 1;
      tempo += conflito ? 4 : 1;
      if (conflito) conflitos += 1;
      passos.push({
        estacao: 'merge',
        trilhos: [[wts[k], 'merge']],
        pacotes: ['merge'],
        titulo: conflito ? `Merge ${t.id.toUpperCase()}: conflito` : `Merge ${t.id.toUpperCase()}`,
        marca: conflito ? 'alerta' : 'ok',
        narracao: conflito
          ? 'A T2 registrou a rota no mesmo ponto de src/app.js que a T1. O git não sabe a ordem das duas linhas novas e para. A resposta certa é manter as duas. A errada, comum com pressa, é aceitar "a minha versão" e apagar a rota da T1.'
          : `${t.branch} entra ${k === 0 ? 'limpa' : appJs ? 'limpa, porque o conflito já foi resolvido com as duas linhas' : 'limpa: cada task mexeu num arquivo diferente'}. npm test entre um merge e outro.`,
        dentro: conflito
          ? { titulo: 'src/app.js', linhas: ['<<<<<<< HEAD', TASKS[0].rota, '=======', t.rota, `>>>>>>> ${t.branch}`], tom: 'alerta' }
          : { titulo: 'terminal', linhas: [`$ git merge ${t.branch} && npm test`, '✓ testes verdes'] },
        metricas: metr(),
        razao: [{ tipo: 'comando', texto: `git merge ${t.branch}` }, ...(conflito ? [{ tipo: 'compartilhado', texto: 'src/app.js: o ponto onde as três tasks se encontram.' }] : [])],
        rastro: `git merge ${t.branch}${conflito ? ' (conflito em src/app.js, mantidas as duas linhas)' : ''}`,
      });
    });
  }

  const ok = rotas === 3 && perdidas === 0;
  passos.push({
    estacao: 'ci',
    titulo: ok ? 'Gates verdes' : 'Gates reprovam',
    marca: ok ? 'ok' : 'falha',
    narracao: ok ? 'npm run gates na main integrada: as três rotas respondem e os testes de aceite passam.' : 'npm run gates na main: falta uma rota e há código pela metade no commit da T2.',
    dentro: { titulo: 'npm run gates', linhas: ok ? ['✓ lint · tipos · smoke · testes · audit'] : ['✗ T1: POST /agendamentos → 404', '✗ lint: função não usada em agendamento.js'], tom: ok ? 'ok' : 'falha' },
    metricas: metr(),
    rastro: `gates: ${ok ? 'verde' : 'vermelho'}`,
  });

  if (modo !== 'mesma-pasta') {
    const cmd = modo === 'clones' ? 'rm -rf ../clone-t1 ../clone-t2 ../clone-t3' : 'git worktree remove ../wt-agendar (e as outras duas)';
    passos.push({
      estacao: 'limpa',
      titulo: 'Lavar as xícaras',
      marca: 'ok',
      narracao: modo === 'clones' ? 'Apaga os três clones. Se esqueceu algum fetch, o trabalho vai junto.' : 'git worktree remove apaga as pastas. As branches e os commits continuam no .git.',
      dentro: { titulo: 'terminal', linhas: [`$ ${cmd}`, '$ git worktree list', '~/agenda  [main]'] },
      metricas: metr(),
      razao: [{ tipo: 'comando', texto: cmd }],
      rastro: cmd,
    });
  } else {
    passos.push({
      estacao: 'limpa',
      titulo: 'Nada para lavar',
      marca: 'falha',
      narracao: 'Não há xícaras para lavar porque nunca houve xícaras. Houve uma mesa só, e três pessoas trocando de lugar nela.',
      metricas: metr(),
      rastro: 'sem worktrees para remover',
    });
  }

  const rot = { worktrees: '3 worktrees', 'mesma-pasta': 'mesma pasta', clones: '3 clones' }[modo];
  return {
    entrada: { titulo: `Três agentes, três tasks · ${rot}`, linhas: TASKS.map((t) => `${t.branch}: ${t.rota}`) },
    desligadas,
    passos,
    saida: {
      titulo: ok ? `Main integrada com as 3 rotas · ${tempo} min` : `Main com ${rotas} de 3 rotas e ${perdidas} edições perdidas`,
      status: ok ? (erros || modo === 'clones' ? 'alerta' : 'ok') : 'falha',
      linhas: [
        `Edições perdidas: ${perdidas}`,
        `Conflitos no merge: ${conflitos}`,
        `Erros de ambiente: ${erros}`,
        `Disco extra: ${disco} MB${modo === 'clones' ? ' (histórico copiado 3 vezes)' : ''}`,
        `Tempo: ${tempo} min`,
      ],
    },
    numeros: { perdidas, conflitos, erros, disco, tempo, rotas },
  };
}
