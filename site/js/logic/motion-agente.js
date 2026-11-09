// Máquina FIG_AGT · Por dentro de um agente (Agente = LLM + Harness).
// Um pedido da agenda de mentorias atravessa guias, modelo, ferramenta e sensores até o PR.
// O livro-razão anota de onde veio cada linha do diff: pedido, spec, suposição ou invenção.

const PEDIDOS = {
  vago: 'Crie o endpoint de agendar mentoria.',
  spec: 'Implemente a T1 de docs/spec.md. Se faltar algo, pergunte antes.',
};

// Linhas da tabela da T1 (docs/specs/dominio-agenda-mentorias.md). "suposto" é o que a IA escreve sem a tabela.
const LINHAS_TABELA = [
  {
    id: 'vagaId',
    spec: 'vagaId ausente → 400 {"erro":"vagaId é obrigatório"}',
    suposto: 'vagaId ausente → 422 {"error":"vagaId required"}',
    teste: '✗ vagaId ausente: esperava 400 {"erro":"vagaId é obrigatório"}, recebeu 422',
  },
  {
    id: 'email',
    spec: 'jovemEmail ausente → 400 {"erro":"jovemEmail é obrigatório"}',
    suposto: 'jovemEmail ausente → 400 {"message":"Email obrigatório"}',
    teste: '✗ jovemEmail ausente: esperava {"erro":"jovemEmail é obrigatório"}, recebeu {"message":"Email obrigatório"}',
  },
  {
    id: 'formato',
    spec: 'jovemEmail sem formato a@b.c → 400 {"erro":"jovemEmail inválido"}',
    suposto: null,
    omitido: 'formato do e-mail não é validado',
    teste: '✗ jovemEmail "ana": esperava 400 {"erro":"jovemEmail inválido"}, recebeu 201',
  },
  {
    id: 'naoExiste',
    spec: 'vaga não existe → 404 {"erro":"Vaga não encontrada"}',
    suposto: null,
    omitido: 'vaga inexistente não é tratada: lê vaga.livre de undefined e cai em 500',
    teste: '✗ vagaId 999: esperava 404 {"erro":"Vaga não encontrada"}, recebeu 500',
  },
  {
    id: 'ocupada',
    spec: 'vaga não está livre → 409 {"erro":"Vaga indisponível"}',
    suposto: 'vaga não está livre → 400 {"erro":"Vaga ocupada"}',
    teste: '✗ vaga ocupada: esperava 409 {"erro":"Vaga indisponível"}, recebeu 400',
  },
  {
    id: 'sucesso',
    spec: 'sucesso → 201 com status "confirmado" e a vaga passa a livre: false',
    suposto: 'sucesso → 200 com status "agendado"',
    teste: '✗ sucesso: esperava 201 com status "confirmado", recebeu 200 com "agendado"',
  },
];

const NFR1 = {
  spec: 'NFR-1: duas requisições na mesma vaga ao mesmo tempo → uma 201 e uma 409',
  omitido: 'sem proteção para duas requisições na mesma vaga ao mesmo tempo',
  teste: '✗ NFR-1: duas requisições simultâneas na vaga 1 → recebeu 201 e 201',
};

const INVENCOES = [
  { id: 'limite', texto: 'if (agendamentosNoMes >= 3) → 403 {"erro":"Limite mensal atingido"}', bloqueadaPelaSpec: true },
  { id: 'email-conf', texto: 'envia e-mail de confirmação com nodemailer (dependência nova)', bloqueadaPelaSpec: true },
  { id: 'minusculas', texto: 'converte jovemEmail para minúsculas antes de salvar', bloqueadaPelaSpec: false, pergunta: 'Pergunta no PR: e-mail com maiúsculas conta como outro jovem? A spec não diz.' },
];

const SENSORES = { todos: ['lint', 'testes', 'review'], 'so-lint': ['lint'], nenhum: [] };

export const motion = {
  id: 'motion-agente',
  fig: 'FIG_AGT',
  titulo: 'Por dentro de um agente',
  lead: 'Agente nada mais é do que um modelo dentro de um harness. Tire uma peça e veja o que muda no diff.',
  dica: 'Troque o pedido. Tire um guia. Desligue um sensor. Olhe o livro-razão.',
  ideia:
    'O modelo só prevê texto. Tudo o que faz o diff sair certo está em volta dele: guias antes de gerar, sensores depois. Linha do diff sem endereço na spec é suposição da IA.',
  pronto: 'Aperte Rodar. A máquina leva um pedido da agenda de mentorias até o PR, uma estação por vez.',
  razaoIntro: 'Cada linha do diff e de onde ela veio. Esta é a pergunta da carta ♠ Rastro: onde, no pedido ou na spec, está escrito isso?',
  nota:
    'Isto é uma simulação: nenhum modelo roda no seu navegador. As linhas do diff, os status e as mensagens vêm da spec da agenda de mentorias e dos testes de aceite do speedrun. Os tokens são ordem de grandeza de uma sessão real do Claude Code, não medição.',
  estacoes: [
    {
      id: 'pedido',
      rotulo: 'Pedido',
      tipo: 'entrada',
      x: 0,
      y: 0,
      w: 1.8,
      d: 1.8,
      h: 0.7,
      camadas: ['o que você digitou'],
      oQueE: 'O texto que você digitou no chat. É a única parte da janela que muda a cada pedido.',
      nomeComercial: 'prompt',
    },
    {
      id: 'agents',
      rotulo: 'AGENTS.md',
      tipo: 'guia',
      x: 3.2,
      y: 0,
      w: 2,
      d: 2,
      h: 0.9,
      camadas: ['comandos', 'leia docs/spec.md antes', 'não invente regra'],
      oQueE: 'Um arquivo Markdown que o agente lê no começo de toda sessão. É guia (feedforward): age antes de o modelo gerar. Vale para todo pedido, até o vago.',
      nomeComercial: 'memória do projeto, rules, CLAUDE.md',
      arquivo: {
        nome: 'AGENTS.md',
        texto:
          '## Comandos\nnpm run gates   # lint, tipos, smoke, testes, audit\n\n## Regras\n1. Leia docs/spec.md antes de implementar.\n2. Não crie regra de negócio que não esteja na spec.\n   Se faltar, pergunte.\n3. Erros sempre no formato {"erro": "<mensagem>"}.',
      },
    },
    {
      id: 'spec',
      rotulo: 'Spec',
      tipo: 'guia',
      x: 6.4,
      y: 0,
      w: 2,
      d: 2,
      h: 0.9,
      camadas: ['tabela de erros', 'NFR-1', 'fora do escopo'],
      oQueE: 'docs/spec.md: o que o sistema faz, os erros com status e mensagem, os requisitos não funcionais e o que fica de fora. O arquivo existe no repositório, mas só entra na janela se alguém mandar ler.',
      nomeComercial: 'spec-driven development',
      arquivo: {
        nome: 'docs/spec.md (T1)',
        texto:
          '| Quando                   | Status | Corpo                                |\n| vagaId ausente           | 400 | {"erro":"vagaId é obrigatório"}     |\n| jovemEmail ausente       | 400 | {"erro":"jovemEmail é obrigatório"} |\n| jovemEmail sem a@b.c     | 400 | {"erro":"jovemEmail inválido"}      |\n| vaga não existe          | 404 | {"erro":"Vaga não encontrada"}      |\n| vaga não está livre      | 409 | {"erro":"Vaga indisponível"}        |\n| sucesso                  | 201 | status "confirmado"                 |\n\nNFR-1: duas requisições na mesma vaga → uma 201, outra 409.\nFora do escopo: e-mail, limite por jovem, autenticação.',
      },
    },
    {
      id: 'janela',
      rotulo: 'Janela',
      tipo: 'contexto',
      x: 9.6,
      y: 0,
      w: 2,
      d: 2,
      h: 1.6,
      medidor: { limite: 0.4 },
      camadas: ['sistema', 'ferramentas', 'memória', 'pedido'],
      oQueE: 'Tudo o que o modelo tem diante de si nesta conversa, na ordem em que o Claude Code carrega: prompt do sistema, ferramentas, memória (AGENTS.md), e só então o seu pedido. Você vê isso com /context.',
      nomeComercial: 'context window',
    },
    {
      id: 'modelo',
      rotulo: 'Modelo',
      tipo: 'modelo',
      x: 12.8,
      y: 0,
      w: 2.2,
      d: 2.2,
      h: 1.3,
      camadas: ['prevê o próximo token'],
      oQueE: 'Uma função que recebe texto e devolve texto, prevendo o próximo token. Sem estado: só sabe o que está na janela. Onde o texto não diz, ele preenche com o mais provável.',
      nomeComercial: 'LLM',
    },
    {
      id: 'ferramenta',
      rotulo: 'Ferramenta',
      tipo: 'ferramenta',
      x: 16.2,
      y: 0,
      w: 1.8,
      d: 1.8,
      h: 0.8,
      camadas: ['Edit', 'Bash'],
      oQueE: 'O modelo não escreve arquivo. Ele devolve um pedido de ferramenta ("edite este arquivo") e o harness executa.',
      nomeComercial: 'tool call',
    },
    {
      id: 'lint',
      rotulo: 'Lint',
      tipo: 'sensor',
      x: 19.2,
      y: 0,
      w: 1.8,
      d: 1.8,
      h: 0.9,
      camadas: ['npm run lint'],
      oQueE: 'Sensor computacional: determinístico e barato. Confere forma (variável não usada, sintaxe). Não sabe nada de regra de negócio.',
      nomeComercial: 'linter, ESLint',
    },
    {
      id: 'testes',
      rotulo: 'Testes',
      tipo: 'sensor',
      x: 22.2,
      y: 0,
      w: 2,
      d: 2,
      h: 1.1,
      camadas: ['tests/aceite (da spec)', 'NFR-1'],
      oQueE: 'Testes de aceite escritos a partir da spec antes do código. Existem no repositório mesmo quando o agente não leu a spec. Pegam o que diverge da tabela. Não pegam o que a tabela não cobre.',
      nomeComercial: 'acceptance tests, TDD',
    },
    {
      id: 'review',
      rotulo: 'Review',
      tipo: 'sensor',
      x: 25.4,
      y: 0,
      w: 2,
      d: 2,
      h: 1.1,
      camadas: ['rastreador-de-spec', 'rubrica'],
      oQueE: 'Sensor inferencial: um subagent com rubrica que pergunta, linha por linha, onde está na spec. Pega o que o teste não cobre. Pode errar e custa tokens.',
      nomeComercial: 'agente de review, LLM como juiz',
      arquivo: {
        nome: '.claude/agents/rastreador-de-spec.md',
        texto:
          '---\nname: rastreador-de-spec\ndescription: Revisa um diff comparando cada mudança com docs/spec.md.\ntools: Read, Grep, Glob\n---\nPara cada regra, condição ou efeito colateral no diff,\ncite a linha de docs/spec.md que justifica.\nSem linha na spec, é achado.',
      },
    },
    {
      id: 'pr',
      rotulo: 'PR',
      tipo: 'saida',
      x: 28.6,
      y: 0,
      w: 2,
      d: 2,
      h: 0.8,
      camadas: ['diff', 'descrição'],
      oQueE: 'O que chega para uma pessoa aprovar. Tudo o que nenhum sensor pegou está aqui dentro.',
      nomeComercial: 'pull request',
    },
  ],
  trilhos: [
    ['pedido', 'agents'],
    ['agents', 'spec'],
    ['spec', 'janela'],
    ['janela', 'modelo'],
    ['modelo', 'ferramenta'],
    ['ferramenta', 'lint'],
    ['lint', 'testes'],
    ['testes', 'review'],
    ['review', 'pr'],
    ['testes', 'modelo', { desvio: 2.4 }],
    ['review', 'modelo', { desvio: 3.4 }],
  ],
  montagem: [
    {
      id: 'pedido',
      rotulo: 'Pedido',
      opcoes: [
        { valor: 'vago', rotulo: 'vago' },
        { valor: 'spec', rotulo: 'aponta a spec' },
      ],
    },
    {
      id: 'agents',
      rotulo: 'AGENTS.md',
      opcoes: [
        { valor: 'com', rotulo: 'com' },
        { valor: 'sem', rotulo: 'sem' },
      ],
    },
    {
      id: 'sensores',
      rotulo: 'Sensores',
      opcoes: [
        { valor: 'todos', rotulo: 'lint + testes + review' },
        { valor: 'so-lint', rotulo: 'só lint' },
        { valor: 'nenhum', rotulo: 'nenhum' },
      ],
    },
  ],
  avarias: [
    { id: 'regra-apagada', estacao: 'agents', rotulo: 'Regra apagada', descricao: 'Alguém tirou do AGENTS.md a linha "não invente regra; se faltar, pergunte".' },
    { id: 'spec-sem-tabela', estacao: 'spec', rotulo: 'Spec sem tabela de erros', descricao: 'A spec diz o que fazer, mas não diz qual status e qual mensagem para cada erro.' },
    { id: 'testes-decoracao', estacao: 'testes', rotulo: 'Testes que não bloqueiam', descricao: 'continue-on-error: true. O teste fica vermelho e a esteira segue.' },
    { id: 'review-sem-rubrica', estacao: 'review', rotulo: 'Review sem rubrica', descricao: 'O agente de review recebe só "revise este código". Volta com comentário genérico.' },
  ],
  quebraPadrao: 'regra-apagada',
  legenda: [
    { tipo: 'pedido', rotulo: 'Pedido', cor: 'ink-2', descricao: 'está no que você digitou' },
    { tipo: 'spec', rotulo: 'Da spec', cor: 'tinta', descricao: 'tem endereço em docs/spec.md' },
    { tipo: 'assumido', rotulo: 'Assumido', cor: 'ouro', descricao: 'a IA supôs o que ninguém escreveu' },
    { tipo: 'omitido', rotulo: 'Esquecido', cor: 'ouro', descricao: 'estava na spec e não veio' },
    { tipo: 'inventado', rotulo: 'Inventado', cor: 'copas', descricao: 'ninguém pediu' },
    { tipo: 'pergunta', rotulo: 'Pergunta', cor: 'uva', descricao: 'a IA perguntou em vez de inventar' },
    { tipo: 'corrigido', rotulo: 'Corrigido por sensor', cor: 'folha', descricao: 'um sensor reprovou e o modelo refez' },
  ],
  metricas: [
    { id: 'linhas', rotulo: 'Linhas de regra no diff' },
    { id: 'endereco', rotulo: 'Com endereço' },
    { id: 'suposicoes', rotulo: 'Suposições' },
    { id: 'invencoes', rotulo: 'Invenções' },
    { id: 'voltas', rotulo: 'Voltas do loop' },
    { id: 'chegou', rotulo: 'Problemas no PR' },
  ],
  licoes: [
    { titulo: 'O modelo só prevê texto.', texto: 'Com o mesmo modelo, o diff muda de 0 para 6 problemas só trocando o que está em volta. Quando o agente erra, pergunte que peça do harness faltou.' },
    { titulo: 'Guia muda o que nasce. Sensor muda o que chega.', texto: 'Sem guia, o modelo inventa e o sensor reprova, em loop. Sem sensor, o modelo acerta às vezes e ninguém sabe quando.' },
    { titulo: 'Lint verde não diz nada sobre regra.', texto: 'O lint passa em todas as montagens. Regra inventada só cai com a spec (guia) ou com um review que pergunta pela linha da spec (sensor).' },
    { titulo: 'Perguntar é uma saída válida.', texto: 'Com a regra "se faltar, pergunte", a lacuna da spec vira pergunta no PR em vez de virar código. Pergunta é barata. Invenção custa um bug.' },
  ],
  desafios: [
    {
      pergunta: 'Pedido vago, com AGENTS.md e todos os sensores. Quantas invenções chegam ao PR?',
      opcoes: ['Nenhuma', 'Uma', 'Duas', 'Três'],
      correta: 0,
      explicacao: 'O AGENTS.md manda ler a spec. A seção "fora do escopo" barra o limite mensal e o e-mail. A regra "pergunte" transforma a lacuna das minúsculas em pergunta.',
      montagem: { pedido: 'vago', agents: 'com', sensores: 'todos' },
    },
    {
      pergunta: 'Sem AGENTS.md, pedido vago, só lint. O que chega ao PR?',
      opcoes: ['Nada errado: o lint passou', 'Suposições e invenções, com a esteira verde', 'O lint bloqueia o PR', 'O modelo pergunta antes de escrever'],
      correta: 1,
      explicacao: 'Sem guia, o modelo preenche as lacunas com o mais provável. Sem testes e sem review, nada reprova. A esteira fica verde porque ninguém mediu o que importa.',
      montagem: { pedido: 'vago', agents: 'sem', sensores: 'so-lint' },
    },
    {
      pergunta: 'Sem AGENTS.md e pedido vago. Qual sensor pega o limite de 3 agendamentos por mês?',
      opcoes: ['Lint', 'Testes de aceite', 'Review com rubrica', 'Nenhum'],
      correta: 2,
      explicacao: 'Os testes de aceite usam um jovem por caso, então o limite nunca dispara. Só o review que pergunta "onde está na spec?" acha essa linha.',
      montagem: { pedido: 'vago', agents: 'sem', sensores: 'todos' },
    },
    {
      pergunta: 'Tudo ligado, mas os testes estão com continue-on-error. O que muda?',
      opcoes: ['Nada, o review compensa', 'Os testes ficam vermelhos e as suposições chegam ao PR mesmo assim', 'O modelo corrige sozinho', 'O lint passa a pegar'],
      correta: 1,
      explicacao: 'Um gate que não bloqueia é decoração. O review procura invenção, não confere status e mensagem de cada linha da tabela.',
      montagem: { pedido: 'vago', agents: 'sem', sensores: 'todos' },
      avarias: ['testes-decoracao'],
    },
  ],
  simular,
};

function k(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')}k` : String(n);
}

export function simular(montagem, avarias = new Set()) {
  const temAgents = montagem.agents === 'com';
  const regraPergunte = temAgents && !avarias.has('regra-apagada');
  const leuSpec = montagem.pedido === 'spec' || temAgents;
  const temTabela = leuSpec && !avarias.has('spec-sem-tabela');
  const sensores = SENSORES[montagem.sensores] || [];
  const decoracao = avarias.has('testes-decoracao');
  const semRubrica = avarias.has('review-sem-rubrica');

  // 1. O que o modelo gera
  const linhas = [{ id: 'rota', tipo: 'pedido', texto: 'POST /agendamentos cria o agendamento' }];
  for (const l of LINHAS_TABELA) {
    if (temTabela) linhas.push({ id: l.id, tipo: 'spec', texto: l.spec, teste: l.teste });
    else if (l.suposto) linhas.push({ id: l.id, tipo: 'assumido', texto: l.suposto, teste: l.teste, certo: l.spec });
    else linhas.push({ id: l.id, tipo: 'omitido', texto: l.omitido, teste: l.teste, certo: l.spec });
  }
  if (leuSpec) linhas.push({ id: 'nfr1', tipo: 'spec', texto: NFR1.spec });
  else linhas.push({ id: 'nfr1', tipo: 'omitido', texto: NFR1.omitido, teste: NFR1.teste, certo: NFR1.spec });
  for (const inv of INVENCOES) {
    if (inv.bloqueadaPelaSpec && leuSpec) continue;
    if (regraPergunte && inv.pergunta) linhas.push({ id: inv.id, tipo: 'pergunta', texto: inv.pergunta });
    else linhas.push({ id: inv.id, tipo: 'inventado', texto: inv.texto });
  }

  const contar = () => {
    const c = (t) => linhas.filter((l) => l.tipo === t).length;
    return {
      linhas: linhas.filter((l) => l.tipo !== 'pergunta').length,
      endereco: c('pedido') + c('spec') + c('corrigido'),
      suposicoes: c('assumido') + c('omitido'),
      invencoes: c('inventado'),
    };
  };
  const tom = (n) => (n ? 'falha' : 'ok');
  let voltas = 0;
  const metr = (extra = {}) => {
    const c = contar();
    return {
      linhas: c.linhas,
      endereco: c.endereco,
      suposicoes: c.suposicoes,
      'suposicoes:tom': c.suposicoes ? 'alerta' : 'ok',
      invencoes: c.invencoes,
      'invencoes:tom': tom(c.invencoes),
      voltas,
      ...extra,
    };
  };

  const desligadas = [];
  if (!temAgents) desligadas.push('agents');
  if (!leuSpec) desligadas.push('spec');
  for (const s of ['lint', 'testes', 'review']) if (!sensores.includes(s)) desligadas.push(s);

  const passos = [];
  const pedido = PEDIDOS[montagem.pedido];

  passos.push({
    estacao: 'pedido',
    titulo: 'Pedido chega',
    narracao: montagem.pedido === 'vago' ? 'Chega um pedido de uma linha. Ele diz o objetivo e nada sobre erros, status ou o que fica de fora.' : 'Chega um pedido que aponta a spec e autoriza o agente a perguntar.',
    dentro: { titulo: 'o pedido', linhas: [`"${pedido}"`] },
    metricas: { linhas: 0, endereco: 0, suposicoes: 0, invencoes: 0, voltas: 0, chegou: '—' },
    razao: [{ tipo: 'pedido', texto: `Pedido: "${pedido}"` }],
    rastro: `pedido: "${pedido}"`,
  });

  if (temAgents) {
    passos.push({
      estacao: 'agents',
      titulo: 'Lê AGENTS.md',
      marca: regraPergunte ? 'ok' : 'alerta',
      narracao: regraPergunte
        ? 'O harness carrega o AGENTS.md antes do pedido. Duas linhas dele vão mudar o diff: "leia a spec" e "não invente regra; pergunte".'
        : 'O AGENTS.md entra, mas alguém apagou a regra "não invente; pergunte". Ainda sobra a linha que manda ler a spec.',
      dentro: { titulo: 'AGENTS.md', linhas: ['1. Leia docs/spec.md antes de implementar.', regraPergunte ? '2. Não crie regra fora da spec. Se faltar, pergunte.' : '2. (linha apagada)', '3. Erros no formato {"erro": "<mensagem>"}.'] },
      rastro: `AGENTS.md carregado${regraPergunte ? '' : ' (sem a regra "pergunte")'}`,
    });
  } else {
    passos.push({
      estacao: 'agents',
      titulo: 'Sem AGENTS.md',
      marca: 'alerta',
      narracao: 'Não há AGENTS.md. Nenhum guia fixo entra na janela. Tudo o que o agente sabe do projeto é o pedido.',
      dentro: { titulo: 'AGENTS.md', linhas: ['(arquivo não existe)'], tom: 'alerta' },
      rastro: 'AGENTS.md: ausente',
    });
  }

  if (leuSpec) {
    passos.push({
      estacao: 'spec',
      titulo: 'Lê a spec',
      marca: temTabela ? 'ok' : 'alerta',
      narracao: temTabela
        ? `${montagem.pedido === 'spec' ? 'O pedido aponta a spec' : 'O AGENTS.md manda ler a spec'}, então ela entra na janela: tabela de erros, NFR-1 e o que fica fora do escopo.`
        : 'A spec entra, mas está sem a tabela de erros. O agente sabe o que fazer e não sabe com qual status e qual mensagem responder.',
      dentro: {
        titulo: 'docs/spec.md',
        linhas: temTabela
          ? ['404 {"erro":"Vaga não encontrada"}', '409 {"erro":"Vaga indisponível"}', 'NFR-1: uma 201 e uma 409', 'Fora do escopo: e-mail, limite por jovem']
          : ['T1: agendar mentoria', '(tabela de erros: vazia)', 'NFR-1: uma 201 e uma 409', 'Fora do escopo: e-mail, limite por jovem'],
      },
      rastro: `docs/spec.md lida${temTabela ? '' : ' (sem tabela de erros)'}`,
    });
  } else {
    passos.push({
      estacao: 'spec',
      titulo: 'Spec fica de fora',
      marca: 'alerta',
      narracao: 'O arquivo docs/spec.md existe no repositório. Ninguém mandou ler. Ele não entra na janela, então para o modelo ele não existe.',
      dentro: { titulo: 'docs/spec.md', linhas: ['(existe no disco, fora da janela)'], tom: 'alerta' },
      rastro: 'docs/spec.md: não lida',
    });
  }

  const tokens = { sistema: 3100, ferramentas: 11200, memoria: temAgents ? 600 : 0, spec: leuSpec ? 1400 : 0, pedido: 30 };
  const totalJanela = Object.values(tokens).reduce((a, b) => a + b, 0);
  passos.push({
    estacao: 'janela',
    titulo: 'Monta a janela',
    narracao: `A janela é montada na ordem: sistema, ferramentas, memória, pedido. São ${k(totalJanela)} tokens de 200k. O pedido é a menor parte.`,
    dentro: {
      titulo: '/context',
      linhas: [`sistema ${k(tokens.sistema)}`, `ferramentas ${k(tokens.ferramentas)}`, `AGENTS.md ${k(tokens.memoria)}`, `spec ${k(tokens.spec)}`, `pedido ${k(tokens.pedido)}`],
    },
    niveis: { janela: totalJanela / 200000 },
    rastro: `janela: ${k(totalJanela)} tokens (${Math.round((totalJanela / 200000) * 100)}%)`,
  });

  const c0 = contar();
  passos.push({
    estacao: 'modelo',
    titulo: 'Modelo gera',
    marca: c0.suposicoes + c0.invencoes ? 'alerta' : 'ok',
    narracao:
      c0.suposicoes + c0.invencoes
        ? `O modelo escreve ${c0.linhas} linhas de regra. ${c0.suposicoes} vieram de suposição e ${c0.invencoes} ninguém pediu. Tudo com cara de certo.`
        : `O modelo escreve ${c0.linhas} linhas de regra e cada uma tem endereço no pedido ou na spec.`,
    dentro: { titulo: 'o que o modelo propôs', linhas: linhas.map((l) => `${marcador(l.tipo)} ${l.texto}`) },
    metricas: metr(),
    razao: linhas.map((l) => ({ tipo: l.tipo, texto: l.texto })),
    rastro: `modelo: ${c0.linhas} linhas (${c0.suposicoes} suposições, ${c0.invencoes} invenções)`,
  });

  passos.push({
    estacao: 'ferramenta',
    titulo: 'Escreve o arquivo',
    narracao: 'O modelo devolve um pedido de ferramenta. O harness executa o Edit. Só agora o código existe no disco.',
    dentro: { titulo: 'tool call', linhas: ['Edit src/rotas/agendamentos.js', `+${18 + linhas.length * 4} linhas`] },
    rastro: 'Edit src/rotas/agendamentos.js',
  });

  if (sensores.includes('lint')) {
    passos.push({
      estacao: 'lint',
      titulo: 'Lint',
      marca: 'ok',
      narracao: 'Lint verde. Ele confere forma. Não sabe se 422 ou 400 é o status certo, nem se o limite mensal foi pedido.',
      dentro: { titulo: 'npm run lint', linhas: ['✓ 0 problemas'], tom: 'ok' },
      rastro: 'lint: verde',
    });
  }

  if (sensores.includes('testes')) {
    const falhas = linhas.filter((l) => (l.tipo === 'assumido' || l.tipo === 'omitido') && l.teste);
    if (!falhas.length) {
      passos.push({
        estacao: 'testes',
        titulo: 'Testes de aceite',
        marca: 'ok',
        narracao: 'Os testes de aceite passam. Cada linha da tabela da spec tem um caso que funciona e um que falha, com a resposta exata.',
        dentro: { titulo: 'npm test', linhas: ['✓ 9 testes de aceite'], tom: 'ok' },
        metricas: metr(),
        rastro: 'testes: verde',
      });
    } else if (decoracao) {
      passos.push({
        estacao: 'testes',
        titulo: 'Testes (decoração)',
        marca: 'alerta',
        narracao: `${falhas.length} testes de aceite falham. A esteira está com continue-on-error, então o vermelho aparece no log e o PR segue. Gate que não bloqueia é decoração.`,
        dentro: { titulo: 'npm test (continue-on-error)', linhas: [...falhas.slice(0, 4).map((f) => f.teste), falhas.length > 4 ? `… e mais ${falhas.length - 4}` : null].filter(Boolean), tom: 'falha' },
        metricas: metr(),
        rastro: `testes: ${falhas.length} falhas ignoradas (continue-on-error)`,
      });
    } else {
      passos.push({
        estacao: 'testes',
        titulo: 'Testes reprovam',
        marca: 'falha',
        narracao: `${falhas.length} testes de aceite falham. Perceba: os testes existem no repositório mesmo sem o agente ter lido a spec. Eles devolvem o sinal com a resposta exata esperada.`,
        dentro: { titulo: 'npm test', linhas: [...falhas.slice(0, 4).map((f) => f.teste), falhas.length > 4 ? `… e mais ${falhas.length - 4}` : null].filter(Boolean), tom: 'falha' },
        metricas: metr(),
        rastro: `testes: ${falhas.length} falhas`,
      });
      voltas += 1;
      for (const f of falhas) {
        f.tipo = 'corrigido';
        f.texto = f.certo;
      }
      passos.push({
        estacao: 'modelo',
        titulo: 'Volta ao modelo',
        pacotes: ['modelo'],
        trilhos: [['testes', 'modelo']],
        narracao: 'A saída do teste volta para a janela. O modelo lê "esperava 404, recebeu 500" e corrige. Esse é o loop agêntico: gerar, medir, corrigir.',
        dentro: { titulo: 'correções', linhas: falhas.map((f) => `✓ ${f.certo}`), tom: 'ok' },
        metricas: metr(),
        razao: falhas.map((f) => ({ tipo: 'corrigido', texto: `Teste reprovou e o modelo refez: ${f.certo}` })),
        rastro: `volta ${voltas}: modelo corrige ${falhas.length} linhas a partir da saída dos testes`,
      });
      passos.push({
        estacao: 'testes',
        titulo: 'Testes de novo',
        marca: 'ok',
        narracao: 'Os testes de aceite passam na segunda volta.',
        dentro: { titulo: 'npm test', linhas: ['✓ 9 testes de aceite'], tom: 'ok' },
        metricas: metr(),
        rastro: 'testes: verde (2ª volta)',
      });
    }
  }

  if (sensores.includes('review')) {
    const invs = linhas.filter((l) => l.tipo === 'inventado');
    if (semRubrica) {
      passos.push({
        estacao: 'review',
        titulo: 'Review genérico',
        marca: 'alerta',
        narracao: 'O agente de review recebeu só "revise este código". Ele devolve conselhos que servem para qualquer PR e não aponta nenhuma linha.',
        dentro: { titulo: 'review', linhas: ['"Considere adicionar tratamento de erros."', '"Bom uso de async/await."', 'VEREDITO: APROVAR'], tom: 'alerta' },
        metricas: metr(),
        rastro: 'review sem rubrica: aprovou com comentários genéricos',
      });
    } else if (!invs.length) {
      passos.push({
        estacao: 'review',
        titulo: 'Review',
        marca: 'ok',
        narracao: 'O rastreador de spec confere cada regra do diff contra a spec e não acha linha sem endereço.',
        dentro: { titulo: 'rastreador-de-spec', linhas: ['0 achados', 'VEREDITO: APROVAR'], tom: 'ok' },
        metricas: metr(),
        rastro: 'review: aprovado, 0 achados',
      });
    } else {
      passos.push({
        estacao: 'review',
        titulo: 'Review bloqueia',
        marca: 'falha',
        narracao: `O rastreador de spec pergunta, para cada regra: onde está na spec? ${invs.length === 1 ? 'Uma linha não tem' : `${invs.length} linhas não têm`} resposta.`,
        dentro: { titulo: 'rastreador-de-spec', linhas: [...invs.map((l) => `✗ ${l.texto} → sem linha na spec`), 'VEREDITO: BLOQUEAR'], tom: 'falha' },
        metricas: metr(),
        rastro: `review: ${invs.length} invenções apontadas`,
      });
      voltas += 1;
      for (const l of invs) l.tipo = 'removido';
      const removidas = invs.length;
      linhas.splice(0, linhas.length, ...linhas.filter((l) => l.tipo !== 'removido'));
      passos.push({
        estacao: 'modelo',
        titulo: 'Volta ao modelo',
        pacotes: ['modelo'],
        trilhos: [['review', 'modelo']],
        narracao: `O modelo remove ${removidas === 1 ? 'a linha inventada' : `as ${removidas} linhas inventadas`}. Repare no custo: mais uma volta inteira por uma regra que um guia teria impedido de nascer.`,
        dentro: { titulo: 'correções', linhas: invs.map((l) => `− ${l.texto}`), tom: 'ok' },
        metricas: metr(),
        razao: invs.map((l) => ({ tipo: 'corrigido', texto: `Review apontou e o modelo removeu: ${l.texto}` })),
        rastro: `volta ${voltas}: modelo remove ${removidas} invenções`,
      });
      passos.push({
        estacao: 'review',
        titulo: 'Review de novo',
        marca: 'ok',
        narracao: 'Segunda passada do rastreador: nenhuma regra sem endereço.',
        dentro: { titulo: 'rastreador-de-spec', linhas: ['0 achados', 'VEREDITO: APROVAR'], tom: 'ok' },
        metricas: metr(),
        rastro: 'review: aprovado (2ª volta)',
      });
    }
  }

  const fim = contar();
  const problemas = fim.suposicoes + fim.invencoes;
  const perguntas = linhas.filter((l) => l.tipo === 'pergunta');
  passos.push({
    estacao: 'pr',
    titulo: 'PR aberto',
    marca: problemas ? 'falha' : 'ok',
    narracao: problemas
      ? `O PR chega com ${problemas} ${problemas === 1 ? 'problema' : 'problemas'} e cara de pronto. Quem aprovar sem a carta Rastro leva junto.`
      : `O PR chega sem suposição e sem invenção${perguntas.length ? ', com uma pergunta para você responder' : ''}. ${voltas ? `Custou ${voltas} ${voltas === 1 ? 'volta' : 'voltas'} do loop.` : 'De primeira.'}`,
    dentro: { titulo: 'diff final', linhas: linhas.map((l) => `${marcador(l.tipo)} ${l.texto}`), tom: problemas ? 'falha' : 'ok' },
    metricas: metr({ chegou: problemas, 'chegou:tom': problemas ? 'falha' : 'ok' }),
    rastro: `PR: ${problemas} problemas, ${perguntas.length} pergunta(s), ${voltas} volta(s)`,
  });

  return {
    entrada: { titulo: 'Pedido para o agente', linhas: [`"${pedido}"`, `AGENTS.md: ${temAgents ? 'sim' : 'não'} · sensores: ${sensores.length ? sensores.join(', ') : 'nenhum'}`] },
    desligadas,
    passos,
    saida: {
      titulo: problemas ? `PR com ${problemas} ${problemas === 1 ? 'problema' : 'problemas'} que ninguém mediu` : 'PR com endereço em cada linha',
      status: problemas ? 'falha' : 'ok',
      linhas: [
        ...linhas.filter((l) => ['assumido', 'omitido', 'inventado'].includes(l.tipo)).map((l) => `${rotuloTipo(l.tipo)}: ${l.texto}`),
        ...perguntas.map((l) => l.texto),
        `Voltas do loop: ${voltas}`,
        problemas ? 'Peça que faltou: veja quais estações estão apagadas ou quebradas.' : 'Cada linha de regra aponta para o pedido ou para a spec.',
      ],
    },
  };
}

function marcador(tipo) {
  return { pedido: '•', spec: '✓', corrigido: '✓', assumido: '?', omitido: '∅', inventado: '✗', pergunta: '¿' }[tipo] || '•';
}

function rotuloTipo(tipo) {
  return { assumido: 'Assumido', omitido: 'Esquecido', inventado: 'Inventado' }[tipo] || tipo;
}
