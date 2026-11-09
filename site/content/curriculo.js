export const semanas = [
  { n: 1, modulo: 'M1', titulo: 'Fundamentos: o que é isso que a gente chama de IA', lugar: 'A margem do rio', ideia: 'Previsão de token, janela de contexto, temperatura, alucinação. Agente = LLM + Harness.', revisao: 'media' },
  { n: 2, modulo: 'M1', titulo: 'Prompt e Context Engineering', lugar: 'A toca do coelho', ideia: 'Especificidade, exemplos, formato de saída. Smart zone e dumb zone. CLAUDE.md como memória.', revisao: 'alta' },
  { n: 3, modulo: 'M1', titulo: 'AGENTS.md e Skills', lugar: 'O frasco "BEBA-ME"', ideia: 'Regras curtas e verificáveis. Skills carregadas só quando a tarefa pede (progressive disclosure).', revisao: 'alta' },
  { n: 4, modulo: 'M1', titulo: 'Tools, MCPs e Segurança (OWASP para LLM)', lugar: 'A chave dourada', ideia: 'Skill é conhecimento, MCP é capacidade. Prompt injection e supply chain.', revisao: 'media' },
  { n: 5, modulo: 'M2', titulo: 'Clean code e DDD na era da IA', lugar: 'A casa do Coelho', ideia: 'Sinais de código ruim gerado por IA. Abstraction bloat. Bounded contexts.', revisao: 'media' },
  { n: 6, modulo: 'M2', titulo: 'O fluxo de desenvolvimento com IA', lugar: 'O conselho da Lagarta', ideia: 'RPI em sessões separadas. ADR. Critérios EARS e cenários BDD.', revisao: 'media' },
  { n: 7, modulo: 'M2', titulo: 'RPI e Spec-Driven Development na prática', lugar: 'O sorriso do Gato', ideia: 'Tasks atômicas e verificáveis. Gates objetivos de "pronto".', revisao: 'alta' },
  { n: 8, modulo: 'M2', titulo: 'Testes e quality gates: os sensores do harness', lugar: 'O jardim da Rainha', ideia: 'BDD vira teste. TDD com o agente. Lint, tipos, build, testes e dependências como gates.', revisao: 'alta' },
  { n: 9, modulo: 'M3', titulo: 'Code Review na era da IA', lugar: 'O tribunal', ideia: 'Leitura em camadas de diff grande. Sinais de alerta. Subagents de review.', revisao: 'alta' },
  { n: 10, modulo: 'M3', titulo: 'Subagents, paralelização e worktrees + Harness (revisão)', lugar: 'O Chá Maluco', ideia: 'Isolamento de contexto, orquestração, worktrees. Semana de revisão: para onde você quer ir?', revisao: 'agora' },
  { n: 11, modulo: 'M3', titulo: 'Construindo software com LLM dentro', lugar: 'Através do espelho', ideia: 'API com streaming, system prompt, structured output, tool calling. RAG, evals e loop engineering.', revisao: 'futura' },
  { n: 12, modulo: 'M3', titulo: 'Construindo agentes (n8n / Google ADK) + Projeto Final', lugar: 'O tabuleiro de xadrez', ideia: 'Agente com tools em n8n e em framework versionado. Escopo do Projeto Final.', revisao: 'futura' },
  { n: 13, modulo: 'M4', titulo: 'RAG e qualidade avançada', lugar: 'A floresta sem nomes', ideia: 'Chunking, embeddings, retrieval. Lixo entra, lixo sai.', revisao: 'futura' },
  { n: 14, modulo: 'M4', titulo: 'Buffer, finalização e Demo Day', lugar: 'O despertar', ideia: 'Gates finais e apresentação para público técnico e não técnico.', revisao: 'futura' },
];

export const aulas = [
  {
    id: 'aula-1',
    titulo: 'Aula 1 · O Gato e o Coelho',
    pergunta: 'Para onde você quer ir e como vai saber que chegou?',
    entregavel: 'Carta de Destino',
    licoes: ['interrogatorio', 'coelho-branco', 'beba-me'],
  },
  {
    id: 'aula-2',
    titulo: 'Aula 2 · O Chá e o Tribunal',
    pergunta: 'Como chegar lá rápido sem perder o controle?',
    entregavel: 'PR integrado com CI verde + Carta à Rainha',
    licoes: ['cha-do-chapeleiro', 'baralho-da-rainha', 'cortem-lhe-a-cabeca', 'julgamento'],
  },
];

export const licoes = [
  {
    id: 'interrogatorio',
    numero: 1,
    titulo: 'O Interrogatório do Gato',
    subtitulo: 'Pedido, assumido ou inventado?',
    lema: 'Toda linha de código precisa de um endereço na spec. Linha sem endereço é suposição da IA.',
    cena: 'gato',
    tempo: 25,
    semanas: [5, 6, 9],
    objetivos: [
      'Rastrear cada linha de um diff até o pedido ou a spec.',
      'Classificar trechos como pedido, assumido ou inventado.',
      'Dar a contraprova: a entrada exata que mostra o erro e a resposta esperada.',
      'Nomear o padrão de erro da IA: preencher lacunas com suposições plausíveis.',
    ],
    labs: ['interrogatorio', 'motion-agente'],
  },
  {
    id: 'coelho-branco',
    numero: 2,
    titulo: 'O Coelho Branco está atrasado',
    subtitulo: 'Requisitos funcionais e não funcionais para IA',
    lema: 'Requisito sem número é desejo. Requisito sem sensor é promessa.',
    cena: 'coelho',
    tempo: 30,
    semanas: [6, 7, 8],
    objetivos: [
      'Diferenciar requisito funcional de não funcional.',
      'Ler tempo de resposta como distribuição: p50, p95, p99.',
      'Explicar por que a latência de cauda cresce quando um pedido chama vários serviços (fan-out).',
      'Escrever um NFR em EARS com número e sensor.',
    ],
    labs: ['percentis', 'construtor-nfr'],
  },
  {
    id: 'beba-me',
    numero: 3,
    titulo: 'Beba-me: Agente = LLM + Harness',
    subtitulo: 'Guias, sensores e o tamanho certo do contexto',
    lema: 'Alice leu o rótulo antes de beber. Guia antes, sensor depois.',
    cena: 'frasco',
    tempo: 35,
    semanas: [1, 2, 3, 8, 10],
    objetivos: [
      'Consolidar Agente = LLM + Harness.',
      'Diferenciar feedforward (guias) de feedback (sensores).',
      'Explicar o problema de isolamento de contexto que subagents resolvem.',
      'Recusar, com argumento, padrões avançados sem necessidade real.',
    ],
    labs: ['guias-sensores', 'contexto', 'precisa-mesmo', 'carta-destino'],
  },
  {
    id: 'cha-do-chapeleiro',
    numero: 4,
    titulo: 'O Chá Maluco',
    subtitulo: 'Git worktrees: uma xícara limpa para cada agente',
    lema: 'Três agentes na mesma pasta é um chá sem xícaras limpas.',
    cena: 'xicara',
    tempo: 20,
    semanas: [10],
    objetivos: [
      'Explicar por que agentes em paralelo na mesma pasta se atropelam.',
      'Criar, listar e remover worktrees, com git e com claude -w.',
      'Integrar branches paralelas e resolver o conflito final.',
    ],
    labs: ['worktrees'],
  },
  {
    id: 'baralho-da-rainha',
    numero: 5,
    titulo: 'O Baralho da Rainha',
    subtitulo: 'Sequencial, paralelo, supervisor (ou nenhum)',
    lema: 'Mais cartas na mesa só embaralham o jogo, a menos que as tarefas sejam independentes.',
    cena: 'cartas',
    tempo: 20,
    semanas: [10],
    objetivos: [
      'Aplicar os padrões sequencial, paralelo e supervisor.',
      'Estimar o custo de coordenação de vários agentes.',
      'Decidir quando um agente único é melhor.',
    ],
    labs: ['orquestracao'],
  },
  {
    id: 'cortem-lhe-a-cabeca',
    numero: 6,
    titulo: 'Cortem-lhe a cabeça!',
    subtitulo: 'Os cinco sensores como gates de CI',
    lema: 'Um gate que não bloqueia é decoração.',
    cena: 'coroa',
    tempo: 25,
    semanas: [7, 8],
    objetivos: [
      'Configurar lint, type check, build, testes e dependency check como gates.',
      'Saber qual defeito cada sensor pega e o que escapa de todos.',
      'Configurar CI com ajuda da IA sem aceitar YAML às cegas.',
    ],
    labs: ['esteira'],
  },
  {
    id: 'julgamento',
    numero: 7,
    titulo: 'O Julgamento do Valete',
    subtitulo: 'Diff grande, rosas pintadas e revisores especializados',
    lema: '"Sentença primeiro, veredito depois!" é o que a Rainha diz. Revisor de verdade pede a evidência.',
    cena: 'balanca',
    tempo: 40,
    semanas: [8, 9, 10],
    objetivos: [
      'Ler criticamente um diff grande gerado por agente, em camadas.',
      'Detectar teste alterado para passar e teste que só testa mock.',
      'Configurar subagents de review especializados.',
      'Transformar o erro repetido da IA em regra (guia) e checagem (sensor).',
    ],
    labs: ['diff-camadas', 'fabrica-revisores', 'carta-rainha'],
  },
];

export const cartas = [
  {
    id: 'rastro',
    naipe: '♠',
    nome: 'Rastro',
    pergunta: 'Aponte uma linha deste diff. Onde, no pedido ou na spec, está escrito isso?',
    mede: 'Rastreabilidade',
    ruim: '"Acho que faz sentido ter isso."',
    boa: '"Linha 14, if (agendamentosNoMes >= 3). Não está na spec. A IA inventou um limite de 3 por mês."',
  },
  {
    id: 'contraprova',
    naipe: '♣',
    nome: 'Contraprova',
    pergunta: 'Que entrada você usaria para provar que este trecho está errado? O que espera ver?',
    mede: 'Falsificação',
    ruim: '"Testaria com vários casos."',
    boa: '"POST /agendamentos com vagaId 999. Espero 404 {"erro":"Vaga não encontrada"}. O código devolve 500."',
  },
  {
    id: 'par',
    naipe: '♥',
    nome: 'Par',
    pergunta: 'Me dê um caso que deve funcionar e um que deve falhar, com a resposta exata de cada um.',
    mede: 'Critério de aceite',
    ruim: '"Funciona se agendar, falha se der erro."',
    boa: '"Vaga 1 livre → 201 com status confirmado. Vaga 1 de novo → 409 {"erro":"Vaga indisponível"}."',
  },
  {
    id: 'contrato',
    naipe: '♦',
    nome: 'Contrato',
    pergunta: 'Quando você diz "tratar o erro", qual erro, qual status e qual mensagem?',
    mede: 'Contrato de erro',
    ruim: '"Tratar os erros."',
    boa: '"jovemEmail ausente → 400 {"erro":"jovemEmail é obrigatório"}."',
  },
  {
    id: 'navalha',
    naipe: '🎩',
    nome: 'Navalha',
    pergunta: 'Qual é o código mais simples que passa nos mesmos testes?',
    mede: 'Simplicidade (contra abstraction bloat)',
    ruim: '"Está limpo, tem até interface e factory."',
    boa: '"A AgendamentoServiceFactory some. Uma função de 15 linhas passa nos mesmos 8 testes."',
  },
  {
    id: 'carta-rainha',
    naipe: '🫖',
    nome: 'Carta à Rainha',
    pergunta: 'Que tipo de erro a IA repetiu hoje? Que regra você colocaria no AGENTS.md ou no agente de review para pegá-lo?',
    mede: 'Fechar o loop do harness',
    ruim: '"A IA errou umas coisas."',
    boa: '"Inventou regra de negócio duas vezes. AGENTS.md: não crie regra que não esteja em docs/spec.md; se faltar, pergunte. Reviewer: liste cada if de regra e a linha da spec."',
  },
];

export function licaoPorId(id) {
  return licoes.find((l) => l.id === id) || null;
}

export function vizinhas(id) {
  const i = licoes.findIndex((l) => l.id === id);
  return { anterior: i > 0 ? licoes[i - 1] : null, proxima: i >= 0 && i < licoes.length - 1 ? licoes[i + 1] : null };
}

export function aulaDaLicao(id) {
  return aulas.find((a) => a.licoes.includes(id)) || null;
}
