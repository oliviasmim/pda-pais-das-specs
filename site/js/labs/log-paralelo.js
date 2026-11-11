import { h } from '../ui.js';
import { VAZIO, VEREDITOS, calcular, gerarMarkdown, leituraAposta } from '../logic/log-paralelo.js';

export function mount(el, ctx) {
  let d = { ...VAZIO, ...(ctx.state.load({}) || {}) };
  if (!Array.isArray(d.tasks) || !d.tasks.length) d = { ...d, tasks: VAZIO.tasks };

  const resultado = h('div', { class: 'lp-resultado', 'aria-live': 'polite' });
  const acoes = h('div', { class: 'row lp-acoes' });

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag' }, 'Laboratório'),
      h('h3', {}, 'Do seu log para o documento'),
      h('p', {}, 'Rodou uma sessão paralela no projeto da agenda ou no seu? Copie os minutos do log. O laboratório calcula (a), (b) e (c) do documento "Quando um agente único teria sido melhor" e mostra se a sua aposta bateu.'),
    ),
    h('div', { class: 'lab__body' }, montarForm(), resultado, acoes),
  );

  function salvar() {
    ctx.state.save(d);
  }

  function nInput(rotulo, valor, aoMudar, dica) {
    const input = h('input', { type: 'number', min: 0, step: 1, inputmode: 'decimal', value: valor ?? '' });
    input.addEventListener('input', () => {
      aoMudar(input.value === '' ? null : Number(input.value));
      salvar();
      atualizar();
    });
    return h('label', { class: 'lp-campo' }, h('span', {}, rotulo), input, dica ? h('small', { class: 'muted' }, dica) : null);
  }

  function montarForm() {
    const tasks = h('fieldset', { class: 'lp-grupo' },
      h('legend', {}, 'Cada task sozinha, em minutos'),
      h('div', { class: 'lp-grade' },
        d.tasks.map((t, i) => nInput(`${t.id} ${t.nome}`, t.minutos, (v) => { d.tasks = d.tasks.map((x, j) => (j === i ? { ...x, minutos: v } : x)); })),
      ),
    );
    const tempos = h('fieldset', { class: 'lp-grupo' },
      h('legend', {}, 'Tempos da sessão paralela'),
      h('div', { class: 'lp-grade' },
        nInput('Aposta (min)', d.aposta, (v) => { d.aposta = v; }, 'Seção 1 do log'),
        nInput('Tempo real (min)', d.real, (v) => { d.real = v; }, 'Até o npm test verde'),
        nInput('Integração (min)', d.integracao, (v) => { d.integracao = v; }, 'Do 1º merge ao teste verde'),
        nInput('Diffs revisados', d.diffs, (v) => { d.diffs = v; }),
      ),
    );
    const conflito = h('select', { 'aria-label': 'Houve conflito de merge?' },
      h('option', { value: 'nao', selected: d.conflito !== 'sim' }, 'Não houve conflito'),
      h('option', { value: 'sim', selected: d.conflito === 'sim' }, 'Houve conflito'),
    );
    conflito.addEventListener('change', () => { d.conflito = conflito.value; salvar(); atualizar(); });
    const verde = h('input', { type: 'checkbox', checked: d.verde !== false });
    verde.addEventListener('change', () => { d.verde = verde.checked; salvar(); atualizar(); });
    return h('div', { class: 'lp-form' }, tasks, tempos,
      h('div', { class: 'row lp-extra' },
        h('label', { class: 'lp-campo' }, h('span', {}, 'Conflito de merge'), conflito),
        h('label', { class: 'lp-check' }, verde, h('span', {}, 'Testes fecharam 100% verdes')),
      ),
    );
  }

  function atualizar() {
    const r = calcular(d);
    acoes.replaceChildren();
    if (!r.ok) {
      resultado.replaceChildren(h('ul', { class: 'lp-erros' }, r.erros.map((e) => h('li', {}, e))));
      return;
    }
    const v = VEREDITOS[r.veredito];
    const chip = { valeu: 'chip--ok', empatou: 'chip--warn', unico: 'chip--bad', incompleto: 'chip--warn' }[r.veredito];
    const pior = r.ganho < 0;
    const larg = (x) => `${Math.max(2, Math.min(100, (x / Math.max(r.somaSozinhas, r.real, 1)) * 100))}%`;
    resultado.replaceChildren(
      h('div', { class: 'lp-barras', role: 'img', 'aria-label': `Soma das tasks sozinhas: ${r.somaSozinhas} minutos. Paralelo real: ${r.real} minutos.` },
        h('div', { class: 'lp-barra' }, h('span', {}, '(a) sozinhas, somadas'), h('div', { class: 'lp-trilho' }, h('div', { class: 'lp-preenche lp-preenche--a', style: { width: larg(r.somaSozinhas) } })), h('strong', { class: 'mono' }, `${r.somaSozinhas} min`)),
        h('div', { class: 'lp-barra' }, h('span', {}, '(b) paralelo, real'), h('div', { class: 'lp-trilho' }, h('div', { class: `lp-preenche ${pior ? 'lp-preenche--ruim' : 'lp-preenche--b'}`, style: { width: larg(r.real) } })), h('strong', { class: 'mono' }, `${r.real} min`)),
      ),
      h('p', { class: 'lp-conta mono' }, `(c) ganho = ${r.somaSozinhas} − ${r.real} = ${r.ganho} min (${r.ganhoPct}%)`),
      h('p', {}, leituraAposta(r)),
      h('p', {}, h('span', { class: `chip ${chip}` }, v.marca), ' ', v.dica),
      r.avisos.length ? h('ul', { class: 'lp-avisos' }, r.avisos.map((a) => h('li', {}, a))) : null,
    );
    if (r.veredito !== 'incompleto') {
      acoes.append(
        h('button', { class: 'btn btn--primary btn--sm', type: 'button', onclick: () => ctx.copy(gerarMarkdown(d)) }, 'Copiar seções 2 a 4 em Markdown'),
        h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: () => ctx.download('quando-um-agente-unico.md', gerarMarkdown(d)) }, 'Baixar .md'),
      );
    }
  }

  atualizar();
}
