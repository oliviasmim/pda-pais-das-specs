import { h } from '../ui.js';
import {
  PASSOS,
  RAIZ,
  TASKS,
  criarEstado,
  executar,
  progressoMissao,
  resolverConflito,
  rotasPerdidas,
  rotuloCaminho,
  simularMesmaPasta,
  textoConflito,
} from '../logic/worktrees.js';

const XICARA = `<svg viewBox="0 0 64 48" aria-hidden="true" class="wt-xicara-svg"><path d="M8 14h38v10c0 11-8.5 18-19 18S8 35 8 24z" fill="var(--xic-fill)" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M46 18h4.5a6.5 6.5 0 0 1 0 13H44" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M4 44h50" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path class="wt-vapor" d="M20 9c-2-2.5 2-4 0-7M28 9c-2-2.5 2-4 0-7M36 9c-2-2.5 2-4 0-7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;

const CHAPEU = `<svg viewBox="0 0 64 48" aria-hidden="true" class="wt-xicara-svg"><path d="M18 34V8h28v26" fill="var(--xic-fill)" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M6 38c8-5 44-5 52 0-8 4-44 4-52 0z" fill="var(--xic-fill)" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M18 26h28" stroke="var(--copas)" stroke-width="4"/><rect x="34" y="14" width="9" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;

const reduzido = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function svg(html) {
  const s = h('span', { class: 'wt-ico' });
  s.innerHTML = html;
  return s;
}

function linhaTerminal(texto, tipo = 'out') {
  return h('div', { class: `wt-linha wt-linha--${tipo}` }, texto || ' ');
}

function sugestoes(estado) {
  const p = progressoMissao(estado);
  if (estado.conflito) return ['git status', 'git merge --abort'];
  if (!p.criar) {
    const livres = ['agendar', 'cancelar', 'vagas'].filter((n) => !Object.keys(estado.branches).some((b) => b.includes(n)));
    const [a, b] = livres;
    return [a && `claude -w ${a}`, b && `git worktree add ../wt-${b} -b ${b}`, 'git worktree list'].filter(Boolean);
  }
  if (!p.agentes) {
    const sem = estado.worktrees.filter((w) => !w.principal && !estado.agentes.some((a) => a.dir === w.dir));
    if (sem.length) {
      const alvo = sem[0];
      const rel = alvo.dir.startsWith(RAIZ) ? alvo.dir.slice(RAIZ.length + 1) : `..${alvo.dir}`;
      return estado.cwd === alvo.dir ? ['claude'] : [`cd ${rel}`, 'claude -w vagas'];
    }
    return ['claude -w vagas', 'git worktree list'];
  }
  if (!p.listar) return estado.cwd === RAIZ ? ['git worktree list'] : [`cd ${RAIZ}`, 'git worktree list'];
  if (!p.mesclar) {
    if (estado.cwd !== RAIZ) return [`cd ${RAIZ}`];
    const pendentes = estado.agentes.filter((a) => !estado.branches[a.branch].mesclada).map((a) => `git merge ${a.branch}`);
    return [...pendentes.slice(0, 2), 'git branch'];
  }
  if (!p.limpar) {
    return estado.worktrees
      .filter((w) => !w.principal)
      .slice(0, 2)
      .map((w) => `git worktree remove ${w.dir.startsWith(RAIZ) ? w.dir.slice(RAIZ.length + 1) : '..' + w.dir}`);
  }
  return ['git worktree list', 'git log'];
}

export function mount(el, ctx) {
  const salvo = ctx.state.load(null);
  let estado = salvo && salvo.estado ? salvo.estado : criarEstado();
  let log = salvo && Array.isArray(salvo.log) ? salvo.log : [];
  let desfazer = [];
  let historico = [];
  let posHist = -1;
  let aba = salvo && salvo.aba ? salvo.aba : 'mesa';
  let timers = [];

  const salvar = () => ctx.state.save({ estado, log: log.slice(-200), aba });

  const abaSem = h('button', { class: 'wt-aba', role: 'tab', type: 'button', id: 'wt-tab-sem', 'aria-controls': 'wt-painel-sem' }, h('span', { class: 'wt-aba__n' }, '1'), ' Sem xícaras: a mesma pasta');
  const abaCom = h('button', { class: 'wt-aba', role: 'tab', type: 'button', id: 'wt-tab-com', 'aria-controls': 'wt-painel-com' }, h('span', { class: 'wt-aba__n' }, '2'), ' Uma xícara para cada');

  const painelSem = h('div', { class: 'wt-painel', role: 'tabpanel', id: 'wt-painel-sem', 'aria-labelledby': 'wt-tab-sem' });
  const painelCom = h('div', { class: 'wt-painel', role: 'tabpanel', id: 'wt-painel-com', 'aria-labelledby': 'wt-tab-com' });

  function trocarAba(nova) {
    aba = nova;
    const sem = aba === 'mesa';
    abaSem.setAttribute('aria-selected', String(sem));
    abaCom.setAttribute('aria-selected', String(!sem));
    abaSem.tabIndex = sem ? 0 : -1;
    abaCom.tabIndex = sem ? -1 : 0;
    painelSem.hidden = !sem;
    painelCom.hidden = sem;
    salvar();
  }
  abaSem.addEventListener('click', () => trocarAba('mesa'));
  abaCom.addEventListener('click', () => trocarAba('xicaras'));
  [abaSem, abaCom].forEach((b) =>
    b.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const outra = b === abaSem ? abaCom : abaSem;
        outra.focus();
        outra.click();
      }
    }),
  );

  // ---------- Painel 1: mesma pasta ----------
  const agentesSem = h(
    'div',
    { class: 'wt-agentes' },
    ['A', 'B', 'C'].map((ag, i) =>
      h('div', { class: 'wt-agente', 'data-ag': ag }, h('span', { class: 'wt-agente__letra' }, ag), h('span', {}, `${TASKS[i].id} · ${TASKS[i].titulo}`)),
    ),
  );
  const discoSem = h('pre', { class: 'wt-arquivo', 'aria-label': 'Conteúdo de src/app.js no disco' });
  const eventosSem = h('ol', { class: 'wt-eventos', 'aria-live': 'polite' });
  const veredSem = h('div', { class: 'wt-veredito', 'aria-live': 'polite' });
  const btnSoltar = h('button', { class: 'btn btn--primary', type: 'button' }, 'Soltar 3 agentes na mesma pasta');
  const btnPasso = h('button', { class: 'btn btn--ghost', type: 'button' }, 'Passo a passo');

  function desenharArquivo(pre, linhas, destaque = {}) {
    pre.replaceChildren(
      h('span', { class: 'wt-arquivo__nome' }, 'src/app.js'),
      ...linhas.map((l) => {
        const t = TASKS.find((x) => x.uso === l || x.import === l);
        let cls = 'wt-l';
        if (t) cls += ` wt-l--${t.id}`;
        if (destaque.nova && l === destaque.nova) cls += ' wt-l--nova';
        return h('span', { class: cls }, l || ' ');
      }),
    );
  }

  const sim = simularMesmaPasta();
  desenharArquivo(discoSem, sim.eventos[0].arquivo);

  function limparTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  let passoAtual = 0;
  function mostrarEvento(i) {
    const ev = sim.eventos[i];
    agentesSem.querySelectorAll('.wt-agente').forEach((a) => a.classList.toggle('wt-agente--ativo', a.dataset.ag === ev.agente));
    const item = h(
      'li',
      { class: `wt-evento wt-evento--${ev.acao}${ev.sobrescreveu && ev.sobrescreveu.length ? ' wt-evento--perda' : ''}` },
      h('span', { class: 'wt-evento__t' }, `t${ev.t}`),
      h('span', {}, ev.texto),
    );
    eventosSem.append(item);
    desenharArquivo(discoSem, ev.arquivo, { nova: ev.nova });
    if (i === sim.eventos.length - 1) {
      agentesSem.querySelectorAll('.wt-agente').forEach((a) => a.classList.remove('wt-agente--ativo'));
      veredSem.replaceChildren(
        h(
          'div',
          { class: 'callout wt-callout-copas' },
          h('strong', {}, `Sobreviveu só ${sim.sobreviventes.join(', ')}. ${sim.perdidas.join(' e ')} sumiram.`),
          h('p', {}, 'Nenhum comando falhou. Nenhum agente avisou. Cada um gravou a versão do arquivo que leu antes, e a última escrita apagou as outras. Os testes rodaram com código pela metade de outro agente.'),
          h('p', {}, 'É por isso que paralelismo de agentes começa com isolamento: uma pasta, uma branch e um agente por task.'),
          h('button', { class: 'btn btn--primary btn--sm', type: 'button', onclick: () => { trocarAba('xicaras'); abaCom.focus(); } }, 'Agora com uma xícara para cada →'),
        ),
      );
      btnPasso.disabled = true;
    }
  }

  function reiniciarSem() {
    limparTimers();
    passoAtual = 0;
    eventosSem.replaceChildren();
    veredSem.replaceChildren();
    btnPasso.disabled = false;
    desenharArquivo(discoSem, sim.eventos[0].arquivo);
  }

  btnSoltar.addEventListener('click', () => {
    reiniciarSem();
    btnPasso.disabled = true;
    const atraso = reduzido() ? 0 : 900;
    sim.eventos.forEach((_, i) => timers.push(setTimeout(() => mostrarEvento(i), i * atraso)));
  });
  btnPasso.addEventListener('click', () => {
    if (passoAtual === 0) {
      eventosSem.replaceChildren();
      veredSem.replaceChildren();
    }
    if (passoAtual < sim.eventos.length) mostrarEvento(passoAtual++);
  });

  painelSem.append(
    h(
      'p',
      { class: 'wt-intro' },
      'Três agentes recebem T1, T2 e T3 do speedrun. Todos rodam na mesma pasta, na mesma branch. Cada task só precisa registrar uma linha em ',
      h('code', {}, 'src/app.js'),
      '. O que pode dar errado?',
    ),
    h('div', { class: 'row wt-acoes' }, btnSoltar, btnPasso),
    agentesSem,
    h('div', { class: 'wt-sem-grid' }, h('div', {}, h('h4', { class: 'wt-h4' }, 'O que cada agente fez'), eventosSem), h('div', {}, h('h4', { class: 'wt-h4' }, 'O arquivo no disco'), discoSem)),
    veredSem,
  );

  // ---------- Painel 2: worktrees ----------
  const saidaTerm = h('div', { class: 'wt-term__saida', role: 'log', 'aria-live': 'polite', 'aria-label': 'Saída do terminal' });
  const promptRotulo = h('span', { class: 'wt-term__prompt' });
  const input = h('input', {
    class: 'wt-term__input',
    type: 'text',
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: 'false',
    'aria-label': 'Comando',
    placeholder: 'digite um comando (help)',
  });
  const formTerm = h('form', { class: 'wt-term__linha' }, promptRotulo, input);
  const chips = h('div', { class: 'wt-chips', 'aria-label': 'Sugestões de comando' });
  const term = h(
    'div',
    { class: 'wt-term' },
    h('div', { class: 'wt-term__barra' }, h('span', { class: 'wt-term__bola' }), h('span', { class: 'wt-term__bola' }), h('span', { class: 'wt-term__bola' }), h('span', { class: 'wt-term__titulo' }, 'zsh · agenda-mentorias')),
    saidaTerm,
    formTerm,
  );
  const mesa = h('div', { class: 'wt-mesa', 'aria-label': 'Mesa do chá: worktrees' });
  const missao = h('ol', { class: 'wt-missao' });
  const conflitoBox = h('div', { class: 'wt-conflito', 'aria-live': 'polite' });
  const fim = h('div', { 'aria-live': 'polite' });
  const btnDesfazer = h('button', { class: 'btn btn--ghost btn--sm', type: 'button' }, '↶ Desfazer');
  const btnReiniciar = h('button', { class: 'btn btn--ghost btn--sm', type: 'button' }, 'Recomeçar');

  function promptDe() {
    return `${rotuloCaminho(estado.cwd)} %`;
  }

  function escreverLog(linhas) {
    for (const l of linhas) {
      log.push(l);
      saidaTerm.append(linhaTerminal(l.texto, l.tipo));
    }
    saidaTerm.scrollTop = saidaTerm.scrollHeight;
  }

  function desenharLog() {
    saidaTerm.replaceChildren(...log.map((l) => linhaTerminal(l.texto, l.tipo)));
    if (!log.length) {
      saidaTerm.append(
        linhaTerminal('Você está na pasta principal do projeto agenda-mentorias, na branch main.', 'dica'),
        linhaTerminal('Missão: três agentes, três xícaras, nenhuma rota perdida. Digite help ou use as sugestões.', 'dica'),
      );
    }
    saidaTerm.scrollTop = saidaTerm.scrollHeight;
  }

  function desenharMesa() {
    const lugares = estado.worktrees.map((w) => {
      const agente = estado.agentes.find((a) => a.dir === w.dir);
      const br = estado.branches[w.branch];
      const task = agente ? TASKS.find((t) => t.id === agente.task) : null;
      const aqui = w.dir === estado.cwd;
      const classes = ['wt-lugar'];
      if (w.principal) classes.push('wt-lugar--cabeceira');
      if (aqui) classes.push('wt-lugar--aqui');
      if (agente) classes.push('wt-lugar--ocupado');
      if (br && br.mesclada) classes.push('wt-lugar--mesclado');
      return h(
        'li',
        { class: classes.join(' ') },
        svg(w.principal ? CHAPEU : XICARA),
        h('span', { class: 'wt-lugar__dir mono' }, rotuloCaminho(w.dir)),
        h('span', { class: 'chip wt-lugar__branch' }, w.branch),
        w.principal
          ? h('span', { class: 'wt-lugar__estado' }, `cabeceira · ${estado.branches.main.ancoras.usos.length}/3 rotas integradas`)
          : agente
            ? h('span', { class: 'wt-lugar__estado' }, `Agente ${agente.id} · ${task.id} ${task.titulo}`, h('span', { class: 'mono' }, ` ${agente.sha}`))
            : h('span', { class: 'wt-lugar__estado muted' }, 'xícara limpa, sem agente'),
        br && br.mesclada && !w.principal ? h('span', { class: 'chip chip--ok' }, 'mesclada') : null,
        aqui ? h('span', { class: 'wt-lugar__aqui' }, 'você está aqui') : null,
      );
    });
    const soltas = Object.entries(estado.branches)
      .filter(([nome]) => nome !== 'main' && !estado.worktrees.some((w) => w.branch === nome))
      .map(([nome, br]) => h('span', { class: `chip ${br.mesclada ? 'chip--ok' : ''}` }, nome));
    mesa.replaceChildren(h('div', { class: 'wt-mesa__toalha' }, h('ul', { class: 'wt-lugares' }, lugares)));
    if (soltas.length) mesa.append(h('p', { class: 'wt-mesa__soltas' }, h('span', { class: 'muted' }, 'Branches sem xícara: '), soltas));
  }

  function desenharMissao() {
    const p = progressoMissao(estado);
    const proximo = PASSOS.find((s) => !p[s.id]);
    missao.replaceChildren(
      ...PASSOS.map((s, i) => {
        const feito = p[s.id];
        const atual = proximo && proximo.id === s.id;
        return h(
          'li',
          { class: `wt-passo${feito ? ' wt-passo--feito' : ''}${atual ? ' wt-passo--atual' : ''}` },
          h('span', { class: 'wt-passo__n', 'aria-hidden': 'true' }, feito ? '✓' : String(i + 1)),
          h('span', {}, h('strong', {}, s.titulo), feito ? h('span', { class: 'sr-only' }, ' (feito)') : null, atual ? h('span', { class: 'wt-passo__dica mono' }, s.dica) : null),
        );
      }),
    );
    if (!proximo) {
      fim.replaceChildren(
        h(
          'div',
          { class: 'callout wt-callout-folha' },
          h('strong', {}, 'Mesa arrumada: três agentes, três xícaras, três rotas na main.'),
          h('p', {}, 'É exatamente isso que vocês fazem no speedrun, com agentes de verdade. O conflito em src/app.js vai aparecer lá também. Agora vocês sabem que a resposta é manter as duas linhas.'),
        ),
      );
    } else fim.replaceChildren();
  }

  function desenharConflito() {
    if (!estado.conflito) {
      const perdidas = rotasPerdidas(estado);
      conflitoBox.replaceChildren(
        perdidas.length
          ? h(
              'div',
              { class: 'callout wt-callout-copas' },
              h('strong', {}, `A main perdeu a rota de ${perdidas.join(', ')}.`),
              h('p', {}, 'O merge "resolveu" o conflito apagando o trabalho de outra task. O teste de aceite dela vai quebrar na CI. Use Desfazer e escolha manter as duas.'),
            )
          : '',
      );
      return;
    }
    const linhas = textoConflito(estado);
    let lado = null;
    const pre = h(
      'pre',
      { class: 'wt-arquivo wt-arquivo--conflito' },
      h('span', { class: 'wt-arquivo__nome' }, 'src/app.js (conflito)'),
      ...linhas.map((l) => {
        let cls = 'wt-l';
        if (l.startsWith('<<<<<<<')) {
          lado = 'ours';
          cls += ' wt-l--marca';
        } else if (l.startsWith('=======')) {
          lado = 'theirs';
          cls += ' wt-l--marca';
        } else if (l.startsWith('>>>>>>>')) {
          lado = null;
          cls += ' wt-l--marca';
        } else if (lado) cls += ` wt-l--${lado}`;
        return h('span', { class: cls }, l || ' ');
      }),
    );
    const escolher = (escolha) => {
      desfazer.push(estado);
      const r = resolverConflito(estado, escolha);
      estado = r.estado;
      escreverLog([
        { texto: `[resolução: ${escolha === 'ambas' ? 'manter as duas' : escolha === 'ours' ? 'manter HEAD' : 'manter a deles'}]`, tipo: 'cmd' },
        { texto: `[main ${r.sha}] Merge branch '${desfazer[desfazer.length - 1].conflito.branch}'`, tipo: r.ok ? 'out' : 'erro' },
        ...(r.ok ? [] : [{ texto: `cuidado: a rota de ${r.perdidas.join(', ')} sumiu de src/app.js`, tipo: 'erro' }]),
      ]);
      ctx.toast(r.ok ? 'Conflito resolvido sem perder rota.' : 'Conflito resolvido, mas uma rota sumiu.');
      atualizar();
    };
    conflitoBox.replaceChildren(
      h('h4', { class: 'wt-h4' }, 'Conflito no merge'),
      h('p', { class: 'muted' }, 'HEAD é a main (o que já foi integrado). Embaixo do ======= está a branch que você está trazendo. Qual versão fica?'),
      pre,
      h(
        'div',
        { class: 'row wt-acoes' },
        h('button', { class: 'btn btn--sm', type: 'button', onclick: () => escolher('ours') }, 'Manter HEAD'),
        h('button', { class: 'btn btn--sm', type: 'button', onclick: () => escolher('theirs') }, 'Manter a deles'),
        h('button', { class: 'btn btn--primary btn--sm', type: 'button', onclick: () => escolher('ambas') }, 'Manter as duas'),
      ),
    );
  }

  function desenharChips() {
    chips.replaceChildren(
      h('span', { class: 'wt-chips__rot muted' }, 'Sugestões:'),
      ...sugestoes(estado).map((c) =>
        h('button', { class: 'wt-chip mono', type: 'button', onclick: () => { input.value = c; input.focus(); } }, c),
      ),
    );
  }

  function atualizar() {
    promptRotulo.textContent = promptDe();
    desenharMesa();
    desenharMissao();
    desenharConflito();
    desenharChips();
    btnDesfazer.disabled = !desfazer.length;
    salvar();
  }

  formTerm.addEventListener('submit', (e) => {
    e.preventDefault();
    const linha = input.value.trim();
    input.value = '';
    if (!linha) return;
    historico.push(linha);
    posHist = historico.length;
    const antes = estado;
    const r = executar(estado, linha);
    if (r.limpar) {
      log = [];
      desenharLog();
      return;
    }
    escreverLog([{ texto: `${promptDe()} ${linha}`, tipo: 'cmd' }, ...r.saida.map((t) => ({ texto: t, tipo: r.erro ? (t.startsWith('dica') ? 'dica' : 'erro') : t.startsWith('dica') ? 'dica' : 'out' }))]);
    if (!r.erro && JSON.stringify(antes) !== JSON.stringify(r.estado)) desfazer.push(antes);
    estado = r.estado;
    atualizar();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && historico.length) {
      posHist = Math.max(0, posHist - 1);
      input.value = historico[posHist];
      e.preventDefault();
    } else if (e.key === 'ArrowDown' && historico.length) {
      posHist = Math.min(historico.length, posHist + 1);
      input.value = historico[posHist] || '';
      e.preventDefault();
    }
  });
  btnDesfazer.addEventListener('click', () => {
    if (!desfazer.length) return;
    estado = desfazer.pop();
    escreverLog([{ texto: '[desfeito o último passo]', tipo: 'dica' }]);
    atualizar();
  });
  btnReiniciar.addEventListener('click', () => {
    estado = criarEstado();
    log = [];
    desfazer = [];
    desenharLog();
    atualizar();
  });

  painelCom.append(
    h(
      'p',
      { class: 'wt-intro' },
      'Agora cada agente ganha uma xícara limpa: um worktree, com a própria pasta e a própria branch, ligado ao mesmo repositório. A cabeceira (pasta principal) fica para a integração.',
    ),
    h(
      'div',
      { class: 'wt-com-grid' },
      h('div', { class: 'wt-col' }, term, chips, conflitoBox),
      h(
        'div',
        { class: 'wt-col' },
        h('h4', { class: 'wt-h4' }, 'A mesa'),
        mesa,
        h('h4', { class: 'wt-h4' }, 'Missão'),
        missao,
        h('div', { class: 'row wt-acoes' }, btnDesfazer, btnReiniciar),
      ),
    ),
    fim,
  );

  el.replaceChildren(
    h(
      'header',
      { class: 'lab__head' },
      h('span', { class: 'lab__tag' }, 'Laboratório'),
      h('h3', {}, 'A mesa do Chá Maluco'),
      h('p', {}, 'Primeiro veja três agentes dividindo a mesma pasta. Depois arrume uma xícara para cada e integre sem perder trabalho.'),
    ),
    h('div', { class: 'lab__body' }, h('div', { class: 'wt-abas', role: 'tablist', 'aria-label': 'Modos' }, abaSem, abaCom), painelSem, painelCom),
  );

  trocarAba(aba);
  desenharLog();
  atualizar();

  return () => limparTimers();
}
