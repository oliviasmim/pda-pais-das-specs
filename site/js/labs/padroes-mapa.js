import { h } from '../ui.js';
import { MAPA, QUADRO, pontosDaSeta } from '../logic/padroes-mapa.js';

const NS = 'http://www.w3.org/2000/svg';
const reduzido = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function s(tag, attrs = {}, ...filhos) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined && v !== false) el.setAttribute(k, String(v));
  for (const f of filhos.flat()) if (f !== null && f !== undefined && f !== false) el.append(f instanceof Node ? f : document.createTextNode(String(f)));
  return el;
}

export function mount(el, ctx) {
  const salvo = ctx.state.load({});
  let padraoId = MAPA.some((p) => p.id === salvo.padraoId) ? salvo.padraoId : 'paralelo';
  let passo = 0;
  let timer = null;

  const abas = h('div', { class: 'pmapa-abas', role: 'radiogroup', 'aria-label': 'Padrão de orquestração' });
  const palco = h('div', { class: 'pmapa-palco' });
  const legenda = h('p', { class: 'pmapa-legenda', 'aria-live': 'polite' });
  const contador = h('span', { class: 'pmapa-contador mono' });
  const ant = h('button', { class: 'btn btn--sm btn--ghost', type: 'button', onclick: () => ir(passo - 1) }, 'Anterior');
  const prox = h('button', { class: 'btn btn--sm btn--primary', type: 'button', onclick: () => ir(passo + 1) }, 'Próximo passo');
  const tocar = h('button', { class: 'btn btn--sm btn--ghost', type: 'button', onclick: alternarTocar }, 'Tocar');
  const ficha = h('dl', { class: 'pmapa-ficha' });

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag' }, 'Laboratório'),
      h('h3', {}, 'Onde cada padrão gasta tempo'),
      h('p', {}, 'Escolha um naipe e avance um passo por vez. Perceba onde a seta volta e onde aparece o losango: é ali que entra o tempo que não é trabalho.'),
    ),
    h('div', { class: 'lab__body' },
      abas,
      palco,
      h('div', { class: 'row pmapa-controles' }, ant, prox, reduzido() ? null : tocar, contador),
      legenda,
      ficha,
    ),
  );

  const atual = () => MAPA.find((p) => p.id === padraoId);

  function desenharAbas() {
    abas.replaceChildren(
      ...MAPA.map((p) =>
        h('button', {
          class: 'pmapa-aba',
          type: 'button',
          role: 'radio',
          'aria-checked': String(p.id === padraoId),
          onclick: () => {
            parar();
            padraoId = p.id;
            passo = 0;
            ctx.state.save({ padraoId });
            tudo();
          },
        }, h('span', { class: 'pmapa-aba__naipe', 'aria-hidden': 'true' }, p.naipe), ' ', p.nome),
      ),
    );
  }

  function desenharSvg() {
    const p = atual();
    const ativos = new Set(p.passos[passo].ativos);
    const idSeta = 'pmapa-ponta';
    const svg = s('svg', {
      class: 'pmapa-svg',
      viewBox: `0 0 ${QUADRO.w} ${QUADRO.h}`,
      role: 'img',
      'aria-label': `Diagrama do padrão ${p.nome}: ${p.nos.map((n) => n.rotulo).join(', ')}.`,
    });
    svg.append(
      s('defs', {},
        s('marker', { id: idSeta, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' },
          s('path', { d: 'M0 0L10 5L0 10z', class: 'pmapa-ponta' })),
      ),
    );
    for (const seta of p.setas) {
      const { x1, y1, x2, y2 } = pontosDaSeta(p, seta);
      const viva = ativos.has(seta.de) && ativos.has(seta.para);
      svg.append(s('line', {
        x1, y1, x2, y2,
        class: `pmapa-seta${viva ? ' pmapa-seta--viva' : ''}`,
        'marker-end': `url(#${idSeta})`,
        'marker-start': seta.duplo ? `url(#${idSeta})` : null,
      }));
      if (seta.rotulo) {
        svg.append(s('text', { x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 8, class: 'pmapa-rotulo-seta', 'text-anchor': 'middle' }, seta.rotulo));
      }
    }
    for (const n of p.nos) {
      const ativo = ativos.has(n.id);
      const g = s('g', { class: `pmapa-no pmapa-no--${n.tipo}${ativo ? ' pmapa-no--ativo' : ''}` });
      if (n.tipo === 'integracao') {
        const cx = n.x + n.w / 2;
        const cy = n.y + n.h / 2;
        g.append(s('polygon', { points: `${cx},${n.y} ${n.x + n.w},${cy} ${cx},${n.y + n.h} ${n.x},${cy}` }));
      } else {
        g.append(s('rect', { x: n.x, y: n.y, width: n.w, height: n.h, rx: 10 }));
      }
      g.append(s('text', { x: n.x + n.w / 2, y: n.y + n.h / 2 - (n.sub ? 3 : -5), class: 'pmapa-no__rotulo', 'text-anchor': 'middle' }, n.rotulo));
      if (n.sub) g.append(s('text', { x: n.x + n.w / 2, y: n.y + n.h / 2 + 14, class: 'pmapa-no__sub', 'text-anchor': 'middle' }, n.sub));
      svg.append(g);
    }
    palco.replaceChildren(svg);
  }

  function desenharResto() {
    const p = atual();
    legenda.textContent = p.passos[passo].texto;
    contador.textContent = `${passo + 1} / ${p.passos.length}`;
    ant.disabled = passo === 0;
    prox.disabled = passo === p.passos.length - 1;
    ficha.replaceChildren(
      h('div', {}, h('dt', {}, 'Use quando'), h('dd', {}, p.usar)),
      h('div', { class: 'pmapa-ficha__custo' }, h('dt', {}, 'Onde custa'), h('dd', {}, p.custo)),
    );
  }

  function tudo() {
    desenharAbas();
    desenharSvg();
    desenharResto();
  }

  function ir(n) {
    const p = atual();
    passo = Math.max(0, Math.min(p.passos.length - 1, n));
    desenharSvg();
    desenharResto();
  }

  function parar() {
    if (timer) clearInterval(timer);
    timer = null;
    tocar.textContent = 'Tocar';
  }

  function alternarTocar() {
    if (timer) return parar();
    if (passo >= atual().passos.length - 1) ir(0);
    tocar.textContent = 'Parar';
    timer = setInterval(() => {
      if (passo >= atual().passos.length - 1) return parar();
      ir(passo + 1);
    }, 1800);
  }

  tudo();
  return parar;
}
