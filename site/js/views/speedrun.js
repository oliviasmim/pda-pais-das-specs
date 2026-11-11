import { h } from '../ui.js';
import {
  SENSORES, TASKS, REGRAS, DURACAO_PADRAO_MIN,
  novoTime, pontuar, ranking, lerPlacar, aplicarPlacar, paraCSV,
  novoCronometro, iniciar, pausar, zerar, mudarDuracao, restante, fase, rodando, formatarTempo, minutosRestantes,
} from '../logic/placar.js';

const REPO = 'oliviasmim/pda-pais-das-specs';

const COMANDOS = [
  {
    titulo: '1. Baixar o projeto e conferir os sensores',
    codigo: `npx degit ${REPO}/speedrun/agenda-mentorias agenda-mentorias
cd agenda-mentorias
git init -b main && git add -A && git commit -m "chore: projeto inicial"
npm install
npm run gates`,
  },
  {
    titulo: '2. Uma xícara para cada agente (git worktree)',
    codigo: `git worktree add ../am-t1 -b t1
git worktree add ../am-t2 -b t2
git worktree add ../am-t3 -b t3
git worktree list
# em cada terminal:
cd ../am-t1 && npm install && claude`,
  },
  {
    titulo: '2b. Ou deixe o Claude Code criar a worktree',
    codigo: `claude -w t1   # cria .claude/worktrees/t1 na branch worktree-t1
claude -w t2
claude -w t3`,
  },
  {
    titulo: '3. TDD em cada worktree: vermelho antes do verde',
    codigo: `touch tests/aceite/T1.ativa
git add -A && git commit -m "test(T1): casos da tabela"   # npm test falhando
# ...implementação...
npm run gates && git add -A && git commit -m "feat(T1): agendar mentoria"`,
  },
  {
    titulo: '4. Integrar na main (o conflito em src/app.js é proposital)',
    codigo: `cd ../agenda-mentorias
git merge t1
git merge t2          # conflito: fique com as duas linhas e os dois imports
git add src/app.js && git commit --no-edit
git merge t3
npm run gates`,
  },
  {
    titulo: '5. Avaliador oficial (só depois do tempo)',
    codigo: `npx degit ${REPO}/speedrun/avaliador avaliador
node avaliador/avaliar.mjs ./agenda-mentorias`,
  },
  {
    titulo: '6. Limpar as xícaras',
    codigo: `git worktree remove ../am-t1
git worktree remove ../am-t2
git worktree remove ../am-t3
git worktree prune`,
  },
];

const MEDALHAS = ['🥇', '🥈', '🥉'];

function estadoInicial() {
  return { versao: 1, cronometro: novoCronometro(DURACAO_PADRAO_MIN), times: [] };
}

function estadoValido(e) {
  return e && e.versao === 1 && e.cronometro && Array.isArray(e.times);
}

export function render(el, ctx) {
  const salvo = ctx.state.load(null);
  let estado = estadoValido(salvo) ? salvo : estadoInicial();
  const salvar = () => ctx.state.save(estado);

  const limpezas = [];

  // ---------- cronômetro ----------
  const tempoEl = h('div', { class: 'sr-relogio__tempo', role: 'timer', 'aria-label': 'Tempo restante' });
  const barraEl = h('div', { class: 'sr-relogio__barra-cheia' });
  const faseEl = h('p', { class: 'sr-relogio__fase' });
  const avisoEl = h('p', { class: 'sr-only', 'aria-live': 'assertive' });
  const botaoIniciar = h('button', { type: 'button', class: 'btn btn--primary' });
  const botaoZerar = h('button', { type: 'button', class: 'btn btn--ghost' }, 'Zerar');
  const campoDuracao = h('input', {
    type: 'number', min: 1, max: 180, step: 1, id: 'sr-duracao', class: 'sr-relogio__duracao',
    value: Math.round(estado.cronometro.duracaoMs / 60000),
  });
  const relogio = h(
    'section',
    { class: 'sr-relogio', 'aria-labelledby': 'sr-relogio-titulo' },
    h('h2', { id: 'sr-relogio-titulo', class: 'sr-only' }, 'Cronômetro'),
    tempoEl,
    h('div', { class: 'sr-relogio__barra', 'aria-hidden': 'true' }, barraEl),
    faseEl,
    h(
      'div',
      { class: 'sr-relogio__controles' },
      botaoIniciar,
      botaoZerar,
      h('label', { for: 'sr-duracao', class: 'sr-relogio__rotulo' }, 'Duração (min)'),
      campoDuracao,
    ),
    avisoEl,
  );

  let faseAnterior = null;
  function desenharRelogio() {
    const agora = Date.now();
    const c = estado.cronometro;
    const r = restante(c, agora);
    const f = fase(c, agora);
    tempoEl.textContent = formatarTempo(r);
    relogio.dataset.fase = f;
    barraEl.style.width = `${Math.min(100, Math.max(0, (1 - r / c.duracaoMs) * 100))}%`;
    botaoIniciar.textContent = rodando(c) ? 'Pausar' : f === 'pronto' ? 'Iniciar' : f === 'fim' ? 'Acabou' : 'Retomar';
    botaoIniciar.disabled = f === 'fim';
    campoDuracao.disabled = rodando(c);
    const textos = {
      pronto: 'Pronto para começar. 3 tasks, 3 xícaras, 1 main verde.',
      normal: rodando(c) ? 'Valendo. Primeiro o commit do teste vermelho, depois o código.' : 'Pausado. O tempo não corre até você retomar.',
      alerta: rodando(c) ? 'Faltam 5 minutos. Pare de codar e faça o merge na main.' : 'Pausado nos últimos 5 minutos.',
      fim: 'Tempo. Mãos longe do teclado. Rodem o npm run gates na main.',
    };
    faseEl.textContent = textos[f];
    if (faseAnterior && f !== faseAnterior) {
      if (f === 'alerta' && rodando(c)) avisoEl.textContent = 'Faltam 5 minutos.';
      if (f === 'fim') {
        avisoEl.textContent = 'Tempo esgotado.';
        ctx.toast('Tempo. Agora rodem o avaliador oficial (passo 5).');
      }
    }
    if (f === 'fim' && rodando(c)) {
      estado.cronometro = pausar(c, c.inicioEm + (c.duracaoMs - c.acumuladoMs));
      salvar();
    }
    faseAnterior = f;
  }

  botaoIniciar.addEventListener('click', () => {
    const agora = Date.now();
    estado.cronometro = rodando(estado.cronometro) ? pausar(estado.cronometro, agora) : iniciar(estado.cronometro, agora);
    salvar();
    desenharRelogio();
  });
  botaoZerar.addEventListener('click', () => {
    estado.cronometro = zerar(estado.cronometro);
    salvar();
    desenharRelogio();
  });
  campoDuracao.addEventListener('change', () => {
    estado.cronometro = mudarDuracao(estado.cronometro, campoDuracao.value);
    campoDuracao.value = Math.round(estado.cronometro.duracaoMs / 60000);
    salvar();
    desenharRelogio();
  });

  const intervalo = setInterval(desenharRelogio, 250);
  limpezas.push(() => clearInterval(intervalo));

  // ---------- ranking ----------
  const rankingLista = h('ol', { class: 'sr-ranking', 'aria-live': 'polite' });
  function desenharRanking() {
    const linhas = ranking(estado.times);
    rankingLista.replaceChildren(
      ...(linhas.length
        ? linhas.map(({ posicao, time, total }) =>
            h(
              'li',
              { class: 'sr-ranking__item', 'data-posicao': posicao },
              h('span', { class: 'sr-ranking__pos', 'aria-hidden': 'true' }, MEDALHAS[posicao - 1] ?? `${posicao}º`),
              h('span', { class: 'sr-ranking__nome' }, time.nome),
              h('span', { class: 'sr-ranking__pontos' }, `${total}`, h('small', {}, ' pts')),
            ),
          )
        : [h('li', { class: 'sr-ranking__vazio muted' }, 'O ranking aparece quando o primeiro time entrar.')]),
    );
  }

  // ---------- times ----------
  const listaTimes = h('div', { class: 'sr-times' });

  function atualizar(id, mudanca, { redesenhar = false } = {}) {
    estado.times = estado.times.map((t) => (t.id === id ? mudanca(t) : t));
    salvar();
    desenharRanking();
    if (redesenhar) desenharTimes();
    else atualizarTotal(id);
  }

  function atualizarTotal(id) {
    const time = estado.times.find((t) => t.id === id);
    const card = listaTimes.querySelector(`[data-time="${id}"]`);
    if (!time || !card) return;
    const { total, partes } = pontuar(time);
    card.querySelector('.sr-time__total').textContent = String(total);
    card.querySelector('.sr-time__partes').textContent =
      `sensores ${partes.sensores} · TDD ${partes.tdd} · casos ${partes.casos} · integração ${partes.integracao} · ` +
      `cartas ${partes.cartas} · rosas ${partes.rosas} · tempo ${partes.tempo}`;
  }

  function caixa(rotulo, marcado, aoMudar) {
    const input = h('input', { type: 'checkbox', checked: marcado || false });
    input.addEventListener('change', () => aoMudar(input.checked));
    return h('label', { class: 'sr-caixa' }, input, h('span', {}, rotulo));
  }

  function contador(rotulo, valor, aoMudar, { negativo = false } = {}) {
    const saida = h('output', { class: 'sr-contador__valor', 'aria-live': 'polite', 'data-zero': valor ? '0' : '1' }, String(valor));
    const mudar = (delta) => {
      const novo = Math.max(0, Number(saida.textContent) + delta);
      saida.textContent = String(novo);
      saida.dataset.zero = novo ? '0' : '1';
      aoMudar(novo);
    };
    return h(
      'div',
      { class: `sr-contador${negativo ? ' sr-contador--negativo' : ''}`, role: 'group', 'aria-label': rotulo },
      h('span', { class: 'sr-contador__rotulo' }, rotulo),
      h('button', { type: 'button', class: 'btn btn--ghost btn--sm', 'aria-label': `Diminuir ${rotulo}`, onclick: () => mudar(-1) }, '−'),
      saida,
      h('button', { type: 'button', class: 'btn btn--ghost btn--sm', 'aria-label': `Aumentar ${rotulo}`, onclick: () => mudar(1) }, '+'),
    );
  }

  function botaoConfirmar(texto, textoConfirmar, acao, classe = 'btn btn--ghost btn--sm') {
    const botao = h('button', { type: 'button', class: classe }, texto);
    let timer = null;
    botao.addEventListener('click', () => {
      if (botao.dataset.confirmando === '1') {
        clearTimeout(timer);
        acao();
        return;
      }
      botao.dataset.confirmando = '1';
      botao.textContent = textoConfirmar;
      timer = setTimeout(() => {
        botao.dataset.confirmando = '0';
        botao.textContent = texto;
      }, 4000);
    });
    limpezas.push(() => clearTimeout(timer));
    return botao;
  }

  function cardTime(time) {
    const id = time.id;
    const idBase = `sr-${id}`;

    const campoCasos = h('input', { type: 'number', min: 0, max: time.casosTotal, value: time.casos, id: `${idBase}-casos`, class: 'sr-numero' });
    campoCasos.addEventListener('input', () => atualizar(id, (t) => ({ ...t, casos: Number(campoCasos.value) || 0 })));

    const campoMin = h('input', { type: 'number', min: 0, max: 180, value: time.minutosRestantes, id: `${idBase}-min`, class: 'sr-numero' });
    campoMin.addEventListener('input', () => atualizar(id, (t) => ({ ...t, minutosRestantes: Number(campoMin.value) || 0 })));
    const terminou = h('button', { type: 'button', class: 'btn btn--ghost btn--sm' }, 'Terminou agora');
    terminou.addEventListener('click', () => {
      const min = minutosRestantes(estado.cronometro, Date.now());
      campoMin.value = String(min);
      atualizar(id, (t) => ({ ...t, minutosRestantes: min }));
      ctx.toast(`${time.nome} terminou com ${min} min sobrando: +${min} pts.`);
    });

    const campoPlacar = h('textarea', {
      id: `${idBase}-placar`, rows: 2, class: 'sr-placar', spellcheck: 'false',
      placeholder: 'PLACAR {"versao":1,"casos":{...}}',
    });
    const retornoPlacar = h('p', { class: 'sr-placar__retorno', 'aria-live': 'polite' });
    const aplicar = h('button', { type: 'button', class: 'btn btn--sm' }, 'Aplicar no placar');
    aplicar.addEventListener('click', () => {
      const lido = lerPlacar(campoPlacar.value);
      if (!lido.ok) {
        retornoPlacar.textContent = lido.erro;
        retornoPlacar.dataset.tipo = 'erro';
        return;
      }
      atualizar(id, (t) => aplicarPlacar(t, lido.dados), { redesenhar: true });
      ctx.toast(`${time.nome}: ${lido.dados.casos} de ${lido.dados.casosTotal} casos passaram no avaliador.`);
    });

    return h(
      'article',
      { class: 'sr-time card', 'data-time': id, 'aria-labelledby': `${idBase}-nome` },
      h(
        'header',
        { class: 'sr-time__cab' },
        h('h3', { id: `${idBase}-nome` }, time.nome),
        h('p', { class: 'sr-time__placar' }, h('span', { class: 'sr-time__total' }, '0'), h('small', {}, ' pts')),
        botaoConfirmar('Remover', 'Remover mesmo?', () => {
          estado.times = estado.times.filter((t) => t.id !== id);
          salvar();
          desenharTimes();
          desenharRanking();
        }),
      ),
      h('p', { class: 'sr-time__partes muted' }),
      h(
        'fieldset',
        { class: 'sr-grupo' },
        h('legend', {}, 'Sensores verdes na CI'),
        ...SENSORES.map((s) =>
          caixa(s.nome, time.sensores[s.id], (v) => atualizar(id, (t) => ({ ...t, sensores: { ...t.sensores, [s.id]: v } }))),
        ),
      ),
      h(
        'fieldset',
        { class: 'sr-grupo' },
        h('legend', {}, 'TDD no git log (commit test: antes do feat:)'),
        ...TASKS.map((task) =>
          caixa(task, time.tdd[task], (v) => atualizar(id, (t) => ({ ...t, tdd: { ...t.tdd, [task]: v } }))),
        ),
        caixa('Integração sem quebrar outra task', time.integracao, (v) => atualizar(id, (t) => ({ ...t, integracao: v }))),
      ),
      h(
        'div',
        { class: 'sr-linha' },
        h(
          'div',
          { class: 'sr-campo' },
          h('label', { for: `${idBase}-casos` }, 'Casos do avaliador'),
          h('span', { class: 'sr-campo__par' }, campoCasos, h('span', { class: 'muted' }, ` / ${time.casosTotal}`)),
        ),
        contador('Cartas na clínica', time.cartas, (v) => atualizar(id, (t) => ({ ...t, cartas: v }))),
        contador('Rosas pintadas', time.rosas, (v) => atualizar(id, (t) => ({ ...t, rosas: v })), { negativo: true }),
        h(
          'div',
          { class: 'sr-campo' },
          h('label', { for: `${idBase}-min` }, 'Minutos restantes'),
          h('span', { class: 'sr-campo__par' }, campoMin, terminou),
        ),
      ),
      h(
        'details',
        { class: 'sr-colar' },
        h('summary', {}, 'Colar a saída do avaliador'),
        h('label', { for: `${idBase}-placar`, class: 'sr-only' }, `Linha PLACAR do time ${time.nome}`),
        campoPlacar,
        h('div', { class: 'row' }, aplicar),
        retornoPlacar,
      ),
    );
  }

  function desenharTimes() {
    listaTimes.replaceChildren(
      ...(estado.times.length
        ? estado.times.map(cardTime)
        : [h('p', { class: 'muted sr-times__vazio' }, 'Nenhum time ainda. Trio ou pessoa sozinha, cada um conta como um time. Digite o nome acima.')]),
    );
    for (const t of estado.times) atualizarTotal(t.id);
  }

  const campoNome = h('input', { type: 'text', id: 'sr-novo-time', placeholder: 'Ex.: As Lagartas', maxlength: 40, autocomplete: 'off' });
  const formTime = h(
    'form',
    { class: 'sr-novo' },
    h('label', { for: 'sr-novo-time' }, 'Nome do time'),
    h('div', { class: 'sr-novo__linha' }, campoNome, h('button', { type: 'submit', class: 'btn btn--primary' }, 'Adicionar time')),
  );
  formTime.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const nome = campoNome.value.trim();
    if (!nome) {
      campoNome.focus();
      ctx.toast('Dê um nome ao time.');
      return;
    }
    estado.times = [...estado.times, novoTime(nome)];
    salvar();
    campoNome.value = '';
    desenharTimes();
    desenharRanking();
    campoNome.focus();
  });

  const exportar = h('button', { type: 'button', class: 'btn btn--ghost' }, 'Exportar CSV');
  exportar.addEventListener('click', () => {
    if (!estado.times.length) {
      ctx.toast('Sem times, o CSV sairia vazio. Adicione um time primeiro.');
      return;
    }
    ctx.download(`placar-speedrun-${new Date().toISOString().slice(0, 10)}.csv`, '﻿' + paraCSV(estado.times));
  });
  const novoSpeedrun = botaoConfirmar('Novo speedrun', 'Apagar placar e cronômetro?', () => {
    estado = estadoInicial();
    salvar();
    campoDuracao.value = String(DURACAO_PADRAO_MIN);
    faseAnterior = null;
    desenharTimes();
    desenharRanking();
    desenharRelogio();
    ctx.toast('Placar e cronômetro zerados.');
  }, 'btn btn--ghost');

  // ---------- comandos e regras ----------
  const comandos = h(
    'section',
    { class: 'sr-secao', 'aria-labelledby': 'sr-comandos' },
    h('h2', { id: 'sr-comandos' }, 'Comandos'),
    h('p', { class: 'muted' }, 'Copie na ordem. O passo a passo com explicação está no README do projeto. Quem digita é a turma.'),
    ...COMANDOS.map(({ titulo, codigo }) => {
      const copiar = h('button', { type: 'button', class: 'copiar', 'aria-label': `Copiar: ${titulo}` }, 'copiar');
      copiar.addEventListener('click', () => ctx.copy(codigo));
      return h('div', { class: 'sr-comando' }, h('h3', {}, titulo), h('pre', {}, h('code', {}, codigo), copiar));
    }),
  );

  const regras = h(
    'section',
    { class: 'sr-secao', 'aria-labelledby': 'sr-regras' },
    h('h2', { id: 'sr-regras' }, 'Pontuação'),
    h(
      'table',
      { class: 'sr-regras' },
      h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Item'), h('th', { scope: 'col' }, 'Pontos'))),
      h('tbody', {}, ...REGRAS.map((r) => h('tr', {}, h('td', {}, r.item), h('td', { class: 'mono' }, r.pontos)))),
    ),
    h(
      'p',
      { class: 'callout' },
      'O avaliador oficial confere casos, TDD no git log e rosas pintadas. ',
      'Sensores, integração, cartas e minutos ficam com a facilitadora. ',
      'Rosa pintada é teste de aceite alterado para passar, como os jardineiros da Rainha pintando rosas brancas de vermelho. Custa 30 pontos porque esconde o defeito em vez de corrigir.',
    ),
  );

  el.replaceChildren(
    h(
      'section',
      { class: 'secao sr-cabecalho' },
      h('div', { class: 'sobretitulo' }, 'Semana 10 · Aula 2'),
      h('h1', {}, 'Speedrun do Chá Maluco'),
      h(
        'p',
        { class: 'heroi__lead' },
        '40 minutos para rodar 3 tasks em paralelo, cada uma na sua xícara (worktree), integrar na main e terminar com os sensores verdes.',
      ),
    ),
    relogio,
    h(
      'div',
      { class: 'sr-painel' },
      h(
        'section',
        { class: 'sr-secao', 'aria-labelledby': 'sr-times-titulo' },
        h('h2', { id: 'sr-times-titulo' }, 'Times'),
        formTime,
        listaTimes,
      ),
      h(
        'aside',
        { class: 'sr-secao sr-lado', 'aria-labelledby': 'sr-ranking-titulo' },
        h('h2', { id: 'sr-ranking-titulo' }, 'Ranking'),
        rankingLista,
        h('div', { class: 'sr-acoes' }, exportar, novoSpeedrun),
      ),
    ),
    regras,
    comandos,
  );

  desenharRelogio();
  desenharTimes();
  desenharRanking();

  return () => {
    for (const fn of limpezas) fn();
  };
}
