export const ITENS = [
  {
    id: 'agents-md',
    nome: 'AGENTS.md / CLAUDE.md',
    desc: 'Convenções, comandos e regras do projeto, carregados em toda sessão.',
    resposta: 'guia',
    explicacao: 'Guia: chega ao agente antes de ele gerar qualquer linha. Não mede nada depois.',
  },
  {
    id: 'skill',
    nome: 'Skill de "como criar endpoint"',
    desc: 'Passo a passo carregado sob demanda quando a tarefa pede.',
    resposta: 'guia',
    explicacao: 'Guia: ensina o caminho. Se o agente ignorar, a skill não percebe.',
  },
  {
    id: 'spec',
    nome: 'docs/spec.md com critérios EARS',
    desc: 'O que o sistema deve fazer, com status e mensagens exatas.',
    resposta: 'guia',
    explicacao: 'Guia: define o destino. Vira sensor só quando alguém transforma os critérios em teste.',
  },
  {
    id: 'exemplo',
    nome: 'Endpoint GET /mentores como exemplo',
    desc: 'Código existente que o agente deve imitar.',
    resposta: 'guia',
    explicacao: 'Guia: exemplo é contexto. Mostra o padrão antes da geração.',
  },
  {
    id: 'lint',
    nome: 'ESLint',
    desc: 'Aponta erro de estilo, variável não usada, complexidade.',
    resposta: 'sensor',
    explicacao: 'Sensor: roda sobre o código já gerado e devolve um sinal objetivo.',
  },
  {
    id: 'types',
    nome: 'Type check (tsc --noEmit)',
    desc: 'Confere tipos sem gerar build.',
    resposta: 'sensor',
    explicacao: 'Sensor: mede o código depois de escrito. Determinístico e barato.',
  },
  {
    id: 'build',
    nome: 'Build / smoke test',
    desc: 'Sobe a aplicação e chama GET /health.',
    resposta: 'sensor',
    explicacao: 'Sensor: prova que o código sobe. Não prova que faz o certo.',
  },
  {
    id: 'audit',
    nome: 'npm audit',
    desc: 'Procura vulnerabilidades conhecidas nas dependências.',
    resposta: 'sensor',
    explicacao: 'Sensor: pega a dependência que a IA adicionou sem motivo, se ela tiver falha conhecida.',
  },
  {
    id: 'ci',
    nome: 'CI que bloqueia o merge',
    desc: 'Roda os sensores em todo PR e impede merge vermelho.',
    resposta: 'sensor',
    explicacao: 'Sensor (o tribunal): junta os sensores e dá o veredito. "Cortem-lhe a cabeça!"',
  },
  {
    id: 'review-agent',
    nome: 'Subagent de review',
    desc: 'Agente com rubrica que lê o diff e aponta problemas.',
    resposta: 'sensor',
    explicacao: 'Sensor inferencial: avalia o que já foi gerado. Menos determinístico que um teste, mas pega o que lint não vê.',
  },
  {
    id: 'hook',
    nome: 'Hook PreToolUse que bloqueia edição de teste',
    desc: 'Script que roda antes de cada Edit/Write e sai com código 2 se o arquivo for de teste.',
    resposta: 'sensor',
    explicacao: 'Sensor que bloqueia: observa a ação do agente e barra antes do estrago. É feedback em tempo real, não instrução.',
  },
  {
    id: 'teste-antes',
    nome: 'Teste escrito antes da implementação (TDD)',
    desc: 'O teste vermelho existe antes do código.',
    resposta: 'ambos',
    explicacao: 'Os dois: antes, guia (diz ao agente o que precisa passar); depois, sensor (mede se passou). Por isso TDD é tão forte com IA.',
  },
  {
    id: 'adr',
    nome: 'ADR-001: fonte de dados em memória',
    desc: 'Registro de uma decisão de arquitetura e do motivo.',
    resposta: 'guia',
    explicacao: 'Guia: evita que o agente "decida" de novo uma coisa que a equipe já decidiu.',
  },
  {
    id: 'pr-humano',
    nome: 'Revisão humana com o Baralho do Gato',
    desc: 'Você lendo o diff e perguntando "onde está escrito isso?".',
    resposta: 'sensor',
    explicacao: 'Sensor humano: o mais caro e o único que entende intenção. Use onde os outros sensores não alcançam.',
  },
];

export const ROTULOS = { guia: 'Guia (feedforward)', sensor: 'Sensor (feedback)', ambos: 'Os dois' };

export function corrigir(id, escolha) {
  const item = ITENS.find((i) => i.id === id);
  if (!item) throw new Error(`item desconhecido: ${id}`);
  const certo = item.resposta === escolha;
  const parcial = item.resposta === 'ambos' && (escolha === 'guia' || escolha === 'sensor');
  return { certo, parcial, resposta: item.resposta, explicacao: item.explicacao };
}

export function placar(respostas = {}) {
  let certos = 0;
  let parciais = 0;
  let respondidos = 0;
  for (const item of ITENS) {
    const escolha = respostas[item.id];
    if (!escolha) continue;
    respondidos++;
    const r = corrigir(item.id, escolha);
    if (r.certo) certos++;
    else if (r.parcial) parciais++;
  }
  return { certos, parciais, respondidos, total: ITENS.length };
}
