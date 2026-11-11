// Máquina FIG_REV · Por dentro de um review (O Julgamento do Valete).
// Um diff grande gerado por agente com seis defeitos plantados. Quem pega o quê:
// a leitura humana em camadas, os subagents de review com rubrica, ou ninguém.

export const DEFEITOS = [
  {
    id: 'dep',
    camada: 'mapa',
    linha: 14,
    titulo: 'Dependência sem motivo',
    arquivo: 'package.json:14',
    trecho: '+ "moment-timezone": "^0.5.45"',
    porque: 'Fuso diferente de Brasília está fora do escopo da spec. Biblioteca nova para nada.',
    maquina: 'rastreador',
    escondidoPorContexto: true,
  },
  {
    id: 'factory',
    camada: 'navalha',
    linha: 120,
    titulo: 'Abstração sem necessidade',
    arquivo: 'src/servicos/AgendamentoServiceFactory.js',
    trecho: 'class AgendamentoServiceFactory { create(): IAgendamentoService { … } }',
    porque: 'Factory + interface para uma implementação só. Uma função de 15 linhas passa nos mesmos testes.',
    maquina: null,
  },
  {
    id: 'mensagem',
    camada: 'contrato',
    linha: 310,
    titulo: 'Mensagem fora do contrato',
    arquivo: 'src/rotas/agendamento.js:27',
    trecho: "res.status(404).json({ erro: 'Vaga inexistente' })",
    porque: 'A spec diz 404 {"erro":"Vaga não encontrada"}.',
    maquina: 'rastreador',
  },
  {
    id: 'limite',
    camada: 'regras',
    linha: 334,
    titulo: 'Regra inventada',
    arquivo: 'src/rotas/agendamento.js:34',
    trecho: "if (doMes.length >= 3) return res.status(403).json({ erro: 'Limite mensal' })",
    porque: 'Nenhuma linha da spec fala em limite por jovem. "Limite de agendamentos" está em fora do escopo.',
    maquina: 'rastreador',
    escondidoPorContexto: true,
  },
  {
    id: 'tartaruga',
    camada: 'testes',
    linha: 905,
    titulo: 'Teste que só testa o mock',
    arquivo: 'tests/agendamento.test.js:12',
    trecho: 'expect(repoMock.salvar).toHaveBeenCalled()',
    porque: 'Confere que o mock foi chamado. Não pegaria nenhum bug da rota.',
    maquina: 'cetico',
  },
  {
    id: 'rosa',
    camada: 'testes',
    linha: 1104,
    titulo: 'Teste de aceite alterado',
    arquivo: 'tests/aceite/t1.test.js:41',
    trecho: '- assert.equal(res.status, 409)\n+ assert.equal(res.status, 201)',
    porque: 'Rosa pintada: o agente mudou a asserção para a CI ficar verde.',
    maquina: 'cetico',
  },
];

const CAMADAS = [
  { id: 'mapa', rotulo: 'Mapa', pergunta: 'Que arquivos mudaram? Algum não devia estar aqui?' },
  { id: 'testes', rotulo: 'Testes', pergunta: 'Que bug cada teste novo pegaria? Algum teste de aceite mudou?' },
  { id: 'contrato', rotulo: 'Contrato', pergunta: 'Cada status e mensagem bate com a tabela da spec?' },
  { id: 'regras', rotulo: 'Regras', pergunta: 'Cada if de regra tem endereço na spec?' },
  { id: 'navalha', rotulo: 'Navalha', pergunta: 'Qual é o código mais simples que passa nos mesmos testes?' },
];

const FADIGA = 600;

export const motion = {
  id: 'motion-review',
  fig: 'FIG_REV',
  titulo: 'Por dentro de um review',
  lead: 'Um PR de 1.180 linhas gerado por agente, com seis defeitos plantados. Leia em camadas, chame os revisores e compare quem pegou o quê.',
  dica: 'Troque quem revisa. Leia de cima para baixo. Tire a rubrica do subagent.',
  ideia:
    'Revisão humana e subagent de review pegam coisas diferentes. A pessoa lê em camadas e pergunta pela simplicidade. O subagent com rubrica não cansa na linha 900. Sem rubrica, ele vira o jurado que escreve bobagem na lousa.',
  pronto: 'Aperte Rodar. O PR #42 entra no tribunal. A fileira da frente são as camadas de leitura humana; a de trás, os dois subagents de review.',
  razaoIntro: 'Cada defeito plantado e quem pegou. É o comparativo do red team da S9: o que o humano pegou e a máquina não, e o contrário.',
  nota:
    'Isto é uma simulação. Os defeitos são os mesmos dos laboratórios desta lição e os subagents são os arquivos de speedrun/agentes-review/. A fadiga na linha 600 é uma régua didática: o ponto exato muda de pessoa para pessoa, a queda de atenção em diff longo não.',
  estacoes: [
    {
      id: 'diff',
      rotulo: 'PR #42',
      tipo: 'entrada',
      x: 0,
      y: 0,
      w: 2,
      d: 2,
      h: 1.3,
      camadas: ['23 arquivos', '+1.180 −40'],
      oQueE: 'feat(T1): agendar mentoria. Gerado por agente em uma sessão. CI verde.',
    },
    ...CAMADAS.map((c, i) => ({
      id: c.id,
      rotulo: c.rotulo,
      tipo: 'humano',
      x: 3.6 + i * 3,
      y: 0,
      w: 1.9,
      d: 1.9,
      h: 0.9,
      camadas: [c.pergunta.length > 30 ? `${c.pergunta.slice(0, 28)}…` : c.pergunta],
      oQueE: `Camada de leitura humana. Pergunta: ${c.pergunta}`,
      nomeComercial: c.id === 'regras' ? 'carta ♠ Rastro' : c.id === 'navalha' ? 'carta 🎩 Navalha' : c.id === 'testes' ? 'carta ♣ Contraprova' : c.id === 'contrato' ? 'carta ♦ Contrato' : undefined,
    })),
    {
      id: 'cetico',
      rotulo: 'Cético',
      tipo: 'sub',
      x: 6.6,
      y: -4.6,
      w: 2.1,
      d: 2.1,
      h: 1.1,
      camadas: ['rubrica', 'janela própria'],
      oQueE: 'O subagent cetico-de-testes desconfia de todo teste verde. Teste de aceite alterado é sempre bloqueio. Para cada teste novo: que bug ele pegaria?',
      arquivo: { nome: 'speedrun/agentes-review/cetico-de-testes.md', texto: '---\nname: cetico-de-testes\ntools: Read, Grep, Glob\ndisallowedTools: Edit, Write\n---\nRosas pintadas: arquivo de tests/aceite/ alterado é BLOQUEIO.\nFalsa Tartaruga: teste que só confere o mock.\nPara cada teste novo: que bug este teste pegaria?' },
    },
    {
      id: 'rastreador',
      rotulo: 'Rastreador',
      tipo: 'sub',
      x: 11.6,
      y: -4.6,
      w: 2.1,
      d: 2.1,
      h: 1.1,
      camadas: ['rubrica', 'janela própria'],
      oQueE: 'O subagent rastreador-de-spec tem uma única pergunta: "onde, na spec, está escrito isso?". Procura regra inventada, efeito colateral e linha da spec sem código.',
      arquivo: { nome: 'speedrun/agentes-review/rastreador-de-spec.md', texto: '---\nname: rastreador-de-spec\ntools: Read, Grep, Glob\ndisallowedTools: Edit, Write\n---\nPara cada regra, condição ou efeito colateral no diff,\ncite a linha de docs/spec.md que justifica.\nSem linha na spec, é achado.' },
    },
    {
      id: 'veredito',
      rotulo: 'Veredito',
      tipo: 'saida',
      x: 19.6,
      y: -1.4,
      w: 2.2,
      d: 2.2,
      h: 1,
      camadas: ['aprovar ou bloquear'],
      oQueE: '"Sentença primeiro, veredito depois!" é o que a Rainha diz. Aqui é o contrário: primeiro a evidência de cada achado, depois o veredito.',
    },
  ],
  trilhos: [
    ['diff', 'mapa'],
    ['mapa', 'testes'],
    ['testes', 'contrato'],
    ['contrato', 'regras'],
    ['regras', 'navalha'],
    ['navalha', 'veredito'],
    ['diff', 'cetico'],
    ['cetico', 'rastreador'],
    ['rastreador', 'veredito'],
  ],
  montagem: [
    {
      id: 'quem',
      rotulo: 'Quem revisa',
      padrao: 'ambos',
      opcoes: [
        { valor: 'ambos', rotulo: 'pessoa + subagents' },
        { valor: 'humano', rotulo: 'só a pessoa' },
        { valor: 'subagents', rotulo: 'só subagents' },
      ],
    },
    {
      id: 'leitura',
      rotulo: 'Leitura humana',
      opcoes: [
        { valor: 'camadas', rotulo: 'em camadas' },
        { valor: 'topo', rotulo: 'de cima para baixo' },
      ],
    },
  ],
  avarias: [
    { id: 'pressa', estacao: 'testes', rotulo: 'Pulou os testes', descricao: 'A pessoa vê a CI verde e não abre a pasta tests/.' },
    { id: 'sem-rubrica', estacao: 'rastreador', rotulo: 'Subagents sem rubrica', descricao: 'Os dois subagents recebem só "revise este PR".' },
    { id: 'mesmo-contexto', estacao: 'cetico', rotulo: 'Revisor na sessão do autor', descricao: 'Os revisores rodam na mesma conversa que escreveu o código e herdam as suposições dela.' },
  ],
  quebraPadrao: 'sem-rubrica',
  legenda: [
    { tipo: 'ambos', rotulo: 'Pessoa e máquina', cor: 'folha', descricao: 'os dois pegaram' },
    { tipo: 'humano', rotulo: 'Só a pessoa', cor: 'copas', descricao: 'a máquina deixou passar' },
    { tipo: 'maquina', rotulo: 'Só a máquina', cor: 'uva', descricao: 'a pessoa deixou passar' },
    { tipo: 'generico', rotulo: 'Comentário genérico', cor: 'ink-3', descricao: 'serve para qualquer PR' },
    { tipo: 'escapou', rotulo: 'Escapou', cor: 'ouro', descricao: 'ninguém pegou' },
  ],
  metricas: [
    { id: 'pegos', rotulo: 'Defeitos pegos' },
    { id: 'soHumano', rotulo: 'Só a pessoa' },
    { id: 'soMaquina', rotulo: 'Só a máquina' },
    { id: 'escaparam', rotulo: 'Escaparam' },
    { id: 'genericos', rotulo: 'Comentários genéricos' },
    { id: 'tempo', rotulo: 'Tempo de review' },
  ],
  licoes: [
    { titulo: 'Testes primeiro.', texto: 'Na leitura de cima para baixo, os testes ficam no fim do diff, depois da linha 900, e é justamente lá que a atenção já acabou. Os testes dizem se o resto está certo: leia antes.' },
    { titulo: 'Rubrica é o que faz o subagent revisar.', texto: 'Sem rubrica, os subagents devolvem "considere adicionar tratamento de erros" e aprovam. A rubrica é a lista de perguntas do Baralho, escrita no arquivo do agente.' },
    { titulo: 'Revisor de verdade não escreveu o código.', texto: 'Rodando na sessão do autor, o rastreador herda a ideia de que o limite mensal "faz sentido". Janela própria é parte do motivo de existir subagent de review.' },
    { titulo: 'A Navalha ainda é sua.', texto: 'Nenhum subagent com essas rubricas pergunta pelo código mais simples. Abstraction bloat continua sendo pego por gente que pergunta "precisa mesmo?".' },
  ],
  desafios: [
    {
      pergunta: 'Só subagents, com rubrica. Qual defeito escapa?',
      opcoes: ['O teste de aceite alterado', 'A regra inventada', 'A Factory sem necessidade', 'A mensagem fora do contrato'],
      correta: 2,
      explicacao: 'As rubricas do cético e do rastreador perguntam por teste e por spec. Nenhuma pergunta pela simplicidade. A carta Navalha continua com a pessoa.',
      montagem: { quem: 'subagents', leitura: 'camadas' },
    },
    {
      pergunta: 'Só a pessoa, lendo de cima para baixo. O que escapa?',
      opcoes: ['O package.json', 'Os dois defeitos de teste, que estão depois da linha 900', 'A Factory', 'Nada'],
      correta: 1,
      explicacao: 'O diff termina pelos testes. Depois de 600 linhas, a atenção cai e a pessoa aprova. A leitura em camadas começa pelos testes.',
      montagem: { quem: 'humano', leitura: 'topo' },
    },
    {
      pergunta: 'Pessoa + subagents, mas os subagents rodam na mesma sessão que escreveu o código. O que muda?',
      opcoes: ['Nada', 'O rastreador deixa passar a regra inventada e a dependência', 'O cético para de funcionar', 'A pessoa pega menos'],
      correta: 1,
      explicacao: 'A sessão do autor já "decidiu" que o limite mensal e o fuso fazem sentido. O revisor herda a suposição. Os defeitos que a pessoa pega continuam pegos.',
      montagem: { quem: 'ambos', leitura: 'camadas' },
      avarias: ['mesmo-contexto'],
    },
  ],
  simular,
};

export function simular(montagem, avarias = new Set()) {
  const humano = montagem.quem !== 'subagents';
  const maquina = montagem.quem !== 'humano';
  const topo = montagem.leitura === 'topo';
  const pressa = avarias.has('pressa');
  const semRubrica = avarias.has('sem-rubrica');
  const mesmoContexto = avarias.has('mesmo-contexto');

  const pegoHumano = new Set();
  const pegoMaquina = new Set();
  let genericos = 0;
  let tempo = 0;
  const passos = [];

  const placar = () => {
    const pegos = DEFEITOS.filter((d) => pegoHumano.has(d.id) || pegoMaquina.has(d.id)).length;
    return {
      pegos: `${pegos}/6`,
      'pegos:tom': pegos === 6 ? 'ok' : pegos >= 4 ? 'alerta' : 'falha',
      soHumano: DEFEITOS.filter((d) => pegoHumano.has(d.id) && !pegoMaquina.has(d.id)).length,
      soMaquina: DEFEITOS.filter((d) => pegoMaquina.has(d.id) && !pegoHumano.has(d.id)).length,
      escaparam: '—',
      genericos,
      'genericos:tom': genericos ? 'alerta' : '',
      tempo: `${tempo} min`,
    };
  };

  const desligadas = [];
  if (!humano) desligadas.push(...CAMADAS.map((c) => c.id));
  if (!maquina) desligadas.push('cetico', 'rastreador');
  if (humano && pressa) desligadas.push('testes');

  passos.push({
    estacao: 'diff',
    titulo: 'PR #42',
    narracao: 'Entra o PR #42: 23 arquivos, 1.180 linhas novas, CI verde. Seis defeitos estão escondidos nele. Nenhum quebra a esteira.',
    dentro: { titulo: 'arquivos, na ordem do diff', linhas: ['package.json', 'src/servicos/AgendamentoServiceFactory.js', 'src/rotas/agendamento.js', 'tests/agendamento.test.js', 'tests/aceite/t1.test.js'] },
    metricas: placar(),
    rastro: 'PR #42: 23 arquivos, +1.180 −40, CI verde',
  });

  if (humano) {
    if (topo) {
      // leitura linear: pega o que está antes da fadiga, na ordem do arquivo
      const ordem = [...DEFEITOS].sort((a, b) => a.linha - b.linha);
      const vistos = ordem.filter((d) => d.linha < FADIGA && !(pressa && d.camada === 'testes'));
      vistos.forEach((d) => pegoHumano.add(d.id));
      tempo += 15;
      passos.push({
        estacao: 'mapa',
        ativos: CAMADAS.map((c) => c.id),
        pacotes: ['contrato'],
        titulo: 'Lê de cima para baixo',
        marca: 'alerta',
        narracao: `A pessoa lê o diff na ordem em que o GitHub mostra. Até a linha ${FADIGA} pega ${vistos.length} defeitos. Depois disso, a atenção acaba: os testes, que estão no fim, passam batido.`,
        dentro: { titulo: 'leitura linear', linhas: [...vistos.map((d) => `✓ l.${d.linha} ${d.titulo}`), `— linha ${FADIGA}: "parece ok, LGTM"`], tom: 'alerta' },
        marcas: Object.fromEntries(CAMADAS.map((c) => [c.id, 'alerta'])),
        metricas: placar(),
        razao: [],
        rastro: `leitura de cima para baixo: ${vistos.length} defeitos antes da linha ${FADIGA}, depois fadiga`,
      });
    } else {
      for (const c of CAMADAS) {
        if (pressa && c.id === 'testes') {
          passos.push({
            estacao: 'testes',
            titulo: 'Pula os testes',
            marca: 'alerta',
            narracao: 'A CI está verde, então a pessoa não abre tests/. É exatamente onde estão os dois defeitos que fazem a CI ficar verde.',
            metricas: placar(),
            rastro: 'camada testes: pulada',
          });
          continue;
        }
        const achados = DEFEITOS.filter((d) => d.camada === c.id);
        achados.forEach((d) => pegoHumano.add(d.id));
        tempo += c.id === 'testes' ? 7 : 4;
        passos.push({
          estacao: c.id,
          titulo: `Camada ${c.rotulo}`,
          marca: achados.length ? 'falha' : 'ok',
          narracao: achados.length ? `${c.pergunta} ${achados.map((d) => `${d.titulo}: ${d.porque}`).join(' ')}` : `${c.pergunta} Nada aqui.`,
          dentro: achados.length ? { titulo: achados.map((d) => d.arquivo).join(' · '), linhas: achados.flatMap((d) => d.trecho.split('\n')), tom: 'falha' } : { titulo: c.rotulo, linhas: ['nada a apontar'], tom: 'ok' },
          metricas: placar(),
          rastro: `camada ${c.rotulo}: ${achados.length ? achados.map((d) => d.titulo).join(', ') : 'nada'}`,
        });
      }
    }
  }

  if (maquina) {
    tempo += 3;
    if (semRubrica) {
      genericos = 4;
      passos.push({
        estacao: 'cetico',
        ativos: ['cetico', 'rastreador'],
        pacotes: ['cetico', 'rastreador'],
        trilhos: [['diff', 'cetico'], ['cetico', 'rastreador']],
        titulo: 'Subagents sem rubrica',
        marca: 'alerta',
        narracao: 'Os dois subagents receberam só "revise este PR". Voltam com conselhos que servem para qualquer código e aprovam. Os jurados escrevendo bobagens na lousa.',
        dentro: { titulo: 'revisão', linhas: ['"Considere adicionar tratamento de erros."', '"Bom uso de async/await."', '"Talvez adicionar mais testes."', '"Código bem organizado."', 'VEREDITO: APROVAR'], tom: 'alerta' },
        marcas: { cetico: 'alerta', rastreador: 'alerta' },
        metricas: placar(),
        razao: [{ tipo: 'generico', texto: '4 comentários genéricos, nenhum com arquivo e linha.' }],
        rastro: 'subagents sem rubrica: 4 comentários genéricos, aprovado',
      });
    } else {
      const doCetico = DEFEITOS.filter((d) => d.maquina === 'cetico');
      const doRastreador = DEFEITOS.filter((d) => d.maquina === 'rastreador' && !(mesmoContexto && d.escondidoPorContexto));
      [...doCetico, ...doRastreador].forEach((d) => pegoMaquina.add(d.id));
      passos.push({
        estacao: 'cetico',
        ativos: ['cetico', 'rastreador'],
        pacotes: ['cetico', 'rastreador'],
        trilhos: [['diff', 'cetico'], ['cetico', 'rastreador']],
        titulo: 'Subagents revisam',
        marca: 'falha',
        narracao: `Os dois subagents rodam em paralelo${mesmoContexto ? ', mas dentro da sessão que escreveu o código' : ', cada um na sua janela, sem saber como o código foi escrito'}. O cético acha ${doCetico.length}, o rastreador acha ${doRastreador.length}.${mesmoContexto ? ' O rastreador herdou a ideia de que o limite e o fuso "fazem sentido".' : ''}`,
        dentro: { titulo: 'tabelas dos revisores', linhas: [...doCetico, ...doRastreador].map((d) => `| ${d.titulo} | ${d.arquivo} | bloqueia |`), tom: 'falha' },
        marcas: { cetico: 'falha', rastreador: doRastreador.length ? 'falha' : 'alerta' },
        metricas: placar(),
        rastro: `subagents: cético ${doCetico.length}, rastreador ${doRastreador.length}${mesmoContexto ? ' (mesmo contexto do autor)' : ''}`,
      });
    }
  }

  // veredito e livro-razão comparativo
  const razao = DEFEITOS.map((d) => {
    const h = pegoHumano.has(d.id);
    const m = pegoMaquina.has(d.id);
    const tipo = h && m ? 'ambos' : h ? 'humano' : m ? 'maquina' : 'escapou';
    return { tipo, texto: `${d.titulo} (${d.arquivo})` };
  });
  const escaparam = razao.filter((r) => r.tipo === 'escapou').length;
  const fim = { ...placar(), escaparam, 'escaparam:tom': escaparam ? 'falha' : 'ok' };
  const bloqueia = escaparam < 6;
  passos.push({
    estacao: 'veredito',
    pacotes: ['veredito'],
    trilhos: [
      ...(humano ? [['navalha', 'veredito']] : []),
      ...(maquina ? [['rastreador', 'veredito']] : []),
    ],
    titulo: 'Veredito',
    marca: escaparam ? 'falha' : 'ok',
    narracao: escaparam
      ? `Veredito com ${6 - escaparam} de 6 defeitos na mesa. ${escaparam} ${escaparam === 1 ? 'passa' : 'passam'} para a main: ${razao.filter((r) => r.tipo === 'escapou').map((r) => r.texto.split(' (')[0]).join(', ')}.`
      : 'Os seis defeitos estão na mesa, cada um com arquivo, linha e evidência. Veredito: bloquear, com a lista do que corrigir.',
    dentro: { titulo: 'veredito', linhas: [bloqueia ? 'BLOQUEAR' : 'APROVAR', ...razao.map((r) => `${r.tipo === 'escapou' ? '✗' : '✓'} ${r.texto}`)], tom: escaparam ? 'falha' : 'ok' },
    metricas: fim,
    razao,
    rastro: `veredito: ${6 - escaparam}/6 pegos, ${escaparam} escaparam`,
  });

  return {
    entrada: { titulo: 'PR #42 · feat(T1): agendar mentoria', linhas: ['23 arquivos · +1.180 −40 · CI verde', `revisão: ${motion.montagem[0].opcoes.find((o) => o.valor === montagem.quem).rotulo}${humano ? `, ${topo ? 'de cima para baixo' : 'em camadas'}` : ''}`] },
    desligadas,
    passos,
    saida: {
      titulo: escaparam ? `${escaparam} ${escaparam === 1 ? 'defeito escapou' : 'defeitos escaparam'}` : 'Seis de seis, com evidência',
      status: escaparam ? 'falha' : 'ok',
      linhas: [
        `Só a pessoa pegou: ${razao.filter((r) => r.tipo === 'humano').map((r) => r.texto.split(' (')[0]).join(', ') || 'nenhum'}`,
        `Só a máquina pegou: ${razao.filter((r) => r.tipo === 'maquina').map((r) => r.texto.split(' (')[0]).join(', ') || 'nenhum'}`,
        `Escaparam: ${razao.filter((r) => r.tipo === 'escapou').map((r) => r.texto.split(' (')[0]).join(', ') || 'nenhum'}`,
        `Tempo: ${tempo} min${genericos ? ` · ${genericos} comentários genéricos` : ''}`,
      ],
    },
    numeros: { escaparam, pegoHumano: [...pegoHumano], pegoMaquina: [...pegoMaquina], genericos },
  };
}
