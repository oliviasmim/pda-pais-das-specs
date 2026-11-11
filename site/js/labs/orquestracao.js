import { h } from '../ui.js';
import { CENARIOS, JANELA, PADROES, ZONA_SMART, compararTodos, gerarCenario, simular, veredito } from '../logic/orquestracao.js';

const NAIPES = { unico: '♠', sequencial: '♣', paralelo: '♦', supervisor: '♥' };
const TIPOS = {
  task: 'trabalho',
  coord: 'coordenação',
  review: 'revisão',
  merge: 'integração',
  conflito: 'conflito',
  dumb: 'dumb zone',
};

const reduzido = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mount(el, ctx) {
  const salvo = ctx.state.load({});
  let cenarioId = salvo.cenarioId || 'speedrun';
  let seu = salvo.seu || { n: 4, dur: 10, compartilha: 'trivial', deps: 'independentes' };
  let palpite = null;
  let padraoAtual = null;

  const cenarioAtual = () => (cenarioId === 'seu' ? gerarCenario(seu) : CENARIOS.find((c) => c.id === cenarioId));
  const salvar = () => ctx.state.save({ cenarioId, seu });

  const listaCenarios = h('div', { class: 'or-cenarios', role: 'radiogroup', 'aria-label': 'Cenário' });
  const detalhe = h('div', { class: 'or-detalhe' });
  const montarSeu = h('div', { class: 'or-seu' });
  const escolha = h('div', { class: 'or-padroes', role: 'group', 'aria-label': 'Padrão de orquestração' });
  const pergunta = h('p', { class: 'or-pergunta' });
  const gantt = h('div', { class: 'or-gantt' });
  const metricas = h('div', { class: 'or-metricas', 'aria-live': 'polite' });
  const notas = h('ul', { class: 'or-notas' });
  const vered = h('div', { class: 'or-vered', 'aria-live': 'polite' });
  const comparar = h('div', { class: 'or-comparar' });
  const btnComparar = h('button', { class: 'btn btn--ghost btn--sm', type: 'button' }, 'Comparar os quatro');

  function desenharCenarios() {
    const todos = [...CENARIOS, { id: 'seu', nome: 'Monte o seu', descricao: 'Escolha número de tasks, duração, arquivos e dependências.' }];
    listaCenarios.replaceChildren(
      ...todos.map((c) =>
        h(
          'button',
          {
            class: 'or-cenario',
            type: 'button',
            role: 'radio',
            'aria-checked': String(c.id === cenarioId),
            onclick: () => {
              cenarioId = c.id;
              palpite = null;
              padraoAtual = null;
              salvar();
              tudo();
            },
          },
          h('span', { class: 'or-cenario__nome' }, c.nome),
        ),
      ),
    );
  }

  function desenharDetalhe() {
    const c = cenarioAtual();
    const contagem = {};
    c.tasks.forEach((t) => t.arquivos.forEach((a) => (contagem[a] = (contagem[a] || 0) + 1)));
    detalhe.replaceChildren(
      h('p', { class: 'or-desc' }, c.descricao),
      h(
        'div',
        { class: 'or-tabela-wrap' },
        h(
          'table',
          { class: 'or-tabela' },
          h('thead', {}, h('tr', {}, h('th', {}, 'Task'), h('th', {}, 'Min'), h('th', {}, 'Tokens'), h('th', {}, 'Depende de'), h('th', {}, 'Arquivos que toca'))),
          h(
            'tbody',
            {},
            c.tasks.map((t) =>
              h(
                'tr',
                {},
                h('td', {}, h('strong', {}, t.id), ' ', t.nome),
                h('td', { class: 'mono' }, t.dur),
                h('td', { class: 'mono' }, `${t.tokens}k`),
                h('td', { class: 'mono' }, t.deps.join(', ') || '—'),
                h(
                  'td',
                  {},
                  t.arquivos.length
                    ? t.arquivos.map((a) => h('span', { class: `or-arq mono${contagem[a] > 1 ? ' or-arq--disputa' : ''}`, title: contagem[a] > 1 ? 'Mais de uma task toca este arquivo' : '' }, a))
                    : h('span', { class: 'muted' }, 'só leitura'),
                ),
              ),
            ),
          ),
        ),
      ),
      h('p', { class: 'or-legenda muted' }, h('span', { class: 'or-arq or-arq--disputa mono' }, 'arquivo'), ' = mais de uma task toca o mesmo arquivo.'),
    );
    montarSeu.hidden = cenarioId !== 'seu';
  }

  function campoSeu(rotulo, input) {
    return h('label', { class: 'or-campo' }, h('span', {}, rotulo), input);
  }

  function desenharSeu() {
    const n = h('input', { type: 'range', min: 1, max: 6, value: seu.n });
    const nV = h('output', { class: 'mono' }, seu.n);
    const dur = h('input', { type: 'range', min: 2, max: 30, value: seu.dur });
    const durV = h('output', { class: 'mono' }, `${seu.dur} min`);
    const comp = h(
      'select',
      {},
      [
        ['nenhum', 'Cada uma no seu arquivo'],
        ['trivial', 'Todas registram 1 linha no mesmo arquivo'],
        ['mesmo', 'Todas mexem no mesmo arquivo de verdade'],
      ].map(([v, t]) => h('option', { value: v, selected: seu.compartilha === v }, t)),
    );
    const deps = h(
      'select',
      {},
      [
        ['independentes', 'Independentes'],
        ['cadeia', 'Em cadeia (cada uma depende da anterior)'],
      ].map(([v, t]) => h('option', { value: v, selected: seu.deps === v }, t)),
    );
    const mudar = () => {
      seu = { n: Number(n.value), dur: Number(dur.value), compartilha: comp.value, deps: deps.value };
      nV.textContent = seu.n;
      durV.textContent = `${seu.dur} min`;
      salvar();
      palpite = null;
      padraoAtual = null;
      desenharDetalhe();
      desenharEscolha();
      limparResultado();
    };
    [n, dur, comp, deps].forEach((i) => i.addEventListener('input', mudar));
    montarSeu.replaceChildren(
      campoSeu('Tasks', h('span', { class: 'or-range' }, n, nV)),
      campoSeu('Duração de cada', h('span', { class: 'or-range' }, dur, durV)),
      campoSeu('Arquivos', comp),
      campoSeu('Dependências', deps),
    );
  }

  function desenharEscolha() {
    pergunta.replaceChildren(
      palpite ? h('span', {}, 'Agora rode os outros padrões e veja onde cada um perde tempo.') : h('strong', {}, 'Antes de rodar: qual padrão você escolhe para este cenário? Diga em voz alta por quê.'),
    );
    escolha.replaceChildren(
      ...PADROES.map((p) =>
        h(
          'button',
          {
            class: `or-padrao${padraoAtual === p.id ? ' or-padrao--ativo' : ''}${palpite === p.id ? ' or-padrao--palpite' : ''}`,
            type: 'button',
            'aria-pressed': String(padraoAtual === p.id),
            onclick: () => rodar(p.id),
          },
          h('span', { class: 'or-padrao__naipe', 'aria-hidden': 'true' }, NAIPES[p.id]),
          h('span', { class: 'or-padrao__nome' }, p.nome),
          h('span', { class: 'or-padrao__resumo' }, p.resumo),
          palpite === p.id ? h('span', { class: 'chip or-padrao__tag' }, 'seu palpite') : null,
        ),
      ),
    );
  }

  function limparResultado() {
    gantt.replaceChildren(h('p', { class: 'muted or-vazio' }, 'Escolha um padrão acima para ver a linha do tempo.'));
    metricas.replaceChildren();
    notas.replaceChildren();
    vered.replaceChildren();
    comparar.replaceChildren();
    btnComparar.hidden = true;
  }

  function escala(c) {
    const { resultados } = compararTodos(c);
    return Math.max(...resultados.map((r) => r.tempo));
  }

  function desenharGantt(r, maxT) {
    const ticks = [];
    const passo = maxT > 60 ? 10 : 5;
    for (let t = 0; t <= maxT; t += passo) ticks.push(t);
    const pct = (x) => `${(x / maxT) * 100}%`;
    const atraso = reduzido() ? 0 : 1;
    gantt.replaceChildren(
      h(
        'div',
        { class: 'or-g', role: 'img', 'aria-label': `Linha do tempo de ${PADROES.find((p) => p.id === r.padrao).nome}: ${r.tempo} minutos no total.` },
        ...r.faixas.map((f) =>
          h(
            'div',
            { class: 'or-g__faixa' },
            h('span', { class: 'or-g__rot' }, f.rotulo),
            h(
              'div',
              { class: 'or-g__trilho' },
              r.blocos
                .filter((b) => b.faixa === f.id)
                .map((b) => {
                  const larg = b.fim - b.inicio;
                  const bloco = h(
                    'span',
                    {
                      class: `or-b or-b--${b.tipo}`,
                      style: { left: pct(b.inicio), width: pct(larg), animationDelay: `${(b.inicio / maxT) * 1.6 * atraso}s` },
                      title: `${b.rotulo} · ${b.inicio}–${b.fim} min (${TIPOS[b.tipo]})`,
                    },
                    larg / maxT > 0.07 ? h('span', { class: 'or-b__txt' }, b.rotulo) : null,
                  );
                  return bloco;
                }),
            ),
          ),
        ),
        h(
          'div',
          { class: 'or-g__eixo', 'aria-hidden': 'true' },
          h('span', { class: 'or-g__rot' }),
          h(
            'div',
            { class: 'or-g__trilho or-g__trilho--eixo' },
            ticks.map((t) => h('span', { class: 'or-g__tick', style: { left: pct(t) } }, `${t}`)),
            h('span', { class: 'or-g__fim', style: { left: pct(r.tempo) } }, `${r.tempo} min`),
          ),
        ),
      ),
      h(
        'div',
        { class: 'or-legenda-g' },
        Object.entries(TIPOS).map(([k, v]) => h('span', { class: 'or-leg' }, h('span', { class: `or-leg__cor or-b--${k}` }), v)),
      ),
    );
  }

  function desenharMetricas(r) {
    const smart = JANELA * ZONA_SMART;
    const pctCtx = Math.min(100, (r.picoContexto / JANELA) * 100);
    metricas.replaceChildren(
      metrica('Tempo total', `${r.tempo} min`),
      metrica('Tokens', `${r.tokens}k`),
      metrica('Coordenação', `${r.overhead} min`),
      metrica('Conflitos', String(r.conflitos.length), r.conflitos.some((c) => c.custo >= 5) ? 'bad' : r.conflitos.length ? 'warn' : 'ok'),
      h(
        'div',
        { class: 'or-m or-m--ctx' },
        h('span', { class: 'or-m__rot' }, 'Maior contexto de um agente'),
        h('span', { class: 'or-m__val' }, `${r.picoContexto}k de ${JANELA}k`),
        h(
          'span',
          { class: 'or-ctx', 'aria-hidden': 'true' },
          h('span', { class: `or-ctx__barra${r.picoContexto > smart ? ' or-ctx__barra--dumb' : ''}`, style: { width: `${pctCtx}%` } }),
          h('span', { class: 'or-ctx__limite', style: { left: `${ZONA_SMART * 100}%` } }),
        ),
        h('span', { class: 'or-ctx__leg' }, `tracejado = ${Math.round(ZONA_SMART * 100)}% da janela, fim da smart zone`),
      ),
    );
    notas.replaceChildren(...r.notas.map((n) => h('li', {}, n)), ...r.conflitos.slice(0, 4).map((c) => h('li', { class: 'or-nota-conf' }, `${c.a} × ${c.b} em `, h('code', {}, c.arquivo))));
  }

  function metrica(rot, val, tom) {
    return h('div', { class: `or-m${tom ? ` or-m--${tom}` : ''}` }, h('span', { class: 'or-m__rot' }, rot), h('span', { class: 'or-m__val' }, val));
  }

  function rodar(padrao) {
    const c = cenarioAtual();
    if (!palpite) palpite = padrao;
    padraoAtual = padrao;
    const r = simular(c, padrao);
    desenharGantt(r, escala(c));
    desenharMetricas(r);
    const v = veredito(c, palpite);
    const nomeMelhor = PADROES.find((p) => p.id === v.melhor).nome;
    vered.replaceChildren(
      h(
        'div',
        { class: `callout or-callout ${v.acertou ? 'or-callout--ok' : 'or-callout--nao'}` },
        h('strong', {}, v.acertou ? 'Seu palpite bateu.' : `Seu palpite: ${PADROES.find((p) => p.id === palpite).nome}. Melhor aqui: ${nomeMelhor}.`),
        h('p', {}, v.texto),
      ),
    );
    btnComparar.hidden = false;
    desenharEscolha();
  }

  btnComparar.addEventListener('click', () => {
    const c = cenarioAtual();
    const { resultados, melhor } = compararTodos(c);
    const maxTok = Math.max(...resultados.map((r) => r.tokens));
    const maxT = Math.max(...resultados.map((r) => r.tempo));
    comparar.replaceChildren(
      h(
        'div',
        { class: 'or-tabela-wrap' },
        h(
          'table',
          { class: 'or-tabela or-tabela--comp' },
          h('thead', {}, h('tr', {}, h('th', {}, 'Padrão'), h('th', {}, 'Tempo'), h('th', {}, 'Tokens'), h('th', {}, 'Conflitos'), h('th', {}, 'Dumb zone'))),
          h(
            'tbody',
            {},
            resultados.map((r) =>
              h(
                'tr',
                { class: r.padrao === melhor ? 'or-melhor' : '' },
                h('td', {}, h('span', { class: 'or-padrao__naipe', 'aria-hidden': 'true' }, NAIPES[r.padrao]), ' ', PADROES.find((p) => p.id === r.padrao).nome, r.padrao === melhor ? h('span', { class: 'chip chip--ok' }, 'melhor') : null),
                h('td', {}, h('span', { class: 'or-mini', style: { width: `${(r.tempo / maxT) * 100}%` } }), h('span', { class: 'mono' }, `${r.tempo} min`)),
                h('td', {}, h('span', { class: 'or-mini or-mini--tok', style: { width: `${(r.tokens / maxTok) * 100}%` } }), h('span', { class: 'mono' }, `${r.tokens}k`)),
                h('td', { class: 'mono' }, r.conflitos.length),
                h('td', {}, r.dumb ? h('span', { class: 'chip chip--warn' }, `sim, em ${r.dumb}`) : h('span', { class: 'muted' }, 'não')),
              ),
            ),
          ),
        ),
      ),
      h('p', { class: 'muted or-nota-pontos' }, 'Critério do "melhor": tempo + tokens (10k ≈ 1 min) + minutos de conflito + penalidade por dumb zone. Se o seu time paga mais caro por token do que por minuto, o vencedor pode mudar.'),
    );
  });

  function tudo() {
    desenharCenarios();
    desenharDetalhe();
    desenharSeu();
    desenharEscolha();
    limparResultado();
  }

  el.replaceChildren(
    h(
      'header',
      { class: 'lab__head' },
      h('span', { class: 'lab__tag' }, 'Laboratório'),
      h('h3', {}, 'Qual padrão você joga?'),
      h('p', {}, 'Escolha um cenário, aposte num padrão antes de rodar e compare a linha do tempo: minutos, tokens, coordenação e conflitos.'),
    ),
    h(
      'div',
      { class: 'lab__body' },
      h('h4', { class: 'or-h4' }, '1 · O cenário'),
      listaCenarios,
      detalhe,
      montarSeu,
      h('h4', { class: 'or-h4' }, '2 · O padrão'),
      pergunta,
      escolha,
      h('h4', { class: 'or-h4' }, '3 · O que acontece'),
      gantt,
      metricas,
      notas,
      vered,
      h('div', { class: 'row' }, btnComparar),
      comparar,
    ),
  );
  tudo();
}
