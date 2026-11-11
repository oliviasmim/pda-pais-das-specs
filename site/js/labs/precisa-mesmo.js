import { h } from '../ui.js';
import { CENARIOS, OPCOES, avaliarEscolha, resumo } from '../logic/precisa-mesmo.js';

const NAIPES = ['♠', '♥', '♣', '♦'];
const RESULTADO = {
  recomendada: { chip: 'chip--ok', txt: 'mesma escolha da facilitação' },
  aceitavel: { chip: 'chip--warn', txt: 'aceitável, com ressalva' },
  diferente: { chip: 'chip--bad', txt: 'escolha diferente' },
};
const JUST = {
  curta: 'Sua justificativa está curta demais. Diga o critério: custo de coordenação, isolamento, dependência entre tarefas...',
  'sem-criterio': 'Sua justificativa não cita um critério. "Porque é melhor" não convence ninguém: diga o que muda em tokens, janela ou dependência entre tarefas.',
};

export function mount(el, ctx) {
  let respostas = ctx.state.load({}) || {};
  const placar = h('p', { class: 'pm-placar', 'aria-live': 'polite' });
  const baralho = h('div', { class: 'pm-baralho' });

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag' }, 'Laboratório'),
      h('h3', {}, 'Precisa mesmo?'),
      h('p', {}, 'Para cada cenário, escolha o arranjo e justifique em uma frase. Depois revele a recomendação. Recusar também é decisão técnica.'),
    ),
    h('div', { class: 'lab__body' },
      h('div', { class: 'row pm-topo' },
        placar,
        h('button', { type: 'button', class: 'btn btn--sm btn--ghost', onclick: () => { respostas = {}; salvar(); render(); } }, 'Recomeçar'),
      ),
      h('dl', { class: 'pm-opcoes' },
        Object.values(OPCOES).map((o) => h('div', {}, h('dt', {}, o.nome), h('dd', {}, o.dica))),
      ),
      baralho,
    ),
  );

  function salvar() {
    ctx.state.save(respostas);
  }

  function carta(c, i) {
    const r = respostas[c.id] || {};
    const nome = `pm-${ctx.licaoId}-${c.id}`;
    const opcoes = h('fieldset', { class: 'pm-escolha' },
      h('legend', { class: 'sr-only' }, `Arranjo para: ${c.titulo}`),
      Object.entries(OPCOES).map(([id, o]) => {
        const input = h('input', { type: 'radio', name: nome, id: `${nome}-${id}`, value: id, checked: r.escolha === id, disabled: !!r.revelado });
        input.addEventListener('change', () => {
          respostas = { ...respostas, [c.id]: { ...respostas[c.id], escolha: id } };
          salvar();
          atualizarBotao();
        });
        return h('label', { for: `${nome}-${id}`, class: 'pm-op' }, input, h('span', {}, o.nome));
      }),
    );
    const just = h('textarea', { id: `${nome}-just`, rows: '2', placeholder: 'Porque...', disabled: !!r.revelado });
    just.value = r.justificativa || '';
    just.addEventListener('input', () => {
      respostas = { ...respostas, [c.id]: { ...respostas[c.id], justificativa: just.value } };
      salvar();
    });
    const revelar = h('button', { type: 'button', class: 'btn btn--sm btn--primary', onclick: () => {
      respostas = { ...respostas, [c.id]: { ...respostas[c.id], revelado: true } };
      salvar();
      render(c.id);
    } }, 'Revelar');
    function atualizarBotao() {
      revelar.disabled = !(respostas[c.id] && respostas[c.id].escolha);
    }
    atualizarBotao();

    const corpo = [
      h('p', { class: 'pm-contexto' }, c.contexto),
      opcoes,
      h('label', { for: `${nome}-just`, class: 'pm-just__rot' }, 'Justificativa (uma frase)'),
      just,
    ];

    if (r.revelado) {
      const av = avaliarEscolha(c.id, r.escolha, r.justificativa);
      corpo.push(
        h('div', { class: 'pm-veredito', 'aria-live': 'polite' },
          h('p', {}, h('span', { class: `chip ${RESULTADO[av.resultado].chip}` }, RESULTADO[av.resultado].txt), ' Recomendado: ', h('strong', {}, OPCOES[av.recomendada].nome)),
          h('p', { class: 'pm-criterio' }, av.criterio),
          av.justificativa !== 'ok' ? h('p', { class: 'pm-just-aviso' }, JUST[av.justificativa]) : null,
          h('button', { type: 'button', class: 'btn btn--sm btn--ghost', onclick: () => {
            respostas = { ...respostas, [c.id]: { ...respostas[c.id], revelado: false } };
            salvar();
            render(c.id);
          } }, 'Responder de novo'),
        ),
      );
    } else {
      corpo.push(h('div', { class: 'row pm-acoes' }, revelar));
    }

    return h('article', { class: `pm-carta${r.revelado ? ' is-revelada' : ''}`, id: `${nome}-carta`, 'data-naipe': NAIPES[i % 4] },
      h('header', { class: 'pm-carta__cab' },
        h('span', { class: 'pm-carta__n mono' }, `${i + 1}/${CENARIOS.length}`),
        h('h4', {}, c.titulo),
      ),
      ...corpo,
    );
  }

  function render(foco) {
    baralho.replaceChildren(...CENARIOS.map(carta));
    const r = resumo(Object.fromEntries(Object.entries(respostas).filter(([, v]) => v.revelado)));
    placar.replaceChildren(
      h('strong', { class: 'mono' }, `${r.respondidas}/${r.total}`), ' revelados · ',
      `${r.recomendadas} alinhados · `,
      h('span', { class: 'pm-placar__recusa' }, `${r.recusas} de ${r.totalRecusas} recusas certeiras`),
    );
    if (foco) {
      const alvo = baralho.querySelector(`#pm-${ctx.licaoId}-${foco}-carta button`);
      if (alvo) alvo.focus({ preventScroll: true });
    }
  }

  render();
}
