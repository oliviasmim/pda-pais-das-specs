import { h } from '../ui.js';
import { ITENS, corrigir, placar } from '../logic/guias-sensores.js';

const COLUNAS = [
  { id: 'guia', titulo: 'Guia', sub: 'feedforward · antes de gerar', icone: '⚗' },
  { id: 'ambos', titulo: 'Os dois', sub: 'guia antes, sensor depois', icone: '⇄' },
  { id: 'sensor', titulo: 'Sensor', sub: 'feedback · depois de gerar', icone: '◉' },
];

const CERTA = { guia: 'era guia', sensor: 'era sensor', ambos: 'eram os dois' };

export function mount(el, ctx) {
  let respostas = ctx.state.load({}) || {};
  const pilha = h('div', { class: 'gs-pilha', 'aria-label': 'Artefatos para classificar' });
  const colunas = {};
  const placarEl = h('p', { class: 'gs-placar', 'aria-live': 'polite' });
  const fim = h('div', { class: 'gs-fim', 'aria-live': 'polite' });

  const colunasEl = h('div', { class: 'gs-colunas' },
    COLUNAS.map((c) => {
      const lista = h('ul', { class: 'gs-col__lista' });
      colunas[c.id] = lista;
      const col = h('section', { class: `gs-col gs-col--${c.id}`, 'data-col': c.id },
        h('header', { class: 'gs-col__cab' },
          h('span', { class: 'gs-col__icone', 'aria-hidden': 'true' }, c.icone),
          h('div', {}, h('h4', {}, c.titulo), h('p', {}, c.sub)),
        ),
        lista,
      );
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.classList.add('is-alvo');
      });
      col.addEventListener('dragleave', () => col.classList.remove('is-alvo'));
      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.classList.remove('is-alvo');
        const id = e.dataTransfer.getData('text/plain');
        if (id) responder(id, c.id);
      });
      return col;
    }),
  );

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag' }, 'Laboratório'),
      h('h3', {}, 'Guia ou sensor? Monte o harness'),
      h('p', {}, 'Para cada artefato, decida: ele orienta o agente antes (guia) ou mede o resultado depois (sensor)? Use os botões ou arraste.'),
    ),
    h('div', { class: 'lab__body' },
      h('div', { class: 'row gs-topo' },
        placarEl,
        h('button', { class: 'btn btn--sm btn--ghost', type: 'button', onclick: reiniciar }, 'Recomeçar'),
      ),
      pilha,
      colunasEl,
      fim,
    ),
  );

  function responder(id, escolha) {
    respostas = { ...respostas, [id]: escolha };
    ctx.state.save(respostas);
    render(id);
  }

  function reiniciar() {
    respostas = {};
    ctx.state.save(respostas);
    render();
  }

  function cartaPilha(item) {
    const carta = h('article', { class: 'gs-carta', draggable: 'true', 'data-id': item.id },
      h('h5', {}, item.nome),
      h('p', {}, item.desc),
      h('div', { class: 'gs-carta__acoes', role: 'group', 'aria-label': `Classificar ${item.nome}` },
        h('button', { type: 'button', class: 'btn btn--sm', onclick: () => responder(item.id, 'guia') }, 'Guia'),
        h('button', { type: 'button', class: 'btn btn--sm', onclick: () => responder(item.id, 'ambos') }, 'Os dois'),
        h('button', { type: 'button', class: 'btn btn--sm', onclick: () => responder(item.id, 'sensor') }, 'Sensor'),
      ),
    );
    carta.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.id);
      e.dataTransfer.effectAllowed = 'move';
      carta.classList.add('is-arrastando');
    });
    carta.addEventListener('dragend', () => carta.classList.remove('is-arrastando'));
    return carta;
  }

  function cartaResposta(item, escolha, recente) {
    const r = corrigir(item.id, escolha);
    const estado = r.certo ? 'ok' : r.parcial ? 'warn' : 'bad';
    const rotulo = r.certo ? 'certo' : r.parcial ? 'quase: os dois' : CERTA[r.resposta];
    const det = h('details', { class: `gs-resp gs-resp--${estado}`, open: recente || !r.certo },
      h('summary', {},
        h('span', { class: `chip chip--${estado}` }, rotulo),
        ' ',
        h('span', { class: 'gs-resp__nome' }, item.nome),
      ),
      h('p', {}, r.explicacao),
      h('button', { type: 'button', class: 'btn btn--sm btn--ghost', onclick: () => {
        const { [item.id]: _, ...resto } = respostas;
        respostas = resto;
        ctx.state.save(respostas);
        render();
      } }, 'Devolver para a pilha'),
    );
    return h('li', {}, det);
  }

  function render(recente) {
    const pendentes = ITENS.filter((i) => !respostas[i.id]);
    pilha.replaceChildren(...pendentes.map(cartaPilha));
    pilha.hidden = pendentes.length === 0;
    for (const c of COLUNAS) colunas[c.id].replaceChildren();
    for (const item of ITENS) {
      const escolha = respostas[item.id];
      if (escolha) colunas[escolha].append(cartaResposta(item, escolha, item.id === recente));
    }
    const p = placar(respostas);
    placarEl.replaceChildren(
      h('strong', { class: 'mono' }, `${p.respondidos}/${p.total}`), ' classificados · ',
      h('span', { class: 'gs-placar__ok' }, `${p.certos} certos`),
      p.parciais ? ` · ${p.parciais} quase` : '',
    );
    fim.replaceChildren();
    if (p.respondidos === p.total) {
      fim.append(
        h('div', { class: 'callout gs-fim__box' },
          h('p', {}, h('strong', {}, `${p.certos} de ${p.total}.`), ' Perceba: quase tudo que a gente escreve (AGENTS.md, skill, spec) é guia, e guia sem sensor é esperança. O teste escrito antes é a ponte: guia o agente e depois mede o resultado.'),
          h('p', { class: 'muted' }, 'Agente = LLM + Harness. Harness = guias + sensores. Se a IA repetiu um erro, você precisa de um guia novo (regra) e de um sensor novo (checagem).'),
        ),
      );
    }
  }

  render();
}
