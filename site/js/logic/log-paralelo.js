// Calculadora do log do speedrun: transforma os números do LOG-SESSAO-PARALELA no
// cálculo de custo de coordenação do documento "Quando um agente único teria sido melhor".
// Sem DOM. Não guarda nome de aluno, só minutos.

export const LIMITE_VALEU = 0.2; // ganho de pelo menos 20% sobre a soma das tasks sozinhas
export const LIMITE_UNICO = 0.05; // ganho de até 5% (ou perda) é sinal de que um agente teria bastado

export const TASKS_PADRAO = [
  { id: 'T1', nome: 'Agendar', minutos: null },
  { id: 'T2', nome: 'Cancelar', minutos: null },
  { id: 'T3', nome: 'Listar vagas', minutos: null },
];

export const VAZIO = {
  tasks: TASKS_PADRAO,
  aposta: null,
  real: null,
  integracao: null,
  conflito: 'nao',
  diffs: null,
  verde: true,
};

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
const valido = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;

export function arredondar(x, casas = 1) {
  const f = 10 ** casas;
  return Math.round(x * f) / f;
}

export function calcular(dados) {
  const tasks = (dados.tasks || []).map((t) => ({ ...t, minutos: num(t.minutos) }));
  const aposta = num(dados.aposta);
  const real = num(dados.real);
  const integracao = num(dados.integracao);
  const erros = [];

  const preenchidas = tasks.filter((t) => valido(t.minutos));
  if (tasks.some((t) => t.minutos !== null && !valido(t.minutos))) erros.push('Minutos de task precisam ser números a partir de zero.');
  if (!preenchidas.length) erros.push('Preencha pelo menos uma task com os minutos que ela levaria sozinha.');
  if (!valido(real) || real === 0) erros.push('Informe o tempo real total, até o npm test ficar verde.');
  if (!valido(aposta)) erros.push('Informe o tempo que vocês apostaram antes de começar.');
  if (integracao !== null && !valido(integracao)) erros.push('Minutos de integração precisam ser um número a partir de zero.');
  if (erros.length) return { ok: false, erros };

  const somaSozinhas = preenchidas.reduce((s, t) => s + t.minutos, 0);
  const maisLonga = Math.max(...preenchidas.map((t) => t.minutos));
  const ganho = somaSozinhas - real;
  const ganhoPct = somaSozinhas > 0 ? ganho / somaSozinhas : 0;
  const diferenca = real - aposta;
  const erroAposta = aposta > 0 ? diferenca / aposta : null;
  const coordenacao = real - maisLonga; // o que sobrou depois da task mais longa
  const ideal = preenchidas.length ? somaSozinhas / preenchidas.length : somaSozinhas;

  let veredito;
  if (dados.verde === false) veredito = 'incompleto';
  else if (ganhoPct >= LIMITE_VALEU) veredito = 'valeu';
  else if (ganhoPct <= LIMITE_UNICO) veredito = 'unico';
  else veredito = 'empatou';

  const avisos = [];
  if (dados.verde === false) avisos.push('Os testes não fecharam 100% verdes. Pela regra da semana, o relógio não parou: este tempo ainda não vale como resultado.');
  if (preenchidas.length < tasks.length) avisos.push('Há tasks sem minutos. A soma usa só as preenchidas.');
  if (real < maisLonga) avisos.push('O tempo real é menor que a task mais longa sozinha. Confira os números do log.');
  if (dados.conflito === 'sim' && integracao === null) avisos.push('Houve conflito, mas falta o tempo de integração. Esse é o número que mais explica o resultado.');

  return {
    ok: true,
    somaSozinhas: arredondar(somaSozinhas),
    maisLonga: arredondar(maisLonga),
    ideal: arredondar(ideal),
    real: arredondar(real),
    aposta: arredondar(aposta),
    integracao: integracao === null ? null : arredondar(integracao),
    ganho: arredondar(ganho),
    ganhoPct: arredondar(ganhoPct * 100, 0),
    diferenca: arredondar(diferenca),
    erroAposta: erroAposta === null ? null : arredondar(erroAposta * 100, 0),
    coordenacao: arredondar(coordenacao),
    veredito,
    avisos,
  };
}

export const VEREDITOS = {
  valeu: { marca: 'Paralelizar valeu a pena', dica: 'O ganho passou de 20%, mesmo pagando organização, revisão e integração. Escreva em que condição isso se repetiria.' },
  unico: { marca: 'Um agente único teria sido melhor', dica: 'O ganho ficou em 5% ou menos: a coordenação comeu o que vocês ganharam rodando junto. Escreva o que fariam diferente se soubessem antes.' },
  empatou: { marca: 'Empatou', dica: 'O ganho ficou entre 5% e 20%. Empate também é resposta: não force um veredito que os números não sustentam.' },
  incompleto: { marca: 'Sem veredito ainda', dica: 'Sem testes 100% verdes, o relógio não parou. Feche os testes e recalcule.' },
};

export function leituraAposta(r) {
  if (!r.ok || r.erroAposta === null) return '';
  if (r.diferenca > 0) return `Vocês subestimaram em ${r.diferenca} min (${r.erroAposta}%). Essa diferença é o custo de coordenação que ficou fora da aposta.`;
  if (r.diferenca < 0) return `Vocês superestimaram em ${Math.abs(r.diferenca)} min (${Math.abs(r.erroAposta)}%): o paralelo saiu mais rápido do que vocês esperavam.`;
  return 'A aposta bateu com o tempo real.';
}

const sinal = (x) => (x > 0 ? `+${x}` : `${x}`);

// Markdown com as seções 2 e 3 do DOC-AGENTE-UNICO preenchidas só com números do log.
// Seções 1, 4 e 5 ficam para a pessoa escrever.
export function gerarMarkdown(dados) {
  const r = calcular(dados);
  if (!r.ok) return '';
  const v = VEREDITOS[r.veredito];
  const conflito = dados.conflito === 'sim' ? 'Houve conflito de merge.' : 'Não houve conflito de merge.';
  const linhas = [
    '# Quando um agente único teria sido melhor',
    '',
    '## 2. O que aconteceu de fato',
    '',
    `- Tempo apostado: ${r.aposta} min`,
    `- Tempo real: ${r.real} min`,
    `- Diferença: ${sinal(r.diferenca)} min (positiva = subestimaram o custo de coordenação)`,
    `- ${conflito}${r.integracao !== null ? ` Integração: ${r.integracao} min.` : ''}${valido(num(dados.diffs)) ? ` Diffs revisados linha a linha: ${num(dados.diffs)}.` : ''}`,
    '',
    '## 3. O cálculo de custo de coordenação',
    '',
    '| | Minutos |',
    '|---|---|',
    `| (a) Tasks sozinhas, somadas (${dados.tasks.filter((t) => valido(num(t.minutos))).map((t) => `${t.id} ${num(t.minutos)}`).join(' + ')}) | ${r.somaSozinhas} |`,
    `| (b) Tempo real, com integração | ${r.real} |`,
    `| (c) Ganho = (a) − (b) | ${r.ganho} (${r.ganhoPct}%) |`,
    '',
    '## 4. Veredito',
    '',
    `Os números sugerem: **${v.marca}**. Confirme ou discorde, com os números do seu log.`,
    '',
    '## 1 e 5. Para escrever à mão',
    '',
    '- Divisão escolhida e por quê (antes de saber como terminaria):',
    '- A regra, em uma frase, para o próximo projeto:',
    '',
  ];
  return linhas.join('\n');
}
