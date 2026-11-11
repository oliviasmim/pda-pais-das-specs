// Onde o erro nasceu? Pesquisa, plano ou código.
// Alcance vem do texto de Dex Horthy (HumanLayer, 2025): pesquisa ruim gera
// milhares de linhas ruins, plano ruim gera centenas, código ruim é só código ruim.

export const ETAPAS = {
  research: {
    nome: 'Research (pesquisa)',
    arquivo: 'RESEARCH.md',
    pergunta: 'A dor de quem usa está descrita certo?',
    alcance: 'milhares de linhas. Spec e código foram construídos em cima do problema errado',
    ordem: 3,
  },
  plan: {
    nome: 'Plan (plano)',
    arquivo: 'docs/spec.md',
    pergunta: 'A spec cobre a dor, com EARS e fatias?',
    alcance: 'centenas de linhas. O código obedeceu a um plano que já nasceu torto',
    ordem: 2,
  },
  implement: {
    nome: 'Implement (código)',
    arquivo: 'o diff',
    pergunta: 'Esta fatia faz o que o plano diz?',
    alcance: 'uma fatia. O plano estava certo e o código se desviou dele',
    ordem: 1,
  },
};

export const DEFEITOS = [
  {
    id: 'email',
    sintoma: 'O endpoint manda e-mail de confirmação que ninguém pediu.',
    nasceu: 'research',
    explicacao: 'O RESEARCH.md escreveu a dor como "o jovem precisa receber um e-mail". Isso já é uma solução. A dor de verdade era "o jovem precisa saber se a vaga ficou com ele", e a resposta 201 já resolve. Spec e código só obedeceram.',
    rastro: 'Frase do RESEARCH.md que virou o EARS do e-mail.',
  },
  {
    id: 'concorrencia',
    sintoma: 'Segunda-feira, 9h: dois jovens agendam a mesma vaga.',
    nasceu: 'plan',
    explicacao: 'O pico (150 tentativas no primeiro minuto) estava anotado na pesquisa. A spec não virou isso em nenhum EARS de concorrência, então o código não tinha o que cumprir. Faltou o NFR-1 (o requisito de duas requisições ao mesmo tempo) no plano.',
    rastro: 'Procure na spec um EARS com "ao mesmo tempo". Não tem.',
  },
  {
    id: 'vaga-livre',
    sintoma: 'O jovem agenda e a vaga continua aparecendo como livre.',
    nasceu: 'implement',
    explicacao: 'A spec da T1 diz que a vaga passa a livre: false. O plano estava certo e a fatia esqueceu uma linha. O conserto fica na própria fatia.',
    rastro: 'T1, linha "sucesso": existe na spec e não existe no diff.',
  },
  {
    id: 'horizontal',
    sintoma: 'Na terceira semana ainda não dá para abrir nada no navegador.',
    nasceu: 'plan',
    explicacao: 'O plano dividiu o trabalho em "banco, depois API, depois tela", uma camada por vez (plano horizontal). Sem uma fatia vertical, que vai do banco à tela num pedaço pequeno, nada fica visível para você revisar no meio do caminho.',
    rastro: 'Ordem das fatias na spec: a fatia 1 funciona de ponta a ponta?',
  },
  {
    id: 'dia',
    sintoma: 'A listagem de vagas traz a semana toda, mas o jovem só quer ver o dia que escolheu.',
    nasceu: 'research',
    explicacao: 'O RESEARCH.md não registrou que o jovem escolhe um dia. Sem essa frase, nenhum EARS nasceu e o parâmetro data nunca entrou. A dor ficou de fora já na pesquisa.',
    rastro: 'Procure no RESEARCH.md uma frase de quem usa sobre "dia". Não tem.',
  },
  {
    id: 'mensagem',
    sintoma: 'A resposta de vaga ocupada diz "Vaga ocupada", e a spec diz "Vaga indisponível".',
    nasceu: 'implement',
    explicacao: 'A mensagem exata está na spec e o código trocou por outra parecida. O conserto é uma linha, e um teste que compara a mensagem exata impede que ela volte.',
    rastro: 'T1, linha "vaga não está livre": a mensagem está escrita.',
  },
];

export const defeitoPorId = (id) => DEFEITOS.find((d) => d.id === id) || null;

export function avaliar(id, etapa) {
  const d = defeitoPorId(id);
  if (!d || !ETAPAS[etapa]) return { nota: 0, correta: null };
  return { nota: d.nasceu === etapa ? 1 : 0, correta: d.nasceu };
}

export function responder(respostas, id, etapa) {
  if (!defeitoPorId(id) || !ETAPAS[etapa]) return { ...respostas };
  return { ...respostas, [id]: etapa };
}

// Quanto custa deixar o erro passar adiante: o que foi construído em cima dele.
export function alcanceDoErro(id) {
  const d = defeitoPorId(id);
  return d ? ETAPAS[d.nasceu].alcance : null;
}

export function placar(respostas) {
  let pontos = 0;
  let respondidas = 0;
  const porEtapa = {};
  for (const e of Object.keys(ETAPAS)) porEtapa[e] = { acertos: 0, total: 0 };
  for (const d of DEFEITOS) {
    porEtapa[d.nasceu].total += 1;
    const r = respostas[d.id];
    if (!r) continue;
    respondidas += 1;
    const { nota } = avaliar(d.id, r);
    pontos += nota;
    if (nota === 1) porEtapa[d.nasceu].acertos += 1;
  }
  return { pontos, total: DEFEITOS.length, respondidas, completo: respondidas === DEFEITOS.length, porEtapa };
}
