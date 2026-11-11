import { h } from '../ui.js';
import { PROMPT, TEMP_MIN, TEMP_MAX, rodar, leitura } from '../logic/temperatura.js';

export function mount(el, ctx) {
  const salvo = ctx.state.load({ t: 0, semente: 1 }) || {};
  let t = typeof salvo.t === 'number' ? salvo.t : 0;
  let semente = salvo.semente || 1;

  const valor = h('strong', { class: 'mono' });
  const slider = h('input', { type: 'range', min: TEMP_MIN, max: TEMP_MAX, step: 0.1, value: t, 'aria-label': 'Temperatura', oninput: (e) => {
    t = Number(e.target.value);
    render();
  } });
  const barras = h('ul', { class: 'tp-barras', 'aria-label': 'Probabilidade de cada próximo token' });
  const saidas = h('ol', { class: 'tp-saidas', 'aria-label': 'Cinco rodadas do mesmo prompt' });
  const msg = h('p', { class: 'tp-leitura', 'aria-live': 'polite' });

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag' }, 'Laboratório'),
      h('h3', {}, 'Mesmo prompt, cinco vezes'),
      h('p', {}, 'Arraste a temperatura e clique em Rodar de novo. Conte quantas palavras diferentes saem para o mesmo prompt.'),
    ),
    h('div', { class: 'lab__body' },
      h('blockquote', { class: 'tp-prompt mono' }, PROMPT, h('span', { class: 'tp-cursor', 'aria-hidden': 'true' }, '▍')),
      h('div', { class: 'row tp-controle' },
        h('label', {}, 'Temperatura ', valor),
        slider,
        h('button', { type: 'button', class: 'btn btn--sm btn--primary', onclick: () => {
          semente += 1;
          ctx.state.save({ t, semente });
          render();
        } }, 'Rodar de novo'),
      ),
      h('div', { class: 'grid-2 tp-grade' },
        h('section', {}, h('h4', {}, 'Próximo token, por probabilidade'), barras),
        h('section', {}, h('h4', {}, '5 rodadas'), saidas),
      ),
      msg,
      h('p', { class: 'muted tp-aviso' }, 'Simplificação: um modelo de verdade escolhe entre dezenas de milhares de tokens, não entre sete. A mecânica é a mesma: a temperatura achata ou afia a distribuição, e a escolha sai de um sorteio.'),
    ),
  );

  function render() {
    ctx.state.save({ t, semente });
    valor.textContent = t.toFixed(1);
    const r = rodar({ temperatura: t, vezes: 5, semente });
    barras.replaceChildren(...r.dist.map((d) => h('li', { class: 'tp-barra' },
      h('span', { class: 'tp-barra__nome mono' }, d.token),
      h('span', { class: 'tp-barra__trilho' }, h('span', { class: 'tp-barra__cheia', style: { width: `${(d.p * 100).toFixed(1)}%` } })),
      h('span', { class: 'tp-barra__pct mono' }, `${(d.p * 100).toFixed(0)}%`),
    )));
    saidas.replaceChildren(...r.saidas.map((tok) => h('li', { class: tok === 'azul' || tok === 'em' ? 'is-estranha' : '' }, h('span', { class: 'muted' }, 'a vaga está '), h('strong', { class: 'mono' }, tok))));
    msg.textContent = leitura({ distintas: r.distintas, vezes: 5 }, t);
  }

  render();
}
