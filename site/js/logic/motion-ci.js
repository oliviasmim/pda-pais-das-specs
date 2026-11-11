// Máquina FIG_CI · Por dentro da esteira (Cortem-lhe a cabeça!).
// Um PR da agenda de mentorias passa pelos sensores. Reaproveita os PRs e sensores do laboratório esteira.
import { PRS, SENSORES } from './esteira.js';

const CINCO = ['lint', 'typecheck', 'build', 'testes', 'deps'];
const prPorNumero = (n) => PRS.find((p) => String(p.numero) === String(n));
const sensor = (id) => SENSORES.find((s) => s.id === id);

export const motion = {
  id: 'motion-ci',
  fig: 'FIG_CI',
  titulo: 'Por dentro da esteira',
  lead: 'Pipeline nada mais é do que uma esteira: o PR passa por cada sensor numa máquina limpa e o primeiro que reprovar para tudo.',
  dica: 'Escolha um PR. Desligue um sensor. Ponha os testes em continue-on-error.',
  ideia:
    'Cada sensor pega um tipo de defeito e é cego para os outros. Um gate só protege se ele bloqueia o merge. O que nenhum sensor pega precisa de guia no AGENTS.md e de alguém (pessoa ou agente de review) com a pergunta certa.',
  pronto: 'Aperte Rodar. O pacote é o PR. Ele sai do push, ganha uma máquina limpa e atravessa os sensores até o merge.',
  razaoIntro: 'O que cada sensor viu neste PR. Pulado não é aprovado: é um sensor que não chegou a olhar.',
  nota:
    'Isto é uma simulação. Os PRs, mensagens de erro, comandos e tempos são os mesmos do laboratório "A esteira" desta lição e dos scripts reais do projeto do speedrun (npm run gates).',
  estacoes: [
    { id: 'push', rotulo: 'Push', tipo: 'entrada', x: 0, y: 0, w: 1.8, d: 1.8, h: 0.7, camadas: ['git push'], oQueE: 'O agente (ou você) empurra a branch e abre o PR. A esteira começa aqui, em todo pull_request.' },
    {
      id: 'runner',
      rotulo: 'Máquina limpa',
      tipo: 'ferramenta',
      x: 3,
      y: 0,
      w: 2,
      d: 2,
      h: 1.1,
      camadas: ['checkout', 'setup-node', 'npm ci'],
      oQueE: 'Uma máquina nova a cada execução: baixa o código, instala Node e as dependências do package-lock. O que só existe no seu computador não existe aqui.',
      nomeComercial: 'runner do GitHub Actions',
      arquivo: { nome: '.github/workflows/ci.yml', texto: 'on: [pull_request]\njobs:\n  gates:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v6\n        with: { node-version: 22 }\n      - run: npm ci\n      - run: npm run lint\n      - run: npm run typecheck\n      - run: npm run smoke\n      - run: npm test\n      - run: npm audit --audit-level=high' },
    },
    ...['lint', 'typecheck', 'build', 'testes', 'deps', 'guarda', 'nfr'].map((id, i) => {
      const s = sensor(id);
      return {
        id,
        rotulo: { lint: 'Lint', typecheck: 'Tipos', build: 'Smoke', testes: 'Testes', deps: 'Audit', guarda: 'Guarda', nfr: 'NFR-2' }[id],
        tipo: 'sensor',
        x: 6.2 + i * 2.9,
        y: s.extra ? 0.3 : 0,
        w: 1.9,
        d: 1.9,
        h: s.extra ? 0.8 : 1 + (i % 2) * 0.15,
        camadas: [s.ferramenta.length > 26 ? `${s.ferramenta.slice(0, 24)}…` : s.ferramenta],
        oQueE: `${s.pergunta} Comando: ${s.comando}. Leva uns ${s.seg} s.${s.extra ? ' Não faz parte dos cinco sensores da S8: é um extra que você liga quando a lição pede.' : ''}`,
        nomeComercial: s.nome,
      };
    }),
    { id: 'review', rotulo: 'Review', tipo: 'humano', x: 26.6, y: 0, w: 2, d: 2, h: 1, camadas: ['carta Rastro', 'carta Navalha'], oQueE: 'Pessoa ou agente de review. É a última chance para o que nenhum sensor computacional enxerga: regra inventada, abstração sem motivo.' },
    { id: 'merge', rotulo: 'Main', tipo: 'saida', x: 29.8, y: 0, w: 2.2, d: 2.2, h: 0.8, camadas: ['branch protection'], oQueE: 'A main. Com branch protection, o botão de merge só libera quando todos os checks obrigatórios passam.' },
  ],
  trilhos: [
    ['push', 'runner'],
    ['runner', 'lint'],
    ['lint', 'typecheck'],
    ['typecheck', 'build'],
    ['build', 'testes'],
    ['testes', 'deps'],
    ['deps', 'guarda'],
    ['guarda', 'nfr'],
    ['nfr', 'review'],
    ['review', 'merge'],
    ['push', 'merge', { desvio: 3 }],
  ],
  montagem: [
    {
      id: 'pr',
      rotulo: 'PR',
      padrao: '21',
      opcoes: PRS.map((p) => ({ valor: String(p.numero), rotulo: `#${p.numero} ${p.titulo}` })),
    },
    {
      id: 'extras',
      rotulo: 'Sensores extras',
      opcoes: [
        { valor: 'nenhum', rotulo: 'só os 5 da S8' },
        { valor: 'guarda', rotulo: '+ guarda dos testes' },
        { valor: 'nfr', rotulo: '+ teste do NFR-2' },
        { valor: 'ambos', rotulo: '+ guarda + NFR-2' },
      ],
    },
  ],
  avarias: [
    { id: 'sem-lint', estacao: 'lint', rotulo: 'Lint desligado', descricao: 'Tiraram o passo npm run lint do workflow.' },
    { id: 'sem-typecheck', estacao: 'typecheck', rotulo: 'Type check desligado', descricao: 'Tiraram o passo npm run typecheck.' },
    { id: 'sem-build', estacao: 'build', rotulo: 'Smoke desligado', descricao: 'Ninguém sobe o servidor numa máquina limpa.' },
    { id: 'decoracao', estacao: 'testes', rotulo: 'Testes em continue-on-error', descricao: 'O passo de testes fica vermelho e a esteira segue como se nada fosse.' },
    { id: 'sem-deps', estacao: 'deps', rotulo: 'Audit desligado', descricao: 'npm audit fora do workflow.' },
    { id: 'sem-protecao', estacao: 'merge', rotulo: 'Main sem proteção', descricao: 'Branch protection desligada: o merge não espera a esteira.' },
  ],
  quebraPadrao: 'decoracao',
  legenda: [
    { tipo: 'pegou', rotulo: 'Pegou', cor: 'folha', descricao: 'o sensor reprovou e bloqueou' },
    { tipo: 'passou', rotulo: 'Passou', cor: 'tinta', descricao: 'o sensor olhou e não viu problema' },
    { tipo: 'pulado', rotulo: 'Pulado', cor: 'ink-3', descricao: 'parou antes de chegar aqui' },
    { tipo: 'ignorado', rotulo: 'Vermelho ignorado', cor: 'ouro', descricao: 'reprovou e não bloqueou' },
    { tipo: 'escapou', rotulo: 'Escapou', cor: 'copas', descricao: 'chegou à main' },
  ],
  metricas: [
    { id: 'tempo', rotulo: 'Tempo de esteira' },
    { id: 'rodados', rotulo: 'Sensores que olharam' },
    { id: 'pego', rotulo: 'Pego por' },
    { id: 'main', rotulo: 'Defeito na main' },
  ],
  licoes: [
    { titulo: 'Cada sensor é cego para o resto.', texto: 'O type check não vê dependência vulnerável. O audit não vê regra errada. Desligar um sensor não deixa a esteira "mais leve": abre um buraco com o formato exato daquele defeito.' },
    { titulo: 'Gate que não bloqueia é decoração.', texto: 'Com continue-on-error, o PR #15 fica vermelho no log e chega à main mesmo assim. O mesmo vale para a main sem branch protection.' },
    { titulo: 'O primeiro que pega paga menos.', texto: 'O PR #12 é pego pelo lint em 20 s. Sem lint, o type check pega aos 30 s. A ordem barata primeiro é economia de tempo de quem espera.' },
    { titulo: 'O que nenhum sensor pega pede guia e pergunta.', texto: 'Regra inventada (#21) e Factory sem motivo (#18) passam pelos cinco. Para eles: regra no AGENTS.md antes, e a carta Rastro ou Navalha no review depois.' },
  ],
  desafios: [
    {
      pergunta: 'PR #17: o agente trocou o 409 por 201 num teste de aceite. Com os 5 sensores, quem pega?',
      opcoes: ['Lint', 'Testes', 'Nenhum dos 5', 'Audit'],
      correta: 2,
      explicacao: 'O teste foi alterado para passar, então os testes passam. Só a guarda (hash dos testes de aceite) ou um review cético pega a rosa pintada.',
      montagem: { pr: '17', extras: 'nenhum' },
    },
    {
      pergunta: 'PR #15 (cancelar não devolve a vaga) com os testes em continue-on-error. Onde ele termina?',
      opcoes: ['Bloqueado nos testes', 'Na main, com o vermelho no log', 'Bloqueado no audit', 'Volta para o agente'],
      correta: 1,
      explicacao: 'O teste reprova, mas o passo não falha o job. Gate que não bloqueia é decoração.',
      montagem: { pr: '15', extras: 'nenhum' },
      avarias: ['decoracao'],
    },
    {
      pergunta: 'PR #12 (erro de sintaxe) sem lint. Quem pega e quanto tempo depois?',
      opcoes: ['Ninguém', 'Type check, aos 30 s', 'Testes, aos 2 min', 'Audit'],
      correta: 1,
      explicacao: 'Erro de sintaxe é pego por vários sensores. Sem o lint, que pegaria aos 20 s, o próximo da fila é o type check, aos 30 s. O defeito não escapa, só custa mais espera.',
      montagem: { pr: '12', extras: 'nenhum' },
      avarias: ['sem-lint'],
    },
    {
      pergunta: 'PR #21 (limite de 3 agendamentos por mês inventado) com todos os sensores e extras. O que acontece?',
      opcoes: ['A guarda pega', 'O NFR-2 pega', 'Passa por todos: só o review com a carta Rastro pega', 'Os testes pegam'],
      correta: 2,
      explicacao: 'Nenhum teste da spec exercita 4 agendamentos do mesmo jovem no mês. Regra inventada não tem sensor computacional: tem guia (AGENTS.md) e pergunta (onde está na spec?).',
      montagem: { pr: '21', extras: 'ambos' },
    },
  ],
  simular,
};

export function simular(montagem, avarias = new Set()) {
  const pr = prPorNumero(montagem.pr) || PRS[0];
  const extras = { nenhum: [], guarda: ['guarda'], nfr: ['nfr'], ambos: ['guarda', 'nfr'] }[montagem.extras] || [];
  const ligados = [...CINCO.filter((id) => !avarias.has(`sem-${id}`)), ...extras];
  const decoracao = avarias.has('decoracao');
  const semProtecao = avarias.has('sem-protecao');
  const todos = [...CINCO, 'guarda', 'nfr'];

  const desligadas = todos.filter((id) => !ligados.includes(id));
  let tempo = 0;
  let pegoPor = null;
  const ignorados = [];
  const olharam = [];
  const passos = [];
  const metr = (extra = {}) => ({
    tempo: `${tempo} s`,
    rodados: `${olharam.length}/${ligados.length}`,
    pego: pegoPor ? sensor(pegoPor).nome : ignorados.length ? 'ignorado' : '—',
    'pego:tom': pegoPor ? 'ok' : ignorados.length ? 'alerta' : '',
    main: '—',
    ...extra,
  });

  passos.push({
    estacao: 'push',
    titulo: `PR #${pr.numero}`,
    narracao: `O agente abre o PR #${pr.numero}: "${pr.titulo}". ${pr.defeito ? 'Ele tem um defeito. Você sabe qual; a esteira ainda não.' : 'Este PR não tem defeito.'}`,
    dentro: { titulo: `PR #${pr.numero}`, linhas: (pr.trecho || ['(sem trecho)']).slice(0, 4) },
    metricas: metr(),
    rastro: `push: PR #${pr.numero} ${pr.titulo}`,
  });

  if (semProtecao) {
    passos.push({
      estacao: 'merge',
      pacotes: ['merge'],
      trilhos: [['push', 'merge']],
      titulo: 'Merge sem esperar',
      marca: pr.defeito ? 'falha' : 'alerta',
      narracao: 'A main está sem branch protection. Alguém aperta merge antes de a esteira terminar. Tudo o que vem depois é aviso atrasado.',
      dentro: { titulo: 'GitHub', linhas: ['Merge pull request ✓', 'checks: em andamento…'], tom: 'alerta' },
      metricas: metr(),
      rastro: 'merge feito antes da esteira (main sem proteção)',
    });
  }

  tempo += 0;
  passos.push({
    estacao: 'runner',
    titulo: 'Máquina limpa',
    narracao: 'Uma máquina nova: checkout, Node 22, npm ci. Arquivo que só existe no computador do agente não existe aqui.',
    dentro: { titulo: 'runner', linhas: ['actions/checkout', 'actions/setup-node (22)', 'npm ci'] },
    metricas: metr(),
    rastro: 'runner: checkout, setup-node, npm ci',
  });

  for (const id of todos) {
    const s = sensor(id);
    if (!ligados.includes(id)) continue;
    if (pegoPor) {
      passos.push({
        estacao: id,
        pacotes: [passos.at(-1).pacotes?.[0] || pegoPor],
        titulo: `${s.nome}: pulado`,
        marca: 'visto',
        narracao: `${s.nome} não roda: a esteira parou no primeiro vermelho.`,
        metricas: metr(),
        razao: [{ tipo: 'pulado', texto: `${s.nome}: pulado (a esteira parou em ${sensor(pegoPor).nome}).` }],
        rastro: `${s.nome}: pulado`,
      });
      continue;
    }
    tempo += s.seg;
    olharam.push(id);
    const pega = pr.pegoPor.includes(id);
    if (pega && decoracao && id === 'testes') {
      ignorados.push(id);
      passos.push({
        estacao: id,
        titulo: `${s.nome}: vermelho ignorado`,
        marca: 'alerta',
        narracao: `${s.nome} reprova, mas o passo está com continue-on-error. O job segue verde. A Rainha gritou e ninguém cortou cabeça nenhuma.`,
        dentro: { titulo: s.comando, linhas: [pr.mensagens[id], 'continue-on-error: true → job ✓'], tom: 'alerta' },
        metricas: metr(),
        razao: [{ tipo: 'ignorado', texto: `${s.nome}: ${pr.mensagens[id]}` }],
        rastro: `${s.nome}: falhou, ignorado (continue-on-error)`,
      });
    } else if (pega) {
      pegoPor = id;
      passos.push({
        estacao: id,
        titulo: `${s.nome} pega`,
        marca: 'falha',
        narracao: `${s.nome} reprova aos ${tempo} s. ${semProtecao ? 'Só que o merge já aconteceu.' : 'O PR fica bloqueado e o agente recebe a mensagem exata.'}`,
        dentro: { titulo: s.comando, linhas: [pr.mensagens[id]], tom: 'falha' },
        metricas: metr(),
        razao: [{ tipo: 'pegou', texto: `${s.nome}: ${pr.mensagens[id]}` }],
        rastro: `${s.nome}: FALHOU aos ${tempo} s`,
      });
    } else {
      passos.push({
        estacao: id,
        titulo: `${s.nome} ✓`,
        marca: 'ok',
        narracao: `${s.nome} passa (${s.seg} s). ${s.pergunta.replace('?', ':')} sim, pelo que este sensor consegue ver.`,
        dentro: { titulo: s.comando, linhas: ['✓'], tom: 'ok' },
        metricas: metr(),
        razao: [{ tipo: 'passou', texto: `${s.nome}: passou.` }],
        rastro: `${s.nome}: verde (${s.seg} s)`,
      });
    }
  }

  const escapou = Boolean(pr.defeito) && (!pegoPor || semProtecao);
  const precisaReview = Boolean(pr.defeito) && !pegoPor && !pr.pegoPor.length;
  const porSensorDesligado = Boolean(pr.defeito) && !pegoPor && pr.pegoPor.length > 0;

  if (!pegoPor) {
    passos.push({
      estacao: 'review',
      titulo: 'Review',
      marca: pr.defeito ? 'alerta' : 'ok',
      narracao: !pr.defeito
        ? 'Esteira verde e nada a apontar. O review lê o diff em minutos porque os sensores já fizeram a parte deles.'
        : precisaReview
          ? `Nenhum sensor da esteira pega este defeito. Sobra o review: ${pr.escape?.quem || 'uma pessoa'} com a pergunta certa.`
          : `O sensor que pegaria este defeito (${pr.pegoPor.map((x) => sensor(x).nome).join(' ou ')}) está desligado ou não bloqueia. O review vê uma esteira verde e tende a aprovar.`,
      dentro: pr.escape ? { titulo: 'o que faltou', linhas: [`Guia: ${pr.escape.guia}`, `Sensor: ${pr.escape.sensor}`], tom: 'alerta' } : { titulo: 'review', linhas: ['LGTM'], tom: 'ok' },
      metricas: metr(),
      rastro: `review: ${pr.defeito ? 'depende de alguém perguntar' : 'aprovado'}`,
    });
  }

  passos.push({
    estacao: 'merge',
    pacotes: ['merge'],
    titulo: escapou ? 'Defeito na main' : pr.defeito ? 'Main protegida' : 'Merge',
    marca: escapou ? 'falha' : 'ok',
    narracao: escapou
      ? `O defeito do PR #${pr.numero} está na main: ${pr.defeito}`
      : pr.defeito
        ? `A main não recebeu o defeito. ${sensor(pegoPor).nome} cortou a cabeça aos ${tempo} s.`
        : `PR #${pr.numero} na main, com todos os sensores verdes.`,
    dentro: { titulo: 'main', linhas: [escapou ? `✗ ${pr.defeito}` : pr.defeito ? '✓ bloqueado antes do merge' : '✓ merge'], tom: escapou ? 'falha' : 'ok' },
    metricas: metr({ main: escapou ? 'sim' : 'não', 'main:tom': escapou ? 'falha' : 'ok' }),
    razao: escapou ? [{ tipo: 'escapou', texto: `PR #${pr.numero}: ${pr.defeito}` }] : [],
    rastro: `main: ${escapou ? 'recebeu o defeito' : 'protegida'}`,
  });

  return {
    entrada: { titulo: `PR #${pr.numero} · ${pr.titulo}`, linhas: [...(pr.trecho || []), `Sensores ligados: ${ligados.map((id) => sensor(id).nome).join(', ') || 'nenhum'}`] },
    desligadas,
    passos,
    saida: {
      titulo: escapou ? 'O defeito chegou à main' : pr.defeito ? `Bloqueado por ${sensor(pegoPor).nome}` : 'PR sem defeito, merge feito',
      status: escapou ? 'falha' : 'ok',
      linhas: [
        pr.defeito ? `Defeito: ${pr.defeito}` : 'Sem defeito.',
        `Tempo de esteira: ${tempo} s`,
        ...(porSensorDesligado ? [`Pegaria: ${pr.pegoPor.map((x) => sensor(x).nome).join(' ou ')}.`] : []),
        ...(precisaReview && pr.escape ? [`Guia que faltou: ${pr.escape.guia}`, `Quem pega: ${pr.escape.quem}`] : []),
        ...(semProtecao ? ['A main está sem branch protection: o merge não esperou a esteira.'] : []),
      ],
    },
    numeros: { pegoPor, tempo, escapou },
  };
}
