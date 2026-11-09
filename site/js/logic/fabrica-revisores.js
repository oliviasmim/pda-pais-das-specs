export const RUBRICA = [
  { id: 'rastro', icone: '♠', rotulo: 'Rastro até a spec', texto: 'Para cada regra de negócio, condição ou efeito colateral no diff, cite a linha de docs/spec.md que justifica. Sem linha na spec, é achado.' },
  { id: 'contraprova', icone: '♣', rotulo: 'Contraprova', texto: 'Para cada achado, dê a entrada exata que prova o problema e a resposta que a spec espera.' },
  { id: 'par', icone: '♥', rotulo: 'Par de casos', texto: 'Para cada linha da tabela da spec, confirme que existe teste do caso que deve funcionar e do caso que deve falhar, com a resposta exata.' },
  { id: 'contrato', icone: '♦', rotulo: 'Contrato de erro', texto: 'Confira status HTTP e corpo de cada erro contra a tabela da spec, caractere por caractere. Catch genérico que devolve 500 para erro de quem chamou é achado.' },
  { id: 'navalha', icone: '🎩', rotulo: 'Navalha', texto: 'Para cada classe, arquivo ou camada nova, diga qual teste quebraria sem ela. Se nenhum quebraria, proponha a versão mais simples.' },
  { id: 'dependencia', icone: '📦', rotulo: 'Dependência nova', texto: 'Liste dependências novas em package.json e o motivo escrito (ADR ou descrição do PR). Sem motivo, é achado.' },
  { id: 'rosas', icone: '🌹', rotulo: 'Rosas pintadas', texto: 'Se algum arquivo de tests/aceite/ estiver entre os alterados, é BLOQUEIO, mesmo com a CI verde: asserção de aceite só muda junto com a spec. Aponte o que foi removido ou enfraquecido.' },
  { id: 'tartaruga', icone: '🐢', rotulo: 'Falsa Tartaruga', texto: 'Sinalize testes que só conferem o que o mock devolveu. Para cada teste novo, responda: que bug este teste pegaria?' },
  { id: 'nfr', icone: '⏱', rotulo: 'Requisitos não funcionais', texto: 'Confira se cada requisito não funcional da spec (concorrência, desempenho) tem teste ou sensor. NFR sem sensor é achado.' },
];

export const ESPECIALIDADES = {
  'rastreador-de-spec': {
    titulo: 'Rastreador de spec',
    resumo: 'Cada linha precisa de um endereço na spec.',
    description: 'Revisa um diff comparando cada mudança com docs/spec.md. Use depois que um agente terminar uma task e antes de abrir o PR, para achar regra inventada, efeito colateral não pedido e caso da spec que ficou de fora.',
    missao: 'Sua única pergunta é: onde, na spec, está escrito isso? Você procura o que foi inventado (regras, efeitos colaterais, limites) e o que foi esquecido (linhas da spec sem código e sem teste).',
    rubrica: ['rastro', 'par', 'contraprova', 'nfr'],
  },
  'cetico-de-testes': {
    titulo: 'Cético de testes',
    resumo: 'Teste verde não é prova. Prova é teste que falharia com o bug.',
    description: 'Revisa os testes de um diff. Use antes de aceitar um PR que mexeu em tests/ ou quando a cobertura subiu rápido demais. Procura teste de aceite alterado, teste que só testa mock e caso de falha sem teste.',
    missao: 'Você desconfia de todo teste verde. Para cada teste novo ou alterado, pergunte que bug ele pegaria. Teste de aceite alterado é sempre bloqueio.',
    rubrica: ['rosas', 'tartaruga', 'par', 'contraprova'],
  },
  'guardiao-de-contrato': {
    titulo: 'Guardião de contrato',
    resumo: 'Qual erro, qual status, qual mensagem.',
    description: 'Confere status HTTP e mensagens de erro contra a tabela da spec. Use quando um diff tocar rotas, validação de entrada ou tratamento de erro.',
    missao: 'Você é a tabela de erros da spec em forma de revisor. Status, ordem das validações e texto da mensagem precisam bater exatamente.',
    rubrica: ['contrato', 'contraprova', 'par'],
  },
  'navalha-de-complexidade': {
    titulo: 'Navalha de complexidade',
    resumo: 'O código mais simples que passa nos mesmos testes.',
    description: 'Procura complexidade acidental: abstrações, dependências e camadas que os testes não exigem. Use em diffs com classes novas, arquivos novos fora de src/routes ou mudança no package.json.',
    missao: 'Você corta o que não paga o próprio custo. Cada abstração, dependência ou arquivo novo precisa de um teste que quebraria sem ele.',
    rubrica: ['navalha', 'dependencia'],
  },
};

export const FERRAMENTAS = [
  { id: 'Read', descricao: 'Ler arquivos.' },
  { id: 'Grep', descricao: 'Buscar texto no projeto.' },
  { id: 'Glob', descricao: 'Encontrar arquivos por padrão.' },
  { id: 'Bash', descricao: 'Rodar comandos (git diff, npm test). Também consegue escrever arquivos.' },
  { id: 'Edit', descricao: 'Editar arquivos.' },
  { id: 'Write', descricao: 'Criar ou sobrescrever arquivos.' },
];

export const MODELOS = ['inherit', 'sonnet', 'opus', 'haiku'];

export const FORMATOS = {
  tabela: {
    rotulo: 'Tabela de achados',
    texto: 'Responda com uma tabela: | Achado | Arquivo:linha | Linha da spec | Contraprova (entrada → esperado) | Severidade (bloqueia ou sugere) |. Termine com uma linha: VEREDITO: APROVAR ou VEREDITO: BLOQUEAR.',
  },
  veredito: {
    rotulo: 'Veredito primeiro',
    texto: 'Comece com VEREDITO: APROVAR ou VEREDITO: BLOQUEAR. Depois, no máximo 5 motivos, do mais grave para o menos grave, cada um com arquivo:linha e a evidência.',
  },
  lista: {
    rotulo: 'Lista curta',
    texto: 'Liste os achados do mais grave para o menos grave. Cada um com arquivo:linha, o problema em uma frase e a correção sugerida em uma frase.',
  },
};

export function configPadrao(especialidade = 'rastreador-de-spec') {
  const e = ESPECIALIDADES[especialidade] || ESPECIALIDADES['rastreador-de-spec'];
  const id = ESPECIALIDADES[especialidade] ? especialidade : 'rastreador-de-spec';
  return {
    especialidade: id,
    nome: id,
    description: e.description,
    ferramentas: ['Read', 'Grep', 'Glob'],
    bloquearEdicao: true,
    modelo: 'sonnet',
    rubrica: [...e.rubrica],
    formato: 'tabela',
  };
}

const NOME_VALIDO = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const QUANDO = /\b(use|usar|quando|antes|depois|após|sempre que)\b/i;

export function validar(config) {
  const msgs = [];
  if (!config.nome || !NOME_VALIDO.test(config.nome)) {
    msgs.push({ nivel: 'erro', campo: 'nome', msg: 'O nome precisa ser kebab-case: letras minúsculas, números e hífens (ex.: rastreador-de-spec).' });
  }
  const desc = (config.description || '').trim();
  if (!desc) {
    msgs.push({ nivel: 'erro', campo: 'description', msg: 'Sem description, o agente principal não sabe quando chamar este revisor.' });
  } else if (!QUANDO.test(desc)) {
    msgs.push({ nivel: 'aviso', campo: 'description', msg: 'A description diz o que o revisor faz, mas não QUANDO usar. Inclua algo como "Use depois que... / antes de abrir o PR".' });
  }
  if (!config.ferramentas || config.ferramentas.length === 0) {
    msgs.push({ nivel: 'erro', campo: 'ferramentas', msg: 'Sem ferramentas o revisor não consegue nem ler o código.' });
  }
  const edita = (config.ferramentas || []).filter((f) => f === 'Edit' || f === 'Write');
  if (edita.length) {
    msgs.push({
      nivel: 'aviso',
      campo: 'ferramentas',
      msg: config.bloquearEdicao
        ? `Conflito: ${edita.join(' e ')} na lista e também em disallowedTools. A lista de bloqueio é aplicada primeiro, então o revisor não vai editar. Tire da lista para ficar claro.`
        : `Revisor com ${edita.join(' e ')} vira autor: pode "consertar" o teste em vez de apontar o problema, e perde a independência que justifica ter um revisor separado.`,
    });
  }
  if ((config.ferramentas || []).includes('Bash')) {
    msgs.push({ nivel: 'aviso', campo: 'ferramentas', msg: 'Bash ajuda a rodar git diff e npm test, mas também escreve arquivos (sed -i, echo >). O texto do agente vai limitar o uso a comandos de leitura.' });
  }
  if (!MODELOS.includes(config.modelo)) {
    msgs.push({ nivel: 'erro', campo: 'modelo', msg: `Modelo inválido. Use um destes: ${MODELOS.join(', ')}.` });
  }
  if (!config.rubrica || config.rubrica.length === 0) {
    msgs.push({ nivel: 'aviso', campo: 'rubrica', msg: 'Revisor sem rubrica escreve opinião, como os jurados do tribunal que anotavam bobagens na lousa.' });
  }
  return msgs;
}

export function podeGerar(config) {
  return !validar(config).some((m) => m.nivel === 'erro');
}

export function yamlTexto(s) {
  const t = String(s).replace(/\s+/g, ' ').trim();
  if (/^[\s>|*&!%@`'"#[\]{},?:-]/.test(t) || /:\s|\s#/.test(t)) {
    return `"${t.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return t;
}

export function caminhoArquivo(config) {
  return `.claude/agents/${config.nome || 'revisor'}.md`;
}

export function gerarAgente(config) {
  const e = ESPECIALIDADES[config.especialidade] || ESPECIALIDADES['rastreador-de-spec'];
  const ferramentas = config.bloquearEdicao
    ? config.ferramentas.filter((f) => f !== 'Edit' && f !== 'Write')
    : [...config.ferramentas];
  const fm = [
    '---',
    `name: ${config.nome}`,
    `description: ${yamlTexto(config.description)}`,
    `tools: ${ferramentas.join(', ')}`,
  ];
  if (config.bloquearEdicao) fm.push('disallowedTools: Edit, Write');
  fm.push(`model: ${config.modelo}`, '---');

  const itens = RUBRICA.filter((r) => config.rubrica.includes(r.id));
  const formato = FORMATOS[config.formato] || FORMATOS.tabela;
  const corpo = [
    '',
    `Você é o ${e.titulo.toLowerCase()} do projeto agenda-mentorias. ${e.missao}`,
    '',
    'Você não escreveu este código. Não confie em comentários, nomes de teste ou mensagens de commit: confira no código e na spec.',
    '',
    '## Antes de revisar',
    '',
    '1. Leia `docs/spec.md` e `AGENTS.md`.',
    ferramentas.includes('Bash')
      ? '2. Veja o diff com `git diff main...HEAD`. Use Bash só para comandos de leitura: `git diff`, `git log --oneline`, `npm test`. Nunca escreva arquivos.'
      : '2. Quem te chamou deve dizer quais arquivos mudaram ou colar o diff. Se não disser, pergunte antes de revisar.',
    '',
    '## Rubrica',
    '',
    ...(itens.length ? itens.map((r) => `- **${r.rotulo}.** ${r.texto}`) : ['- (sem rubrica definida)']),
    '',
    '## Formato da resposta',
    '',
    formato.texto,
    '',
    '## Regras',
    '',
    '- Não edite arquivos. Seu papel é apontar, não consertar.',
    '- Todo achado tem evidência: arquivo:linha e, quando houver, a linha da spec.',
    '- Se não tiver certeza, escreva "dúvida" e diga o que precisaria ver para decidir.',
    '- Não elogie. Se não houver achados, diga só VEREDITO: APROVAR e o que você conferiu.',
    '',
  ];
  return [...fm, ...corpo].join('\n');
}
