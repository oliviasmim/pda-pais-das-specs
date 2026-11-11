import { h } from '../ui.js';
import {
  PERGUNTAS_YAML,
  PRS,
  SENSORES,
  formatarTempo,
  gerarWorkflow,
  ordemFailFast,
  ordemPadrao,
  rodarEsteira,
  rodarFila,
  sensor,
} from '../logic/esteira.js';

const reduzido = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mount(el, ctx) {
  const salvo = ctx.state.load({});
  let ordem = Array.isArray(salvo.ordem) ? salvo.ordem.filter((id) => sensor(id)) : SENSORES.map((s) => s.id);
  let ligados = new Set(Array.isArray(salvo.ligados) ? salvo.ligados : ordemPadrao());
  let checks = salvo.checks || {};
  let rodou = false;
  let timers = [];
  let aberto = null;

  const ativos = () => ordem.filter((id) => ligados.has(id));
  const salvar = () => ctx.state.save({ ordem, ligados: [...ligados], checks });

  const listaSensores = h('ol', { class: 'es-sensores' });
  const fila = h('ol', { class: 'es-fila' });
  const resumo = h('div', { class: 'es-resumo', 'aria-live': 'polite' });
  const metas = h('ul', { class: 'es-metas' });
  const yamlPre = h('pre', { class: 'es-yaml' });
  const perguntas = h('ol', { class: 'es-perguntas' });
  const btnRodar = h('button', { class: 'btn btn--primary', type: 'button' }, '▶ Rodar a fila de PRs');
  const btnFailFast = h('button', { class: 'btn btn--ghost btn--sm', type: 'button' }, 'Ordenar: mais barato primeiro');
  const btnPadrao = h('button', { class: 'btn btn--ghost btn--sm', type: 'button' }, 'Voltar ao padrão da S8');

  function limparTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function mover(id, delta) {
    const i = ordem.indexOf(id);
    const j = i + delta;
    if (j < 0 || j >= ordem.length) return;
    [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
    mudou(id);
  }

  function mudou(foco) {
    salvar();
    rodou = false;
    desenharSensores(foco);
    desenharFila(false);
    desenharResumo();
    desenharYaml();
  }

  function desenharSensores(foco) {
    listaSensores.replaceChildren(
      ...ordem.map((id, i) => {
        const s = sensor(id);
        const on = ligados.has(id);
        const caixa = h('input', {
          type: 'checkbox',
          checked: on,
          id: `es-on-${id}`,
          onchange: (e) => {
            if (e.target.checked) ligados.add(id);
            else ligados.delete(id);
            mudou();
          },
        });
        const sobe = h('button', { class: 'es-seta', type: 'button', 'aria-label': `Subir ${s.nome}`, disabled: i === 0, onclick: () => mover(id, -1) }, '↑');
        const desce = h('button', { class: 'es-seta', type: 'button', 'aria-label': `Descer ${s.nome}`, disabled: i === ordem.length - 1, onclick: () => mover(id, 1) }, '↓');
        const li = h(
          'li',
          { class: `es-sensor${on ? '' : ' es-sensor--off'}${s.extra ? ' es-sensor--extra' : ''}`, 'data-id': id },
          h('label', { class: 'es-sensor__lig', for: `es-on-${id}` }, caixa, h('span', { class: 'es-sensor__nome' }, s.nome), s.extra ? h('span', { class: 'chip chip--warn' }, 'extra') : null),
          h('span', { class: 'es-sensor__ferr muted' }, s.ferramenta),
          h('span', { class: 'es-sensor__seg mono' }, `${s.seg}s`),
          h('span', { class: 'es-sensor__setas' }, sobe, desce),
        );
        return li;
      }),
    );
    if (foco) {
      const alvo = listaSensores.querySelector(`[data-id="${foco}"] .es-seta:not([disabled])`);
      if (alvo) alvo.focus();
    }
  }

  function linhaPr(pr, res, revelar) {
    const ativosAgora = ativos();
    const estacoes = ativosAgora.map((id) => {
      const p = res ? res.passos.find((x) => x.sensor === id) : null;
      const est = p ? p.resultado : 'espera';
      return h('span', { class: `es-est es-est--${est}`, title: `${sensor(id).nome}: ${est}` }, est === 'falhou' ? '✂' : est === 'ok' ? '✓' : est === 'pulado' ? '·' : '');
    });
    let status = h('span', { class: 'es-status muted' }, 'na fila');
    if (res && revelar) {
      if (res.pegoPor) status = h('span', { class: 'es-status es-status--bloq', title: 'Cortem-lhe a cabeça!' }, `✂ barrado: ${sensor(res.pegoPor).nome}`);
      else if (res.escapou) status = h('span', { class: 'es-status es-status--escapou' }, 'Chegou na main com defeito');
      else status = h('span', { class: 'es-status es-status--ok' }, 'Merge limpo');
    }
    const id = `es-det-${pr.id}`;
    const btn = h(
      'button',
      { class: 'es-pr__btn', type: 'button', 'aria-expanded': String(aberto === pr.id), 'aria-controls': id, onclick: () => { aberto = aberto === pr.id ? null : pr.id; desenharFila(rodou); } },
      h('span', { class: 'es-pr__num mono' }, `#${pr.numero}`),
      h('span', { class: 'es-pr__tit' }, pr.titulo),
    );
    const det = aberto === pr.id ? detalhePr(pr, res, revelar) : null;
    return h(
      'li',
      { class: `es-pr${res && revelar ? (res.pegoPor ? ' es-pr--bloq' : res.escapou ? ' es-pr--escapou' : ' es-pr--ok') : ''}` },
      h('div', { class: 'es-pr__linha' }, btn, h('span', { class: 'es-ests', 'aria-hidden': 'true' }, estacoes), status),
      det ? h('div', { class: 'es-pr__det', id }, det) : null,
    );
  }

  function detalhePr(pr, res, revelar) {
    const partes = [
      h('pre', { class: 'es-diff' }, pr.trecho.map((l) => h('span', { class: l.startsWith('+') ? 'es-add' : l.startsWith('-') ? 'es-del' : '' }, l))),
    ];
    if (!revelar) {
      partes.push(h('p', { class: 'muted' }, 'Antes de rodar: o que você acha que está errado neste diff? Depois rode a fila e confira.'));
      return partes;
    }
    partes.push(h('p', {}, h('strong', {}, pr.defeito ? 'Defeito plantado: ' : 'Sem defeito: '), pr.defeito || 'este PR é o controle. Esteira boa deixa passar.'));
    if (res.pegoPor) partes.push(h('pre', { class: 'es-msg' }, pr.mensagens[res.pegoPor]));
    if (pr.escape && (res.escapou || res.pegoPor)) {
      partes.push(
        h(
          'div',
          { class: 'es-ff' },
          h('div', { class: 'es-ff__col es-ff__col--guia' }, h('span', { class: 'es-ff__rot' }, 'Guia · feedforward'), h('p', {}, pr.escape.guia)),
          h('div', { class: 'es-ff__col es-ff__col--sensor' }, h('span', { class: 'es-ff__rot' }, 'Sensor · feedback'), h('p', {}, pr.escape.sensor)),
        ),
      );
      if (res.escapou) partes.push(h('p', { class: 'es-quem' }, 'Quem descobre se ninguém pegar: ', h('strong', {}, pr.escape.quem), '.'));
    }
    return partes;
  }

  function desenharFila(revelar) {
    const resultados = rodou ? rodarFila(ativos()).resultados : null;
    fila.replaceChildren(...PRS.map((pr, i) => linhaPr(pr, resultados ? resultados[i] : null, revelar && rodou)));
  }

  function desenharResumo() {
    if (!rodou) {
      resumo.replaceChildren();
      desenharMetas(null);
      return;
    }
    const { resumo: r } = rodarFila(ativos());
    const partes = [
      h(
        'div',
        { class: 'es-placar' },
        num('Defeitos barrados', `${r.pegos}/${r.defeitos}`, r.pegos === r.defeitos ? 'ok' : 'bad'),
        num('Chegaram na main', String(r.escaparam.length), r.escaparam.length ? 'bad' : 'ok'),
        num('Minutos de CI na fila', formatarTempo(r.tempoTotal)),
        num('Feedback médio por PR', formatarTempo(r.tempoMedio)),
      ),
      r.escaparamPorSensorDesligado.length
        ? h(
            'p',
            { class: 'callout es-callout es-callout--copas' },
            h('strong', {}, 'Escaparam por sensor desligado: '),
            r.escaparamPorSensorDesligado.map((p) => `#${p.numero}`).join(', '),
            '. Abra o PR, leia o defeito e ligue o sensor que pega esse tipo de erro.',
          )
        : null,
      r.precisamDeReview.length
        ? h(
            'p',
            { class: 'callout es-callout es-callout--uva' },
            h('strong', {}, 'Nenhuma esteira pega tudo. '),
            r.precisamDeReview.map((p) => `#${p.numero} (${p.titulo})`).join(' e '),
            ' passam com qualquer combinação de sensores: o código roda e os testes passam, o erro é ele não ser o que a spec pediu. Quem pega é review humano ou subagent de review (lição 7).',
          )
        : null,
    ];
    resumo.replaceChildren(...partes.filter(Boolean));
    desenharMetas(r);
  }

  function desenharMetas(r) {
    const todos = SENSORES.map((s) => s.id);
    const ideal = rodarFila(ordemFailFast(todos)).resumo.tempoTotal;
    const m1 = r && r.escaparamPorSensorDesligado.length === 0;
    const m2 = r && m1 && r.tempoTotal <= ideal;
    const m3 = Object.values(checks).filter(Boolean).length === PERGUNTAS_YAML.length;
    metas.replaceChildren(
      meta(m1, 'Nenhum defeito evitável chega na main.'),
      meta(m2, `E gaste no máximo ${formatarTempo(ideal)} de CI na fila (dica: o sensor mais rápido roda primeiro).`),
      meta(m3, 'Marque as 5 perguntas depois de conferir cada uma no YAML.'),
    );
  }

  function meta(ok, texto) {
    return h('li', { class: `es-meta${ok ? ' es-meta--ok' : ''}` }, h('span', { class: 'es-meta__ico', 'aria-hidden': 'true' }, ok ? '♥' : '♡'), texto, ok ? h('span', { class: 'sr-only' }, ' (cumprida)') : null);
  }

  function num(rot, val, tom) {
    return h('div', { class: `es-num${tom ? ` es-num--${tom}` : ''}` }, h('span', { class: 'es-num__rot' }, rot), h('span', { class: 'es-num__val' }, val));
  }

  function desenharYaml() {
    yamlPre.textContent = gerarWorkflow(ativos());
    perguntas.replaceChildren(
      ...PERGUNTAS_YAML.map((p, i) =>
        h(
          'li',
          {},
          h(
            'label',
            { class: 'es-perg' },
            h('input', {
              type: 'checkbox',
              checked: Boolean(checks[i]),
              onchange: (e) => {
                checks[i] = e.target.checked;
                salvar();
                desenharMetas(rodou ? rodarFila(ativos()).resumo : null);
              },
            }),
            h('span', {}, p),
          ),
        ),
      ),
    );
  }

  btnRodar.addEventListener('click', () => {
    limparTimers();
    rodou = true;
    aberto = null;
    const resultados = rodarFila(ativos()).resultados;
    if (reduzido()) {
      desenharFila(true);
      desenharResumo();
      return;
    }
    fila.replaceChildren(...PRS.map((pr) => linhaPr(pr, null, false)));
    resumo.replaceChildren();
    PRS.forEach((pr, i) => {
      timers.push(
        setTimeout(() => {
          const novo = linhaPr(pr, resultados[i], true);
          novo.classList.add('es-pr--entra');
          fila.children[i].replaceWith(novo);
          if (i === PRS.length - 1) desenharResumo();
        }, 260 * i),
      );
    });
  });
  btnFailFast.addEventListener('click', () => {
    const on = ordemFailFast(ativos());
    const off = ordem.filter((id) => !ligados.has(id));
    ordem = [...on, ...off];
    mudou();
    ctx.toast('Reordenado: o sensor mais rápido roda primeiro.');
  });
  btnPadrao.addEventListener('click', () => {
    ordem = SENSORES.map((s) => s.id);
    ligados = new Set(ordemPadrao());
    mudou();
  });

  el.replaceChildren(
    h(
      'header',
      { class: 'lab__head' },
      h('span', { class: 'lab__tag' }, 'Laboratório'),
      h('h3', {}, 'A esteira da Rainha'),
      h('p', {}, 'Dez PRs gerados por agente vão passar pela esteira. Escolha quais sensores rodam e em que ordem, rode a fila e veja o que chega na main.'),
    ),
    h(
      'div',
      { class: 'lab__body' },
      h(
        'div',
        { class: 'es-grid' },
        h(
          'section',
          { class: 'es-col', 'aria-label': 'Sensores' },
          h('h4', { class: 'es-h4' }, 'Os sensores, na ordem em que rodam'),
          listaSensores,
          h('div', { class: 'row es-acoes' }, btnFailFast, btnPadrao),
          h('h4', { class: 'es-h4' }, 'Metas'),
          metas,
        ),
        h(
          'section',
          { class: 'es-col', 'aria-label': 'Fila de PRs' },
          h('div', { class: 'es-fila-head' }, h('h4', { class: 'es-h4' }, 'A fila de PRs'), btnRodar),
          h('p', { class: 'muted es-dica' }, 'Clique num PR para ver o diff. Cada ✂ é um gate cortando a cabeça do PR.'),
          fila,
          resumo,
        ),
      ),
      h(
        'section',
        { class: 'es-yaml-box', 'aria-label': 'Workflow gerado' },
        h(
          'div',
          { class: 'es-yaml-head' },
          h('h4', { class: 'es-h4' }, 'O workflow destes sensores'),
          h(
            'div',
            { class: 'row' },
            h('button', { class: 'btn btn--sm', type: 'button', onclick: () => ctx.copy(gerarWorkflow(ativos())) }, 'Copiar'),
            h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: () => ctx.download('ci.yml', gerarWorkflow(ativos())) }, 'Baixar ci.yml'),
          ),
        ),
        h(
          'div',
          { class: 'es-yaml-grid' },
          yamlPre,
          h('div', {}, h('p', { class: 'es-yaml-nota' }, h('strong', {}, 'Revise o YAML que a IA te der com estas 5 perguntas.'), ' Gate configurado errado é pior que nenhum: o check fica verde e todo mundo para de olhar.'), perguntas),
        ),
      ),
    ),
  );

  desenharSensores();
  desenharFila(false);
  desenharResumo();
  desenharYaml();

  return () => limparTimers();
}
