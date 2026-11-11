export const semanas = [
  { n: 1, modulo: 'M1', titulo: 'Fundamentos: o que é isso que a gente chama de IA', ideia: 'O modelo prevê o próximo pedaço de texto (token). Janela de contexto, temperatura, alucinação. Agente = LLM + harness.', revisao: 'media' },
  { n: 2, modulo: 'M1', titulo: 'Prompt e Context Engineering', ideia: 'Pedido vago gera resposta média. Exemplos e formato de saída. Smart zone e dumb zone (a qualidade cai quando a janela enche). CLAUDE.md como memória.', revisao: 'alta' },
  { n: 3, modulo: 'M1', titulo: 'AGENTS.md e Skills', ideia: 'Regras curtas que dá para conferir. Skill carregada só quando a tarefa pede (progressive disclosure).', revisao: 'alta' },
  { n: 4, modulo: 'M1', titulo: 'Tools, MCPs e Segurança (OWASP para LLM)', ideia: 'Skill ensina como fazer, MCP conecta a IA a outra ferramenta. Prompt injection (texto escondido que muda o pedido) e pacote malicioso nas dependências (supply chain).', revisao: 'media' },
  { n: 5, modulo: 'M2', titulo: 'Clean code e DDD na era da IA', ideia: 'Sinais de código ruim gerado por IA. Camada que ninguém pediu (abstraction bloat). Fronteiras do domínio (bounded contexts).', revisao: 'media' },
  { n: 6, modulo: 'M2', titulo: 'O fluxo de desenvolvimento com IA', ideia: 'Pesquisa, plano e implementação em sessões separadas (RPI). ADR para registrar decisão. Critérios EARS e cenários BDD.', revisao: 'media' },
  { n: 7, modulo: 'M2', titulo: 'RPI e Spec-Driven Development na prática', ideia: 'Tasks pequenas que dá para conferir uma a uma. Pronto é quando o gate passa.', revisao: 'alta' },
  { n: 8, modulo: 'M2', titulo: 'Testes e quality gates: os sensores do harness', ideia: 'Cenário BDD vira teste. TDD com o agente. Lint, tipos, build, testes e dependências como gates.', revisao: 'alta' },
  { n: 9, modulo: 'M3', titulo: 'Code Review na era da IA', ideia: 'Diff grande lido em camadas. Sinais de alerta. Subagents que revisam o PR.', revisao: 'alta' },
  { n: 10, modulo: 'M3', titulo: 'Subagents, paralelização e worktrees + Harness (revisão)', ideia: 'Cada subagent com a própria janela de contexto. Quem faz o quê entre vários agentes (orquestração). Uma worktree por agente. Semana de revisão.', revisao: 'agora' },
  { n: 11, modulo: 'M3', titulo: 'Construindo software com LLM dentro', ideia: 'Chamar o modelo pela API com streaming, system prompt, saída em JSON (structured output) e tool calling. RAG, evals e loop engineering.', revisao: 'futura' },
  { n: 12, modulo: 'M3', titulo: 'Construindo agentes (n8n / Google ADK) + Projeto Final', ideia: 'Agente com tools em n8n e em framework versionado. Escopo do Projeto Final.', revisao: 'futura' },
  { n: 13, modulo: 'M4', titulo: 'RAG e qualidade avançada', ideia: 'Quebrar o documento em pedaços (chunking), embeddings e busca do trecho certo (retrieval). Lixo entra, lixo sai.', revisao: 'futura' },
  { n: 14, modulo: 'M4', titulo: 'Buffer, finalização e Demo Day', ideia: 'Gates finais e apresentação para público técnico e não técnico.', revisao: 'futura' },
];

export const aulas = [
  {
    id: 'aula-1',
    titulo: 'Aula 1 · Para onde ir',
    pergunta: 'Para onde você quer ir e como vai saber que chegou?',
    entregavel: 'Carta de Destino',
    licoes: ['interrogatorio', 'coelho-branco', 'beba-me'],
  },
  {
    id: 'aula-2',
    titulo: 'Aula 2 · Rápido e sob controle',
    pergunta: 'Como chegar lá rápido sem perder o controle?',
    entregavel: 'PR integrado com CI verde + regra nova no AGENTS.md',
    licoes: ['cha-do-chapeleiro', 'baralho-da-rainha', 'cortem-lhe-a-cabeca', 'julgamento'],
  },
];

export const licoes = [
  {
    id: 'interrogatorio',
    numero: 1,
    titulo: 'Interrogatório do diff',
    subtitulo: 'Pedido, assumido ou inventado?',
    lema: 'Toda linha de código precisa de um endereço na spec. Linha sem endereço é suposição da IA.',
    cena: 'gato',
    tempo: 25,
    semanas: [5, 6, 9],
    objetivos: [
      'Rastrear cada linha de um diff até o pedido ou a spec.',
      'Classificar trechos como pedido, assumido ou inventado.',
      'Dar a contraprova: a entrada exata que mostra o erro e a resposta esperada.',
      'Reconhecer o erro mais comum da IA: preencher o que você não disse com algo que parece razoável.',
    ],
    labs: ['interrogatorio', 'motion-agente', 'triagem-pr', 'cadeia-rpi'],
  },
  {
    id: 'coelho-branco',
    numero: 2,
    titulo: 'Requisitos com número',
    subtitulo: 'Requisitos funcionais e não funcionais para IA',
    lema: 'Requisito sem número é desejo. Requisito sem sensor é promessa.',
    cena: 'coelho',
    tempo: 30,
    semanas: [6, 7, 8],
    objetivos: [
      'Diferenciar requisito funcional de não funcional.',
      'Ler tempo de resposta como distribuição: p50, p95, p99.',
      'Explicar por que a latência de cauda cresce quando um pedido chama vários serviços (fan-out).',
      'Escrever um requisito não funcional (NFR) em EARS, com número e com o sensor que mede.',
      'Reconhecer os cinco padrões EARS e transformar um cenário BDD em teste.',
    ],
    labs: ['percentis', 'motion-requisito', 'construtor-nfr', 'ears-validador', 'bdd-para-teste'],
  },
  {
    id: 'beba-me',
    numero: 3,
    titulo: 'Agente = LLM + Harness',
    subtitulo: 'Guias, sensores e o tamanho certo do contexto',
    lema: 'Guia antes, sensor depois. O modelo sozinho não confere nada.',
    cena: 'frasco',
    tempo: 50,
    semanas: [1, 2, 3, 8, 10],
    objetivos: [
      'Apontar, num agente que você usa, o que é LLM e o que é harness.',
      'Separar guia (entra antes: AGENTS.md, skill, spec) de sensor (confere depois: lint, teste, review).',
      'Explicar o problema que o subagent resolve: a janela do agente principal enchendo de busca e de log.',
      'Dizer não, com argumento, a um padrão avançado que a tarefa não pede.',
    ],
    labs: ['temperatura', 'ciclo-harness', 'guias-sensores', 'faxina-contexto', 'contexto', 'motion-subagent', 'disparo-skill', 'precisa-mesmo', 'carta-destino'],
  },
  {
    id: 'cha-do-chapeleiro',
    numero: 4,
    titulo: 'Worktrees em paralelo',
    subtitulo: 'Uma pasta limpa para cada agente',
    lema: 'Três agentes na mesma pasta apagam o trabalho um do outro.',
    cena: 'xicara',
    tempo: 20,
    semanas: [10],
    objetivos: [
      'Explicar por que agentes em paralelo na mesma pasta apagam o trabalho um do outro.',
      'Criar, listar e remover worktrees, com git e com claude -w.',
      'Integrar branches paralelas e resolver o conflito final.',
    ],
    labs: ['worktrees', 'eixos-isolamento', 'motion-worktrees'],
  },
  {
    id: 'baralho-da-rainha',
    numero: 5,
    titulo: 'Padrões de orquestração',
    subtitulo: 'Sequencial, paralelo, supervisor (ou nenhum)',
    lema: 'Mais agentes só atrapalham, a menos que as tarefas sejam independentes.',
    cena: 'cartas',
    tempo: 20,
    semanas: [10],
    objetivos: [
      'Aplicar os padrões sequencial, paralelo e supervisor.',
      'Estimar o custo de coordenação (tokens e conversa entre agentes) antes de abrir mais um.',
      'Decidir quando um agente único é melhor.',
    ],
    labs: ['padroes-mapa', 'custo-coordenacao', 'orquestracao', 'motion-subagent', 'log-paralelo'],
  },
  {
    id: 'cortem-lhe-a-cabeca',
    numero: 6,
    titulo: 'Gates de CI',
    subtitulo: 'Os cinco sensores como gates de CI',
    lema: 'Um gate que não bloqueia é decoração.',
    cena: 'coroa',
    tempo: 25,
    semanas: [7, 8],
    objetivos: [
      'Configurar lint, type check, build, testes e dependency check como gates.',
      'Dizer qual defeito cada sensor pega e qual escapa de todos.',
      'Configurar a CI com ajuda da IA lendo cada linha do YAML antes de aceitar.',
      'Provar que um teste prova algo: quebrar o código de propósito e ver o teste cair.',
      'Provar que o gate bloqueia: check obrigatório na main e ordem de commits no histórico.',
    ],
    labs: ['esteira', 'motion-ci', 'teste-nao-prova', 'protecao-main', 'vermelho-verde'],
  },
  {
    id: 'julgamento',
    numero: 7,
    titulo: 'Revisão em camadas',
    subtitulo: 'Diff grande, teste maquiado e revisores especializados',
    lema: 'Evidência antes do veredito. Revisor de verdade pede o teste.',
    cena: 'balanca',
    tempo: 40,
    semanas: [8, 9, 10],
    objetivos: [
      'Ler criticamente um diff grande gerado por agente, em camadas.',
      'Detectar teste alterado para passar e teste que só testa mock.',
      'Configurar subagents de review, cada um olhando uma coisa só.',
      'Transformar o erro repetido da IA em regra (guia) e checagem (sensor).',
      'Separar o que bloqueia o PR do que é só observação (nit).',
    ],
    labs: ['diff-camadas', 'motion-review', 'triagem-achados', 'fabrica-revisores', 'carta-rainha'],
  },
];

export const cartas = [
  {
    id: 'rastro',
    naipe: '01',
    nome: 'Rastro',
    pergunta: 'Aponte uma linha deste diff. Onde, no pedido ou na spec, está escrito isso?',
    mede: 'Rastreabilidade',
    ruim: '"Acho que faz sentido ter isso."',
    boa: '"Linha 14, if (agendamentosNoMes >= 3). Não está na spec. A IA inventou um limite de 3 por mês."',
  },
  {
    id: 'contraprova',
    naipe: '02',
    nome: 'Contraprova',
    pergunta: 'Que entrada você usaria para provar que este trecho está errado? O que espera ver?',
    mede: 'Falsificação (achar a entrada que derruba o código)',
    ruim: '"Testaria com vários casos."',
    boa: '"POST /agendamentos com vagaId 999. Espero 404 {"erro":"Vaga não encontrada"}. O código devolve 500."',
  },
  {
    id: 'par',
    naipe: '03',
    nome: 'Par',
    pergunta: 'Me dê um caso que deve funcionar e um que deve falhar, com a resposta exata de cada um.',
    mede: 'Critério de aceite',
    ruim: '"Funciona se agendar, falha se der erro."',
    boa: '"Vaga 1 livre → 201 com status confirmado. Vaga 1 de novo → 409 {"erro":"Vaga indisponível"}."',
  },
  {
    id: 'contrato',
    naipe: '04',
    nome: 'Contrato',
    pergunta: 'Quando você diz "tratar o erro", qual erro, qual status e qual mensagem?',
    mede: 'Contrato de erro',
    ruim: '"Tratar os erros."',
    boa: '"jovemEmail ausente → 400 {"erro":"jovemEmail é obrigatório"}."',
  },
  {
    id: 'navalha',
    naipe: '05',
    nome: 'Navalha',
    pergunta: 'Qual é o código mais simples que passa nos mesmos testes?',
    mede: 'Simplicidade (contra camada que ninguém pediu)',
    ruim: '"Está limpo, tem até interface e factory."',
    boa: '"A AgendamentoServiceFactory some. Uma função de 15 linhas passa nos mesmos 8 testes."',
  },
  {
    id: 'carta-rainha',
    naipe: '06',
    nome: 'Erro vira regra',
    pergunta: 'Que tipo de erro a IA repetiu hoje? Que regra você colocaria no AGENTS.md ou no agente de review para pegá-lo?',
    mede: 'Erro repetido virando regra',
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
