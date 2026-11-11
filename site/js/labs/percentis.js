import { h } from '../ui.js';
import { simular, estatisticas, histograma, fracaoAfetada, frase, criarRng, amostrarBackend } from '../logic/percentis.js';

const SVG = 'http://www.w3.org/2000/svg';
const LIMITE = 1000;
const FAIXAS = 80;

function s(tag, attrs = {}, ...filhos) {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  for (const f of filhos) el.append(f instanceof Node ? f : document.createTextNode(String(f)));
  return el;
}

const PRESETS = [
  { nome: 'Um backend saudável', cauda: 2, fanout: 1 },
  { nome: 'Fan-out 5', cauda: 2, fanout: 5 },
  { nome: 'Fan-out 20', cauda: 2, fanout: 20 },
  { nome: 'Cauda pesada', cauda: 8, fanout: 1 },
];

const MARCAS = [
  { chave: 'media', rotulo: 'média', cor: 'var(--ouro)', tracejado: true },
  { chave: 'p50', rotulo: 'p50', cor: 'var(--tinta)' },
  { chave: 'p95', rotulo: 'p95', cor: 'var(--uva)' },
  { chave: 'p99', rotulo: 'p99', cor: 'var(--copas)' },
];

export function mount(el, ctx) {
  const salvo = ctx.state.load({ cauda: 2, fanout: 1, semente: 42 });
  const estado = { cauda: salvo.cauda ?? 2, fanout: salvo.fanout ?? 1, semente: salvo.semente ?? 42 };

  const W = 640;
  const H = 250;
  const M = { t: 50, r: 16, b: 34, l: 16 };
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'pc-hist', role: 'img', 'aria-labelledby': `pc-titulo-${ctx.licaoId}` });
  const tituloSvg = s('title', { id: `pc-titulo-${ctx.licaoId}` }, 'Histograma do tempo de resposta');
  svg.append(tituloSvg);

  const caudaInput = h('input', { type: 'range', min: '0', max: '10', step: '0.5', value: String(estado.cauda), id: `pc-cauda-${ctx.licaoId}` });
  const fanInput = h('input', { type: 'range', min: '1', max: '20', step: '1', value: String(estado.fanout), id: `pc-fan-${ctx.licaoId}` });
  const caudaVal = h('output', { class: 'pc-val mono', for: caudaInput.id });
  const fanVal = h('output', { class: 'pc-val mono', for: fanInput.id });

  const tiles = Object.fromEntries(MARCAS.map((m) => [m.chave, h('strong', { class: 'pc-tile__num mono' })]));
  const resumo = h('p', { class: 'pc-resumo', 'aria-live': 'polite' });
  const chamadas = h('div', { class: 'pc-chamadas' });
  const medidor = h('div', { class: 'pc-medidor__barra' });
  const medidorTxt = h('p', { class: 'pc-medidor__txt' });

  const presets = h(
    'div',
    { class: 'row pc-presets', role: 'group', 'aria-label': 'Cenários prontos' },
    PRESETS.map((p) =>
      h('button', {
        class: 'btn btn--sm',
        type: 'button',
        onclick: () => {
          estado.cauda = p.cauda;
          estado.fanout = p.fanout;
          caudaInput.value = String(p.cauda);
          fanInput.value = String(p.fanout);
          atualizar();
        },
      }, p.nome),
    ),
    h('button', {
      class: 'btn btn--sm btn--ghost',
      type: 'button',
      title: 'Sorteia outra amostra com a mesma configuração',
      onclick: () => {
        estado.semente = (estado.semente * 7919 + 13) % 100000;
        atualizar();
      },
    }, '↻ Nova amostra'),
  );

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag' }, 'Laboratório'),
      h('h3', {}, 'O relógio do Coelho: quanto espera quem cai na cauda?'),
      h('p', {}, 'Mexa na cauda e no fan-out. Perceba que a média quase não sai do lugar enquanto o p99 dispara.'),
    ),
    h('div', { class: 'lab__body' },
      h('div', { class: 'pc-controles' },
        h('div', { class: 'pc-controle' },
          h('label', { for: caudaInput.id }, 'Requisições lentas em cada backend (cauda)'),
          h('div', { class: 'row' }, caudaInput, caudaVal),
        ),
        h('div', { class: 'pc-controle' },
          h('label', { for: fanInput.id }, 'Fan-out: chamadas por requisição'),
          h('div', { class: 'row' }, fanInput, fanVal),
        ),
      ),
      presets,
      h('div', { class: 'pc-tiles' },
        MARCAS.map((m) => h('div', { class: 'pc-tile', style: { '--cor': m.cor } }, h('span', { class: 'pc-tile__rot' }, m.rotulo), tiles[m.chave])),
      ),
      h('figure', { class: 'pc-fig' }, svg, h('figcaption', { class: 'faint' }, '2.000 requisições simuladas. Eixo: tempo de resposta em ms (o que passa de 1 s fica na última barra). Altura em escala de raiz quadrada, para a cauda aparecer.')),
      resumo,
      h('div', { class: 'grid-2 pc-baixo' },
        h('section', { class: 'pc-exemplo' },
          h('h4', {}, 'Uma requisição, chamada por chamada'),
          h('p', { class: 'muted' }, 'A resposta só sai quando a chamada mais lenta termina. A barra destacada é quem segura todo mundo.'),
          chamadas,
        ),
        h('section', { class: 'pc-medidor' },
          h('h4', {}, 'Quem sente a cauda?'),
          h('div', { class: 'pc-medidor__trilho', 'aria-hidden': 'true' }, medidor),
          medidorTxt,
        ),
      ),
    ),
  );

  function desenhar(stats, hist) {
    while (svg.lastChild && svg.lastChild !== tituloSvg) svg.lastChild.remove();
    const larguraUtil = W - M.l - M.r;
    const alturaUtil = H - M.t - M.b;
    const todas = [...hist.contagens, hist.foraDoGrafico];
    const maior = Math.sqrt(Math.max(...todas, 1));
    const bw = larguraUtil / (FAIXAS + 1);
    const x = (ms) => M.l + (Math.min(ms, LIMITE) / LIMITE) * (larguraUtil - bw);

    svg.append(s('line', { x1: M.l, x2: W - M.r, y1: H - M.b, y2: H - M.b, class: 'pc-eixo' }));
    todas.forEach((c, i) => {
      if (!c) return;
      const alt = Math.max((Math.sqrt(c) / maior) * alturaUtil, 2);
      svg.append(s('rect', {
        x: M.l + i * bw + 0.5,
        y: H - M.b - alt,
        width: Math.max(bw - 1, 1),
        height: alt,
        rx: 1.5,
        class: i === FAIXAS ? 'pc-barra pc-barra--fora' : 'pc-barra',
      }));
    });
    for (const ms of [0, 250, 500, 750, 1000]) {
      const xx = ms === 1000 ? M.l + FAIXAS * bw + bw / 2 : x(ms);
      svg.append(s('text', { x: xx, y: H - M.b + 18, class: 'pc-tick', 'text-anchor': 'middle' }, ms === 1000 ? '≥1 s' : `${ms}`));
    }

    const posicoes = [];
    for (const m of MARCAS) {
      const v = stats[m.chave];
      const xx = x(v);
      let nivel = 0;
      while (posicoes.some((p) => p.nivel === nivel && Math.abs(p.x - xx) < 62)) nivel++;
      posicoes.push({ x: xx, nivel });
      svg.append(s('line', {
        x1: xx, x2: xx, y1: 17 + Math.min(nivel, 3) * 12, y2: H - M.b,
        stroke: m.cor, 'stroke-width': 2, 'stroke-dasharray': m.tracejado ? '5 4' : 'none',
      }));
      const anchor = xx > W - 90 ? 'end' : 'start';
      svg.append(s('text', {
        x: anchor === 'end' ? xx - 4 : xx + 4,
        y: 13 + Math.min(nivel, 3) * 12,
        fill: m.cor,
        class: 'pc-marca',
        'text-anchor': anchor,
      }, `${m.rotulo} ${Math.round(v)}`));
    }
  }

  function desenharChamadas() {
    const rand = criarRng(estado.semente + 1);
    const n = estado.fanout;
    let tempos = [];
    for (let tentativa = 0; tentativa < 40; tentativa++) {
      tempos = Array.from({ length: n }, () => amostrarBackend(rand, { cauda: estado.cauda / 100 }));
      if (n === 1 || Math.max(...tempos) > 200 || tentativa === 39) break;
    }
    const maior = Math.max(...tempos);
    const escala = Math.max(maior, 300);
    chamadas.replaceChildren(
      ...tempos.map((t, i) =>
        h('div', { class: `pc-chamada${n > 1 && t === maior ? ' pc-chamada--lenta' : ''}` },
          h('span', { class: 'pc-chamada__rot mono' }, `#${i + 1}`),
          h('span', { class: 'pc-chamada__trilho' }, h('span', { class: 'pc-chamada__barra', style: { width: `${(t / escala) * 100}%` } })),
          h('span', { class: 'pc-chamada__ms mono' }, `${Math.round(t)} ms`),
        ),
      ),
      h('p', { class: 'pc-chamada__total' }, 'Resposta ao usuário: ', h('strong', { class: 'mono' }, `${Math.round(maior)} ms`)),
    );
  }

  function atualizar() {
    estado.cauda = Number(caudaInput.value);
    estado.fanout = Number(fanInput.value);
    caudaVal.textContent = `${estado.cauda.toLocaleString('pt-BR')}%`;
    fanVal.textContent = `${estado.fanout}×`;
    const tempos = simular({ requisicoes: 2000, fanout: estado.fanout, cauda: estado.cauda / 100, semente: estado.semente });
    const stats = estatisticas(tempos);
    const hist = histograma(tempos, { faixas: FAIXAS, limite: LIMITE });
    for (const m of MARCAS) tiles[m.chave].textContent = `${Math.round(stats[m.chave])} ms`;
    desenhar(stats, hist);
    desenharChamadas();
    resumo.textContent = frase({ fanout: estado.fanout, stats });
    const afetada = fracaoAfetada(estado.fanout);
    medidor.style.width = `${Math.max(afetada * 100, 1)}%`;
    medidorTxt.innerHTML = '';
    medidorTxt.append(
      h('strong', { class: 'mono' }, `${(afetada * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`),
      ` das requisições encostam em pelo menos uma chamada acima do p99 do backend (1 − 0,99`,
      h('sup', {}, String(estado.fanout)),
      ').',
    );
    ctx.state.save({ ...estado });
  }

  caudaInput.addEventListener('input', atualizar);
  fanInput.addEventListener('input', atualizar);
  atualizar();
}
