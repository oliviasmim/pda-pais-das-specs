export const SENSORES = [
  {
    id: 'lint',
    nome: 'Lint',
    ferramenta: 'ESLint',
    comando: 'npm run lint',
    seg: 20,
    padrao: true,
    pergunta: 'O código obedece às regras do projeto e não tem erro bobo?',
  },
  {
    id: 'typecheck',
    nome: 'Type check',
    ferramenta: 'tsc --noEmit com checkJs',
    comando: 'npm run typecheck',
    seg: 30,
    padrao: true,
    pergunta: 'Os tipos combinam entre quem chama e quem é chamado?',
  },
  {
    id: 'build',
    nome: 'Build + smoke',
    ferramenta: 'sobe o servidor e chama GET /health',
    comando: 'npm run smoke',
    seg: 40,
    padrao: true,
    pergunta: 'O sistema liga numa máquina limpa?',
  },
  {
    id: 'testes',
    nome: 'Testes + cobertura',
    ferramenta: 'node --test com cobertura mínima de 80%',
    comando: 'npm test',
    seg: 60,
    padrao: true,
    pergunta: 'O comportamento é o que a spec pede?',
  },
  {
    id: 'deps',
    nome: 'Dependências',
    ferramenta: 'npm audit',
    comando: 'npm audit --audit-level=high',
    seg: 15,
    padrao: true,
    pergunta: 'Alguma biblioteca tem vulnerabilidade conhecida?',
  },
  {
    id: 'guarda',
    nome: 'Guarda dos testes de aceite',
    ferramenta: 'sha256 de tests/aceite/ contra o manifesto',
    comando: 'npm run guarda',
    seg: 5,
    padrao: false,
    extra: true,
    pergunta: 'Alguém mexeu nos testes de aceite para fazer passar?',
  },
  {
    id: 'nfr',
    nome: 'NFR-2 · p95 < 50 ms',
    ferramenta: '200 requisições locais em GET /mentores/:id/vagas',
    comando: 'node --test --test-name-pattern=NFR \"tests/**/*.test.js\"',
    seg: 45,
    padrao: false,
    extra: true,
    pergunta: 'O requisito não funcional escrito na spec continua valendo?',
  },
];

export const PRS = [
  {
    id: 'pr12',
    numero: 12,
    titulo: 'feat: valida jovemEmail',
    defeito: 'Erro de sintaxe: falta uma vírgula num objeto.',
    trecho: ["-  { erro: 'jovemEmail é obrigatório' },", "+  { status: 400 erro: 'jovemEmail é obrigatório' },"],
    pegoPor: ['lint', 'typecheck', 'build', 'testes'],
    mensagens: {
      lint: 'src/routes/agendamentos.js:18:17  Parsing error: Unexpected token erro',
      typecheck: "src/routes/agendamentos.js(18,17): error TS1005: ',' expected.",
      build: 'SyntaxError: Unexpected identifier \'erro\'',
      testes: 'SyntaxError: Unexpected identifier \'erro\' (nenhum teste rodou)',
    },
  },
  {
    id: 'pr13',
    numero: 13,
    titulo: 'fix: lê vagaId da query',
    defeito: 'Tipo errado: passa a string "12" para uma função que espera número.',
    trecho: ['-  const vaga = repo.buscarVaga(req.body.vagaId);', '+  const vaga = repo.buscarVaga(req.query.vagaId);'],
    pegoPor: ['typecheck'],
    mensagens: {
      typecheck: "src/routes/agendamentos.js(22,33): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.",
    },
    escape: { quem: 'review humano', guia: 'AGENTS.md: "Use JSDoc com @param tipado em toda função de src/repo.js."', sensor: 'Ligue o type check.' },
  },
  {
    id: 'pr14',
    numero: 14,
    titulo: 'refactor: carrega mentores de config/',
    defeito: 'O servidor lê config/mentores.json no boot, mas o arquivo está no .gitignore. Na máquina do agente funciona; numa máquina limpa, não sobe.',
    trecho: ["+const mentores = JSON.parse(readFileSync('config/mentores.json', 'utf8'));"],
    pegoPor: ['build'],
    mensagens: {
      build: "Error: ENOENT: no such file or directory, open 'config/mentores.json' (GET /health nunca respondeu)",
    },
    escape: { quem: 'a primeira pessoa que clonar o repositório', guia: 'AGENTS.md: "Todo arquivo que o servidor lê no boot precisa estar versionado."', sensor: 'Ligue o build + smoke.' },
  },
  {
    id: 'pr15',
    numero: 15,
    titulo: 'feat(T2): cancelar agendamento',
    defeito: 'Regra de negócio errada: cancela, mas não devolve a vaga (livre continua false).',
    trecho: ["+  agendamento.status = 'cancelado';", '+  return res.json({ id: agendamento.id, status: agendamento.status });'],
    pegoPor: ['testes'],
    mensagens: {
      testes: '✖ T2 · cancelar devolve a vaga · expected livre: true, actual: false',
    },
    escape: { quem: 'o jovem que tenta agendar a vaga liberada', guia: 'Spec T2: "a vaga volta a livre: true".', sensor: 'Ligue os testes com o cenário da spec.' },
  },
  {
    id: 'pr16',
    numero: 16,
    titulo: 'chore: adiciona lodash',
    defeito: 'Dependência vulnerável (lodash 4.17.15, prototype pollution, severidade alta) adicionada para usar _.isEmpty uma vez.',
    trecho: ['+    "lodash": "4.17.15"', "+import _ from 'lodash';", '+if (_.isEmpty(req.body)) {'],
    pegoPor: ['deps'],
    mensagens: {
      deps: 'lodash  <4.17.19 · Prototype Pollution · severity: high · fix available via `npm audit fix`',
    },
    escape: { quem: 'quem explorar a vulnerabilidade', guia: 'AGENTS.md: "Não adicione dependência sem justificar no PR por que a biblioteca padrão não resolve."', sensor: 'Ligue o npm audit.' },
  },
  {
    id: 'pr17',
    numero: 17,
    titulo: 'fix: corrige teste de agendamento',
    defeito: 'Rosa pintada: o agente trocou o 409 esperado por 201 no teste de aceite para a CI ficar verde.',
    trecho: ['-  assert.equal(res.status, 409);', '+  assert.equal(res.status, 201);'],
    pegoPor: ['guarda'],
    mensagens: {
      guarda: 'tests/aceite/agendar.test.js: sha256 diferente do manifesto. Testes de aceite não podem mudar neste PR.',
    },
    escape: {
      quem: 'review humano ou subagent cético-de-testes',
      guia: 'AGENTS.md: "Nunca altere arquivos em tests/aceite/. Se um teste parecer errado, pare e pergunte."',
      sensor: 'Hook PreToolUse que bloqueia Edit|Write em tests/aceite/ e a guarda de checksum na CI.',
    },
  },
  {
    id: 'pr18',
    numero: 18,
    titulo: 'refactor: AgendamentoServiceFactory',
    defeito: 'Abstração inútil: Factory + Strategy + interface para uma única implementação. 140 linhas novas, mesmo comportamento.',
    trecho: ['+export class AgendamentoServiceFactory {', '+  static create(strategy = new DefaultAgendamentoStrategy()) {', '+    return new AgendamentoService(strategy);'],
    pegoPor: [],
    mensagens: {},
    escape: {
      quem: 'review humano com a carta Navalha',
      guia: 'AGENTS.md: "Prefira funções simples. Padrão de projeto só com dois casos reais que precisem dele."',
      sensor: 'Nenhum sensor da CI pega isso. Subagent de review com a pergunta: qual é o código mais simples que passa nos mesmos testes?',
    },
  },
  {
    id: 'pr19',
    numero: 19,
    titulo: 'feat(T3): filtra vagas por data',
    defeito: 'Desempenho: ordena a lista dentro de um loop (O(n²)). Com 1.000 vagas, p95 vai a 118 ms.',
    trecho: ['+for (const v of vagas) {', '+  livres.sort((a, b) => a.inicio.localeCompare(b.inicio));'],
    pegoPor: ['nfr'],
    mensagens: {
      nfr: 'NFR-2 falhou: p95 = 118 ms com 1.000 vagas (meta: 50 ms)',
    },
    escape: {
      quem: 'os 150 jovens abrindo a agenda às 9h de segunda',
      guia: 'Spec: "ENQUANTO o mentor tiver até 1.000 vagas, o sistema DEVE responder em p95 < 50 ms."',
      sensor: 'Requisito sem sensor é promessa: ligue o teste de NFR-2.',
    },
  },
  {
    id: 'pr21',
    numero: 21,
    titulo: 'feat(T1): agendar mentoria',
    defeito: 'Regra inventada: limita cada jovem a 3 agendamentos por mês. Não está na spec, e nenhum teste cobre isso.',
    trecho: ['+  if (agendamentosDoMes(jovemEmail) >= 3) {', "+    return res.status(429).json({ erro: 'Limite mensal atingido' });"],
    pegoPor: [],
    mensagens: {},
    escape: {
      quem: 'review humano com a carta Rastro, ou subagent rastreador-de-spec',
      guia: 'AGENTS.md: "Não crie regra de negócio que não esteja em docs/spec.md. Se faltar, pergunte."',
      sensor: 'Nenhum sensor da CI pega regra inventada. Só quem compara cada if com a spec.',
    },
  },
  {
    id: 'pr20',
    numero: 20,
    titulo: 'feat: GET /health devolve a versão',
    defeito: null,
    trecho: ["-  res.json({ status: 'ok' });", "+  res.json({ status: 'ok', versao: pkg.version });"],
    pegoPor: [],
    mensagens: {},
  },
];

export function sensor(id) {
  return SENSORES.find((s) => s.id === id);
}

export function ordemPadrao() {
  return SENSORES.filter((s) => s.padrao).map((s) => s.id);
}

export function rodarEsteira(ordem, pr) {
  const passos = [];
  let tempo = 0;
  let pegoPor = null;
  for (const id of ordem) {
    const s = sensor(id);
    if (!s) continue;
    if (pegoPor) {
      passos.push({ sensor: id, resultado: 'pulado', seg: 0 });
      continue;
    }
    tempo += s.seg;
    if (pr.pegoPor.includes(id)) {
      pegoPor = id;
      passos.push({ sensor: id, resultado: 'falhou', seg: s.seg, mensagem: pr.mensagens[id] || 'falhou' });
    } else {
      passos.push({ sensor: id, resultado: 'ok', seg: s.seg });
    }
  }
  const temDefeito = Boolean(pr.defeito);
  return {
    pr: pr.id,
    passos,
    pegoPor,
    tempo,
    bloqueado: Boolean(pegoPor),
    escapou: temDefeito && !pegoPor,
    pegavel: pr.pegoPor.length > 0,
  };
}

export function rodarFila(ordem, prs = PRS) {
  const resultados = prs.map((pr) => rodarEsteira(ordem, pr));
  const comDefeito = prs.filter((p) => p.defeito);
  const pegos = resultados.filter((r) => r.pegoPor);
  const escaparam = resultados.filter((r) => r.escapou).map((r) => prs.find((p) => p.id === r.pr));
  const semSensorPossivel = escaparam.filter((p) => !p.pegoPor.length);
  const tempoTotal = resultados.reduce((s, r) => s + r.tempo, 0);
  return {
    resultados,
    resumo: {
      defeitos: comDefeito.length,
      pegos: pegos.length,
      escaparam,
      precisamDeReview: semSensorPossivel,
      escaparamPorSensorDesligado: escaparam.filter((p) => p.pegoPor.length),
      tempoTotal,
      tempoMedio: Math.round(tempoTotal / Math.max(1, resultados.length)),
    },
  };
}

export function ordemFailFast(ordem) {
  return [...ordem].sort((a, b) => sensor(a).seg - sensor(b).seg);
}

export function formatarTempo(seg) {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  if (!m) return `${s}s`;
  return s ? `${m}min ${s}s` : `${m}min`;
}

const PASSOS_YAML = {
  lint: { name: 'Lint', run: 'npm run lint' },
  typecheck: { name: 'Type check', run: 'npm run typecheck' },
  build: { name: 'Build + smoke (sobe e chama /health)', run: 'npm run smoke' },
  testes: { name: 'Testes + cobertura mínima', run: 'npm test' },
  deps: { name: 'Dependências (falha em high/critical)', run: 'npm audit --audit-level=high' },
  guarda: { name: 'Guarda dos testes de aceite', run: 'npm run guarda' },
  nfr: { name: 'NFR-2 · p95 < 50 ms', run: 'node --test --test-name-pattern=NFR \"tests/**/*.test.js\"' },
};

export function gerarWorkflow(ordem, { node = 22 } = {}) {
  const linhas = [
    '# .github/workflows/ci.yml',
    '# Gerado no laboratório "Cortem-lhe a cabeça!". Ajuste os nomes dos scripts ao seu package.json.',
    'name: CI',
    '',
    'on:',
    '  pull_request:',
    '  push:',
    '    branches: [main]',
    '',
    'permissions:',
    '  contents: read',
    '',
    'jobs:',
    '  gates:',
    '    runs-on: ubuntu-latest',
    '    timeout-minutes: 15',
    '    steps:',
    '      - uses: actions/checkout@v6',
    '      - uses: actions/setup-node@v6',
    '        with:',
    `          node-version: ${node}`,
    '          cache: npm',
    '      - name: Instalar dependências (lockfile)',
    '        run: npm ci',
  ];
  for (const id of ordem) {
    const p = PASSOS_YAML[id];
    if (!p) continue;
    linhas.push(`      - name: ${p.name}`, `        run: ${p.run}`);
  }
  return linhas.join('\n') + '\n';
}

export const PERGUNTAS_YAML = [
  'Roda em pull_request, antes do merge, e não só em push na main?',
  'Cada sensor que você quer está lá, e você já viu cada um ficar vermelho de propósito?',
  'Usa npm ci (respeita o lockfile) e não npm install?',
  'Tem continue-on-error, "|| true" ou exit 0 escondendo falha?',
  'O job "gates" está marcado como obrigatório na proteção da main? Sem isso, CI vermelha é só opinião.',
];

export function auditarYaml(texto) {
  const achados = [];
  if (!/pull_request/.test(texto)) achados.push('Não roda em pull_request: o defeito só aparece depois do merge.');
  if (/continue-on-error:\s*true/.test(texto)) achados.push('continue-on-error: true transforma o gate em enfeite.');
  if (/\|\|\s*true/.test(texto)) achados.push('"|| true" engole a falha do comando.');
  if (/npm install(?!\S)/.test(texto)) achados.push('npm install ignora o lockfile; use npm ci.');
  if (/--passWithNoTests/.test(texto)) achados.push('--passWithNoTests deixa passar quando nenhum teste roda.');
  if (!/npm audit/.test(texto)) achados.push('Nenhuma checagem de dependências.');
  return achados;
}
