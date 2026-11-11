// Página inicial: a "placa do harness" em isometria.
// Cada peça da placa é uma lição da semana. Os callouts ligam a peça à lição.

import { h } from '../ui.js';
import { caixa, disco, trilha, ponto, rotulo, mover, marcacao, projetar, pecas, CORES } from '../iso.js';

const S = 4;
const VB = { w: 1000, h: 640 };
const OX = 438;
const OY = 132;
const CW = 190; // largura do callout no viewBox
const CH = 96; // altura aproximada

// ancora: ponto 3D na placa · caixa: canto do callout no viewBox · liga: onde a linha encosta no callout
export const PONTOS = [
  { licao: 'interrogatorio', rotulo: 'Rastro', texto: 'Cada linha do diff aponta para um trecho da spec.', ancora: [38, 25, 3.2], caixa: [8, 132] },
  { licao: 'coelho-branco', rotulo: 'Spec com número', texto: 'p95, status e mensagem exatos.', ancora: [16, 20, 9], caixa: [196, 4] },
  { licao: 'beba-me', rotulo: 'LLM + harness', texto: 'Guias antes, sensores depois. Isso faz do modelo um agente.', ancora: [60, 40, 9], caixa: [600, 4] },
  { licao: 'cha-do-chapeleiro', rotulo: 'Worktrees', texto: 'Uma pasta e uma branch para cada agente.', ancora: [110, 22, 6], caixa: [802, 150] },
  { licao: 'baralho-da-rainha', rotulo: 'Subagents', texto: 'Paralelo só quando as tarefas são independentes.', ancora: [15, 62, 6], caixa: [8, 420] },
  { licao: 'cortem-lhe-a-cabeca', rotulo: 'Gates na CI', texto: 'Gate que não bloqueia é decoração.', ancora: [86, 75, 12], caixa: [270, 540] },
  { licao: 'julgamento', rotulo: 'Revisão', texto: 'Diff grande lido em camadas.', ancora: [104, 56, 8], caixa: [802, 440] },
];

function ligacao([bx, by], [ax, ay]) {
  if (ax > bx + CW) return [bx + CW, by + CH / 2];
  if (ax < bx) return [bx, by + CH / 2];
  return ay > by + CH ? [bx + CW / 2, by + CH] : [bx + CW / 2, by];
}

function cena() {
  const f = [];
  // sombra e placa
  f.push({ tipo: 'poli', pts: [[3, 4, 0], [123, 4, 0], [123, 88, 0], [3, 88, 0]], cor: 'rgba(29,34,48,.12)', semTraco: true });
  f.push(...caixa(0, 0, 0, 120, 84, 3.2, CORES.placa));
  const z = 3.2;
  for (const [x, y] of [[4, 4], [116, 4], [4, 80], [116, 80]]) f.push(...disco(x, y, z + 0.01, 1.8, 'var(--bg)'));
  f.push(...caixa(34, 1.2, z, 46, 3.4, 4.4, CORES.chip));
  f.push(...rotulo([15, 81.5, z + 0.01], 'PAÍS DAS SPECS', 3.6, 'rgba(255,255,255,.6)', { espaco: 1 }));

  // trilhas (ficam por baixo das peças)
  const t = (pts) => f.push(...trilha(pts, z + 0.02, CORES.acento, 1));
  t([[28, 18], [38, 18], [38, 32], [46, 32]]);
  t([[28, 24], [34, 24], [34, 38], [46, 38]]);
  t([[72, 34], [78, 34], [78, 9], [84, 9]]);
  t([[72, 40], [80, 40], [80, 21], [84, 21]]);
  t([[72, 46], [82, 46], [82, 33], [84, 33]]);
  t([[48, 44], [30, 44], [30, 55], [22, 55]]);
  t([[48, 49], [34, 49], [34, 69], [22, 69]]);
  t([[58, 52], [58, 75.5], [62, 75.5]]);
  t([[72, 52], [88, 52]]);
  for (const p of [[28, 18], [28, 24], [46, 32], [46, 38], [84, 9], [84, 21], [84, 33], [22, 55], [22, 69], [88, 52]]) f.push(...ponto([...p, z + 0.03], 0.9));

  // peças, de trás para a frente
  f.push(...mover(pecas.spec(), 6, 6, z));
  f.push(...mover(pecas.worktree(CORES.verde, 'T1'), 86, 4.5, z));
  f.push(...mover(pecas.worktree(CORES.roxo, 'T2'), 86, 16.5, z));
  f.push(...mover(pecas.worktree(CORES.ouro, 'T3'), 86, 28.5, z));
  f.push(...mover(pecas.chip(), 48, 28, z));
  f.push(...mover(pecas.subagente(CORES.roxo), 10, 50, z));
  f.push(...mover(pecas.revisao(), 88, 44, z));
  f.push(...mover(pecas.subagente(CORES.roxo), 10, 64, z));
  for (let i = 0; i < 5; i++) f.push(...mover(pecas.gate(i === 3 ? CORES.vermelho : CORES.verde), 62 + i * 10, 72, z));
  // conector de energia na frente
  return f;
}

function tela(p) {
  const [x, y] = projetar(p, S);
  return [x + OX, y + OY];
}

export function placaHarness(licoes) {
  const porId = Object.fromEntries(licoes.map((l) => [l.id, l]));
  const linhas = PONTOS.map((pt, i) => {
    const [ax, ay] = tela(pt.ancora);
    const [lx, ly] = ligacao(pt.caixa, [ax, ay]);
    const meio = Math.abs(lx - ax) > Math.abs(ly - ay) ? `${ax},${ly}` : `${lx},${ay}`;
    return (
      `<g class="placa__liga" data-i="${i}">` +
      `<polyline points="${lx},${ly} ${meio} ${ax},${ay}" fill="none" stroke="var(--ink-3)" stroke-width="1.2" stroke-dasharray="3 4"/>` +
      `<circle cx="${lx}" cy="${ly}" r="3.6" fill="var(--paper)" stroke="var(--acento)" stroke-width="2"/>` +
      `<circle cx="${ax}" cy="${ay}" r="5" fill="var(--paper)" stroke="var(--acento)" stroke-width="2.4"/>` +
            `</g>`
    );
  });

  const svg = `<svg class="placa__svg" viewBox="0 0 ${VB.w} ${VB.h}" role="img" aria-labelledby="placa-t">
<title id="placa-t">Placa do harness: spec, LLM, worktrees, subagents, gates de CI e revisão. Cada peça é uma lição da semana.</title>
${marcacao(cena(), { s: S, ox: OX, oy: OY, traco: 0.9 })}
${linhas.join('')}
</svg>`;

  const callouts = PONTOS.map((pt, i) => {
    const l = porId[pt.licao];
    return h(
      'a',
      {
        class: 'callout-iso',
        href: `#/licao/${pt.licao}`,
        'data-i': i,
        style: { left: `${(pt.caixa[0] / VB.w) * 100}%`, top: `${(pt.caixa[1] / VB.h) * 100}%` },
      },
      h('span', { class: 'callout-iso__num' }, String(i + 1)),
      h('span', { class: 'callout-iso__txt' }, h('strong', {}, pt.rotulo), h('span', {}, pt.texto), h('small', {}, `Lição ${l.numero}`)),
    );
  });

  const fig = h('figure', { class: 'placa' }, h('div', { class: 'placa__arte', html: svg }), h('div', { class: 'placa__callouts' }, callouts));

  // realça a linha do callout em foco
  fig.addEventListener('pointerover', (e) => realcar(e.target.closest('[data-i]')?.dataset.i));
  fig.addEventListener('pointerleave', () => realcar(null));
  fig.addEventListener('focusin', (e) => realcar(e.target.closest('[data-i]')?.dataset.i));
  fig.addEventListener('focusout', () => realcar(null));
  function realcar(i) {
    fig.querySelectorAll('[data-i]').forEach((el) => el.classList.toggle('ativo', i != null && el.dataset.i === i));
  }
  return fig;
}

