// Custo de coordenação: quanto tempo leva uma mesma tarefa com n agentes.
// Modelo didático, não medição. Os números do seu log valem mais que os daqui.

export const N_MAX = 8;
export const TOKENS_POR_MINUTO = 2.5; // mil tokens por minuto de trabalho (mesma escala do laboratório de orquestração)
export const TOKENS_SUBIDA = 12; // mil tokens que cada agente novo gasta só para ler AGENTS.md, spec e arquivos

export const PADRAO = { trabalho: 36, partes: 3, fracaoSerial: 0.15, subida: 1, atrito: 0.5 };

export function normalizar(p = {}) {
  const v = { ...PADRAO, ...p };
  return {
    trabalho: Math.max(1, Number(v.trabalho)),
    partes: Math.max(1, Math.round(Number(v.partes))),
    fracaoSerial: Math.min(0.9, Math.max(0, Number(v.fracaoSerial))),
    subida: Math.max(0, Number(v.subida)),
    atrito: Math.max(0, Number(v.atrito)),
  };
}

// Pares de agentes que podem se atrapalhar: n(n-1)/2, o argumento da Lei de Brooks.
export function canais(n) {
  return (n * (n - 1)) / 2;
}

export function ideal(p, n) {
  const { trabalho } = normalizar(p);
  return trabalho / n;
}

export function agentesUteis(p, n) {
  return Math.min(n, normalizar(p).partes);
}

export function tempo(p, n) {
  const v = normalizar(p);
  if (n <= 1) return v.trabalho;
  const serial = v.trabalho * v.fracaoSerial;
  const dividivel = v.trabalho - serial;
  return serial + dividivel / agentesUteis(v, n) + v.subida * n + v.atrito * canais(n);
}

export function tokens(p, n) {
  const v = normalizar(p);
  return Math.round(v.trabalho * TOKENS_POR_MINUTO + (n > 1 ? n * TOKENS_SUBIDA : 0));
}

export function curva(p, nMax = N_MAX) {
  const pontos = [];
  for (let n = 1; n <= nMax; n++) {
    const real = tempo(p, n);
    pontos.push({
      n,
      ideal: ideal(p, n),
      real,
      aceleracao: normalizar(p).trabalho / real,
      tokens: tokens(p, n),
      canais: canais(n),
      parados: Math.max(0, n - agentesUteis(p, n)),
    });
  }
  return pontos;
}

// Menor tempo; em empate, o menor número de agentes.
export function melhorN(p, nMax = N_MAX) {
  return curva(p, nMax).reduce((m, x) => (x.real < m.real - 1e-9 ? x : m)).n;
}

export function leitura(p, n) {
  const c = curva(p, N_MAX)[n - 1];
  const v = normalizar(p);
  const melhor = melhorN(p);
  const frases = [];
  if (n === 1) {
    frases.push('Um agente só: sem coordenação e sem conflito, mas também sem dividir o trabalho.');
    return frases;
  }
  frases.push(`Com ${n} agentes, o ideal seria ${fmt(c.ideal)} min (o total dividido por ${n}). Somando a coordenação, o modelo dá ${fmt(c.real)} min.`);
  if (c.real >= v.trabalho) frases.push('Passou do tempo de um agente único: a coordenação comeu todo o ganho.');
  if (c.parados > 0) frases.push(`A tarefa só tem ${v.partes} ${v.partes === 1 ? 'parte' : 'partes'} independentes: ${c.parados} ${c.parados === 1 ? 'agente fica parado' : 'agentes ficam parados'} e ainda pagam subida e atrito.`);
  if (n > melhor) frases.push(`O melhor ponto deste cenário é ${melhor} ${melhor === 1 ? 'agente' : 'agentes'}. A partir daí, cada agente a mais piora o tempo.`);
  if (n === melhor && n > 1) frases.push('Este é o melhor ponto do cenário: o menor tempo com o menor número de agentes.');
  return frases;
}

export function fmt(x) {
  return (Math.round(x * 10) / 10).toString().replace('.', ',');
}
