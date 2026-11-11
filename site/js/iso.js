// Desenho isométrico em SVG: caixas, cilindros, trilhas e rótulos.
// Tudo é desenhado em unidades de "placa" e projetado com escala s.
// Cores vêm dos tokens de style.css, então o tema escuro funciona sozinho.

const C = Math.cos(Math.PI / 6);
const S = 0.5;

export const CORES = {
  placa: 'var(--placa)',
  papel: 'var(--paper)',
  chip: '#262a37',
  chip2: '#363b4d',
  metal: '#c9ccd4',
  verde: 'var(--folha)',
  vermelho: 'var(--copas)',
  roxo: 'var(--uva)',
  ouro: 'var(--ouro)',
  acento: 'var(--acento)',
  vidro: 'var(--tinta-soft)',
  cinza: '#dfe1e7',
};

const escurecer = (cor, p) => `color-mix(in srgb, ${cor} ${p}%, #000)`;

export function projetar([x, y, z], s = 1) {
  return [(x - y) * C * s, (x + y) * S * s - z * s];
}

/* ---------- primitivas (coordenadas 3D) ---------- */

export function caixa(x, y, z, w, d, h, cor) {
  return [
    { tipo: 'poli', pts: [[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], cor: escurecer(cor, 84) },
    { tipo: 'poli', pts: [[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], cor: escurecer(cor, 66) },
    { tipo: 'poli', pts: [[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], cor },
  ];
}

function circulo(cx, cy, z, r, de = 0, ate = Math.PI * 2, n = 28) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = de + ((ate - de) * i) / n;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a), z]);
  }
  return pts;
}

export function cilindro(cx, cy, z, r, h, cor) {
  // metade da frente: onde x + y cresce (de -45° a 135°)
  const de = -Math.PI / 4;
  const ate = (3 * Math.PI) / 4;
  const baixo = circulo(cx, cy, z, r, de, ate);
  const cima = circulo(cx, cy, z + h, r, de, ate).reverse();
  return [
    { tipo: 'poli', pts: [...baixo, ...cima], cor: escurecer(cor, 74) },
    { tipo: 'poli', pts: circulo(cx, cy, z + h, r), cor },
  ];
}

export function disco(cx, cy, z, r, cor, opts = {}) {
  return [{ tipo: 'poli', pts: circulo(cx, cy, z, r), cor, ...opts }];
}

export function trilha(pts, z, cor = CORES.acento, largura = 1) {
  return [{ tipo: 'linha', pts: pts.map(([x, y]) => [x, y, z]), cor, largura }];
}

export function ponto(p, r, cor = CORES.acento) {
  return [{ tipo: 'ponto', pts: [p], r, cor }];
}

export function rotulo(p, texto, tamanho, cor = '#fff', opts = {}) {
  return [{ tipo: 'texto', pts: [p], texto, tamanho, cor, ...opts }];
}

export function mover(formas, dx, dy, dz = 0) {
  return formas.map((f) => ({ ...f, pts: f.pts.map(([x, y, z]) => [x + dx, y + dy, z + dz]) }));
}

/* ---------- renderização ---------- */

const n2 = (v) => Math.round(v * 100) / 100;

export function marcacao(formas, { s = 1, ox = 0, oy = 0, traco = 0.8 } = {}) {
  const P = (p) => {
    const [x, y] = projetar(p, s);
    return [n2(x + ox), n2(y + oy)];
  };
  return formas
    .map((f) => {
      if (f.tipo === 'poli') {
        const d = f.pts.map(P).map((q) => q.join(',')).join(' ');
        if (f.semTraco) return `<polygon points="${d}" style="fill:${f.cor}"/>`;
        return `<polygon points="${d}" style="fill:${f.cor}" stroke="var(--iso-linha)" stroke-width="${traco}" stroke-linejoin="round"${f.opacidade ? ` opacity="${f.opacidade}"` : ''}/>`;
      }
      if (f.tipo === 'linha') {
        const d = f.pts.map(P).map((q) => q.join(',')).join(' ');
        return `<polyline points="${d}" fill="none" style="stroke:${f.cor}" stroke-width="${n2(f.largura * s * 0.5)}" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>`;
      }
      if (f.tipo === 'ponto') {
        const [x, y] = P(f.pts[0]);
        return `<circle cx="${x}" cy="${y}" r="${n2(f.r * s)}" style="fill:var(--paper);stroke:${f.cor}" stroke-width="${n2(f.r * s * 0.45)}"/>`;
      }
      if (f.tipo === 'texto') {
        const [x, y] = P(f.pts[0]);
        // eixo x da placa: (C, S); eixo y: (-C, S)
        const m = [C * s, S * s, -C * s, S * s, x, y].map(n2).join(' ');
        return `<text transform="matrix(${m})" font-size="${f.tamanho}" font-family="Barlow Semi Condensed, sans-serif" font-weight="700" letter-spacing="${f.espaco ?? 0.6}" style="fill:${f.cor}" opacity="${f.opacidade ?? 1}">${f.texto}</text>`;
      }
      return '';
    })
    .join('');
}

export function limites(formas, s = 1) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const f of formas) {
    for (const p of f.pts) {
      const [x, y] = projetar(p, s);
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

// Ícone isolado: viewBox ajustado ao desenho, com sombra no chão.
export function icone(formas, { pad = 3, traco = 0.45, rotuloAria = '' } = {}) {
  const b = limites(formas);
  const vb = [b.x0 - pad, b.y0 - pad, b.w + pad * 2, b.h + pad * 2].map(n2).join(' ');
  const aria = rotuloAria ? `role="img" aria-label="${rotuloAria}"` : 'aria-hidden="true"';
  return `<svg class="iso-icone" viewBox="${vb}" ${aria}>${marcacao(formas, { traco })}</svg>`;
}

/* ---------- peças ---------- */

export const pecas = {
  spec() {
    const f = [];
    for (let i = 0; i < 4; i++) f.push(...caixa(i * 0.7, i * 0.7, i * 1.5, 20, 26, 1.3, CORES.papel));
    const z = 3 * 1.5 + 1.3;
    for (let k = 0; k < 5; k++) f.push(...trilha([[4.1, 6.1 + k * 3.6], [k === 2 ? 12 : 17.1, 6.1 + k * 3.6]], z, 'var(--ink-3)', 0.7));
    f.push(...caixa(13.6, 13, z, 5, 3.2, 0.5, CORES.acento));
    f.push(...rotulo([4.1, 4.4, z], 'SPEC', 2.8, 'var(--ink)'));
    return f;
  },

  chip() {
    const f = [];
    const pino = (x, y, w, d) => caixa(x, y, 1.4, w, d, 1.3, CORES.metal);
    for (let i = 0; i < 6; i++) f.push(...pino(3 + i * 3.6, -2.4, 1.6, 2.4));
    for (let i = 0; i < 6; i++) f.push(...pino(-2.4, 3 + i * 3.6, 2.4, 1.6));
    f.push(...caixa(0, 0, 0, 24, 24, 5, CORES.chip));
    f.push(...caixa(3.5, 3.5, 5, 17, 17, 0.6, CORES.chip2));
    for (let i = 0; i < 6; i++) f.push(...pino(24, 3 + i * 3.6, 2.4, 1.6));
    for (let i = 0; i < 6; i++) f.push(...pino(3 + i * 3.6, 24, 1.6, 2.4));
    f.push(...rotulo([6.5, 11.5, 5.6], 'LLM', 5.4, '#fff', { espaco: 1.2 }));
    f.push(...disco(6, 17.8, 5.61, 1.1, '#4a5065'));
    return f;
  },

  worktree(cor = CORES.verde, nome = '') {
    const f = [];
    f.push(...caixa(0, 0, 0, 24, 9, 1.8, cor));
    f.push(...caixa(3, 2, 1.8, 6, 5, 1.8, CORES.chip));
    for (let i = 0; i < 4; i++) f.push(...caixa(13 + i * 2.4, 3.4, 1.8, 1.2, 1.2, 2.6, CORES.metal));
    if (nome) f.push(...rotulo([13, 7.8, 1.81], nome, 2.4, '#fff'));
    return f;
  },

  subagente(cor = CORES.roxo) {
    const f = [];
    const pino = (x, y, w, d) => caixa(x, y, 0.8, w, d, 1, CORES.metal);
    f.push(...pino(-1.6, 2.5, 1.6, 1.2), ...pino(-1.6, 6.3, 1.6, 1.2));
    f.push(...pino(2.5, -1.6, 1.2, 1.6), ...pino(6.3, -1.6, 1.2, 1.6));
    f.push(...caixa(0, 0, 0, 10, 10, 3.6, cor));
    f.push(...caixa(2.2, 2.2, 3.6, 5.6, 5.6, 0.5, CORES.chip));
    f.push(...pino(10, 2.5, 1.6, 1.2), ...pino(10, 6.3, 1.6, 1.2));
    f.push(...pino(2.5, 10, 1.2, 1.6), ...pino(6.3, 10, 1.2, 1.6));
    return f;
  },

  gate(cor = CORES.verde) {
    return [...caixa(0, 0, 0, 7, 7, 8, CORES.cinza), ...caixa(-0.6, -0.6, 8, 8.2, 8.2, 1, CORES.chip), ...cilindro(3.5, 3.5, 9, 2.4, 1.8, cor)];
  },

  revisao() {
    return [
      ...caixa(0, 0, 0, 20, 20, 5, CORES.ouro),
      ...cilindro(10, 10, 5, 7.4, 1.6, CORES.chip),
      ...disco(10, 10, 6.62, 5.6, CORES.vidro),
      ...disco(8.2, 8.2, 6.63, 1.6, 'rgba(255,255,255,.7)'),
      ...caixa(17, 8.8, 5.2, 9, 2.4, 1.4, CORES.chip),
    ];
  },

  cartas() {
    const f = [];
    const cores = [CORES.papel, CORES.papel, CORES.papel];
    cores.forEach((c, i) => f.push(...caixa(i * 3, -i * 2.2, i * 1.2, 14, 20, 1, c)));
    f.push(...rotulo([9.2, -0.4, 3.41], '?', 9, 'var(--tinta)'));
    return f;
  },

  cronometro() {
    return [...cilindro(10, 10, 0, 10, 4, CORES.papel), ...disco(10, 10, 4.01, 7.6, CORES.cinza), ...trilha([[10, 10], [10, 4]], 4.05, 'var(--copas)', 1.4), ...trilha([[10, 10], [15, 10]], 4.05, 'var(--ink)', 1.4), ...caixa(8.6, -3.6, 1, 3, 3, 2.6, CORES.chip)];
  },

  degraus() {
    const f = [];
    const cores = [CORES.placa, CORES.roxo, CORES.verde, CORES.ouro];
    cores.forEach((c, i) => f.push(...caixa(i * 8, 0, 0, 8, 10, 2.5 + i * 3, c)));
    return f;
  },

  livro() {
    return [...caixa(0, 0, 0, 18, 24, 1.4, CORES.placa), ...caixa(0.8, 0.8, 1.4, 16.4, 22.4, 4, CORES.papel), ...caixa(0, 0, 5.4, 18, 24, 1.4, CORES.placa), ...rotulo([3, 4, 6.81], 'A–Z', 4.2, '#fff')];
  },
};

// Ícone de cada lição (mesma peça que aparece na placa da página inicial).
export const iconeDaLicao = {
  interrogatorio: () => [...caixa(0, 0, 0, 30, 14, 2, CORES.placa), ...trilha([[3, 4], [12, 4], [12, 10], [27, 10]], 2.01, CORES.acento, 1.2), ...ponto([3, 4, 2.01], 1.2), ...ponto([27, 10, 2.01], 1.2), ...mover(pecas.subagente(CORES.chip2), 15, 1, 2)],
  'coelho-branco': () => pecas.spec(),
  'beba-me': () => pecas.chip(),
  'cha-do-chapeleiro': () => [...pecas.worktree(CORES.verde), ...mover(pecas.worktree(CORES.roxo), 0, 11, 0), ...mover(pecas.worktree(CORES.ouro), 0, 22, 0)],
  'baralho-da-rainha': () => [...pecas.subagente(), ...mover(pecas.subagente(CORES.placa), 14, 0, 0), ...mover(pecas.subagente(CORES.verde), 0, 14, 0)],
  'cortem-lhe-a-cabeca': () => [...pecas.gate(), ...mover(pecas.gate(CORES.verde), 10, 0, 0), ...mover(pecas.gate(CORES.vermelho), 20, 0, 0)],
  julgamento: () => pecas.revisao(),
};
