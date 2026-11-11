import { h } from '../ui.js';
import { PR, CLASSES, ARQUIVOS, avaliarResposta, responder, placar, stat } from '../logic/triagem-pr.js';

export function mount(el, ctx) {
  let respostas = ctx.state.load({}) || {};
  const salvar = () => ctx.state.save(respostas);
  const lista = h('div', { class: 'tp-lista' });
  const resumo = h('p', { class: 'tp-resumo', 'aria-live': 'polite' });

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag' }, 'Laboratório'),
      h('h3', {}, 'Qual arquivo você abre primeiro?'),
      h('p', {}, 'Sem abrir código nenhum, olhe a saída do git diff --stat e classifique cada arquivo comparando com o pedido do PR.'),
    ),
    h('div', { class: 'lab__body' },
      h('p', { class: 'tp-pedido' }, h('strong', {}, PR.titulo), h('br'), PR.pedido),
      h('pre', { class: 'tp-stat mono', tabindex: '0', 'aria-label': 'Saída do git diff --stat' }, stat()),
      resumo,
      lista,
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'btn btn--sm btn--ghost', onclick: () => { respostas = {}; salvar(); render(); } }, 'Recomeçar'),
      ),
    ),
  );

  function linha(a) {
    const r = respostas[a.id];
    const av = r ? avaliarResposta(a.id, r) : null;
    const grupo = h('div', { class: 'row tp-botoes', role: 'group', 'aria-label': `Classificar ${a.caminho}` },
      Object.entries(CLASSES).map(([id, c]) => h('button', {
        type: 'button',
        class: `btn btn--sm ${r === id ? 'btn--primary' : 'btn--ghost'}`,
        'aria-pressed': r === id ? 'true' : 'false',
        title: c.descricao,
        onclick: () => { respostas = responder(respostas, a.id, id); salvar(); render(a.id); },
      }, c.nome)));
    const corpo = [h('code', { class: 'tp-caminho' }, a.caminho), grupo];
    if (r) {
      corpo.push(h('p', { class: 'tp-explica', 'aria-live': 'polite' },
        h('span', { class: `chip ${av.nota ? 'chip--ok' : 'chip--bad'}` }, av.nota ? 'Certo' : `Era: ${CLASSES[a.classe].nome}`), ' ', a.explicacao));
    }
    return h('article', { class: `tp-linha${r ? ' is-respondida' : ''}`, 'data-id': a.id }, ...corpo);
  }

  function render(foco) {
    lista.replaceChildren(...ARQUIVOS.map(linha));
    const p = placar(respostas);
    resumo.replaceChildren(
      h('strong', { class: 'mono' }, `${p.pontos}/${p.total}`), ` certos · sinais achados: ${p.sinaisAchados}/${p.sinaisTotal} · arquivos normais marcados como suspeitos: ${p.falsosAlarmes}`,
      p.completo ? ' · Os 4 sinais dizem por onde começar a leitura. Se o PR volta ou passa, quem decide é você, depois de abrir esses diffs.' : '',
    );
    if (foco) {
      const alvo = lista.querySelector(`[data-id="${foco}"] button[aria-pressed="true"]`);
      if (alvo) alvo.focus({ preventScroll: true });
    }
  }

  render();
}
