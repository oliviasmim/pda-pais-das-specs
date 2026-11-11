import { h } from '../ui.js';
import { CENARIOS, lerCenario, avaliarCenario, gerarTeste } from '../logic/bdd-para-teste.js';

const ROTULO = { faltando: 'falta', vago: 'vago', composto: 'dois em um' };
const CHIP = { faltando: 'chip--bad', vago: 'chip--warn', composto: 'chip--warn' };

export function mount(el, ctx) {
  const salvo = ctx.state.load({ texto: CENARIOS[0].texto });
  const estado = { texto: salvo.texto || CENARIOS[0].texto };

  const area = h('textarea', { id: `bdd-texto-${ctx.licaoId}`, rows: '7', spellcheck: 'false' });
  area.value = estado.texto;
  const lista = h('div', { class: 'bdd-exemplos' });
  const avisos = h('div', { class: 'bdd-avisos', 'aria-live': 'polite' });
  const codigo = h('pre', { class: 'bdd-codigo' }, h('code', {}));
  const btnCopiar = h('button', { class: 'btn btn--sm', type: 'button', onclick: () => ctx.copy(codigo.textContent) }, 'Copiar teste');

  for (const ex of CENARIOS) {
    lista.append(h('button', { class: 'btn btn--sm btn--ghost', type: 'button', onclick: () => {
      estado.texto = ex.texto; area.value = ex.texto; render();
    } }, ex.nome));
  }

  function render() {
    ctx.state.save({ texto: estado.texto });
    const c = lerCenario(estado.texto);
    const lista_ = avaliarCenario(c);
    avisos.replaceChildren(
      lista_.length
        ? h('ul', { class: 'bdd-lista' }, lista_.map((a) => h('li', {}, h('span', { class: `chip ${CHIP[a.tipo] || ''}` }, ROTULO[a.tipo] || a.tipo), ' ', a.msg)))
        : h('p', {}, h('span', { class: 'chip chip--ok' }, 'Passa'), ' Um cenário, uma ação, um resultado que um teste consegue conferir.'),
    );
    codigo.firstChild.textContent = gerarTeste(c);
  }

  area.addEventListener('input', () => { estado.texto = area.value; render(); });

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag' }, 'Laboratório'),
      h('h3', {}, 'De cenário BDD a teste: o que o assert vai conferir?'),
      h('p', {}, 'Escolha um cenário da agenda ou edite o texto. Os avisos mostram o que um teste não conseguiria conferir, e o esqueleto do teste ao lado muda junto.'),
    ),
    h('div', { class: 'lab__body' },
      lista,
      h('div', { class: 'bdd-grid' },
        h('div', {},
          h('label', { for: area.id, class: 'bdd-rotulo' }, 'Cenário (Dado, Quando, Então)'),
          area,
          avisos),
        h('div', {},
          h('p', { class: 'bdd-rotulo' }, 'Teste gerado (node:test)'),
          codigo,
          btnCopiar)),
    ),
  );
  render();
}
