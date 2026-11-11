import { h } from '../ui.js';
import {
  REVISORES,
  PRIORIDADES,
  ACHADOS,
  TITULO_PR,
  avaliarAchado,
  pontuacao,
  matriz,
} from '../logic/triagem-achados.js';

let contador = 0;
const nomeRevisor = (id) => REVISORES.find((r) => r.id === id).curto;

export function mount(el, ctx) {
  const uid = `ta${++contador}`;
  const salvo = ctx.state.load({ respostas: {}, revelado: false });
  const respostas = salvo.respostas && typeof salvo.respostas === 'object' ? salvo.respostas : {};
  let revelado = Boolean(salvo.revelado);
  const salvar = () => ctx.state.save({ respostas, revelado });

  const lista = h('div', { class: 'ta-lista' });
  const saida = h('div', { class: 'ta-saida', 'aria-live': 'polite' });

  const resp = (id) => (respostas[id] = respostas[id] || { pegam: [], prioridade: null });

  function cartao(a) {
    const r = resp(a.id);
    const av = revelado ? avaliarAchado(a.id, r) : null;
    const ok = av && av.quem && av.prioridade;
    return h('article', { class: `ta-achado${av ? (ok ? ' ta-achado--certo' : ' ta-achado--errado') : ''}` },
      h('header', {}, h('code', { class: 'mono muted', text: a.onde }), h('p', { class: 'ta-achado__txt', text: a.texto })),
      h('fieldset', { class: 'ta-campo', disabled: revelado },
        h('legend', { text: 'Quem pega?' }),
        ...REVISORES.map((rv) => {
          const id = `${uid}-${a.id}-${rv.id}`;
          return h('label', { for: id, class: 'ta-check' },
            h('input', {
              type: 'checkbox', id, checked: r.pegam.includes(rv.id),
              onchange: (e) => {
                r.pegam = e.target.checked ? [...new Set([...r.pegam, rv.id])] : r.pegam.filter((x) => x !== rv.id);
                salvar();
              },
            }),
            h('span', { text: rv.nome }));
        }),
      ),
      h('fieldset', { class: 'ta-campo', disabled: revelado },
        h('legend', { text: 'Prioridade' }),
        ...PRIORIDADES.map((p) => {
          const id = `${uid}-${a.id}-p-${p.id}`;
          return h('label', { for: id, class: 'ta-check' },
            h('input', { type: 'radio', id, name: `${uid}-${a.id}-p`, checked: r.prioridade === p.id, onchange: () => { r.prioridade = p.id; salvar(); } }),
            h('span', { text: p.nome }));
        }),
      ),
      av ? h('div', { class: 'ta-fb' },
        h('p', {},
          h('strong', { text: av.quem ? 'Quem pega: certo. ' : `Quem pega: ${a.pegam.map(nomeRevisor).join(' e ')}. ` }),
          h('strong', { text: av.prioridade ? 'Prioridade: certa.' : `Prioridade: ${a.prioridade === 'bloqueia' ? 'bloqueia' : 'não bloqueia'}.` }),
        ),
        h('p', { class: 'muted', text: a.porque }),
      ) : null,
    );
  }

  function tabela() {
    const m = matriz();
    return h('div', { class: 'ta-matriz-wrap' },
      h('table', { class: 'ta-matriz' },
        h('caption', { text: 'Quem pega o quê neste PR' }),
        h('thead', {}, h('tr', {}, h('th', { scope: 'col', text: 'Achado' }), ...REVISORES.map((r) => h('th', { scope: 'col', text: r.curto })))),
        h('tbody', {}, ...ACHADOS.map((a) => h('tr', {},
          h('th', { scope: 'row', class: 'mono', text: a.id }),
          ...REVISORES.map((r) => {
            const pega = a.pegam.includes(r.id);
            const sozinho = pega && a.pegam.length === 1;
            return h('td', { class: `${pega ? 'ta-sim' : 'ta-nao'}${sozinho ? ' ta-so' : ''}` },
              h('span', { 'aria-hidden': 'true', text: pega ? (sozinho ? '◆' : '●') : '·' }),
              h('span', { class: 'sr-only', text: pega ? (sozinho ? 'pega, e só este' : 'pega') : 'não pega' }));
          }),
        ))),
        h('tfoot', {}, h('tr', {}, h('th', { scope: 'row', text: 'Total' }), ...m.colunas.map((c) => h('td', { text: `${c.pega.length} de ${ACHADOS.length}` })))),
      ),
      h('p', { class: 'muted ta-legenda', text: '● pega junto com outro. ◆ só este revisor pega. Nenhuma coluna chega a 8 de 8.' }),
    );
  }

  function desenhar() {
    lista.replaceChildren(...ACHADOS.map(cartao));
    if (!revelado) {
      saida.replaceChildren(h('button', {
        type: 'button', class: 'btn btn--primary',
        onclick: () => { revelado = true; salvar(); desenhar(); },
      }, 'Conferir a triagem'));
      return;
    }
    const p = pontuacao(respostas);
    saida.replaceChildren(
      h('p', { class: 'ta-placar', text: `${p.pontos} de ${p.max} pontos (1 por "quem pega", 1 por prioridade).` }),
      tabela(),
      h('div', { class: 'row' }, h('button', {
        type: 'button', class: 'btn btn--ghost btn--sm',
        onclick: () => { for (const k of Object.keys(respostas)) delete respostas[k]; revelado = false; salvar(); desenhar(); },
      }, 'Refazer')),
    );
  }

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag', text: 'Laboratório' }),
      h('h3', { text: 'Triagem de achados' }),
      h('p', { class: 'muted', text: `PR do agente: "${TITULO_PR}". Para cada um dos ${ACHADOS.length} achados, marque quem pegaria (pode ser mais de um) e se ele trava o merge. Depois confira: a tabela mostra o que cada revisor deixa passar.` }),
    ),
    h('div', { class: 'lab__body stack' }, lista, saida),
  );
  desenhar();
}
