// Laboratório "temperatura": o mesmo prompt várias vezes.
// Os números são ilustrativos: um modelo real escolhe entre dezenas de milhares de tokens.
export const PROMPT = 'Uma jovem tentou agendar a vaga das 9h e a resposta da API foi: a vaga está';

export const CANDIDATOS = [
  { token: 'indisponível', logit: 4.0 },
  { token: 'ocupada', logit: 3.2 },
  { token: 'reservada', logit: 2.6 },
  { token: 'livre', logit: 1.6 },
  { token: 'bloqueada', logit: 1.0 },
  { token: 'em', logit: 0.2 },
  { token: 'azul', logit: -1.5 },
];

export const TEMP_MIN = 0;
export const TEMP_MAX = 2;

export function softmax(logits, temperatura) {
  if (!Array.isArray(logits) || logits.length === 0) throw new Error('logits vazio');
  if (temperatura <= 0) {
    const max = Math.max(...logits);
    const primeiro = logits.indexOf(max);
    return logits.map((_, i) => (i === primeiro ? 1 : 0));
  }
  const escala = logits.map((l) => l / temperatura);
  const m = Math.max(...escala);
  const exp = escala.map((x) => Math.exp(x - m));
  const soma = exp.reduce((a, b) => a + b, 0);
  return exp.map((x) => x / soma);
}

export function distribuicao(temperatura, candidatos = CANDIDATOS) {
  const p = softmax(candidatos.map((c) => c.logit), temperatura);
  return candidatos.map((c, i) => ({ token: c.token, p: p[i] }));
}

// Gerador pseudoaleatório pequeno e reprodutível (mulberry32).
export function rng(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sortear(dist, aleatorio) {
  const r = aleatorio();
  let acumulado = 0;
  for (const d of dist) {
    acumulado += d.p;
    if (r < acumulado) return d.token;
  }
  return dist[dist.length - 1].token;
}

export function rodar({ temperatura, vezes = 5, semente = 1, candidatos = CANDIDATOS } = {}) {
  const dist = distribuicao(temperatura, candidatos);
  const aleatorio = rng(semente);
  const saidas = Array.from({ length: vezes }, () => sortear(dist, aleatorio));
  return { dist, saidas, distintas: new Set(saidas).size };
}

export function leitura({ distintas, vezes }, temperatura) {
  if (temperatura <= 0) return 'Temperatura 0: sempre o token mais provável. As respostas saem iguais, mas igual não quer dizer certo.';
  if (distintas === 1) return 'Saiu tudo igual nesta rodada, mas foi sorte: as barras mostram que outras palavras ainda têm chance. Rode de novo ou suba a temperatura.';
  if (temperatura >= 1.5) return `${distintas} saídas diferentes em ${vezes}. Com temperatura alta, palavra improvável (tipo "azul") ganha chance e a frase perde o sentido.`;
  return `${distintas} saídas diferentes em ${vezes}. O mesmo prompt não dá o mesmo texto, então você testa o comportamento (status, corpo, regra), não a frase.`;
}
