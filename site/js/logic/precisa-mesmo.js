export const OPCOES = {
  unico: { nome: 'Agente único', dica: 'Uma sessão, um contexto, sem coordenação.' },
  subagent: { nome: 'Subagent', dica: 'Delega uma parte pesada para uma janela limpa e recebe só o resumo.' },
  paralelo: { nome: 'Paralelo com worktrees', dica: 'Várias sessões ao mesmo tempo, cada uma na sua pasta e branch.' },
  supervisor: { nome: 'Supervisor', dica: 'Um agente divide, distribui, confere e integra o trabalho de vários.' },
};

export const CENARIOS = [
  {
    id: 'typo',
    titulo: 'Corrigir um typo no README',
    contexto: 'Alguém sugeriu usar 3 subagents: um acha o erro, um corrige, um revisa.',
    recomendada: 'unico',
    aceitaveis: [],
    criterio: 'A tarefa leva um minuto. Coordenar três agentes custa mais tokens e mais tempo do que a tarefa inteira. Recusar aqui é julgamento, não preguiça.',
  },
  {
    id: 'crud',
    titulo: 'CRUD de uma tabela de mentores',
    contexto: 'Um tutorial sugere um swarm: agente de rotas, agente de testes, agente de docs e agente revisor, todos ao mesmo tempo.',
    recomendada: 'unico',
    aceitaveis: [],
    criterio: 'Tudo depende do mesmo modelo de dados. Em paralelo, cada agente adivinha o formato do outro e a integração vira conflito. Um agente com spec e testes resolve.',
  },
  {
    id: 'diff-grande',
    titulo: 'Revisar um diff de 2.000 linhas',
    contexto: 'O agente terminou uma feature grande. Sua sessão já está com 55% da janela ocupada.',
    recomendada: 'subagent',
    aceitaveis: [],
    criterio: 'Isolamento de contexto: um subagent de review lê o diff inteiro numa janela limpa, com rubrica própria, e devolve só os achados. Sua janela principal continua utilizável.',
  },
  {
    id: 'pesquisa',
    titulo: 'Descobrir onde o projeto valida e-mails',
    contexto: 'São 60 arquivos. Você só precisa da lista de lugares e do padrão usado.',
    recomendada: 'subagent',
    aceitaveis: ['unico'],
    criterio: 'Leitura volumosa, resposta curta: é o caso clássico de subagent. Num projeto pequeno, uma busca direta (grep) no agente único também resolve.',
  },
  {
    id: 'speedrun',
    titulo: 'Três tasks independentes com prazo de 40 minutos',
    contexto: 'T1 (agendar), T2 (cancelar) e T3 (listar vagas) mexem em arquivos diferentes e têm testes próprios.',
    recomendada: 'paralelo',
    aceitaveis: ['supervisor'],
    criterio: 'Paralelismo real: as tasks não dependem uma da outra. Uma worktree para cada evita que um agente sobrescreva o outro. O custo de coordenação aparece só na integração.',
  },
  {
    id: 'migracao',
    titulo: 'Migrar 30 arquivos de callback para async/await',
    contexto: 'Mesmo padrão em todos, arquivos independentes, suíte de testes cobrindo cada um.',
    recomendada: 'supervisor',
    aceitaveis: ['paralelo'],
    criterio: 'Muitas partes iguais e independentes, com um sensor objetivo (testes): um supervisor divide em lotes, distribui, confere os gates de cada lote e integra.',
  },
  {
    id: 'bug',
    titulo: 'Um teste de concorrência que falha às vezes',
    contexto: 'Ninguém entende ainda a causa. Alguém sugere mandar 4 agentes investigarem hipóteses diferentes.',
    recomendada: 'unico',
    aceitaveis: ['subagent'],
    criterio: 'Depuração precisa de raciocínio contínuo sobre a mesma evidência. Dividir antes de entender espalha o contexto. No máximo, delegue a leitura de logs longos para um subagent.',
  },
  {
    id: 'contrato',
    titulo: 'Mudar o contrato da API e o front que consome',
    contexto: 'O campo inicio vira inicioEm. O front precisa do novo formato.',
    recomendada: 'unico',
    aceitaveis: [],
    criterio: 'É sequencial: o front depende do contrato novo. Em paralelo, o agente do front trabalha em cima de um contrato que ainda não existe.',
  },
];

const PALAVRAS_CRITERIO = ['coorden', 'isol', 'contexto', 'janela', 'independ', 'depend', 'conflit', 'pequen', 'grande', 'custo', 'token', 'paralel', 'tempo', 'sequenc', 'resumo', 'simples', 'integr'];

export function avaliarJustificativa(texto = '') {
  const t = texto.trim().toLowerCase();
  if (t.length < 20) return 'curta';
  if (!PALAVRAS_CRITERIO.some((p) => t.includes(p))) return 'sem-criterio';
  return 'ok';
}

export function avaliarEscolha(cenarioId, escolha, justificativa = '') {
  const c = CENARIOS.find((x) => x.id === cenarioId);
  if (!c) throw new Error(`cenário desconhecido: ${cenarioId}`);
  let resultado = 'diferente';
  if (escolha === c.recomendada) resultado = 'recomendada';
  else if (c.aceitaveis.includes(escolha)) resultado = 'aceitavel';
  return { resultado, justificativa: avaliarJustificativa(justificativa), recomendada: c.recomendada, criterio: c.criterio };
}

export function resumo(respostas = {}) {
  let recomendadas = 0;
  let recusas = 0;
  let respondidas = 0;
  for (const c of CENARIOS) {
    const r = respostas[c.id];
    if (!r || !r.escolha) continue;
    respondidas++;
    if (avaliarEscolha(c.id, r.escolha).resultado !== 'diferente') recomendadas++;
    if (c.recomendada === 'unico' && r.escolha === 'unico') recusas++;
  }
  const totalRecusas = CENARIOS.filter((c) => c.recomendada === 'unico').length;
  return { recomendadas, respondidas, total: CENARIOS.length, recusas, totalRecusas };
}
