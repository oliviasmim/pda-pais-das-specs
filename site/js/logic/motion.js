// Motor das máquinas (motions). Lógica pura: geometria, montagem, estado acumulado e validação.
// A interface está em site/js/motion.js. Cada máquina define estações, montagem, avarias e simular().

export const U = 24;
const EIXO_X = [0.95, 0.21];
const EIXO_Y = [-0.62, 0.42];
const EIXO_Z = 0.95;

export const ESPESSURA_CAMADA = 0.32;
export const VAO_FECHADA = 0.08;
export const VAO_ABERTA = 1.15;

export const TIPOS = {
  entrada: { rotulo: 'Entrada', cor: 'ouro' },
  guia: { rotulo: 'Guia (feedforward)', cor: 'tinta' },
  sensor: { rotulo: 'Sensor (feedback)', cor: 'folha' },
  modelo: { rotulo: 'Modelo', cor: 'uva' },
  sub: { rotulo: 'Subagent', cor: 'uva' },
  contexto: { rotulo: 'Contexto', cor: 'uva' },
  ferramenta: { rotulo: 'Ferramenta do harness', cor: 'ink-3' },
  humano: { rotulo: 'Pessoa', cor: 'ink' },
  repo: { rotulo: 'Repositório', cor: 'ink-3' },
  pasta: { rotulo: 'Pasta de trabalho', cor: 'ouro' },
  saida: { rotulo: 'Saída', cor: 'ink-2' },
};

export const MARCAS = ['visto', 'ok', 'alerta', 'falha'];

/** Projeta um ponto da grade (x, y, z) para a tela, em px. */
export function iso(x, y, z = 0, u = U) {
  return [(x * EIXO_X[0] + y * EIXO_Y[0]) * u, (x * EIXO_X[1] + y * EIXO_Y[1]) * u - z * EIXO_Z * u];
}

/** As três faces visíveis de uma caixa da grade, já projetadas. */
export function prisma({ x, y, w, d }, z0, z1, u = U) {
  const p = (a, b, c) => iso(a, b, c, u);
  return {
    topo: [p(x, y, z1), p(x + w, y, z1), p(x + w, y + d, z1), p(x, y + d, z1)],
    frente: [p(x, y + d, z0), p(x + w, y + d, z0), p(x + w, y + d, z1), p(x, y + d, z1)],
    lado: [p(x + w, y, z0), p(x + w, y + d, z0), p(x + w, y + d, z1), p(x + w, y, z1)],
  };
}

export function pontosSvg(pts) {
  return pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ');
}

export function centro(est) {
  return { x: est.x + est.w / 2, y: est.y + est.d / 2 };
}

/** Altura (em unidades da grade) do topo da pilha de camadas de uma estação. */
export function alturaTopo(est, aberta = false) {
  const n = (est.camadas || []).length;
  const vao = aberta ? VAO_ABERTA : VAO_FECHADA;
  return est.h + n * (ESPESSURA_CAMADA + vao);
}

/** Faixa z de cada camada de uma estação (de baixo para cima). */
export function faixasCamadas(est, aberta = false) {
  const vao = aberta ? VAO_ABERTA : VAO_FECHADA;
  return (est.camadas || []).map((nome, i) => {
    const z0 = est.h + vao + i * (ESPESSURA_CAMADA + vao);
    return { nome, z0, z1: z0 + ESPESSURA_CAMADA };
  });
}

/** Caminho do trilho na grade, em L, entre os centros de duas estações. */
export function caminhoTrilho(a, b, desvio = 0) {
  const ca = centro(a);
  const cb = centro(b);
  let pts;
  if (desvio) {
    pts = [
      [ca.x, ca.y],
      [ca.x, ca.y + desvio],
      [cb.x, cb.y + desvio],
      [cb.x, cb.y],
    ];
  } else if (ca.y === cb.y || ca.x === cb.x) {
    pts = [
      [ca.x, ca.y],
      [cb.x, cb.y],
    ];
  } else {
    const mx = (ca.x + cb.x) / 2;
    pts = [
      [ca.x, ca.y],
      [mx, ca.y],
      [mx, cb.y],
      [cb.x, cb.y],
    ];
  }
  return pts;
}

/** Retângulo da mesa (a plataforma) que cobre todas as estações com margem. */
export function mesa(estacoes, margem = 1.4) {
  const xs = estacoes.flatMap((e) => [e.x, e.x + e.w]);
  const ys = estacoes.flatMap((e) => [e.y, e.y + e.d]);
  const x = Math.min(...xs) - margem;
  const y = Math.min(...ys) - margem;
  return { x, y, w: Math.max(...xs) + margem - x, d: Math.max(...ys) + margem - y };
}

/** Caixa de visão (viewBox) que cabe a mesa, as estações e as etiquetas. */
export function limitesCena(estacoes, aberta = false, u = U) {
  const m = mesa(estacoes);
  const pts = [...Object.values(prisma(m, -0.7, 0, u)).flat()];
  estacoes.forEach((e, i) => {
    const topo = alturaTopo(e, aberta) + (e.etiqueta ?? alturaEtiqueta(i));
    const c = centro(e);
    pts.push(iso(c.x, c.y, topo + 0.9, u));
    const [ex] = iso(e.x + e.w, e.y, 0, u);
    pts.push([ex + (aberta ? 150 : 40), iso(c.x, c.y, topo, u)[1]]);
  });
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const pad = 18;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  return { x: minX, y: minY, w: Math.max(...xs) + pad - minX, h: Math.max(...ys) + pad - minY };
}

export function alturaEtiqueta(i) {
  return 1.5 + (i % 2) * 1.25;
}

/* ---------------- montagem ---------------- */

export function montagemPadrao(def) {
  const m = {};
  for (const c of def.montagem || []) m[c.id] = c.padrao ?? c.opcoes[0].valor;
  return m;
}

export function normalizarMontagem(def, parcial = {}) {
  const m = montagemPadrao(def);
  for (const c of def.montagem || []) {
    const v = parcial[c.id];
    if (v !== undefined && c.opcoes.some((o) => o.valor === v)) m[c.id] = v;
  }
  return m;
}

export function normalizarAvarias(def, lista = []) {
  const validas = new Set((def.avarias || []).map((a) => a.id));
  return [...new Set(lista)].filter((a) => validas.has(a));
}

/** "pedido=vago,agents=sem;q=regra-apagada+testes-decoracao" */
export function codificarMontagem(def, montagem, avarias = []) {
  const m = normalizarMontagem(def, montagem);
  const partes = Object.entries(m).map(([k, v]) => `${k}=${v}`);
  const q = normalizarAvarias(def, [...avarias]);
  return partes.join(',') + (q.length ? `;q=${q.join('+')}` : '');
}

export function decodificarMontagem(def, texto = '') {
  const [campos = '', resto = ''] = String(texto).split(';');
  const parcial = {};
  for (const par of campos.split(',')) {
    const [k, v] = par.split('=');
    if (k && v !== undefined) parcial[k.trim()] = v.trim();
  }
  const q = resto.startsWith('q=') ? resto.slice(2).split('+').filter(Boolean) : [];
  return { montagem: normalizarMontagem(def, parcial), avarias: normalizarAvarias(def, q) };
}

/** Todas as combinações de montagem (para testar a máquina inteira). */
export function combinacoes(def) {
  let lista = [{}];
  for (const c of def.montagem || []) {
    lista = lista.flatMap((m) => c.opcoes.map((o) => ({ ...m, [c.id]: o.valor })));
  }
  return lista;
}

/* ---------------- estado acumulado até o passo i ---------------- */

export function estadoAte(resultado, i) {
  const passos = resultado.passos || [];
  const marcas = {};
  const niveis = {};
  let metricas = {};
  const razao = [];
  const rastro = [];
  let atual = null;
  for (let k = 0; k <= Math.min(i, passos.length - 1); k++) {
    const p = passos[k];
    atual = p;
    if (p.estacao) marcas[p.estacao] = p.marca || marcas[p.estacao] || 'visto';
    for (const [id, m] of Object.entries(p.marcas || {})) marcas[id] = m;
    Object.assign(niveis, p.niveis || {});
    metricas = { ...metricas, ...(p.metricas || {}) };
    razao.push(...(p.razao || []));
    if (p.rastro) rastro.push(...[].concat(p.rastro));
  }
  const ativos = atual ? [...new Set([atual.estacao, ...(atual.ativos || [])].filter(Boolean))] : [];
  const pacotes = atual ? atual.pacotes || [atual.estacao].filter(Boolean) : [];
  return { marcas, niveis, metricas, razao, rastro, atual, ativos, pacotes, fim: passos.length > 0 && i >= passos.length - 1 };
}

/** Trilhos acesos na transição do passo i-1 para o passo i. */
export function trilhosAcesos(def, resultado, i) {
  const passos = resultado.passos || [];
  const p = passos[i];
  if (!p) return [];
  if (p.trilhos) return p.trilhos.map(([a, b]) => chaveTrilho(a, b));
  const ant = passos[i - 1];
  if (!ant) return [];
  const de = ant.pacotes || [ant.estacao];
  const para = p.pacotes || [p.estacao];
  const existentes = new Set((def.trilhos || []).map(([a, b]) => chaveTrilho(a, b)));
  const acesos = [];
  for (const a of de) for (const b of para) if (a !== b && existentes.has(chaveTrilho(a, b))) acesos.push(chaveTrilho(a, b));
  return acesos;
}

export function chaveTrilho(a, b) {
  return [a, b].sort().join('~');
}

export function contarRazao(razao, legenda) {
  return legenda.map((l) => ({ ...l, n: razao.filter((r) => r.tipo === l.tipo).length }));
}

/* ---------------- exportar o rastro ---------------- */

export function rastroMarkdown(def, montagem, avarias, resultado) {
  const fim = estadoAte(resultado, resultado.passos.length - 1);
  const rotuloCampo = (c) => c.opcoes.find((o) => o.valor === montagem[c.id])?.rotulo ?? montagem[c.id];
  const linhas = [
    `# ${def.titulo} (${def.fig})`,
    '',
    '## Montagem',
    '',
    ...(def.montagem || []).map((c) => `- ${c.rotulo}: ${rotuloCampo(c)}`),
    `- Peças quebradas: ${avarias.length ? avarias.map((a) => def.avarias.find((x) => x.id === a)?.rotulo ?? a).join(', ') : 'nenhuma'}`,
    '',
    '## Rastro',
    '',
    ...fim.rastro.map((r, i) => `${i + 1}. ${r}`),
    '',
    '## Livro-razão',
    '',
    ...contarRazao(fim.razao, def.legenda).map((l) => `- ${l.rotulo}: ${l.n}`),
    '',
    ...fim.razao.map((r) => `- [${def.legenda.find((l) => l.tipo === r.tipo)?.rotulo ?? r.tipo}] ${r.texto}`),
    '',
    '## Saída',
    '',
    `**${resultado.saida.titulo}**`,
    '',
    ...resultado.saida.linhas.map((l) => `- ${l}`),
    '',
    `_Simulação do País das Specs (PdA, Semana 10). ${def.nota}_`,
    '',
  ];
  return linhas.join('\n');
}

/* ---------------- validação de uma máquina ---------------- */

export function validarMotion(def) {
  const erros = [];
  const ids = new Set();
  for (const k of ['id', 'fig', 'titulo', 'lead', 'ideia', 'pronto', 'nota']) if (!def[k]) erros.push(`falta "${k}"`);
  if (!Array.isArray(def.estacoes) || def.estacoes.length < 3) erros.push('precisa de pelo menos 3 estações');
  for (const e of def.estacoes || []) {
    if (ids.has(e.id)) erros.push(`estação repetida "${e.id}"`);
    ids.add(e.id);
    if (!TIPOS[e.tipo]) erros.push(`estação "${e.id}" com tipo desconhecido "${e.tipo}"`);
    for (const k of ['x', 'y', 'w', 'd', 'h']) if (typeof e[k] !== 'number') erros.push(`estação "${e.id}" sem ${k}`);
    if (!e.rotulo || !e.oQueE) erros.push(`estação "${e.id}" sem rótulo ou explicação`);
  }
  for (const t of def.trilhos || []) for (const id of t.slice(0, 2)) if (!ids.has(id)) erros.push(`trilho cita estação inexistente "${id}"`);
  for (const a of def.avarias || []) {
    if (!ids.has(a.estacao)) erros.push(`avaria "${a.id}" em estação inexistente "${a.estacao}"`);
    if (!a.rotulo || !a.descricao) erros.push(`avaria "${a.id}" sem rótulo ou descrição`);
  }
  if (def.quebraPadrao && !(def.avarias || []).some((a) => a.id === def.quebraPadrao)) erros.push('quebraPadrao não é uma avaria');
  const tipos = new Set((def.legenda || []).map((l) => l.tipo));
  if (!tipos.size) erros.push('sem legenda do livro-razão');
  if ((def.licoes || []).length !== 4) erros.push('"O que a máquina mostra" precisa de 4 itens');
  for (const d of def.desafios || []) {
    if (!d.pergunta || !Array.isArray(d.opcoes) || d.opcoes.length < 2) erros.push('desafio sem pergunta ou opções');
    if (!(d.correta >= 0 && d.correta < (d.opcoes || []).length)) erros.push(`desafio "${d.pergunta}" com resposta fora das opções`);
  }
  if ((def.desafios || []).length < 3) erros.push('precisa de pelo menos 3 desafios');

  const avariasIds = (def.avarias || []).map((a) => a.id);
  const cenarios = [];
  for (const m of combinacoes(def)) {
    cenarios.push([m, []]);
    for (const a of avariasIds) cenarios.push([m, [a]]);
    cenarios.push([m, avariasIds]);
  }
  for (const [m, q] of cenarios) {
    let r;
    try {
      r = def.simular(m, new Set(q));
    } catch (e) {
      erros.push(`simular(${JSON.stringify(m)}, [${q}]) quebrou: ${e.message}`);
      continue;
    }
    const onde = `${codificarMontagem(def, m, q)}`;
    if (!r || !Array.isArray(r.passos) || !r.passos.length) {
      erros.push(`${onde}: sem passos`);
      continue;
    }
    if (!r.saida || !r.saida.titulo || !Array.isArray(r.saida.linhas)) erros.push(`${onde}: sem saída`);
    if (!r.entrada || !r.entrada.titulo) erros.push(`${onde}: sem entrada`);
    for (const id of r.desligadas || []) if (!ids.has(id)) erros.push(`${onde}: desliga estação inexistente "${id}"`);
    r.passos.forEach((p, i) => {
      for (const id of [p.estacao, ...(p.ativos || []), ...(p.pacotes || []), ...Object.keys(p.marcas || {}), ...Object.keys(p.niveis || {})]) {
        if (id && !ids.has(id)) erros.push(`${onde}: passo ${i + 1} cita estação inexistente "${id}"`);
      }
      if (!p.titulo || !p.narracao) erros.push(`${onde}: passo ${i + 1} sem título ou narração`);
      if (p.marca && !MARCAS.includes(p.marca)) erros.push(`${onde}: passo ${i + 1} com marca "${p.marca}"`);
      for (const rz of p.razao || []) if (!tipos.has(rz.tipo)) erros.push(`${onde}: passo ${i + 1} com tipo de razão "${rz.tipo}" fora da legenda`);
    });
  }
  return [...new Set(erros)];
}
