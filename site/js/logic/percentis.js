export function criarRng(semente = 42) {
  let a = semente >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(rand) {
  const u = Math.max(rand(), 1e-12);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function amostrarBackend(rand, { base = 40, cauda = 0.02, lento = 400 } = {}) {
  if (rand() < cauda) {
    return lento * Math.exp(0.35 * normal(rand));
  }
  return base * Math.exp(0.3 * normal(rand));
}

export function simular({ requisicoes = 2000, fanout = 1, cauda = 0.02, base = 40, lento = 400, semente = 42 } = {}) {
  const rand = criarRng(semente);
  const n = Math.max(1, Math.floor(fanout));
  const tempos = new Array(requisicoes);
  for (let i = 0; i < requisicoes; i++) {
    let maior = 0;
    for (let j = 0; j < n; j++) {
      const t = amostrarBackend(rand, { base, cauda, lento });
      if (t > maior) maior = t;
    }
    tempos[i] = maior;
  }
  return tempos;
}

export function percentil(ordenados, p) {
  if (ordenados.length === 0) return 0;
  const idx = Math.min(ordenados.length - 1, Math.max(0, Math.ceil((p / 100) * ordenados.length) - 1));
  return ordenados[idx];
}

export function estatisticas(tempos) {
  const ordenados = [...tempos].sort((a, b) => a - b);
  const soma = ordenados.reduce((s, t) => s + t, 0);
  return {
    n: ordenados.length,
    media: ordenados.length ? soma / ordenados.length : 0,
    p50: percentil(ordenados, 50),
    p95: percentil(ordenados, 95),
    p99: percentil(ordenados, 99),
    max: ordenados.length ? ordenados[ordenados.length - 1] : 0,
  };
}

export function histograma(tempos, { faixas = 40, limite } = {}) {
  const max = limite ?? Math.max(...tempos, 1);
  const largura = max / faixas;
  const contagens = new Array(faixas).fill(0);
  let foraDoGrafico = 0;
  for (const t of tempos) {
    if (t >= max) {
      foraDoGrafico++;
      continue;
    }
    contagens[Math.floor(t / largura)]++;
  }
  return { contagens, largura, max, foraDoGrafico };
}

export function fracaoAfetada(fanout, p = 0.99) {
  const n = Math.max(1, Math.floor(fanout));
  return 1 - Math.pow(p, n);
}

export function frase({ fanout, stats }) {
  const afetados = Math.round(fracaoAfetada(fanout) * 100);
  const media = Math.round(stats.media);
  const p99 = Math.round(stats.p99);
  const base = `A média diz ${media} ms. Mas 1 em cada 100 pessoas espera ${p99} ms ou mais.`;
  if (fanout <= 1) {
    return `${base} Com uma chamada por requisição, só 1% das pessoas cai na cauda de um backend. Um requisito escrito com a média não enxerga essas pessoas.`;
  }
  return `${base} Com fan-out ${fanout}, ${afetados}% das requisições esperam pelo menos uma chamada na cauda (acima do p99 de um backend).`;
}
