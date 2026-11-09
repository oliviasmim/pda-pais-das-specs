import {
  PEDIDO,
  ARQUIVO,
  LINHAS,
  ACHADOS,
  CLASSES,
  SPEC_T1,
  PADRAO,
  achadoDaLinha,
  achadoPorId,
  avaliarResposta,
  responder,
  placar,
  relatorio,
} from '../logic/interrogatorio.js';
import { cartas } from '../../content/curriculo.js';

function h(tag, props = {}, ...filhos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === false || v === null || v === undefined) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const f of filhos.flat()) {
    if (f === null || f === undefined || f === false) continue;
    el.append(f instanceof Node ? f : document.createTextNode(String(f)));
  }
  return el;
}

const carta = (id) => cartas.find((c) => c.id === id);
const faixa = (linhas) => (linhas.length > 1 ? `linhas ${linhas[0]}–${linhas[linhas.length - 1]}` : `linha ${linhas[0]}`);

export function mount(el, ctx) {
  let estado = ctx.state.load({ respostas: {}, spec: false, atual: null });
  if (!estado.respostas) estado = { respostas: {}, spec: false, atual: null };

  const salvar = () => ctx.state.save(estado);

  const botaoSpec = h('button', {
    class: 'btn btn--ghost btn--sm',
    type: 'button',
    'aria-pressed': String(Boolean(estado.spec)),
    onclick: () => {
      estado.spec = !estado.spec;
      salvar();
      desenhar();
    },
  });

  const codigo = h('div', { class: 'ig-codigo', role: 'group', 'aria-label': `Diff de ${ARQUIVO}` });
  const painel = h('div', { class: 'ig-painel', role: 'region', 'aria-label': 'Interrogatório do trecho', 'aria-live': 'polite' });
  const legenda = h('div', { class: 'ig-legenda-bar' });
  const spec = h('section', { class: 'ig-spec', 'aria-label': 'Spec do domínio' });
  const rodape = h('footer', { class: 'ig-placar', 'aria-live': 'polite' });
  const grade = h('div', { class: 'ig-grade' }, legenda, codigo);

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag', text: 'Laboratório' }),
      h('h3', { text: 'Pedido, assumido ou inventado?' }),
      h('p', { class: 'muted', text: 'Clique em cada trecho marcado com ◆. O interrogatório abre logo abaixo da linha, como um comentário de revisão. Decidam em dupla de onde ele veio antes de ver o veredito.' }),
    ),
    h('div', { class: 'lab__body' },
      h('div', { class: 'ig-pedido' },
        h('div', {},
          h('span', { class: 'ig-rotulo', text: 'Pedido feito à IA' }),
          h('blockquote', { class: 'ig-citacao', text: `“${PEDIDO}”` }),
        ),
        botaoSpec,
      ),
      spec,
      grade,
      rodape,
    ),
  );

  function linhasDoCodigo() {
    codigo.replaceChildren(
      h('div', { class: 'ig-arquivo' },
        h('span', { class: 'mono', text: ARQUIVO }),
        h('span', { class: 'chip chip--ok', text: `+${LINHAS.length} novo` }),
      ),
    );
    const atual = estado.atual ? achadoPorId(estado.atual) : null;
    LINHAS.forEach((texto, i) => {
      const n = i + 1;
      const achado = achadoDaLinha(n);
      const resposta = achado ? estado.respostas[achado.id] : null;
      const nota = achado && resposta ? avaliarResposta(achado.id, resposta).nota : null;
      const classes = ['ig-linha'];
      if (achado) classes.push('ig-linha--marcada');
      if (atual && achado && achado.id === atual.id) classes.push('ig-linha--atual');
      if (resposta) classes.push(`ig-linha--${achado.classe}`);
      const conteudo = [
        h('span', { class: 'ig-num', 'aria-hidden': 'true', text: String(n) }),
        h('span', { class: 'ig-sinal', 'aria-hidden': 'true', text: achado ? (resposta ? (nota === 1 ? '✓' : nota === 0.5 ? '½' : '✗') : '◆') : '+' }),
        h('code', { class: 'ig-texto', text: texto || ' ' }),
      ];
      if (achado) {
        codigo.append(h('button', {
          type: 'button',
          class: classes.join(' '),
          'data-achado': achado.id,
          'aria-label': `Linha ${n}: ${texto.trim()}. ${resposta ? `Respondido: ${CLASSES[resposta].nome}` : 'Ainda não analisado'}`,
          onclick: () => selecionar(achado.id),
        }, conteudo));
      } else {
        codigo.append(h('div', { class: classes.join(' ') }, conteudo));
      }
      if (atual && n === atual.linhas[atual.linhas.length - 1]) codigo.append(painel);
    });
    if (!atual) painel.remove();
  }

  function selecionar(id) {
    estado.atual = id;
    salvar();
    desenhar();
    const botao = codigo.querySelector(`[data-achado="${id}"]`);
    if (botao) botao.focus({ preventScroll: true });
  }

  function proximoSemResposta() {
    const ordem = [...ACHADOS].sort((a, b) => a.linhas[0] - b.linhas[0]);
    const idx = ordem.findIndex((a) => a.id === estado.atual);
    const depois = [...ordem.slice(idx + 1), ...ordem.slice(0, idx + 1)];
    return depois.find((a) => !estado.respostas[a.id]) || null;
  }

  function desenharPainel() {
    const achado = estado.atual ? achadoPorId(estado.atual) : null;
    const p = placar(estado.respostas);
    legenda.replaceChildren(
      h('ul', { class: 'ig-legenda' },
        ...Object.entries(CLASSES).map(([k, c]) => h('li', {}, h('span', { class: `ig-ponto ig-ponto--${k}` }), h('strong', { text: c.nome }), h('span', { class: 'muted', text: ` ${c.descricao}` }))),
      ),
      h('p', { class: 'ig-faltam mono', text: p.completo ? 'Todos os trechos interrogados.' : `${ACHADOS.length - p.respondidas} trechos ◆ esperando` }),
    );
    if (!achado) return;
    const resposta = estado.respostas[achado.id];
    const cabecalho = [
      h('p', { class: 'ig-onde mono', text: `${ARQUIVO} · ${faixa(achado.linhas)}` }),
      h('h4', { class: 'ig-titulo', text: achado.titulo }),
    ];
    if (!resposta) {
      painel.replaceChildren(
        ...cabecalho,
        h('p', { class: 'ig-pergunta', text: 'De onde veio este trecho?' }),
        h('div', { class: 'ig-opcoes' },
          ...Object.entries(CLASSES).map(([k, c]) => h('button', {
            type: 'button',
            class: `ig-opcao ig-opcao--${k}`,
            onclick: () => {
              estado.respostas = responder(estado.respostas, achado.id, k);
              salvar();
              desenhar();
              const foco = painel.querySelector('.ig-veredito');
              if (foco) foco.focus();
            },
          }, h('strong', { text: c.nome }), h('span', { text: c.descricao }))),
        ),
      );
      return;
    }
    const { nota, correta } = avaliarResposta(achado.id, resposta);
    const veredito = nota === 1 ? 'Certo' : nota === 0.5 ? 'Quase' : 'Não';
    const c = carta(achado.carta);
    const proximo = proximoSemResposta();
    painel.replaceChildren(
      ...cabecalho,
      h('div', { class: `ig-veredito ig-veredito--${nota === 1 ? 'ok' : nota === 0.5 ? 'quase' : 'nao'}`, tabindex: '-1' },
        h('span', { class: 'ig-veredito-nota', text: veredito }),
        h('span', {}, 'Vocês disseram ', h('strong', { text: CLASSES[resposta].nome }), '. É ', h('strong', { class: `ig-cor--${correta}`, text: CLASSES[correta].nome }), '.'),
      ),
      h('p', { text: achado.explicacao }),
      h('div', { class: `ig-naspec${estado.spec ? ' ig-naspec--forte' : ''}` },
        h('span', { class: 'ig-rotulo', text: 'Na spec' }),
        h('p', { text: achado.spec }),
      ),
      h('div', { class: 'ig-contraprova' },
        h('span', { class: 'ig-rotulo', text: '♣ Contraprova' }),
        h('dl', {},
          h('dt', { text: 'Entrada' }), h('dd', { class: 'mono', text: achado.contraprova.entrada }),
          h('dt', { text: 'Esperado' }), h('dd', { class: 'mono', text: achado.contraprova.esperado }),
          h('dt', { text: 'O código devolve' }), h('dd', { class: 'mono ig-obtido', text: achado.contraprova.obtido }),
        ),
      ),
      c ? h('p', { class: 'ig-carta' }, h('span', { class: 'ig-naipe', 'aria-hidden': 'true', text: c.naipe }), h('span', {}, h('strong', { text: `Carta ${c.nome}: ` }), c.pergunta)) : null,
      h('div', { class: 'row ig-acoes' },
        proximo ? h('button', { type: 'button', class: 'btn btn--primary btn--sm', onclick: () => selecionar(proximo.id) }, `Próximo trecho: ${faixa(proximo.linhas)} →`) : null,
        h('button', {
          type: 'button',
          class: 'btn btn--ghost btn--sm',
          onclick: () => {
            const novo = { ...estado.respostas };
            delete novo[achado.id];
            estado.respostas = novo;
            salvar();
            desenhar();
          },
        }, 'Responder de novo'),
      ),
    );
  }

  function desenharSpec() {
    botaoSpec.textContent = estado.spec ? 'Esconder a spec' : 'Comparar com a spec';
    botaoSpec.setAttribute('aria-pressed', String(Boolean(estado.spec)));
    spec.hidden = !estado.spec;
    grade.classList.toggle('ig-grade--spec', Boolean(estado.spec));
    if (!estado.spec) return;
    spec.replaceChildren(
      h('div', { class: 'ig-spec-topo' },
        h('span', { class: 'ig-rotulo', text: 'docs/spec.md' }),
        h('h4', { text: SPEC_T1.titulo }),
        h('p', { class: 'mono muted', text: `Corpo: ${SPEC_T1.corpo}` }),
      ),
      h('div', { class: 'ig-tabela-wrap' },
        h('table', { class: 'ig-tabela' },
          h('thead', {}, h('tr', {}, h('th', { text: 'Quando' }), h('th', { text: 'Status' }), h('th', { text: 'Corpo' }))),
          h('tbody', {}, ...SPEC_T1.tabela.map(([q, s, c]) => h('tr', {}, h('td', { text: q }), h('td', { class: 'mono', text: s }), h('td', { class: 'mono', text: c })))),
        ),
      ),
      h('ul', { class: 'ig-extras' }, ...SPEC_T1.extras.map((t) => h('li', { text: t }))),
      h('p', { class: 'muted ig-dica', text: 'Com a spec, a pergunta muda de "isso faz sentido?" para "em que linha da spec está isso?". Repare quantos "assumidos" passam a ter resposta.' }),
    );
  }

  function desenharPlacar() {
    const p = placar(estado.respostas);
    const barras = Object.entries(CLASSES).map(([k, c]) => {
      const { acertos, total } = p.porClasse[k];
      return h('div', { class: 'ig-barra' },
        h('span', { class: 'ig-barra-nome' }, h('span', { class: `ig-ponto ig-ponto--${k}` }), c.nome),
        h('span', { class: 'ig-barra-trilho', role: 'img', 'aria-label': `${c.nome}: ${acertos} de ${total} certos` },
          h('span', { class: `ig-barra-cheia ig-barra-cheia--${k}`, style: `width:${total ? (acertos / total) * 100 : 0}%` }),
        ),
        h('span', { class: 'mono', text: `${acertos}/${total}` }),
      );
    });
    rodape.replaceChildren(
      h('div', { class: 'ig-placar-topo' },
        h('div', {},
          h('span', { class: 'ig-rotulo', text: 'Placar da dupla' }),
          h('p', { class: 'ig-pontos' }, h('strong', { text: String(p.pontos).replace('.', ',') }), ` / ${p.total}`),
          h('p', { class: 'muted', text: `${p.respondidas} de ${p.total} trechos analisados` }),
        ),
        h('div', { class: 'ig-barras' }, ...barras),
      ),
      p.completo
        ? h('div', { class: 'ig-padrao' },
          h('span', { class: 'ig-rotulo', text: 'O padrão de erro da IA' }),
          h('p', { text: PADRAO }),
          h('p', { class: 'muted', text: 'Pergunta para a dupla: que regra no AGENTS.md teria evitado metade desses trechos? Guardem a resposta para a Carta à Rainha.' }),
        )
        : null,
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'btn btn--sm', onclick: () => ctx.copy(relatorio(estado.respostas)) }, 'Copiar relatório da dupla'),
        h('button', {
          type: 'button',
          class: 'btn btn--ghost btn--sm',
          onclick: () => {
            estado = { respostas: {}, spec: estado.spec, atual: null };
            salvar();
            desenhar();
            ctx.toast('Interrogatório reiniciado.');
          },
        }, 'Recomeçar'),
      ),
    );
  }

  function desenhar() {
    desenharSpec();
    desenharPainel();
    linhasDoCodigo();
    desenharPlacar();
  }

  desenhar();
}
