// Interface das máquinas (motions). Recebe a definição pura de site/js/logic/motion-<id>.js
// e desenha o palco em SVG, os controles, o painel e as abas. Sem dependências.
import { h } from './ui.js';
import {
  TIPOS,
  iso,
  prisma,
  pontosSvg,
  centro,
  alturaTopo,
  faixasCamadas,
  caminhoTrilho,
  mesa,
  limitesCena,
  alturaEtiqueta,
  normalizarMontagem,
  normalizarAvarias,
  codificarMontagem,
  decodificarMontagem,
  estadoAte,
  trilhosAcesos,
  chaveTrilho,
  contarRazao,
  rastroMarkdown,
} from './logic/motion.js';

const SVG = 'http://www.w3.org/2000/svg';
const VELOCIDADES = [0.5, 1, 2, 4];
const PASSO_MS = 2600;
let contador = 0;

function s(tag, attrs = {}, ...filhos) {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined && v !== false) el.setAttribute(k, String(v));
  for (const f of filhos.flat()) if (f) el.append(f instanceof Node ? f : document.createTextNode(String(f)));
  return el;
}

const rotuloVel = (v) => (v === 0.5 ? '½×' : `${v}×`);
const reduzido = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Monta uma máquina dentro de el (já com a classe .lab).
 * opcoes.inicial: texto de montagem ("campo=valor;q=avaria") para começar.
 * opcoes.telaCheia: true quando a máquina é a página inteira (#/maquina/<id>).
 */
export function montarMotion(el, ctx, def, opcoes = {}) {
  const uid = `m${++contador}`;
  const salvo = ctx.state?.load?.(null) || {};
  const inicial = decodificarMontagem(def, opcoes.inicial || el.dataset.montagem || '');
  const temInicial = Boolean(opcoes.inicial || el.dataset.montagem);

  const st = {
    montagem: temInicial ? inicial.montagem : normalizarMontagem(def, salvo.montagem || {}),
    avarias: new Set(temInicial ? inicial.avarias : normalizarAvarias(def, salvo.avarias || [])),
    i: -1,
    tocando: false,
    vel: 1,
    aberta: false,
    rabisco: salvo.rabisco ?? 1,
    rotulos: salvo.rotulos ?? true,
    aba: 'rodada',
    selecionada: null,
    resultado: null,
  };
  let timer = null;

  const salvar = () => ctx.state?.save?.({ montagem: st.montagem, avarias: [...st.avarias], rabisco: st.rabisco, rotulos: st.rotulos });

  /* ---------- cabeçalho ---------- */
  el.classList.add('m-maquina');
  if (opcoes.telaCheia) el.classList.add('m-maquina--cheia');
  const cab = h(
    'header',
    { class: 'lab__head m-cab' },
    h('span', { class: 'lab__tag' }, `Máquina · ${def.fig}`),
    h('h3', {}, def.titulo),
    h('p', {}, def.lead, ' ', h('span', { class: 'm-dica' }, def.dica)),
  );

  /* ---------- barra de controles ---------- */
  const btnRodar = h('button', { type: 'button', class: 'm-btn m-btn--forte', 'aria-keyshortcuts': 'Space' }, 'Rodar');
  const btnPasso = h('button', { type: 'button', class: 'm-btn', 'aria-keyshortcuts': 'ArrowRight' }, 'Passo');
  const btnVoltar = h('button', { type: 'button', class: 'm-btn', 'aria-label': 'Voltar um passo', 'aria-keyshortcuts': 'ArrowLeft' }, '←');
  const menuQuebrar = h('div', { class: 'm-menu', role: 'group', 'aria-label': 'Peças que você pode quebrar' });
  const quebrar = h('details', { class: 'm-quebrar' }, h('summary', { class: 'm-btn m-btn--quebrar' }, 'Quebrar'), menuQuebrar);
  const btnConsertar = h('button', { type: 'button', class: 'm-btn' }, 'Consertar');
  const btnAbrir = h('button', { type: 'button', class: 'm-btn', 'aria-pressed': 'false', 'aria-keyshortcuts': 'A' }, 'Abrir a caixa');
  const btnZerar = h('button', { type: 'button', class: 'm-btn' }, 'Zerar');
  const grupoVel = h(
    'div',
    { class: 'm-vel', role: 'group', 'aria-label': 'Velocidade' },
    VELOCIDADES.map((v) =>
      h('button', { type: 'button', class: 'm-btn m-btn--vel', 'data-vel': v, 'aria-pressed': v === st.vel ? 'true' : 'false', onclick: () => definirVel(v) }, rotuloVel(v)),
    ),
  );

  const selects = (def.montagem || []).map((c) => {
    const sel = h(
      'select',
      { class: 'm-select', id: `${uid}-${c.id}`, 'data-campo': c.id },
      c.opcoes.map((o) => h('option', { value: o.valor }, o.rotulo)),
    );
    sel.value = st.montagem[c.id];
    sel.addEventListener('change', () => {
      st.montagem[c.id] = sel.value;
      recalcular(true);
    });
    return h('label', { class: 'm-campo', for: `${uid}-${c.id}` }, h('span', {}, c.rotulo), sel);
  });

  const rabisco = h('input', { type: 'range', min: '0', max: '3', step: '1', value: String(st.rabisco), id: `${uid}-rab`, class: 'm-range' });
  const rotulos = h('input', { type: 'checkbox', id: `${uid}-rot`, class: 'm-check' });
  rotulos.checked = st.rotulos;

  const barra = h(
    'div',
    { class: 'm-barra' },
    h('div', { class: 'm-grupo' }, h('span', { class: 'm-grupo__nome' }, 'Rodar'), btnRodar, btnPasso, btnVoltar, quebrar, btnConsertar, btnAbrir, btnZerar, grupoVel),
    selects.length ? h('div', { class: 'm-grupo' }, h('span', { class: 'm-grupo__nome' }, 'Montagem'), selects) : null,
    h(
      'div',
      { class: 'm-grupo' },
      h('span', { class: 'm-grupo__nome' }, 'Olhar'),
      h('label', { class: 'm-campo', for: `${uid}-rab` }, h('span', {}, 'Rabisco'), rabisco),
      h('label', { class: 'm-campo m-campo--check', for: `${uid}-rot` }, rotulos, h('span', {}, 'Rótulos')),
    ),
  );

  /* ---------- passos, narração, palco ---------- */
  const listaPassos = h('ol', { class: 'm-passos', 'aria-label': 'Passos da máquina' });
  const narra = h('p', { class: 'm-narra', 'aria-live': 'polite' });
  const svg = s('svg', { class: 'm-svg', role: 'img', 'aria-label': `Desenho da máquina: ${def.titulo}` });
  const dentro = h('div', { class: 'm-dentro', 'aria-hidden': 'true' });
  const quebradas = h('div', { class: 'm-quebradas' });
  const palco = h(
    'div',
    {
      class: 'm-palco',
      tabindex: '0',
      role: 'group',
      'aria-label': `${def.titulo}. Espaço roda ou pausa. Seta para a direita avança um passo. Seta para a esquerda volta. A abre a caixa.`,
    },
    quebradas,
    svg,
    dentro,
  );

  const etapa = h('div', { class: 'm-etapa' });
  const metricas = h('div', { class: 'm-metricas' });
  const ideia = h('p', { class: 'm-ideia' }, h('b', {}, 'A ideia'), ' ', def.ideia);

  /* ---------- painel lateral com abas ---------- */
  const ABAS = [
    ['rodada', 'Rodada'],
    ['tente', 'Tente'],
    ['razao', 'Livro-razão'],
    ['abrir', 'Abrir'],
    ['rastro', 'Rastro'],
  ];
  const tabs = h('div', { class: 'm-tabs', role: 'tablist', 'aria-label': 'Detalhes da máquina' });
  const paineis = {};
  for (const [id, nome] of ABAS) {
    const b = h('button', { type: 'button', role: 'tab', id: `${uid}-tab-${id}`, 'aria-controls': `${uid}-pn-${id}`, 'data-aba': id }, nome);
    b.addEventListener('click', () => trocarAba(id));
    b.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const k = ABAS.findIndex(([a]) => a === id);
      const prox = ABAS[(k + (e.key === 'ArrowRight' ? 1 : ABAS.length - 1)) % ABAS.length][0];
      trocarAba(prox);
      tabs.querySelector(`[data-aba="${prox}"]`).focus();
    });
    tabs.append(b);
    paineis[id] = h('div', { class: 'm-painel', role: 'tabpanel', id: `${uid}-pn-${id}`, 'aria-labelledby': `${uid}-tab-${id}` });
  }
  const lado = h('aside', { class: 'm-lado', 'aria-label': 'Painel da máquina' }, tabs, Object.values(paineis));

  /* ---------- o que a máquina mostra ---------- */
  const acoes = h(
    'div',
    { class: 'row m-acoes' },
    h('button', { type: 'button', class: 'btn btn--sm', onclick: copiarLink }, 'Copiar link desta montagem'),
    h('button', { type: 'button', class: 'btn btn--sm', onclick: baixarRastro }, 'Baixar o rastro (.md)'),
    opcoes.telaCheia ? null : h('a', { class: 'btn btn--sm btn--ghost', href: `#/maquina/${def.id}` }, 'Abrir em tela cheia ⛶'),
  );
  const mostra = h(
    'section',
    { class: 'm-mostra' },
    h('h4', {}, 'O que a máquina mostra'),
    h(
      'div',
      { class: 'm-licoes' },
      def.licoes.map((l) => h('div', { class: 'm-licao' }, h('strong', {}, l.titulo), h('p', {}, l.texto))),
    ),
    h('p', { class: 'm-nota' }, def.nota),
    acoes,
  );

  const principal = h('div', { class: 'm-principal' }, listaPassos, narra, palco, etapa, metricas, ideia);
  el.replaceChildren(cab, h('div', { class: 'lab__body m-corpo' }, barra, h('div', { class: 'm-grade' }, principal, lado), mostra));

  /* ---------- desenho da cena ---------- */
  let cena = null;

  function desenharCena() {
    const desligadas = new Set(st.resultado.desligadas || []);
    const ests = def.estacoes;
    const vb = limitesCena(ests, st.aberta);
    svg.setAttribute('viewBox', `${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`);
    svg.replaceChildren();

    const escala = [0, 1.4, 2.6, 4][st.rabisco] || 0;
    const defs = s(
      'defs',
      {},
      s(
        'filter',
        { id: `${uid}-rab`, x: '-5%', y: '-5%', width: '110%', height: '110%' },
        s('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.035', numOctaves: '2', seed: '3', result: 'r' }),
        s('feDisplacementMap', { in: 'SourceGraphic', in2: 'r', scale: escala, xChannelSelector: 'R', yChannelSelector: 'G' }),
      ),
      s('pattern', { id: `${uid}-pontos`, width: '14', height: '14', patternUnits: 'userSpaceOnUse' }, s('circle', { cx: '2', cy: '2', r: '0.9', class: 'm-ponto' })),
    );
    svg.append(defs, s('rect', { x: vb.x, y: vb.y, width: vb.w, height: vb.h, fill: `url(#${uid}-pontos)` }));
    const raiz = s('g', { filter: escala ? `url(#${uid}-rab)` : null });
    svg.append(raiz);

    // mesa
    const m = prisma(mesa(ests), -0.7, 0);
    raiz.append(
      s('g', { class: 'm-mesa' }, s('polygon', { class: 'm-f-frente', points: pontosSvg(m.frente) }), s('polygon', { class: 'm-f-lado', points: pontosSvg(m.lado) }), s('polygon', { class: 'm-f-topo', points: pontosSvg(m.topo) })),
    );

    // trilhos
    const porId = Object.fromEntries(ests.map((e) => [e.id, e]));
    const trilhos = s('g', { class: 'm-trilhos' });
    const elTrilhos = {};
    for (const t of def.trilhos || []) {
      const [a, b, opt = {}] = t;
      const d =
        'M' +
        caminhoTrilho(porId[a], porId[b], opt.desvio || 0)
          .map(([x, y]) => iso(x, y, 0.02).map((n) => n.toFixed(1)).join(' '))
          .join(' L');
      const g = s('g', { class: 'm-trilho', 'data-volta': opt.desvio ? '1' : null }, s('path', { d, class: 'm-trilho__base' }), s('path', { d, class: 'm-trilho__fluxo' }));
      elTrilhos[chaveTrilho(a, b)] = g;
      trilhos.append(g);
    }
    raiz.append(trilhos);

    // estações em ordem de profundidade
    const elEst = {};
    const ordem = [...ests].sort((a, b) => centro(a).x + centro(a).y - (centro(b).x + centro(b).y));
    for (const e of ordem) {
      const idx = ests.indexOf(e);
      const tipo = TIPOS[e.tipo];
      const g = s('g', {
        class: 'm-est',
        'data-id': e.id,
        'data-tipo': e.tipo,
        style: `--c: var(--${tipo.cor})`,
        tabindex: '0',
        role: 'button',
        'aria-label': `${e.rotulo}. ${tipo.rotulo}. Abrir detalhes.`,
        'data-desligada': desligadas.has(e.id) ? '1' : null,
        'data-quebrada': (def.avarias || []).some((a) => a.estacao === e.id && st.avarias.has(a.id)) ? '1' : null,
      });
      const corpo = prisma(e, 0, e.h);
      g.append(
        s('polygon', { class: 'm-f-frente', points: pontosSvg(corpo.frente) }),
        s('polygon', { class: 'm-f-lado', points: pontosSvg(corpo.lado) }),
        s('polygon', { class: 'm-f-topo', points: pontosSvg(corpo.topo) }),
      );
      // medidor (janela de contexto) na face da frente
      if (e.medidor) {
        const nivel = s('polygon', { class: 'm-nivel', points: '' });
        const limite = e.medidor.limite ?? 0.4;
        const [l1, l2] = [iso(e.x, e.y + e.d, e.h * limite), iso(e.x + e.w, e.y + e.d, e.h * limite)];
        g.append(nivel, s('line', { class: 'm-limite', x1: l1[0], y1: l1[1], x2: l2[0], y2: l2[1] }));
        g.medidor = nivel;
      }
      // camadas (a pilha que abre quando você clica em "Abrir a caixa")
      for (const [k, f] of faixasCamadas(e, st.aberta).entries()) {
        const inset = 0.18 + k * 0.04;
        const caixa = { x: e.x + inset, y: e.y + inset, w: e.w - 2 * inset, d: e.d - 2 * inset };
        const p = prisma(caixa, f.z0, f.z1);
        const gc = s(
          'g',
          { class: 'm-camada', 'data-camada': k },
          s('polygon', { class: 'm-f-frente', points: pontosSvg(p.frente) }),
          s('polygon', { class: 'm-f-lado', points: pontosSvg(p.lado) }),
          s('polygon', { class: 'm-f-topo', points: pontosSvg(p.topo) }),
        );
        if (st.aberta) {
          const [tx, ty] = iso(caixa.x + caixa.w, caixa.y + caixa.d / 2, f.z1);
          gc.append(s('line', { class: 'm-pino', x1: tx, y1: ty, x2: tx + 16, y2: ty }), s('text', { class: 'm-camada__txt', x: tx + 19, y: ty + 3.5 }, f.nome));
        }
        g.append(gc);
      }
      // etiqueta com pino
      const c = centro(e);
      const zTopo = alturaTopo(e, st.aberta);
      const zTag = zTopo + alturaEtiqueta(idx);
      const [px, py] = iso(c.x, c.y, zTopo);
      const [tx, ty] = iso(c.x, c.y, zTag);
      const texto = e.rotulo.toUpperCase();
      const larg = texto.length * 6.4 + 14;
      g.append(
        s('line', { class: 'm-pino', x1: px, y1: py, x2: tx, y2: ty }),
        s(
          'g',
          { class: 'm-tag', transform: `translate(${(tx - larg / 2).toFixed(1)} ${(ty - 15).toFixed(1)})` },
          s('rect', { width: larg, height: 16, rx: 8 }),
          s('text', { x: larg / 2, y: 11.2, 'text-anchor': 'middle' }, texto),
        ),
      );
      // marca de quebrada
      const [qx, qy] = iso(c.x, c.y + e.d / 2, e.h * 0.55);
      g.append(s('g', { class: 'm-x', transform: `translate(${qx.toFixed(1)} ${qy.toFixed(1)})` }, s('circle', { r: 8 }), s('path', { d: 'M-3.5 -3.5 L3.5 3.5 M3.5 -3.5 L-3.5 3.5' })));
      g.addEventListener('click', () => selecionar(e.id));
      g.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          ev.stopPropagation();
          selecionar(e.id);
        }
      });
      elEst[e.id] = g;
      raiz.append(g);
    }

    // pacotes (o que viaja de estação em estação)
    const pacotes = [];
    const gp = s('g', { class: 'm-pacotes' });
    for (let k = 0; k < 4; k++) {
      const p = prisma({ x: -0.35, y: -0.35, w: 0.7, d: 0.7 }, 0, 0.7);
      const g = s(
        'g',
        { class: 'm-pacote', 'data-k': k },
        s('polygon', { class: 'm-f-frente', points: pontosSvg(p.frente) }),
        s('polygon', { class: 'm-f-lado', points: pontosSvg(p.lado) }),
        s('polygon', { class: 'm-f-topo', points: pontosSvg(p.topo) }),
      );
      pacotes.push(g);
      gp.append(g);
    }
    raiz.append(gp);
    svg.classList.toggle('m-sem-rotulos', !st.rotulos);
    cena = { elEst, elTrilhos, pacotes, porId };
  }

  function posicaoPacote(id, k, total) {
    const e = cena.porId[id];
    const c = centro(e);
    const off = total > 1 ? (k - (total - 1) / 2) * 0.55 : 0;
    const [x, y] = iso(c.x + off, c.y, alturaTopo(e, st.aberta) + 0.15);
    return [x, y];
  }

  /* ---------- atualização por passo ---------- */
  function atualizar() {
    const r = st.resultado;
    const est = estadoAte(r, st.i);
    const n = r.passos.length;

    // chips de passo
    [...listaPassos.children].forEach((li, k) => {
      const b = li.firstChild;
      if (k === st.i) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
      li.dataset.estado = k < st.i ? 'feito' : k === st.i ? 'agora' : '';
      li.dataset.marca = k <= st.i ? r.passos[k].marca || '' : '';
    });

    narra.textContent = st.i < 0 ? def.pronto : est.atual.narracao;

    // estações
    for (const [id, g] of Object.entries(cena.elEst)) {
      g.dataset.marca = est.marcas[id] || '';
      g.dataset.ativo = est.ativos.includes(id) ? '1' : '0';
      g.dataset.selecionada = st.selecionada === id ? '1' : '0';
      if (g.medidor) {
        const e = cena.porId[id];
        const v = Math.max(0, Math.min(1, est.niveis[id] ?? 0));
        const z = e.h * v;
        g.medidor.setAttribute('points', pontosSvg([iso(e.x, e.y + e.d, 0.02), iso(e.x + e.w, e.y + e.d, 0.02), iso(e.x + e.w, e.y + e.d, z), iso(e.x, e.y + e.d, z)]));
        g.medidor.dataset.zona = v >= (e.medidor.limite ?? 0.4) ? 'burra' : v >= (e.medidor.limite ?? 0.4) * 0.75 ? 'quase' : 'esperta';
      }
    }
    const acesos = new Set(trilhosAcesos(def, r, st.i));
    for (const [k, g] of Object.entries(cena.elTrilhos)) g.dataset.aceso = acesos.has(k) ? '1' : '0';

    // pacotes
    const ps = est.pacotes;
    cena.pacotes.forEach((g, k) => {
      if (k < ps.length && cena.porId[ps[k]]) {
        const [x, y] = posicaoPacote(ps[k], k, ps.length);
        g.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        g.dataset.visivel = '1';
        g.dataset.tom = est.atual?.marca || '';
      } else {
        g.dataset.visivel = '0';
      }
    });

    // dentro da estação
    const dd = est.atual?.dentro;
    if (dd) {
      dentro.dataset.visivel = '1';
      dentro.dataset.tom = dd.tom || est.atual.marca || '';
      const MAX = 5;
      const extra = dd.linhas.length - MAX;
      dentro.replaceChildren(
        h('span', { class: 'm-dentro__tit' }, `Dentro: ${dd.titulo}`),
        ...dd.linhas.slice(0, extra > 0 ? MAX - 1 : MAX).map((l) => h('code', {}, l)),
        ...(extra > 0 ? [h('button', { type: 'button', class: 'm-dentro__mais', onclick: () => trocarAba('rodada') }, `… e mais ${extra + 1} na aba Rodada`)] : []),
      );
    } else {
      dentro.dataset.visivel = '0';
      dentro.replaceChildren(h('span', { class: 'm-dentro__tit' }, 'Dentro: nada passou por aqui ainda'));
    }

    // peças quebradas
    quebradas.replaceChildren(
      ...[...st.avarias].map((id) => {
        const a = def.avarias.find((x) => x.id === id);
        return h('span', { class: 'chip chip--bad' }, `✕ ${a.rotulo}`);
      }),
    );

    // etapa e métricas
    etapa.replaceChildren(
      h('span', { class: 'm-rot' }, 'Etapa'),
      h('strong', {}, st.i < 0 ? 'Pronta · aperte Rodar' : `${st.i + 1}/${n} · ${est.atual.titulo}`),
      h('span', { class: 'm-teclas', 'aria-hidden': 'true' }, 'clique numa peça · espaço roda · → avança · A abre'),
    );
    metricas.replaceChildren(
      ...def.metricas.map((m) => {
        const v = est.metricas[m.id] ?? '—';
        const tom = est.metricas[`${m.id}:tom`] || '';
        return h('div', { class: 'm-metrica', 'data-tom': tom }, h('span', { class: 'm-rot' }, m.rotulo), h('strong', {}, String(v)));
      }),
    );

    // botões
    btnRodar.textContent = st.tocando ? 'Pausar' : est.fim ? 'Rodar de novo' : 'Rodar';
    btnRodar.setAttribute('aria-pressed', st.tocando ? 'true' : 'false');
    btnVoltar.disabled = st.i < 0;
    btnPasso.disabled = st.i >= n - 1;

    desenharPaineis(est);
  }

  /* ---------- painéis ---------- */
  function desenharPaineis(est) {
    const r = st.resultado;
    // Rodada
    paineis.rodada.replaceChildren(
      h('h5', {}, 'Entrada'),
      h('p', { class: 'm-sub' }, r.entrada.titulo),
      ...(r.entrada.linhas || []).map((l) => h('code', { class: 'm-linha' }, l)),
      h('h5', {}, 'Agora'),
      est.atual?.dentro
        ? h('div', {}, h('p', { class: 'm-sub' }, est.atual.dentro.titulo), ...est.atual.dentro.linhas.map((l) => h('code', { class: 'm-linha' }, l)))
        : h('p', { class: 'muted' }, 'Nada rodando ainda.'),
      h('h5', {}, 'Saída ', est.fim ? h('span', { class: `chip ${r.saida.status === 'ok' ? 'chip--ok' : r.saida.status === 'alerta' ? 'chip--warn' : 'chip--bad'}` }, r.saida.status === 'ok' ? 'chegou bem' : r.saida.status === 'alerta' ? 'chegou com alerta' : 'chegou com defeito') : h('span', { class: 'chip' }, 'esperando')),
      est.fim ? h('div', {}, h('p', { class: 'm-sub' }, r.saida.titulo), h('ul', { class: 'm-ul' }, r.saida.linhas.map((l) => h('li', {}, l)))) : h('p', { class: 'muted' }, 'A saída aparece no último passo.'),
    );

    // Livro-razão
    const contagem = contarRazao(est.razao, def.legenda);
    const total = Math.max(1, est.razao.length);
    paineis.razao.replaceChildren(
      h('p', { class: 'm-sub' }, def.razaoIntro || 'Cada afirmação da máquina e de onde ela veio.'),
      h(
        'div',
        { class: 'm-barra-razao', 'aria-hidden': 'true' },
        contagem.filter((c) => c.n).map((c) => h('span', { style: { flexGrow: String(c.n), background: `var(--${c.cor})` }, title: `${c.rotulo}: ${c.n}` })),
        est.razao.length ? null : h('span', { style: { flexGrow: '1' } }),
      ),
      h(
        'ul',
        { class: 'm-legenda' },
        contagem.map((c) => h('li', {}, h('i', { style: { background: `var(--${c.cor})` } }), h('span', {}, c.rotulo), h('b', {}, c.n), h('small', {}, c.descricao || ''))),
      ),
      est.razao.length
        ? h(
            'ol',
            { class: 'm-razao' },
            est.razao.map((rz) => {
              const l = def.legenda.find((x) => x.tipo === rz.tipo);
              return h('li', { style: { '--c': `var(--${l.cor})` } }, h('span', { class: 'm-razao__tipo' }, l.rotulo), h('span', {}, rz.texto));
            }),
          )
        : h('p', { class: 'muted' }, 'Nada anotado ainda. Rode a máquina.'),
      h('p', { class: 'faint m-sub' }, `${total === 1 && !est.razao.length ? 0 : est.razao.length} anotação(ões) até aqui.`),
    );

    // Abrir
    const e = def.estacoes.find((x) => x.id === st.selecionada);
    if (!e) {
      paineis.abrir.replaceChildren(
        h('p', { class: 'muted' }, 'Clique numa peça da máquina (ou escolha abaixo) para ver o que ela é por dentro.'),
        h(
          'div',
          { class: 'm-pecas' },
          def.estacoes.map((x) => h('button', { type: 'button', class: 'chip', onclick: () => selecionar(x.id) }, x.rotulo)),
        ),
      );
    } else {
      const avaria = (def.avarias || []).filter((a) => a.estacao === e.id);
      paineis.abrir.replaceChildren(
        h('p', { class: 'm-sub' }, h('span', { class: 'chip', style: { borderColor: `var(--${TIPOS[e.tipo].cor})` } }, TIPOS[e.tipo].rotulo)),
        h('h5', {}, e.rotulo),
        h('p', {}, e.oQueE),
        e.nomeComercial ? h('p', { class: 'm-sub' }, h('b', {}, 'O nome que você vai ouvir por aí: '), e.nomeComercial) : null,
        e.camadas?.length ? h('div', {}, h('h5', {}, 'Camadas'), h('ol', { class: 'm-ul' }, e.camadas.map((c) => h('li', {}, c)))) : null,
        e.arquivo ? h('div', {}, h('h5', {}, e.arquivo.nome), h('pre', { class: 'm-pre' }, h('code', {}, e.arquivo.texto))) : null,
        ...avaria.map((a) =>
          h(
            'button',
            { type: 'button', class: st.avarias.has(a.id) ? 'btn btn--sm' : 'btn btn--sm btn--primary', onclick: () => alternarAvaria(a.id) },
            st.avarias.has(a.id) ? `Consertar: ${a.rotulo}` : `Quebrar: ${a.rotulo}`,
          ),
        ),
        h('p', {}, h('button', { type: 'button', class: 'btn btn--sm btn--ghost', onclick: () => selecionar(null) }, 'Ver todas as peças')),
      );
    }

    // Rastro
    paineis.rastro.replaceChildren(
      h('p', { class: 'm-sub' }, 'Uma linha por passo, na ordem em que aconteceu.'),
      est.rastro.length ? h('ol', { class: 'm-rastro' }, est.rastro.map((l) => h('li', {}, l))) : h('p', { class: 'muted' }, 'O rastro começa quando a máquina roda.'),
      h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn btn--sm', onclick: baixarRastro }, 'Baixar o rastro completo (.md)')),
    );
  }

  function desenharTente() {
    paineis.tente.replaceChildren(
      h('p', { class: 'm-sub' }, 'Responda antes de rodar. Depois monte a máquina e confira.'),
      ...(def.desafios || []).map((d, k) => {
        const fb = h('div', { class: 'm-fb', 'aria-live': 'polite' });
        const opcoes = d.opcoes.map((o, j) =>
          h(
            'button',
            {
              type: 'button',
              class: 'm-opcao',
              onclick: (ev) => {
                const certo = j === d.correta;
                ev.currentTarget.parentElement.querySelectorAll('button').forEach((b, x) => {
                  b.dataset.res = x === d.correta ? 'certa' : x === j ? 'errada' : '';
                });
                fb.replaceChildren(
                  h('p', {}, h('strong', {}, certo ? 'Isso. ' : 'Ainda não. '), d.explicacao),
                  h('button', { type: 'button', class: 'btn btn--sm btn--primary', onclick: () => aplicarDesafio(d) }, 'Montar e rodar'),
                );
              },
            },
            o,
          ),
        );
        return h('div', { class: 'm-desafio' }, h('p', { class: 'm-desafio__q' }, h('b', {}, `${k + 1}. `), d.pergunta), h('div', { class: 'm-opcoes' }, opcoes), fb);
      }),
    );
  }

  function trocarAba(id) {
    st.aba = id;
    tabs.querySelectorAll('[role="tab"]').forEach((b) => {
      const ativo = b.dataset.aba === id;
      b.setAttribute('aria-selected', ativo ? 'true' : 'false');
      b.tabIndex = ativo ? 0 : -1;
    });
    for (const [k, p] of Object.entries(paineis)) p.hidden = k !== id;
  }

  /* ---------- ações ---------- */
  function recalcular(reiniciar = false) {
    const tocava = st.tocando;
    parar();
    st.resultado = def.simular({ ...st.montagem }, new Set(st.avarias));
    listaPassos.replaceChildren(
      ...st.resultado.passos.map((p, k) =>
        h('li', {}, h('button', { type: 'button', class: 'm-chip', onclick: () => irPara(k) }, h('span', { class: 'm-chip__n' }, k + 1), h('span', {}, p.titulo))),
      ),
    );
    menuQuebrar.replaceChildren(
      ...(def.avarias || []).map((a) =>
        h(
          'button',
          { type: 'button', class: 'm-menu__item', 'aria-pressed': st.avarias.has(a.id) ? 'true' : 'false', onclick: () => alternarAvaria(a.id) },
          h('strong', {}, a.rotulo),
          h('span', {}, a.descricao),
        ),
      ),
    );
    if (reiniciar) st.i = -1;
    st.i = Math.min(st.i, st.resultado.passos.length - 1);
    salvar();
    desenharCena();
    atualizar();
    if (tocava && reiniciar) tocar();
  }

  function irPara(k) {
    parar();
    st.i = Math.max(-1, Math.min(k, st.resultado.passos.length - 1));
    atualizar();
  }

  function avancar() {
    if (st.i >= st.resultado.passos.length - 1) {
      parar();
      return false;
    }
    st.i += 1;
    atualizar();
    return true;
  }

  function agendar() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!st.tocando) return;
      if (avancar()) agendar();
      else {
        st.tocando = false;
        atualizar();
      }
    }, PASSO_MS / st.vel);
  }

  function tocar() {
    if (st.i >= st.resultado.passos.length - 1) st.i = -1;
    st.tocando = true;
    avancar();
    agendar();
    atualizar();
  }

  function parar() {
    st.tocando = false;
    clearTimeout(timer);
  }

  function definirVel(v) {
    st.vel = v;
    el.style.setProperty('--m-dur', reduzido() ? '0ms' : `${Math.round(Math.min(900, (PASSO_MS / v) * 0.42))}ms`);
    grupoVel.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', Number(b.dataset.vel) === v ? 'true' : 'false'));
    if (st.tocando) agendar();
  }

  function alternarAvaria(id) {
    if (st.avarias.has(id)) st.avarias.delete(id);
    else st.avarias.add(id);
    const a = def.avarias.find((x) => x.id === id);
    ctx.toast?.(st.avarias.has(id) ? `Quebrou: ${a.rotulo}` : `Consertou: ${a.rotulo}`);
    recalcular(true);
  }

  function selecionar(id) {
    st.selecionada = id;
    trocarAba('abrir');
    atualizar();
  }

  function aplicarDesafio(d) {
    st.montagem = normalizarMontagem(def, { ...st.montagem, ...(d.montagem || {}) });
    st.avarias = new Set(normalizarAvarias(def, d.avarias || []));
    selects.forEach((lab) => {
      const sel = lab.querySelector('select');
      sel.value = st.montagem[sel.dataset.campo];
    });
    recalcular(true);
    tocar();
    palco.scrollIntoView({ behavior: reduzido() ? 'auto' : 'smooth', block: 'center' });
  }

  function linkAtual() {
    const base = location.href.split('#')[0];
    return `${base}#/maquina/${def.id}?m=${encodeURIComponent(codificarMontagem(def, st.montagem, [...st.avarias]))}`;
  }

  function copiarLink() {
    ctx.copy?.(linkAtual());
  }

  function baixarRastro() {
    ctx.download?.(`${def.id}-rastro.md`, rastroMarkdown(def, st.montagem, [...st.avarias], st.resultado));
  }

  btnRodar.addEventListener('click', () => (st.tocando ? (parar(), atualizar()) : tocar()));
  btnPasso.addEventListener('click', () => (parar(), avancar()));
  btnVoltar.addEventListener('click', () => irPara(st.i - 1));
  btnConsertar.addEventListener('click', () => {
    if (!st.avarias.size) return ctx.toast?.('Nada quebrado para consertar.');
    st.avarias.clear();
    ctx.toast?.('Tudo consertado.');
    recalcular(true);
  });
  btnAbrir.addEventListener('click', () => {
    st.aberta = !st.aberta;
    btnAbrir.setAttribute('aria-pressed', st.aberta ? 'true' : 'false');
    btnAbrir.textContent = st.aberta ? 'Fechar a caixa' : 'Abrir a caixa';
    desenharCena();
    atualizar();
  });
  btnZerar.addEventListener('click', () => {
    st.montagem = normalizarMontagem(def, {});
    st.avarias.clear();
    st.aberta = false;
    st.selecionada = null;
    btnAbrir.setAttribute('aria-pressed', 'false');
    btnAbrir.textContent = 'Abrir a caixa';
    selects.forEach((lab) => {
      const sel = lab.querySelector('select');
      sel.value = st.montagem[sel.dataset.campo];
    });
    definirVel(1);
    recalcular(true);
  });
  rabisco.addEventListener('input', () => {
    st.rabisco = Number(rabisco.value);
    salvar();
    desenharCena();
    atualizar();
  });
  rotulos.addEventListener('change', () => {
    st.rotulos = rotulos.checked;
    salvar();
    svg.classList.toggle('m-sem-rotulos', !st.rotulos);
  });
  palco.addEventListener('keydown', (e) => {
    if (e.target !== palco) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      btnRodar.click();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      btnPasso.click();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      btnVoltar.click();
    } else if (e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      btnAbrir.click();
    }
  });
  const fecharMenu = (e) => {
    if (quebrar.open && !quebrar.contains(e.target)) quebrar.open = false;
  };
  document.addEventListener('click', fecharMenu);

  definirVel(1);
  desenharTente();
  trocarAba('rodada');
  recalcular(true);

  return () => {
    parar();
    document.removeEventListener('click', fecharMenu);
  };
}
