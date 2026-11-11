import { h } from '../ui.js';
import { N_MAX, PADRAO, canais, curva, fmt, leitura, melhorN, normalizar } from '../logic/custo-coordenacao.js';

const NS = 'http://www.w3.org/2000/svg';
const L = 640;
const A = 280;
const M = { e: 46, d: 16, c: 16, b: 34 };

function s(tag, attrs = {}, ...filhos) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined && v !== false) el.setAttribute(k, String(v));
  for (const f of filhos.flat()) if (f !== null && f !== undefined && f !== false) el.append(f instanceof Node ? f : document.createTextNode(String(f)));
  return el;
}

export function mount(el, ctx) {
  const salvo = ctx.state.load({});
  let p = normalizar({ ...PADRAO, ...(salvo.p || {}) });
  let n = Math.min(N_MAX, Math.max(1, Math.round(salvo.n || 3)));

  const grafico = h('div', { class: 'cc-grafico' });
  const leitor = h('div', { class: 'cc-leitura', 'aria-live': 'polite' });
  const tabela = h('div', { class: 'cc-tabela-wrap' });
  const campos = h('div', { class: 'cc-campos' });

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag' }, 'Laboratório'),
      h('h3', {}, 'Quanto custa mais um agente?'),
      h('p', {}, 'Arraste os controles e veja quando a linha do tempo real se afasta da ideal. Os valores iniciais são as três tasks da agenda (T1, T2, T3).'),
    ),
    h('div', { class: 'lab__body' }, campos, grafico, leitor, tabela,
      h('p', { class: 'muted cc-aviso' }, 'Isto é um modelo para treinar a intuição, não uma medição. Tempo = parte serial + parte dividida entre os agentes que têm o que fazer + subida de cada agente + atrito por par de agentes (n·(n−1)/2). Quando você rodar uma sessão paralela de verdade, confie no seu log.'),
    ),
  );

  function salvar() {
    ctx.state.save({ p, n });
  }

  function campo(rotulo, chave, min, max, passo, fmtVal) {
    const out = h('output', { class: 'mono' }, fmtVal(p[chave]));
    const input = h('input', { type: 'range', min, max, step: passo, value: p[chave], 'aria-label': rotulo });
    input.addEventListener('input', () => {
      p = normalizar({ ...p, [chave]: Number(input.value) });
      out.textContent = fmtVal(p[chave]);
      salvar();
      atualizar();
    });
    return h('label', { class: 'cc-campo' }, h('span', {}, rotulo), input, out);
  }

  function desenharCampos() {
    const nIn = h('input', { type: 'range', min: 1, max: N_MAX, step: 1, value: n, 'aria-label': 'Número de agentes' });
    const nOut = h('output', { class: 'mono' }, String(n));
    nIn.addEventListener('input', () => {
      n = Number(nIn.value);
      nOut.textContent = String(n);
      salvar();
      atualizar();
    });
    campos.replaceChildren(
      h('label', { class: 'cc-campo cc-campo--n' }, h('span', {}, 'Agentes'), nIn, nOut),
      campo('Trabalho total (min, um agente)', 'trabalho', 6, 90, 1, (v) => `${v} min`),
      campo('Partes independentes', 'partes', 1, 8, 1, (v) => String(v)),
      campo('Parte serial (planejar, integrar, revisar)', 'fracaoSerial', 0, 0.5, 0.05, (v) => `${Math.round(v * 100)}%`),
      campo('Subida de cada agente (ler spec e arquivos)', 'subida', 0, 4, 0.5, (v) => `${fmt(v)} min`),
      campo('Atrito por par de agentes (alinhar, esperar)', 'atrito', 0, 2, 0.25, (v) => `${fmt(v)} min`),
    );
  }

  function desenharGrafico(pontos) {
    const topo = Math.max(...pontos.map((x) => Math.max(x.real, x.ideal)), p.trabalho) * 1.08;
    const x = (i) => M.e + ((L - M.e - M.d) * (i - 1)) / (N_MAX - 1);
    const y = (v) => M.c + (A - M.c - M.b) * (1 - v / topo);
    const melhor = melhorN(p);
    const svg = s('svg', {
      class: 'cc-svg',
      viewBox: `0 0 ${L} ${A}`,
      role: 'img',
      'aria-label': `Tempo por número de agentes. Um agente: ${fmt(pontos[0].real)} minutos. Com ${n}: ${fmt(pontos[n - 1].real)} minutos reais contra ${fmt(pontos[n - 1].ideal)} ideais. Melhor ponto: ${melhor}.`,
    });
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(topo * f));
    for (const t of ticks) {
      svg.append(s('line', { x1: M.e, x2: L - M.d, y1: y(t), y2: y(t), class: 'cc-grade' }));
      svg.append(s('text', { x: M.e - 6, y: y(t) + 4, class: 'cc-eixo', 'text-anchor': 'end' }, `${t}`));
    }
    for (const q of pontos) svg.append(s('text', { x: x(q.n), y: A - 12, class: 'cc-eixo', 'text-anchor': 'middle' }, `${q.n}`));
    svg.append(s('text', { x: (M.e + L - M.d) / 2, y: A - 0, class: 'cc-eixo cc-eixo--tit', 'text-anchor': 'middle' }, 'agentes'));
    svg.append(s('text', { x: 4, y: 10, class: 'cc-eixo cc-eixo--tit' }, 'min'));
    svg.append(s('line', { x1: x(n), x2: x(n), y1: M.c, y2: A - M.b, class: 'cc-sel' }));
    svg.append(s('polyline', { points: pontos.map((q) => `${x(q.n)},${y(q.ideal)}`).join(' '), class: 'cc-linha cc-linha--ideal' }));
    svg.append(s('polyline', { points: pontos.map((q) => `${x(q.n)},${y(q.real)}`).join(' '), class: 'cc-linha cc-linha--real' }));
    for (const q of pontos) {
      svg.append(s('circle', { cx: x(q.n), cy: y(q.real), r: q.n === n ? 6 : 3.5, class: `cc-ponto${q.n === melhor ? ' cc-ponto--melhor' : ''}${q.n === n ? ' cc-ponto--sel' : ''}` }));
    }
    const b = pontos[melhor - 1];
    svg.append(s('text', { x: x(melhor), y: y(b.real) - 12, class: 'cc-eixo cc-eixo--melhor', 'text-anchor': 'middle' }, 'melhor'));
    grafico.replaceChildren(
      svg,
      h('p', { class: 'cc-chaves' },
        h('span', { class: 'cc-chave cc-chave--ideal' }, 'ideal (total ÷ agentes)'),
        h('span', { class: 'cc-chave cc-chave--real' }, 'real, com coordenação'),
      ),
    );
  }

  function desenharTabela(pontos) {
    tabela.replaceChildren(
      h('table', { class: 'cc-tabela' },
        h('caption', { class: 'sr-only' }, 'Tempo e tokens por número de agentes'),
        h('thead', {}, h('tr', {}, ['Agentes', 'Ideal', 'Real', 'Aceleração', 'Pares', 'Tokens'].map((t) => h('th', { scope: 'col' }, t)))),
        h('tbody', {}, pontos.map((q) =>
          h('tr', { class: q.n === n ? 'cc-linha-sel' : '' },
            h('th', { scope: 'row' }, String(q.n)),
            h('td', { class: 'mono' }, `${fmt(q.ideal)} min`),
            h('td', { class: 'mono' }, `${fmt(q.real)} min`),
            h('td', { class: 'mono' }, `${fmt(q.aceleracao)}x`),
            h('td', { class: 'mono' }, String(canais(q.n))),
            h('td', { class: 'mono' }, `${q.tokens}k`),
          ))),
      ),
    );
  }

  function atualizar() {
    const pontos = curva(p);
    desenharGrafico(pontos);
    desenharTabela(pontos);
    leitor.replaceChildren(...leitura(p, n).map((f) => h('p', {}, f)));
  }

  desenharCampos();
  atualizar();
}
