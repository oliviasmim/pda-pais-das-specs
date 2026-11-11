import { h } from '../ui.js';
import { PASSOS, MOTIVOS, LOGS, COMANDO, conferir } from '../logic/vermelho-verde.js';

let contador = 0;

const PORQUE = {
  'mesmo-commit': 'Com teste e código no mesmo commit, não tem como saber se o teste falhou alguma vez.',
  'codigo-antes': 'O teste foi escrito olhando o código pronto, então tende a descrever o que o código faz, e não o que a spec pede.',
  'nunca-vermelho': 'O teste já passava antes de o código existir, então ele não confere a mudança nova.',
  'sem-teste': 'Sem commit de teste, não há ordem nenhuma para provar.',
};

export function mount(el, ctx) {
  const uid = `vv${++contador}`;
  const salvo = ctx.state.load({ escolhas: {}, conferidos: [] });
  const escolhas = salvo.escolhas && typeof salvo.escolhas === 'object' ? salvo.escolhas : {};
  const conferidos = new Set(Array.isArray(salvo.conferidos) ? salvo.conferidos : []);
  const salvar = () => ctx.state.save({ escolhas, conferidos: [...conferidos] });

  const ciclo = h('ol', { class: 'vv-ciclo' }, ...PASSOS.map((p) => h('li', { class: `vv-passo vv-passo--${p.cor}` },
    h('strong', { text: p.nome }), h('span', { text: p.texto }))));
  const lista = h('div', { class: 'vv-logs' });
  const resumo = h('p', { class: 'vv-resumo', 'aria-live': 'polite' });

  function cartao(l) {
    const escolha = escolhas[l.id];
    const feito = conferidos.has(l.id);
    const r = feito ? conferir(l.id, escolha) : null;
    const nomeGrupo = `${uid}-${l.id}`;
    return h('article', { class: `vv-log${r ? (r.acertou ? ' vv-log--certo' : ' vv-log--errado') : ''}` },
      h('header', {}, h('strong', { text: l.titulo }), h('code', { class: 'mono muted', text: COMANDO })),
      h('ul', { class: 'vv-commits' }, ...l.commits.map((c) => h('li', { class: 'vv-commit' },
        h('code', { class: 'mono', text: c.hash }),
        h('span', { class: 'vv-commit__msg', text: c.msg }),
        h('span', { class: 'vv-commit__arq mono muted', text: c.arquivos.join(', ') }),
        h('span', { class: `chip ${c.resultado === 'falha' ? 'chip--bad' : 'chip--ok'}`, text: c.resultado === 'falha' ? 'teste vermelho' : 'teste verde' }),
      ))),
      h('fieldset', { class: 'vv-escolha', disabled: feito },
        h('legend', { text: 'Este log prova a ordem?' }),
        ...Object.entries(MOTIVOS).filter(([k]) => k !== 'sem-teste').map(([k, texto]) => {
          const id = `${nomeGrupo}-${k}`;
          return h('label', { for: id, class: 'vv-radio' },
            h('input', { type: 'radio', id, name: nomeGrupo, value: k, checked: escolha === k, onchange: () => { escolhas[l.id] = k; salvar(); } }),
            h('span', { text: texto }));
        }),
      ),
      h('div', { class: 'row' },
        h('button', {
          type: 'button',
          class: 'btn btn--sm btn--primary',
          disabled: feito,
          onclick: () => {
            if (!escolhas[l.id]) { ctx.toast('Escolha uma resposta primeiro.'); return; }
            conferidos.add(l.id); salvar(); desenhar();
          },
        }, 'Conferir'),
      ),
      r ? h('p', { class: 'vv-fb', text: r.real.valido
        ? (r.acertou ? 'Certo. O teste ficou vermelho num commit só dele, e o código veio depois.' : 'Não. Este log é a prova: o teste ficou vermelho num commit só dele, e o código veio depois.')
        : `${r.acertou ? 'Certo' : 'Não. O problema aqui é outro'}: ${MOTIVOS[r.real.motivo].toLowerCase()}. ${PORQUE[r.real.motivo]}` }) : null,
    );
  }

  function desenhar() {
    lista.replaceChildren(...LOGS.map(cartao));
    const certos = [...conferidos].filter((id) => conferir(id, escolhas[id]).acertou).length;
    resumo.textContent = conferidos.size === LOGS.length
      ? `Você acertou ${certos} de ${LOGS.length}. Só o log A mostra o teste vermelho antes do código.`
      : `Conferidos: ${conferidos.size} de ${LOGS.length}.`;
  }

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag', text: 'Laboratório' }),
      h('h3', { text: 'A prova está no commit' }),
      h('p', { class: 'muted', text: 'Quatro históricos de git da mesma feature: cancelar agendamento. Só um prova que o teste veio antes do código. Leia a ordem dos commits e os arquivos de cada um.' }),
    ),
    h('div', { class: 'lab__body stack' }, ciclo, lista, resumo),
  );
  desenhar();
}
