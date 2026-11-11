import { h } from '../ui.js';
import { ETAPAS, DEFEITOS, avaliar, responder, placar } from '../logic/cadeia-rpi.js';

export function mount(el, ctx) {
  let respostas = ctx.state.load({}) || {};
  const salvar = () => ctx.state.save(respostas);
  const lista = h('div', { class: 'cr-lista' });
  const resumo = h('p', { class: 'cr-resumo', 'aria-live': 'polite' });

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag' }, 'Laboratório'),
      h('h3', {}, 'Onde o erro nasceu?'),
      h('p', {}, 'Os seis defeitos apareceram no código final. Para cada um, escolha a sessão em que ele nasceu: é lá que a correção tem de acontecer.'),
    ),
    h('div', { class: 'lab__body' },
      h('ol', { class: 'cr-trilho', 'aria-label': 'As três sessões' },
        Object.entries(ETAPAS).map(([id, e]) => h('li', { class: 'cr-etapa', 'data-etapa': id },
          h('strong', {}, e.nome),
          h('span', { class: 'mono muted' }, e.arquivo),
          h('span', { class: 'muted' }, e.pergunta),
        ))),
      resumo,
      lista,
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'btn btn--sm btn--ghost', onclick: () => { respostas = {}; salvar(); render(); } }, 'Recomeçar'),
      ),
    ),
  );

  function escolher(id, etapa) {
    respostas = responder(respostas, id, etapa);
    salvar();
    render(id);
  }

  function cartao(d, i) {
    const r = respostas[d.id];
    const av = r ? avaliar(d.id, r) : null;
    const botoes = Object.entries(ETAPAS).map(([id, e]) => h('button', {
      type: 'button',
      class: `btn btn--sm ${r === id ? 'btn--primary' : 'btn--ghost'}`,
      'aria-pressed': r === id ? 'true' : 'false',
      'data-escolha': id,
      onclick: () => escolher(d.id, id),
    }, e.nome));
    const corpo = [
      h('p', { class: 'cr-sintoma' }, d.sintoma),
      h('div', { class: 'row cr-botoes', role: 'group', 'aria-label': `Onde nasceu: ${d.sintoma}` }, botoes),
    ];
    if (r) {
      const certa = ETAPAS[d.nasceu];
      corpo.push(h('div', { class: 'cr-veredito', 'aria-live': 'polite' },
        h('p', {}, h('span', { class: `chip ${av.nota ? 'chip--ok' : 'chip--bad'}` }, av.nota ? 'Certo' : `Nasceu em ${certa.nome}`), ' ', d.explicacao),
        h('p', { class: 'muted' }, h('strong', {}, 'Rastro: '), d.rastro),
        h('p', { class: 'cr-alcance' }, h('strong', {}, 'O que foi construído em cima: '), certa.alcance, '.'),
      ));
    }
    return h('article', { class: `cr-cartao${r ? ' is-respondido' : ''}`, 'data-id': d.id },
      h('span', { class: 'mono muted cr-n' }, `${i + 1}/${DEFEITOS.length}`), ...corpo);
  }

  function render(foco) {
    lista.replaceChildren(...DEFEITOS.map(cartao));
    const p = placar(respostas);
    resumo.replaceChildren(h('strong', { class: 'mono' }, `${p.pontos}/${p.total}`), ` certos · ${p.respondidas} de ${p.total} respondidos`);
    if (foco) {
      const alvo = lista.querySelector(`[data-id="${foco}"] button[aria-pressed="true"]`);
      if (alvo) alvo.focus({ preventScroll: true });
    }
  }

  render();
}
