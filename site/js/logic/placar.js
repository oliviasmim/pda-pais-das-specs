// Lógica pura do placar e do cronômetro do Speedrun (sem DOM).
// Pontuação: docs/facilitacao/semana-10-plano.md, seção 6, Aula 2.

export const DURACAO_PADRAO_MIN = 40;
export const ALERTA_MS = 5 * 60 * 1000;
export const TOTAL_CASOS_PADRAO = 26;

export const SENSORES = [
  { id: 'lint', nome: 'Lint' },
  { id: 'types', nome: 'Type check' },
  { id: 'testes', nome: 'Testes + cobertura' },
  { id: 'deps', nome: 'Dependências' },
  { id: 'smoke', nome: 'Smoke' },
];
export const TASKS = ['T1', 'T2', 'T3'];

export const PONTOS = {
  sensor: 10,
  tdd: 10,
  caso: 2,
  integracao: 15,
  carta: 5,
  rosa: -30,
  minuto: 1,
};

export const REGRAS = [
  { item: 'Cada sensor verde na CI (lint, types, testes+cobertura, deps, smoke)', pontos: '10 cada' },
  { item: 'Cada task com commit vermelho antes do verde (TDD visível no git log)', pontos: '10 cada' },
  { item: 'Avaliador oficial: cada caso de aceite que passa', pontos: '2 cada' },
  { item: 'Integração sem quebrar teste de outra task', pontos: '15' },
  { item: 'Responder em voz alta uma carta do baralho na clínica', pontos: '5 cada' },
  { item: 'Rosa pintada (teste de aceite alterado para passar)', pontos: '−30 cada' },
  { item: 'Terminar antes do tempo', pontos: '+1 por minuto restante' },
];

let contador = 0;
function novoId() {
  contador += 1;
  return `t${Date.now().toString(36)}${contador.toString(36)}`;
}

/** @param {string} nome */
export function novoTime(nome) {
  return {
    id: novoId(),
    nome: String(nome).trim() || 'Time sem nome',
    sensores: Object.fromEntries(SENSORES.map((s) => [s.id, false])),
    tdd: Object.fromEntries(TASKS.map((t) => [t, false])),
    casos: 0,
    casosTotal: TOTAL_CASOS_PADRAO,
    integracao: false,
    cartas: 0,
    rosas: 0,
    minutosRestantes: 0,
  };
}

function inteiro(valor, minimo = 0, maximo = Number.MAX_SAFE_INTEGER) {
  const n = Math.trunc(Number(valor));
  if (!Number.isFinite(n)) return minimo;
  return Math.min(maximo, Math.max(minimo, n));
}

/** Pontos de um time, por parte e no total. */
export function pontuar(time) {
  const partes = {
    sensores: Object.values(time.sensores ?? {}).filter(Boolean).length * PONTOS.sensor,
    tdd: Object.values(time.tdd ?? {}).filter(Boolean).length * PONTOS.tdd,
    casos: inteiro(time.casos, 0, inteiro(time.casosTotal, 0) || Number.MAX_SAFE_INTEGER) * PONTOS.caso,
    integracao: time.integracao ? PONTOS.integracao : 0,
    cartas: inteiro(time.cartas) * PONTOS.carta,
    rosas: inteiro(time.rosas) * PONTOS.rosa,
    tempo: inteiro(time.minutosRestantes) * PONTOS.minuto,
  };
  const total = Object.values(partes).reduce((a, b) => a + b, 0);
  return { partes, total };
}

/** Times ordenados: mais pontos; empate → mais minutos restantes; depois nome. */
export function ranking(times) {
  return times
    .map((time) => ({ time, ...pontuar(time) }))
    .sort(
      (a, b) =>
        b.total - a.total ||
        inteiro(b.time.minutosRestantes) - inteiro(a.time.minutosRestantes) ||
        a.time.nome.localeCompare(b.time.nome, 'pt-BR'),
    )
    .map((linha, i) => ({ posicao: i + 1, ...linha }));
}

/**
 * Lê a linha "PLACAR {...}" impressa pelo avaliador.
 * Aceita a linha sozinha, a saída inteira colada ou só o JSON.
 * @param {string} texto
 * @returns {{ ok: true, dados: { casos: number, casosTotal: number, tdd: Record<string, boolean>, rosas: number } } | { ok: false, erro: string }}
 */
export function lerPlacar(texto) {
  const linhas = String(texto ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const linha = [...linhas].reverse().find((l) => l.startsWith('PLACAR')) ?? linhas.find((l) => l.startsWith('{'));
  if (!linha) return { ok: false, erro: 'Não achei a linha que começa com PLACAR. Ela é a última que o avaliador imprime.' };
  const json = linha.replace(/^PLACAR\s*/, '');
  let bruto;
  try {
    bruto = JSON.parse(json);
  } catch {
    return { ok: false, erro: 'A linha PLACAR está incompleta. Copie a linha inteira, até a última chave }.' };
  }
  const casos = bruto?.casos;
  if (!casos || !Number.isInteger(casos.passaram) || !Number.isInteger(casos.total)) {
    return { ok: false, erro: 'Essa linha não tem o campo casos (passaram e total). Copie a última linha que o avaliador imprimiu.' };
  }
  if (casos.passaram < 0 || casos.passaram > casos.total) {
    return { ok: false, erro: 'Os números de casos não batem (passaram maior que o total).' };
  }
  const tdd = Object.fromEntries(TASKS.map((t) => [t, bruto?.tdd?.[t] === true]));
  const rosas = Array.isArray(bruto?.rosas) ? bruto.rosas.length : inteiro(bruto?.rosas);
  return { ok: true, dados: { casos: casos.passaram, casosTotal: casos.total, tdd, rosas } };
}

/** Novo time com os dados do avaliador aplicados (não mexe no que é manual). */
export function aplicarPlacar(time, dados) {
  return {
    ...time,
    casos: dados.casos,
    casosTotal: dados.casosTotal,
    tdd: { ...time.tdd, ...dados.tdd },
    rosas: dados.rosas,
  };
}

function celulaCsv(valor) {
  const texto = String(valor ?? '');
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/** CSV separado por ponto e vírgula (abre direto no Excel em português). */
export function paraCSV(times) {
  const cabecalho = [
    'posicao', 'time', 'total',
    ...SENSORES.map((s) => `sensor_${s.id}`),
    ...TASKS.map((t) => `tdd_${t}`),
    'casos', 'casos_total', 'integracao', 'cartas', 'rosas', 'minutos_restantes',
  ];
  const linhas = ranking(times).map(({ posicao, time, total }) => [
    posicao, time.nome, total,
    ...SENSORES.map((s) => (time.sensores?.[s.id] ? 1 : 0)),
    ...TASKS.map((t) => (time.tdd?.[t] ? 1 : 0)),
    inteiro(time.casos), inteiro(time.casosTotal), time.integracao ? 1 : 0,
    inteiro(time.cartas), inteiro(time.rosas), inteiro(time.minutosRestantes),
  ]);
  return [cabecalho, ...linhas].map((l) => l.map(celulaCsv).join(';')).join('\n') + '\n';
}

// ---------- cronômetro ----------

/** @param {number} [minutos] */
export function novoCronometro(minutos = DURACAO_PADRAO_MIN) {
  return { duracaoMs: inteiro(minutos, 1, 180) * 60 * 1000, inicioEm: null, acumuladoMs: 0 };
}

export function rodando(c) {
  return c.inicioEm !== null;
}

export function decorrido(c, agora) {
  return c.acumuladoMs + (c.inicioEm === null ? 0 : Math.max(0, agora - c.inicioEm));
}

export function restante(c, agora) {
  return c.duracaoMs - decorrido(c, agora);
}

export function iniciar(c, agora) {
  if (rodando(c) || restante(c, agora) <= 0) return c;
  return { ...c, inicioEm: agora };
}

export function pausar(c, agora) {
  if (!rodando(c)) return c;
  return { ...c, inicioEm: null, acumuladoMs: decorrido(c, agora) };
}

export function zerar(c) {
  return { ...c, inicioEm: null, acumuladoMs: 0 };
}

/** Muda a duração mantendo o tempo já decorrido. */
export function mudarDuracao(c, minutos) {
  return { ...c, duracaoMs: inteiro(minutos, 1, 180) * 60 * 1000 };
}

/** @returns {'pronto' | 'normal' | 'alerta' | 'fim'} */
export function fase(c, agora) {
  const r = restante(c, agora);
  if (r <= 0) return 'fim';
  if (!rodando(c) && c.acumuladoMs === 0) return 'pronto';
  return r <= ALERTA_MS ? 'alerta' : 'normal';
}

/** "MM:SS" (ou "H:MM:SS"), arredondando para cima para o 00:00 só aparecer no fim. */
export function formatarTempo(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function minutosRestantes(c, agora) {
  return Math.max(0, Math.floor(restante(c, agora) / 60000));
}
