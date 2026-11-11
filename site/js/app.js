import { h, toast, copy, download, slug } from './ui.js';
import { estadoDoLab, licaoFeita, marcarLicao, preferencia, definirPreferencia } from './store.js';
import { renderQuiz } from './quiz.js';
import { icone, pecas, iconeDaLicao } from './iso.js';
import { placaHarness } from './views/placa.js';
import { aulas, licoes, cartas, licaoPorId, vizinhas, aulaDaLicao } from '../content/curriculo.js';
import { maquinas, maquinaPorId } from '../content/maquinas.js';

const MARKED_URL = 'https://cdn.jsdelivr.net/npm/marked@12.0.2/lib/marked.esm.js';
const main = document.getElementById('conteudo');
let limpezas = [];
let observador = null;

let markedPromise = null;
function carregarMarked() {
  if (!markedPromise) {
    markedPromise = import(MARKED_URL)
      .then((m) => (md) => m.marked.parse(md, { gfm: true }))
      .catch(() => markdownMinimo);
  }
  return markedPromise;
}

function escapar(s) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

function markdownMinimo(md) {
  return md
    .split(/\n{2,}/)
    .map((bloco) => {
      if (/^\s*</.test(bloco)) return bloco;
      if (bloco.startsWith('## ')) return `<h2>${escapar(bloco.slice(3))}</h2>`;
      if (bloco.startsWith('### ')) return `<h3>${escapar(bloco.slice(4))}</h3>`;
      if (bloco.startsWith('```')) return `<pre><code>${escapar(bloco.replace(/^```\w*\n?|```$/g, ''))}</code></pre>`;
      return `<p>${escapar(bloco)}</p>`;
    })
    .join('\n');
}

function limpar() {
  limpezas.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignora falha de limpeza */
    }
  });
  limpezas = [];
  if (observador) observador.disconnect();
  observador = null;
}

function definirTitulo(t) {
  document.title = t ? `${t} · País das Specs` : 'País das Specs';
}

function marcarNav(rota) {
  document.querySelectorAll('.nav a').forEach((a) => {
    const alvo = a.getAttribute('href').slice(1) || '/';
    const atual = alvo === '/' ? rota === '/' : rota.startsWith(alvo) || (alvo === '/maquinas' && rota.startsWith('/maquina/'));
    if (atual) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  const nav = document.getElementById('nav');
  nav.dataset.aberto = '0';
  document.getElementById('menu-btn').setAttribute('aria-expanded', 'false');
}

function carregarCss(href) {
  if (document.querySelector(`link[data-css="${href}"]`)) return;
  document.head.append(h('link', { rel: 'stylesheet', href, 'data-css': href }));
}

function ctxDe(licaoId, labId) {
  return { labId, licaoId, state: estadoDoLab(licaoId, labId), toast, copy, download };
}

async function montarLab(el, licaoId) {
  const labId = el.dataset.lab;
  el.classList.add('lab', `lab-${labId}`);
  el.setAttribute('id', `lab-${labId}`);
  carregarCss(`css/labs/${labId}.css`);
  try {
    const mod = await import(`./labs/${labId}.js`);
    const fim = mod.mount(el, ctxDe(licaoId, labId));
    if (typeof fim === 'function') limpezas.push(fim);
  } catch (erro) {
    console.error(erro);
    el.replaceChildren(
      h('header', { class: 'lab__head' }, h('span', { class: 'lab__tag' }, 'Laboratório'), h('h3', {}, labId)),
      h('p', { class: 'lab__erro' }, 'Este laboratório não carregou. Recarregue a página. Se continuar, avise a facilitadora.'),
    );
  }
}

function cartasInline(ids) {
  return h(
    'div',
    { class: 'cartas-inline' },
    ids
      .map((id) => cartas.find((c) => c.id === id.trim()))
      .filter(Boolean)
      .map((c) =>
        h(
          'a',
          { class: 'carta-mini', href: `#/baralho?carta=${c.id}`, 'data-naipe': c.naipe },
          h('span', { class: 'carta__canto' }, c.naipe),
          h('span', {}, h('strong', {}, c.nome), h('span', {}, c.pergunta)),
        ),
      ),
  );
}

/* ---------------- views ---------------- */

function viewInicio() {
  definirTitulo('');
  const totalFeitas = licoes.filter((l) => licaoFeita(l.id)).length;

  const progresso = Math.round((totalFeitas / licoes.length) * 100);
  const heroi = h(
    'section',
    { class: 'palco' },
    h(
      'div',
      { class: 'palco__principal' },
      h(
        'div',
        { class: 'palco__cab' },
        h('div', { class: 'sobretitulo' }, 'Especialização em IA · PdA'),
        h('h1', { html: 'Para onde você quer <em>ir</em>?' }),
      ),
      placaHarness(licoes),
    ),
    h(
      'aside',
      { class: 'palco__lado' },
      h(
        'div',
        { class: 'painel painel--progresso' },
        h('span', { class: 'painel__icone', html: icone(pecas.livro()) }),
        h(
          'div',
          { class: 'painel__progresso' },
          h('span', { class: 'painel__rotulo' }, 'Lições feitas'),
          h('span', { class: 'barra-prog', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': licoes.length, 'aria-valuenow': totalFeitas, 'aria-label': 'Lições feitas' }, h('i', { style: { width: `${progresso}%` } })),
        ),
        h('span', { class: 'painel__conta mono' }, `${totalFeitas}/${licoes.length}`),
      ),
      h(
        'div',
        { class: 'painel' },
        h('div', { class: 'painel__abas', role: 'presentation' }, h('span', { class: 'ativa' }, 'Ponto de partida')),
        h(
          'figure',
          { class: 'dialogo' },
          h('span', { class: 'quem' }, 'Alice'),
          h('p', {}, '“Você poderia me dizer, por favor, que caminho devo tomar para sair daqui?”'),
          h('span', { class: 'quem gato' }, 'O Gato'),
          h('p', {}, '“Isso depende bastante de para onde você quer ir.”'),
          h('span', { class: 'quem' }, 'Alice'),
          h('p', {}, '“Não me importa muito para onde…”'),
          h('span', { class: 'quem gato' }, 'O Gato'),
          h('p', {}, '“Então não importa que caminho você tome.”'),
          h('cite', {}, 'Lewis Carroll, Alice no País das Maravilhas (1865), cap. 6. Tradução livre.'),
        ),
        h(
          'p',
          { class: 'painel__lead' },
          'Subagent, worktree, CI e review deixam a IA mais rápida. Para onde ela vai, quem escreve é você, na spec: o que o sistema faz, quão bem precisa fazer (com número) e qual teste mostra que fez.',
        ),
      ),
      h(
        'div',
        { class: 'painel painel--codigo' },
        h('div', { class: 'painel__abas' }, h('span', { class: 'ativa' }, 'Leve com você'), h('span', { class: 'mono faint' }, 'AGENTS.md')),
        h(
          'ol',
          { class: 'codigo-linhas mono' },
          ['## Regras', '1. Não crie regra que não', '   esteja em docs/spec.md.', '2. Status e mensagem de erro', '   exatamente como na spec.', '3. Pronto é quando o gate passa.'].map((t) => h('li', {}, t)),
        ),
      ),
      h(
        'div',
        { class: 'row' },
        h('a', { class: 'btn btn--primary', href: `#/licao/${licoes[0].id}` }, totalFeitas ? 'Continuar' : 'Começar pela lição 1', ' →'),
        h('a', { class: 'btn', href: '#/baralho' }, 'As 6 perguntas'),
      ),
    ),
  );

  const faixa = h(
    'section',
    { class: 'faixa', 'aria-label': 'Lições' },
    h('h2', { class: 'faixa__titulo' }, 'Lições'),
    h(
      'ol',
      { class: 'faixa__lista' },
      licoes.map((l) =>
        h(
          'li',
          {},
          h(
            'a',
            { class: `faixa__item${licaoFeita(l.id) ? ' feita' : ''}`, href: `#/licao/${l.id}` },
            h('span', { class: 'faixa__arte', html: icone(iconeDaLicao[l.id]?.() || pecas.chip()) }),
            h('span', { class: 'faixa__nome' }, `${l.numero}. ${l.titulo}`),
            h('span', { class: 'faixa__seta', 'aria-hidden': 'true' }, licaoFeita(l.id) ? '✓' : '›'),
          ),
        ),
      ),
    ),
  );

  const frase = h(
    'section',
    { class: 'frase-semana', 'aria-label': 'Frase para levar' },
    h('p', { html: 'Requisito sem número é <em>desejo</em>.<br>Requisito sem sensor é <em>promessa</em>.' }),
  );

  const blocoAulas = h(
    'section',
    { class: 'secao' },
    h('div', { class: 'secao__cab' }, h('h2', {}, 'Em que ordem fazer'), h('span', { class: 'muted' }, 'Quem digita é você. As 6 perguntas mostram se você sabe o que quer da IA.')),
    h(
      'div',
      { class: 'aulas' },
      aulas.map((a) =>
        h(
          'article',
          { class: 'card aula' },
          h('div', { class: 'aula__cab' }, h('h3', {}, a.titulo), h('span', { class: 'chip' }, '2h')),
          h('p', { class: 'aula__pergunta' }, a.pergunta),
          h(
            'ol',
            { class: 'lista-licoes' },
            a.licoes.map((id) => {
              const l = licaoPorId(id);
              return h(
                'li',
                {},
                h(
                  'a',
                  { href: `#/licao/${l.id}` },
                  h('span', { class: 'num' }, l.numero),
                  h('span', {}, h('span', { class: 'titulo-licao' }, l.titulo), h('span', { class: 'sub-licao' }, l.subtitulo)),
                  licaoFeita(l.id) ? h('span', { class: 'feito' }, '✓ feita') : h('span', { class: 'faint', style: { fontSize: '0.8rem' } }, `${l.tempo} min`),
                ),
              );
            }),
          ),
          h('p', { class: 'muted', style: { margin: '1rem 0 0', fontSize: '0.9rem' } }, h('strong', {}, 'Entregável: '), a.entregavel),
        ),
      ),
    ),
  );

  const atalhos = h(
    'section',
    { class: 'secao' },
    h('div', { class: 'secao__cab' }, h('h2', {}, 'Ferramentas')),
    h(
      'div',
      { class: 'atalhos' },
      [
        { href: '#/maquinas', arte: pecas.chip(), t: 'Máquinas', d: 'Seis simulações para rodar, quebrar e abrir: agente, requisito, subagent, worktrees, esteira e review.' },
        { href: '#/baralho', arte: pecas.cartas(), t: 'As 6 perguntas', d: 'As perguntas da facilitadora, com a resposta que trava e a que avança. Dá para imprimir.' },
        { href: '#/glossario', arte: pecas.livro(), t: 'Glossário', d: 'Cada termo com o que se ouve por aí e o que ele é na prática.' },
      ].map((a) => h('a', { class: 'card atalho', href: a.href }, h('span', { class: 'atalho__arte', html: icone(a.arte) }), h('h3', {}, a.t), h('p', {}, a.d))),
    ),
  );

  main.replaceChildren(heroi, faixa, frase, blocoAulas, atalhos);
}

function viewBaralho(params) {
  definirTitulo('As 6 perguntas');
  const foco = params.get('carta');
  const grade = h(
    'div',
    { class: 'baralho' },
    cartas.map((c) => {
      const el = h('div', { class: 'carta', 'data-naipe': c.naipe, id: `carta-${c.id}`, 'data-virada': '0' });
      const btn = h(
        'button',
        { type: 'button', class: 'carta__btn', 'aria-pressed': 'false', 'aria-label': `Carta ${c.nome}. ${c.pergunta} Toque para ver exemplos de resposta.` },
        h(
          'div',
          { class: 'carta__in' },
          h(
            'div',
            { class: 'carta__face' },
            h('span', { class: 'carta__canto' }, c.naipe),
            h('span', { class: 'carta__nome' }, c.nome),
            h('p', { class: 'carta__pergunta' }, c.pergunta),
            h('span', { class: 'carta__mede' }, `Mede: ${c.mede}`),
            h('span', { class: 'carta__dica' }, 'Toque para virar'),
          ),
          h(
            'div',
            { class: 'carta__face carta__verso' },
            h('span', { class: 'carta__canto' }, c.naipe),
            h('span', { class: 'carta__nome' }, c.nome),
            h('div', { class: 'carta__resp carta__resp--ruim' }, h('b', {}, 'Resposta que trava'), c.ruim),
            h('div', { class: 'carta__resp carta__resp--boa' }, h('b', {}, 'Resposta que avança'), c.boa),
          ),
        ),
      );
      btn.addEventListener('click', () => {
        const virada = el.dataset.virada === '1' ? '0' : '1';
        el.dataset.virada = virada;
        btn.setAttribute('aria-pressed', virada === '1' ? 'true' : 'false');
      });
      el.append(btn);
      return el;
    }),
  );

  main.replaceChildren(
    h(
      'section',
      { class: 'secao', style: { marginTop: '0.5rem' } },
      h('div', { class: 'sobretitulo' }, 'Para usar na prática'),
      h('h1', {}, 'As 6 perguntas'),
      h(
        'p',
        { class: 'heroi__lead' },
        'Seis perguntas que a facilitadora faz durante a prática. Se você responde cada uma com uma linha do diff, um número ou o status e a mensagem exatos, você sabe o que quer da IA. Se a resposta tem "testaria", "trataria" ou "acho que", ainda não sabe para onde quer ir.',
      ),
      h(
        'div',
        { class: 'row nao-imprimir', style: { margin: '1.2rem 0 2rem' } },
        h('button', { class: 'btn', type: 'button', onclick: () => document.querySelectorAll('.carta').forEach((c) => (c.dataset.virada = '0')) }, 'Desvirar todas'),
        h('button', { class: 'btn', type: 'button', onclick: () => document.querySelectorAll('.carta').forEach((c) => (c.dataset.virada = '1')) }, 'Virar todas'),
        h('button', { class: 'btn', type: 'button', onclick: () => sortearCarta() }, 'Sortear uma carta'),
        h('button', { class: 'btn btn--ghost', type: 'button', onclick: () => window.print() }, 'Imprimir'),
      ),
      grade,
    ),
  );

  function sortearCarta() {
    const todas = [...document.querySelectorAll('.carta')];
    todas.forEach((c) => (c.style.opacity = '0.35'));
    const escolhida = todas[Math.floor(Math.random() * todas.length)];
    escolhida.style.opacity = '1';
    escolhida.scrollIntoView({ behavior: 'smooth', block: 'center' });
    escolhida.querySelector('button').focus({ preventScroll: true });
    setTimeout(() => todas.forEach((c) => (c.style.opacity = '')), 4000);
  }

  if (foco) {
    const alvo = document.getElementById(`carta-${foco}`);
    if (alvo) setTimeout(() => alvo.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  }
}

async function viewGlossario() {
  definirTitulo('Glossário');
  const { termos } = await import('../content/glossario.js');
  const lista = h('div', { class: 'tabela-wrap' });
  const campo = h('input', { class: 'busca', type: 'search', placeholder: 'Buscar: worktree, p95, gate…', 'aria-label': 'Buscar termo no glossário' });

  function desenhar(filtro = '') {
    const f = slug(filtro);
    const visiveis = termos.filter((t) => !f || slug(`${t.termo} ${t.dizem} ${t.significa}`).includes(f));
    lista.replaceChildren(
      h(
        'table',
        { class: 'tabela' },
        h('thead', {}, h('tr', {}, h('th', {}, 'Termo'), h('th', {}, 'O que se ouve por aí'), h('th', {}, 'O que é na prática'), h('th', {}, 'Onde ver'))),
        h(
          'tbody',
          {},
          visiveis.length
            ? visiveis.map((t) =>
                h(
                  'tr',
                  {},
                  h('td', {}, h('strong', {}, t.termo)),
                  h('td', { class: 'muted' }, t.dizem),
                  h('td', {}, t.significa),
                  h('td', {}, t.licao ? h('a', { href: `#/licao/${t.licao}` }, licaoPorId(t.licao)?.titulo || t.licao) : h('span', { class: 'faint' }, `S${t.semana}`)),
                ),
              )
            : h('tr', {}, h('td', { colspan: 4, class: 'muted' }, 'Nenhum termo com essa palavra. Tente o nome em inglês ou em português.')),
        ),
      ),
    );
  }

  campo.addEventListener('input', () => desenhar(campo.value));
  desenhar();
  main.replaceChildren(
    h(
      'section',
      { class: 'secao', style: { marginTop: '0.5rem' } },
      h('div', { class: 'sobretitulo' }, 'Linguagem ubíqua: o mesmo nome para a mesma coisa'),
      h('h1', {}, 'Glossário'),
      h('p', { class: 'heroi__lead' }, 'Teste rápido: explique o termo sem usar a própria palavra. Se travar, leia a terceira coluna e abra a lição da quarta.'),
      h('div', { style: { margin: '1.5rem 0' } }, campo),
      lista,
    ),
  );
}

function viewMaquinas() {
  definirTitulo('Máquinas');
  carregarCss('css/motion.css');
  main.replaceChildren(
    h(
      'section',
      { class: 'secao', style: { marginTop: '0.5rem' } },
      h('div', { class: 'sobretitulo' }, 'Por dentro da caixa'),
      h('h1', {}, 'As máquinas'),
      h(
        'p',
        { class: 'heroi__lead' },
        'Cada máquina abre uma peça do que a gente usou no curso e mostra o mecanismo funcionando, um passo por vez. Rode, quebre uma peça, abra a caixa e olhe o livro-razão. Toda máquina também aparece dentro da lição dela.',
      ),
      h(
        'div',
        { class: 'galeria-maquinas' },
        maquinas.map((m) => {
          const l = licaoPorId(m.licao);
          return h(
            'a',
            { class: 'card maquina-card', href: `#/maquina/${m.id}` },
            h('span', { class: 'fig' }, m.fig),
            h('h3', {}, m.titulo),
            h('p', {}, m.resumo),
            l ? h('span', { class: 'onde' }, `Na lição ${l.numero}: ${l.titulo}`) : null,
          );
        }),
      ),
    ),
  );
}

async function viewMaquina(id, params) {
  const m = maquinaPorId(id);
  if (!m) return viewNaoAchei();
  definirTitulo(m.titulo);
  carregarCss('css/motion.css');
  const l = licaoPorId(m.licao);
  const el = h('div', { class: 'lab', id: `lab-${m.id}` });
  main.replaceChildren(
    h(
      'section',
      { class: 'secao', style: { marginTop: '0.5rem' } },
      h(
        'p',
        { class: 'muted', style: { margin: '0 0 0.5rem' } },
        h('a', { href: '#/maquinas' }, '← Todas as máquinas'),
        l ? [' · ', h('a', { href: `#/licao/${l.id}` }, `Lição ${l.numero}: ${l.titulo}`)] : null,
      ),
      el,
    ),
  );
  try {
    const [motor, def] = await Promise.all([import('./motion.js'), import(`./logic/${m.id}.js`)]);
    if (location.hash.split('?')[0] !== `#/maquina/${id}`) return;
    const fim = motor.montarMotion(el, ctxDe('maquinas', m.id), def.motion, { inicial: params.get('m') || '', telaCheia: true });
    if (typeof fim === 'function') limpezas.push(fim);
  } catch (erro) {
    console.error(erro);
    el.replaceChildren(h('p', { class: 'lab__erro' }, 'Esta máquina não carregou. Recarregue a página. Se continuar, avise a facilitadora.'));
  }
}

async function viewLicao(id) {
  const licao = licaoPorId(id);
  if (!licao) return viewNaoAchei();
  definirTitulo(licao.titulo);
  main.replaceChildren(h('p', { class: 'carregando' }, 'Abrindo a lição…'));

  const [md, quiz, render] = await Promise.all([
    fetch(`content/licoes/${id}.md`).then((r) => (r.ok ? r.text() : null)).catch(() => null),
    fetch(`content/quiz/${id}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    carregarMarked(),
  ]);

  if (location.hash.split('?')[0] !== `#/licao/${id}`) return;

  const aula = aulaDaLicao(id);
  const { anterior, proxima } = vizinhas(id);
  const perguntas = (etapa) => (quiz?.perguntas || []).filter((q) => q.etapa === etapa);

  const cab = h(
    'header',
    { class: 'licao__cab' },
    iconeDaLicao[id] ? h('div', { class: 'licao__arte', html: icone(iconeDaLicao[id](), { pad: 4 }) }) : null,
    h('div', { class: 'sobretitulo' }, aula ? `${aula.titulo} · Lição ${licao.numero}` : `Lição ${licao.numero}`),
    h('h1', {}, licao.titulo),
    h('p', { class: 'lema' }, licao.lema),
    h(
      'div',
      { class: 'meta' },
      h('span', { class: 'chip' }, `⏱ ${licao.tempo} min`),
      h('span', { class: 'chip' }, licao.subtitulo),
      h('span', { class: 'chip' }, `Revisa ${licao.semanas.map((s) => `S${s}`).join(', ')}`),
      licaoFeita(id) ? h('span', { class: 'chip chip--ok' }, '✓ feita') : null,
    ),
    h('div', { class: 'objetivos' }, h('h4', {}, 'Ao final, você consegue'), h('ul', {}, licao.objetivos.map((o) => h('li', {}, o)))),
  );

  const prosa = h('article', { class: 'prosa' });
  prosa.innerHTML = md ? render(md) : '<p class="muted">O texto desta lição ainda não foi escrito.</p>';

  prosa.querySelectorAll('table').forEach((t) => {
    const wrap = h('div', { class: 'tabela-wrap' });
    t.replaceWith(wrap);
    wrap.append(t);
  });

  prosa.querySelectorAll('pre').forEach((pre) => {
    const b = h('button', { type: 'button', class: 'copiar' }, 'copiar');
    b.addEventListener('click', () => copy(pre.querySelector('code')?.textContent ?? pre.textContent));
    pre.append(b);
  });

  prosa.querySelectorAll('a[href^="http"]').forEach((a) => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
  });

  prosa.querySelectorAll('[data-cartas]').forEach((el) => el.replaceWith(cartasInline(el.dataset.cartas.split(','))));

  const pre = perguntas('pre');
  if (pre.length) prosa.prepend(renderQuiz(id, 'pre', pre));

  const check = perguntas('check');
  const alvoCheck = prosa.querySelector('[data-quiz="check"]');
  if (check.length) {
    const q = renderQuiz(id, 'check', check);
    if (alvoCheck) alvoCheck.replaceWith(q);
    else prosa.append(q);
  } else if (alvoCheck) alvoCheck.remove();

  const pos = perguntas('pos');
  if (pos.length) prosa.append(renderQuiz(id, 'pos', pos));

  const titulos = [...prosa.querySelectorAll(':scope > h2')];
  titulos.forEach((t) => {
    if (!t.id) t.id = slug(t.textContent);
  });

  const indice = h(
    'ol',
    {},
    titulos.map((t) =>
      h('li', {}, h('a', { href: `#/licao/${id}`, 'data-alvo': t.id, onclick: (e) => (e.preventDefault(), t.scrollIntoView({ behavior: 'smooth', block: 'start' })) }, t.textContent)),
    ),
  );

  const lado = h(
    'aside',
    { class: 'licao__lado', 'aria-label': 'Nesta lição' },
    h('h4', {}, 'Nesta lição'),
    indice,
    h('h4', {}, aula ? aula.titulo : 'Lições'),
    h(
      'ol',
      {},
      (aula ? aula.licoes : licoes.map((l) => l.id)).map((lid) => {
        const l = licaoPorId(lid);
        return h('li', { class: lid === id ? 'eh-atual' : '' }, h('a', { href: `#/licao/${lid}` }, `${l.numero}. ${l.titulo}`));
      }),
    ),
  );

  const btnConcluir = h('button', { type: 'button', class: licaoFeita(id) ? 'btn' : 'btn btn--primary' }, licaoFeita(id) ? 'Desmarcar lição' : 'Marcar lição como feita');
  btnConcluir.addEventListener('click', () => {
    const feita = !licaoFeita(id);
    marcarLicao(id, feita);
    btnConcluir.textContent = feita ? 'Desmarcar lição' : 'Marcar lição como feita';
    btnConcluir.className = feita ? 'btn' : 'btn btn--primary';
    toast(feita ? `Lição ${licao.numero} feita. O ✓ aparece na página inicial.` : `Lição ${licao.numero} desmarcada.`);
  });

  const conteudo = h(
    'div',
    {},
    cab,
    prosa,
    h('div', { class: 'concluir' }, btnConcluir, h('span', { class: 'muted' }, 'O progresso fica salvo só neste navegador. Em outro computador, começa do zero.')),
    h(
      'nav',
      { class: 'navegacao', 'aria-label': 'Lições vizinhas' },
      anterior ? h('a', { href: `#/licao/${anterior.id}` }, h('small', {}, '← Anterior'), anterior.titulo) : h('span'),
      proxima
        ? h('a', { class: 'prox', href: `#/licao/${proxima.id}` }, h('small', {}, 'Próxima →'), proxima.titulo)
        : h('a', { class: 'prox', href: '#/maquinas' }, h('small', {}, 'Fim das lições →'), 'Abrir as máquinas'),
    ),
  );

  main.replaceChildren(h('div', { class: 'licao' }, lado, conteudo));
  window.scrollTo(0, 0);

  await Promise.all([...prosa.querySelectorAll('[data-lab]')].map((el) => montarLab(el, id)));

  if ('IntersectionObserver' in window && titulos.length) {
    observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            indice.querySelectorAll('a').forEach((a) => (a.dataset.ativo = a.dataset.alvo === e.target.id ? '1' : '0'));
          }
        });
      },
      { rootMargin: '-80px 0px -70% 0px' },
    );
    titulos.forEach((t) => observador.observe(t));
  }
}

function viewNaoAchei() {
  definirTitulo('Caminho errado');
  main.replaceChildren(
    h(
      'section',
      { class: 'secao', style: { textAlign: 'center' } },
      h('h1', {}, 'Qualquer caminho serve?'),
      h('p', { class: 'heroi__lead', style: { margin: '0 auto 1.5rem' } }, 'Este endereço não existe no site. Confira o link ou volte para o início.'),
      h('a', { class: 'btn btn--primary', href: '#/' }, 'Voltar ao início'),
    ),
  );
}

/* ---------------- roteador ---------------- */

async function rotear() {
  limpar();
  const [caminho, query = ''] = (location.hash.slice(1) || '/').split('?');
  const params = new URLSearchParams(query);
  marcarNav(caminho);
  const partes = caminho.split('/').filter(Boolean);
  try {
    if (partes.length === 0) viewInicio();
    else if (partes[0] === 'licao' && partes[1]) await viewLicao(partes[1]);
    else if (partes[0] === 'baralho') viewBaralho(params);
    else if (partes[0] === 'glossario') await viewGlossario();
    else if (partes[0] === 'maquinas') viewMaquinas();
    else if (partes[0] === 'maquina' && partes[1]) await viewMaquina(partes[1], params);
    else viewNaoAchei();
  } catch (erro) {
    console.error(erro);
    main.replaceChildren(h('p', { class: 'carregando' }, 'Esta página deu erro ao abrir. Recarregue. Se continuar, avise a facilitadora.'));
  }
  if (!params.get('carta') && partes[0] !== 'licao') window.scrollTo(0, 0);
}

/* ---------------- preferências ---------------- */

function aplicarProjetor(ativo) {
  const r = document.documentElement;
  if (ativo) r.setAttribute('data-projetor', '1');
  else r.removeAttribute('data-projetor');
  document.getElementById('btn-projetor').setAttribute('aria-pressed', ativo ? 'true' : 'false');
  definirPreferencia('projetor', ativo);
}

function temaAtual() {
  const r = document.documentElement.getAttribute('data-theme');
  if (r) return r;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

document.getElementById('btn-tema').addEventListener('click', () => {
  const novo = temaAtual() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', novo);
  definirPreferencia('tema', novo);
});

document.getElementById('btn-projetor').addEventListener('click', () => aplicarProjetor(!document.documentElement.hasAttribute('data-projetor')));
document.getElementById('btn-projetor').setAttribute('aria-pressed', preferencia('projetor', false) ? 'true' : 'false');

document.getElementById('menu-btn').addEventListener('click', (e) => {
  const nav = document.getElementById('nav');
  const aberto = nav.dataset.aberto === '1';
  nav.dataset.aberto = aberto ? '0' : '1';
  e.currentTarget.setAttribute('aria-expanded', aberto ? 'false' : 'true');
});

document.addEventListener('keydown', (e) => {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
  const alvo = e.target;
  if (alvo instanceof HTMLElement && (alvo.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName))) return;
  if (e.key === 'p' || e.key === 'P') aplicarProjetor(!document.documentElement.hasAttribute('data-projetor'));
});

window.addEventListener('hashchange', rotear);
rotear();
