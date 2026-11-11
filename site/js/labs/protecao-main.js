import { h } from '../ui.js';
import { OPCOES, PRESETS, configDe, placar, diagnostico } from '../logic/protecao-main.js';

let contador = 0;

const ROTULO_CHECK = { verde: 'gates: verde', vermelho: 'gates: vermelho', 'nao-rodou': 'gates: não rodou' };
const CLASSE_CHECK = { verde: 'chip--ok', vermelho: 'chip--bad', 'nao-rodou': 'chip--warn' };

export function mount(el, ctx) {
  const uid = `pm${++contador}`;
  const padrao = PRESETS.comoGerado.config;
  let cfg = { ...padrao, ...ctx.state.load(padrao) };
  const salvar = () => ctx.state.save(cfg);

  const opcoes = h('div', { class: 'pm-opcoes' });
  const presets = h('div', { class: 'row pm-presets' });
  const painel = h('div', { class: 'pm-painel' });
  const resumo = h('div', { class: 'pm-resumo', 'aria-live': 'polite' });

  function checkbox(o) {
    const id = `${uid}-${o.id}`;
    return h('label', { class: `pm-opcao pm-opcao--${o.grupo}`, for: id },
      h('input', { type: 'checkbox', id, checked: cfg[o.id], onchange: (e) => { cfg[o.id] = e.target.checked; salvar(); desenhar(); } }),
      h('span', {},
        h('strong', { text: o.titulo }),
        h('span', { class: 'muted', text: ` ${o.ajuda}` }),
      ),
    );
  }

  function cartao(l) {
    const bloqueado = l.merge === 'bloqueado';
    return h('article', { class: `pm-pr${l.entrou ? ' pm-pr--entrou' : ''}` },
      h('header', {}, h('strong', { text: l.cenario.titulo }), h('p', { class: 'muted', text: l.cenario.detalhe })),
      h('div', { class: 'pm-pr__estado' },
        h('span', { class: `chip ${CLASSE_CHECK[l.check]}`, text: ROTULO_CHECK[l.check] }),
        h('button', {
          type: 'button',
          class: `btn btn--sm ${bloqueado ? '' : 'btn--primary'}`,
          disabled: bloqueado,
          'aria-disabled': String(bloqueado),
          text: l.cenario.via === 'push' ? (bloqueado ? 'Push recusado' : 'Push aceito') : (bloqueado ? 'Merge bloqueado' : 'Merge liberado'),
        }),
      ),
      h('p', { class: 'pm-pr__motivo', text: l.motivo }),
      l.entrou ? h('p', { class: 'pm-pr__alerta', text: 'O defeito chegou na main.' }) : null,
    );
  }

  function desenhar() {
    opcoes.replaceChildren(
      h('p', { class: 'pm-h', text: 'No workflow (YAML)' }),
      ...OPCOES.filter((o) => o.grupo === 'workflow').map(checkbox),
      h('p', { class: 'pm-h', text: 'No GitHub (Settings)' }),
      ...OPCOES.filter((o) => o.grupo === 'github').map(checkbox),
    );
    presets.replaceChildren(...Object.values(PRESETS).map((p) => h('button', {
      type: 'button',
      class: 'btn btn--ghost btn--sm',
      onclick: () => { cfg = { ...p.config }; salvar(); desenhar(); },
    }, p.nome)));
    const p = placar(cfg);
    painel.replaceChildren(...p.linhas.map(cartao));
    const falta = diagnostico(cfg);
    resumo.replaceChildren(
      h('p', { class: `pm-placar ${p.ok ? 'pm-placar--ok' : 'pm-placar--ruim'}` },
        p.ok
          ? 'Três defeitos barrados, PR correto liberado. Agora repita no seu repositório: abra um PR que quebra o lint e veja o botão de merge travar.'
          : `Chegaram na main: ${p.defeitosQueEntraram} de 3 defeitos. PR correto travado sem motivo: ${p.bloqueioIndevido}. O que ainda falta:`),
      ...(falta.length && !p.ok ? [h('ul', { class: 'pm-falta' }, ...falta.map((t) => h('li', { text: t })))] : []),
    );
  }

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag', text: 'Laboratório' }),
      h('h3', { text: 'Quem trava o botão de merge?' }),
      h('p', { class: 'muted', text: 'Quatro mudanças tentam entrar na main, três com defeito. Ligue as regras do YAML e do GitHub até os três defeitos ficarem de fora e o PR correto entrar.' }),
    ),
    h('div', { class: 'lab__body pm-grade' },
      h('div', { class: 'pm-col' }, presets, opcoes),
      h('div', { class: 'pm-col' }, painel, resumo),
    ),
  );
  desenhar();
}
