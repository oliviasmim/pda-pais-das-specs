import { h } from '../ui.js';
import { FICHAS, PAPEIS, JANELA, LIMITE_SMART, avaliar, formatarTokens, VEREDITOS } from '../logic/faxina-contexto.js';

const ZONA_TXT = { smart: 'smart zone', dumb: 'dumb zone', cheia: 'janela cheia' };
const ZONA_CHIP = { smart: 'chip--ok', dumb: 'chip--bad', cheia: 'chip--bad' };

export function mount(el, ctx) {
  const salvo = ctx.state.load({ dentro: FICHAS.map((f) => f.id) }) || {};
  let dentro = new Set((salvo.dentro || []).filter((id) => FICHAS.some((f) => f.id === id)));

  const barra = h('div', { class: 'fx-barra', role: 'img' });
  const chip = h('span', { class: 'chip' });
  const num = h('strong', { class: 'mono' });
  const lista = h('ul', { class: 'fx-fichas' });
  const veredito = h('div', { class: 'callout fx-veredito', 'aria-live': 'polite' });
  const falta = h('ul', { class: 'fx-falta', 'aria-live': 'polite' });

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag' }, 'Laboratório'),
      h('h3', {}, 'Faxina de contexto'),
      h('p', {}, 'O agente vai implementar a T1. Clique numa ficha para tirá-la da janela ou pôr de volta. Fique abaixo de 60% sem perder o que ele precisa para não inventar.'),
    ),
    h('div', { class: 'lab__body' },
      h('div', { class: 'row fx-cab' }, h('h4', {}, 'Janela do agente'), chip, h('span', { class: 'muted fx-num' }, num, ` de ${formatarTokens(JANELA)} tokens`)),
      h('div', { class: 'fx-trilho' }, barra, h('span', { class: 'fx-limite', style: { left: `${LIMITE_SMART * 100}%` } }, h('span', {}, `${Math.round(LIMITE_SMART * 100)}%`))),
      h('div', { class: 'row fx-acoes' },
        h('button', { type: 'button', class: 'btn btn--sm btn--ghost', onclick: () => mudar(new Set(FICHAS.map((f) => f.id))) }, 'Colocar tudo'),
        h('button', { type: 'button', class: 'btn btn--sm btn--ghost', onclick: () => mudar(new Set()) }, 'Esvaziar'),
      ),
      lista,
      veredito,
      falta,
    ),
  );

  function mudar(novo) {
    dentro = novo;
    ctx.state.save({ dentro: [...dentro] });
    render();
  }

  function alternar(id) {
    const novo = new Set(dentro);
    if (novo.has(id)) novo.delete(id);
    else novo.add(id);
    mudar(novo);
  }

  function render() {
    const r = avaliar([...dentro]);
    chip.className = `chip ${ZONA_CHIP[r.zona]}`;
    chip.textContent = ZONA_TXT[r.zona];
    num.textContent = formatarTokens(r.tokens);
    const segs = [h('span', { class: 'fx-seg fx-seg--base', style: { width: `${(r.tokens - FICHAS.filter((f) => dentro.has(f.id)).reduce((a, f) => a + f.tokens, 0)) / JANELA * 100}%` } })];
    for (const f of FICHAS) if (dentro.has(f.id)) segs.push(h('span', { class: `fx-seg fx-seg--${f.papel}`, title: f.nome, style: { width: `${(f.tokens / JANELA) * 100}%` } }));
    barra.replaceChildren(...segs);
    barra.setAttribute('aria-label', `${(r.fracao * 100).toFixed(0)}% da janela ocupada, ${ZONA_TXT[r.zona]}`);
    lista.replaceChildren(...FICHAS.map((f) => {
      const on = dentro.has(f.id);
      return h('li', {},
        h('button', { type: 'button', class: `fx-ficha fx-ficha--${f.papel}${on ? ' is-dentro' : ''}`, 'aria-pressed': on ? 'true' : 'false', onclick: () => alternar(f.id) },
          h('span', { class: 'fx-ficha__nome' }, f.nome),
          h('span', { class: 'fx-ficha__meta mono' }, `${formatarTokens(f.tokens)} · ${PAPEIS[f.papel]}`),
          h('span', { class: 'fx-ficha__estado' }, on ? 'dentro da janela' : 'fora da janela'),
        ),
      );
    }));
    veredito.replaceChildren(h('p', {}, VEREDITOS[r.veredito]));
    falta.replaceChildren(...[...r.faltando, ...r.utilFora].map((f) => h('li', {}, h('span', { class: `chip ${f.papel === 'essencial' ? 'chip--bad' : 'chip--warn'}` }, f.papel === 'essencial' ? 'falta' : 'ajudaria'), ' ', f.falta)));
  }

  render();
}
