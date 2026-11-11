import { h } from '../ui.js';
import { passos, resumo, proximo, anterior, NOME_NO } from '../logic/ciclo-harness.js';

const SVG = 'http://www.w3.org/2000/svg';
function s(tag, attrs = {}, ...filhos) {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined && v !== false) el.setAttribute(k, String(v));
  for (const f of filhos.flat()) if (f) el.append(f instanceof Node ? f : document.createTextNode(String(f)));
  return el;
}

const POS = { guias: 12, llm: 176, ferramentas: 340, sensores: 504 };
const LARGURA = 124;
const SUB = {
  guias: 'AGENTS.md · spec · skill',
  llm: 'prevê o próximo token',
  ferramentas: 'Read · Edit · Bash',
  sensores: 'lint · tipos · testes · CI',
};
const PAPEL_NO = { guias: 'guia', llm: 'llm', ferramentas: 'ferr', sensores: 'sensor' };
const reduzido = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function mount(el, ctx) {
  const salvo = ctx.state.load({ guias: true, sensores: true }) || {};
  let cfg = { guias: salvo.guias !== false, sensores: salvo.sensores !== false };
  let i = 0;
  let timer = null;

  const caixas = {};
  const palco = s('svg', { viewBox: '0 0 640 200', role: 'img', 'aria-label': 'Ciclo do agente: guias, LLM, ferramentas e sensores' });
  palco.append(
    s('defs', {}, s('marker', { id: 'ch-seta', viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 7, markerHeight: 7, orient: 'auto' }, s('path', { d: 'M0,0 L8,4 L0,8 z', class: 'ch-seta' }))),
  );
  for (const [a, b] of [['guias', 'llm'], ['llm', 'ferramentas'], ['ferramentas', 'sensores']]) {
    palco.append(s('line', { x1: POS[a] + LARGURA, y1: 70, x2: POS[b] - 3, y2: 70, class: 'ch-fio', 'marker-end': 'url(#ch-seta)' }));
  }
  palco.append(
    s('path', { d: `M ${POS.sensores + LARGURA / 2} 112 C ${POS.sensores + LARGURA / 2} 175, ${POS.llm + LARGURA / 2} 175, ${POS.llm + LARGURA / 2} 114`, class: 'ch-fio ch-volta', 'marker-end': 'url(#ch-seta)', fill: 'none' }),
    s('text', { x: 320, y: 188, class: 'ch-rotulo', 'text-anchor': 'middle' }, 'o sinal do sensor volta para a janela'),
  );
  for (const id of Object.keys(POS)) {
    const g = s('g', { class: `ch-no ch-no--${PAPEL_NO[id]}`, 'data-no': id },
      s('rect', { x: POS[id], y: 28, width: LARGURA, height: 84, rx: 10 }),
      s('text', { x: POS[id] + LARGURA / 2, y: 62, class: 'ch-no__nome', 'text-anchor': 'middle' }, NOME_NO[id]),
      s('text', { x: POS[id] + LARGURA / 2, y: 86, class: 'ch-no__sub', 'text-anchor': 'middle' }, SUB[id]),
    );
    caixas[id] = g;
    palco.append(g);
  }
  const barraGuias = s('text', { x: POS.guias + LARGURA / 2, y: 20, class: 'ch-etiqueta', 'text-anchor': 'middle' }, 'antes');
  const barraSensores = s('text', { x: POS.sensores + LARGURA / 2, y: 20, class: 'ch-etiqueta', 'text-anchor': 'middle' }, 'depois');
  palco.append(barraGuias, barraSensores);

  const titulo = h('h4', { class: 'ch-passo__titulo' });
  const texto = h('p', { class: 'ch-passo__texto' });
  const chip = h('span', { class: 'chip' });
  const contador = h('span', { class: 'muted mono' });
  const leitura = h('p', { class: 'ch-leitura muted', 'aria-live': 'polite' });
  const painel = h('div', { class: 'ch-passo', 'aria-live': 'polite' }, h('div', { class: 'row' }, chip, contador), titulo, texto);
  const btnPlay = h('button', { type: 'button', class: 'btn btn--sm btn--primary' }, 'Tocar');
  const btnAnt = h('button', { type: 'button', class: 'btn btn--sm', onclick: () => ir(anterior(i)) }, 'Voltar');
  const btnProx = h('button', { type: 'button', class: 'btn btn--sm', onclick: () => ir(proximo(i, passos(cfg).length)) }, 'Avançar');

  const opcao = (chave, rotulo) => {
    const input = h('input', { type: 'checkbox', checked: cfg[chave], onchange: (e) => {
      cfg = { ...cfg, [chave]: e.target.checked };
      ctx.state.save(cfg);
      parar();
      i = 0;
      render();
    } });
    return h('label', { class: 'ch-opcao' }, input, ' ', rotulo);
  };

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag' }, 'Laboratório'),
      h('h3', {}, 'O ciclo do harness, passo a passo'),
      h('p', {}, 'Siga o agente implementando a T1. Depois desligue os guias, os sensores ou os dois e veja onde o ciclo quebra.'),
    ),
    h('div', { class: 'lab__body' },
      h('div', { class: 'row ch-opcoes' }, opcao('guias', 'Guias ligados'), opcao('sensores', 'Sensores ligados')),
      h('div', { class: 'ch-palco' }, palco),
      painel,
      h('div', { class: 'row ch-controles' }, btnAnt, btnPlay, btnProx),
      leitura,
    ),
  );

  btnPlay.addEventListener('click', () => (timer ? parar() : tocar()));

  function parar() {
    clearInterval(timer);
    timer = null;
    btnPlay.textContent = 'Tocar';
  }
  function tocar() {
    const total = passos(cfg).length;
    if (i >= total - 1) i = 0;
    render();
    if (reduzido()) return;
    btnPlay.textContent = 'Pausar';
    timer = setInterval(() => {
      const t = passos(cfg).length;
      if (i >= t - 1) return parar();
      i += 1;
      render();
    }, 2600);
  }
  function ir(novo) {
    parar();
    i = novo;
    render();
  }

  function render() {
    const lista = passos(cfg);
    i = Math.min(i, lista.length - 1);
    const p = lista[i];
    for (const [id, g] of Object.entries(caixas)) {
      g.classList.toggle('is-ativo', p.ativos.includes(id));
      g.classList.toggle('is-falha', Boolean(p.falha) && p.ativos.includes(id));
      g.classList.toggle('is-off', (id === 'guias' && !cfg.guias) || (id === 'sensores' && !cfg.sensores));
    }
    chip.className = `chip ${p.falha ? 'chip--bad' : p.ok ? 'chip--ok' : p.papel === 'guia' ? 'chip--warn' : ''}`;
    chip.textContent = { guia: 'guia', llm: 'LLM', ferramenta: 'ferramenta', sensor: 'sensor' }[p.papel];
    contador.textContent = `passo ${i + 1} de ${lista.length}`;
    titulo.textContent = p.titulo;
    texto.textContent = p.texto;
    btnAnt.disabled = i === 0;
    btnProx.disabled = i === lista.length - 1;
    leitura.textContent = i === lista.length - 1 ? resumo(cfg) : '';
  }

  render();
  return () => clearInterval(timer);
}
