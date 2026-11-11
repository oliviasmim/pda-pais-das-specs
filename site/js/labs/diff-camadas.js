import {
  ARQUIVOS,
  ALERTAS,
  CAMADAS,
  estatisticas,
  totalLinhas,
  extrairAssinaturas,
  arquivosDaCamada,
  pontosPorCamada,
  conferir,
  resumo,
  linhaEmDestaque,
} from '../logic/diff-camadas.js';
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

const naipe = (id) => (cartas.find((c) => c.id === id) || {}).naipe || '';
const INICIAL = { camada: 1, desbloqueada: 1, conferidas: {}, marcados: [], achados: {}, falsos: 0 };

export function mount(el, ctx) {
  let estado = { ...INICIAL, ...ctx.state.load(INICIAL) };
  const salvar = () => ctx.state.save(estado);

  const passos = h('ol', { class: 'dc-passos' });
  const conteudo = h('div', { class: 'dc-conteudo' });
  const lateral = h('aside', { class: 'dc-lateral' });
  const final = h('section', { class: 'dc-final', 'aria-live': 'polite' });

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag', text: 'Laboratório' }),
      h('h3', { text: 'Leitura em camadas de um diff grande' }),
      h('p', { class: 'muted', text: `Um agente implementou T1 e T3 e abriu um PR com ${totalLinhas()} linhas em ${ARQUIVOS.length} arquivos. Leia uma camada por vez e marque só o sinal que você já consegue ver nela. Achar na camada 1 vale ${pontosPorCamada(1)} pontos, na camada 4 vale ${pontosPorCamada(4)}. Marcar sem evidência tira 1.` }),
    ),
    h('div', { class: 'lab__body' }, passos, h('div', { class: 'dc-grade' }, conteudo, lateral), final),
  );

  function irPara(n) {
    if (n > estado.desbloqueada) return;
    estado.camada = n;
    estado.marcados = [];
    salvar();
    desenhar();
  }

  function desenharPassos() {
    passos.replaceChildren(...CAMADAS.map((c) => {
      const conferida = Boolean(estado.conferidas[c.n]);
      const atual = estado.camada === c.n;
      const bloqueada = c.n > estado.desbloqueada;
      return h('li', {},
        h('button', {
          type: 'button',
          class: `dc-passo${atual ? ' dc-passo--atual' : ''}${conferida ? ' dc-passo--feito' : ''}`,
          disabled: bloqueada,
          'aria-current': atual ? 'step' : false,
          onclick: () => irPara(c.n),
        },
        h('span', { class: 'dc-passo-n', text: conferida ? '✓' : String(c.n) }),
        h('span', { class: 'dc-passo-txt' }, h('strong', { text: c.nome }), h('span', { class: 'muted', text: `~${c.custo} · até ${pontosPorCamada(c.n)} pts por sinal` })),
        ));
    }));
  }

  const ids = () => Object.keys(estado.achados);

  function linhaDiff(l, numero) {
    const alerta = l.t !== ' ' && linhaEmDestaque(l.c, ids());
    return h('div', { class: `dc-linha dc-linha--${l.t === '+' ? 'add' : l.t === '-' ? 'del' : 'ctx'}${alerta ? ' dc-linha--alerta' : ''}` },
      h('span', { class: 'dc-num', 'aria-hidden': 'true', text: String(numero) }),
      h('span', { class: 'dc-sinal', 'aria-hidden': 'true', text: l.t }),
      h('code', { text: l.c || ' ' }),
    );
  }

  function blocoArquivo(a) {
    const st = estatisticas([a])[0];
    return h('details', { class: 'dc-arquivo', open: true },
      h('summary', {},
        h('span', { class: 'mono', text: a.caminho }),
        h('span', { class: 'dc-contagem mono' }, h('span', { class: 'dc-add', text: `+${st.adicoes}` }), ' ', h('span', { class: 'dc-del', text: `−${st.remocoes}` })),
      ),
      h('div', { class: 'dc-codigo' }, ...a.linhas.map((l, i) => linhaDiff(l, i + 1))),
    );
  }

  function desenharConteudo() {
    const c = CAMADAS[estado.camada - 1];
    const topo = h('div', { class: 'dc-topo' },
      h('span', { class: 'dc-rotulo', text: `Camada ${c.n} de 4` }),
      h('h4', { text: c.nome }),
      h('p', { class: 'muted', text: c.pergunta }),
    );
    if (c.n === 1) {
      const est = estatisticas();
      const maior = Math.max(...est.map((a) => a.adicoes + a.remocoes));
      const achadosIds = ids();
      conteudo.replaceChildren(topo, h('table', { class: 'dc-arquivos' },
        h('thead', {}, h('tr', {}, h('th', { text: 'Arquivo' }), h('th', { text: 'Estado' }), h('th', { text: 'Tamanho' }))),
        h('tbody', {}, ...est.map((a) => {
          const alerta = linhaEmDestaque(a.caminho, achadosIds) || (a.caminho.startsWith('package') && achadosIds.includes('dependencia')) || (a.caminho.includes('Adapter') && achadosIds.includes('abstracao'));
          return h('tr', { class: alerta ? 'dc-linha--alerta' : '' },
            h('td', { class: 'mono', text: a.caminho }),
            h('td', {}, h('span', { class: `chip ${a.status === 'novo' ? 'chip--ok' : 'chip--warn'}`, text: a.status })),
            h('td', {},
              h('span', { class: 'dc-barra', role: 'img', 'aria-label': `${a.adicoes} adições e ${a.remocoes} remoções` },
                h('span', { class: 'dc-barra-add', style: `width:${(a.adicoes / maior) * 100}%` }),
                h('span', { class: 'dc-barra-del', style: `width:${(a.remocoes / maior) * 100}%` }),
              ),
              h('span', { class: 'mono dc-mini' }, h('span', { class: 'dc-add', text: `+${a.adicoes}` }), ' ', h('span', { class: 'dc-del', text: `−${a.remocoes}` })),
            ),
          );
        })),
      ));
      return;
    }
    if (c.n === 2) {
      const grupos = new Map();
      for (const s of extrairAssinaturas()) {
        if (!grupos.has(s.caminho)) grupos.set(s.caminho, []);
        grupos.get(s.caminho).push(s);
      }
      conteudo.replaceChildren(topo, ...[...grupos.entries()].map(([caminho, lista]) => h('div', { class: 'dc-assinaturas' },
        h('p', { class: 'mono dc-caminho', text: caminho }),
        h('div', { class: 'dc-codigo' }, ...lista.map((s) => linhaDiff({ t: '+', c: s.texto }, s.indice + 1))),
      )));
      return;
    }
    conteudo.replaceChildren(topo, ...arquivosDaCamada(c.n).map(blocoArquivo));
  }

  function desenharLateral() {
    const n = estado.camada;
    const conferida = estado.conferidas[n];
    const itens = ALERTAS.map((a) => {
      const achadoEm = estado.achados[a.id];
      if (achadoEm) {
        return h('li', { class: 'dc-alerta dc-alerta--achado' },
          h('span', { class: 'dc-alerta-marca', 'aria-hidden': 'true', text: naipe(a.carta) || '✓' }),
          h('span', {}, h('strong', { text: a.nome }), h('span', { class: 'muted', text: ` · ${a.apelido} · camada ${achadoEm}` })),
        );
      }
      const marcado = estado.marcados.includes(a.id);
      return h('li', { class: 'dc-alerta' },
        h('button', {
          type: 'button',
          class: `dc-toggle${marcado ? ' dc-toggle--on' : ''}`,
          'aria-pressed': String(marcado),
          disabled: Boolean(conferida),
          onclick: () => {
            estado.marcados = marcado ? estado.marcados.filter((x) => x !== a.id) : [...estado.marcados, a.id];
            salvar();
            desenharLateral();
          },
        }, h('span', { class: 'dc-caixa', 'aria-hidden': 'true', text: marcado ? '■' : '□' }), a.nome),
      );
    });

    const feedback = h('div', { class: 'dc-feedback', 'aria-live': 'polite' });
    if (conferida) {
      const linhas = [
        ...conferida.novos.map((id) => {
          const a = ALERTAS.find((x) => x.id === id);
          return h('li', { class: 'dc-fb dc-fb--ok' }, h('strong', { text: `+${pontosPorCamada(n)} ${a.nome}` }), h('span', { text: a.evidencias[n] }));
        }),
        ...conferida.falsos.map((id) => {
          const a = ALERTAS.find((x) => x.id === id);
          return h('li', { class: 'dc-fb dc-fb--nao' }, h('strong', { text: `−1 ${a.nome}` }), h('span', { text: 'Nada nesta camada mostra isso ainda. Sem uma linha para apontar, é palpite.' }));
        }),
      ];
      if (!linhas.length) linhas.push(h('li', { class: 'dc-fb' }, h('span', { text: 'Você não marcou nada nesta camada.' })));
      const escaparam = ALERTAS.filter((a) => a.camadas.includes(n) && !estado.achados[a.id]);
      feedback.append(h('ul', { class: 'dc-fbs' }, ...linhas));
      if (escaparam.length) {
        feedback.append(h('p', { class: 'dc-escapou' }, `${escaparam.length} sinal${escaparam.length > 1 ? 'is' : ''} já ${escaparam.length > 1 ? 'apareciam' : 'aparecia'} aqui e ${escaparam.length > 1 ? 'passaram' : 'passou'}. Ainda dá para pegar nas próximas camadas, valendo menos.`));
      }
      if (n < 4) {
        feedback.append(h('button', { type: 'button', class: 'btn btn--primary btn--sm', onclick: () => irPara(n + 1) }, `Ir para a camada ${n + 1} →`));
      }
    } else {
      feedback.append(h('button', {
        type: 'button',
        class: 'btn btn--primary',
        onclick: () => {
          const r = conferir(n, estado.marcados, estado.achados);
          for (const id of r.novos) estado.achados[id] = n;
          estado.falsos += r.falsos.length;
          estado.conferidas = { ...estado.conferidas, [n]: { novos: r.novos, falsos: r.falsos } };
          estado.desbloqueada = Math.max(estado.desbloqueada, Math.min(4, n + 1));
          estado.marcados = [];
          salvar();
          desenhar();
        },
      }, `Conferir camada ${n}`));
    }

    lateral.replaceChildren(
      h('p', { class: 'dc-rotulo', text: 'Sinais de alerta' }),
      h('p', { class: 'muted dc-instrucao', text: conferida ? 'Camada conferida.' : 'Marque só o que esta camada já mostra.' }),
      h('ul', { class: 'dc-alertas' }, ...itens),
      feedback,
    );
  }

  function desenharFinal() {
    if (!estado.conferidas[4]) {
      final.replaceChildren();
      final.hidden = true;
      return;
    }
    final.hidden = false;
    const r = resumo(estado.achados, estado.falsos);
    const maiorBarra = Math.max(1, ...r.porCamada);
    final.replaceChildren(
      h('div', { class: 'dc-final-topo' },
        h('div', {},
          h('p', { class: 'dc-rotulo', text: 'Veredito do revisor' }),
          h('p', { class: 'dc-pontos' }, h('strong', { text: String(r.pontos) }), ` / ${r.maximo} pontos`),
          h('p', { class: 'muted', text: `${r.achadosAte2} de ${ALERTAS.length} sinais achados nas camadas 1 e 2, nos primeiros ~4 minutos de leitura.` }),
        ),
        h('div', { class: 'dc-grafico', role: 'img', 'aria-label': `Sinais por camada: ${r.porCamada.join(', ')}` },
          ...r.porCamada.map((q, i) => h('div', { class: 'dc-coluna' },
            h('span', { class: 'dc-coluna-barra', style: `height:${(q / maiorBarra) * 100}%` }),
            h('span', { class: 'mono', text: String(q) }),
            h('span', { class: 'muted', text: `C${i + 1}` }),
          )),
        ),
      ),
      r.perdidos.length
        ? h('div', { class: 'dc-perdidos' },
          h('p', { class: 'dc-rotulo', text: 'O que passou batido' }),
          h('ul', {}, ...r.perdidos.map((id) => {
            const a = ALERTAS.find((x) => x.id === id);
            const c = Math.min(...a.camadas);
            return h('li', {}, h('strong', { text: `${naipe(a.carta)} ${a.nome} (${a.apelido})` }), ` · visível desde a camada ${c}. ${a.evidencias[c]} ${a.explicacao}`);
          })),
        )
        : h('p', { class: 'dc-perfeito', text: `Você pegou os ${ALERTAS.length} sinais. Leve o mais grave para a Carta à Rainha, no fim da lição, para o próximo agente não repetir.` }),
      h('div', { class: 'dc-licao' },
        h('p', {}, h('strong', { text: 'Perceba: ' }), 'a camada 1 (só a lista de arquivos) já mostra o teste de aceite alterado e a dependência nova. A camada 2 mostra a regra inventada e o 409 que sumiu. Quem começa pelo corpo gasta 20 minutos para achar o que estava na tela no primeiro minuto.'),
      ),
      h('div', { class: 'row' },
        h('button', {
          type: 'button',
          class: 'btn btn--ghost btn--sm',
          onclick: () => {
            estado = { ...INICIAL, conferidas: {}, achados: {}, marcados: [] };
            salvar();
            desenhar();
            ctx.toast('Leitura reiniciada.');
          },
        }, 'Ler de novo'),
      ),
    );
  }

  function desenhar() {
    desenharPassos();
    desenharConteudo();
    desenharLateral();
    desenharFinal();
  }

  desenhar();
}
