import {
  RUBRICA,
  ESPECIALIDADES,
  FERRAMENTAS,
  MODELOS,
  FORMATOS,
  configPadrao,
  validar,
  podeGerar,
  gerarAgente,
  caminhoArquivo,
} from '../logic/fabrica-revisores.js';

function h(tag, props = {}, ...filhos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === false || v === null || v === undefined) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'value') el.value = v;
    else if (k === 'checked') el.checked = Boolean(v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const f of filhos.flat()) {
    if (f === null || f === undefined || f === false) continue;
    el.append(f instanceof Node ? f : document.createTextNode(String(f)));
  }
  return el;
}

let contador = 0;

export function mount(el, ctx) {
  const uid = `fr${++contador}`;
  let cfg = { ...configPadrao(), ...ctx.state.load(configPadrao()) };
  const salvar = () => ctx.state.save(cfg);

  const previa = h('pre', { class: 'fr-previa', tabindex: '0', 'aria-label': 'Prévia do arquivo do agente' }, h('code'));
  const caminho = h('p', { class: 'fr-caminho mono' });
  const mensagens = h('ul', { class: 'fr-msgs', 'aria-live': 'polite' });
  const botaoCopiar = h('button', { type: 'button', class: 'btn btn--primary btn--sm', onclick: () => podeGerar(cfg) && ctx.copy(gerarAgente(cfg)) }, 'Copiar');
  const botaoBaixar = h('button', { type: 'button', class: 'btn btn--sm', onclick: () => podeGerar(cfg) && ctx.download(`${cfg.nome}.md`, gerarAgente(cfg)) }, 'Baixar .md');
  const comoUsar = h('div', { class: 'fr-uso' });

  const especialidades = h('div', { class: 'fr-especialidades', role: 'radiogroup', 'aria-label': 'Especialidade' });
  const campoNome = h('input', {
    id: `${uid}-nome`,
    class: 'fr-input mono',
    type: 'text',
    autocomplete: 'off',
    spellcheck: 'false',
    oninput: (e) => { cfg.nome = e.target.value.trim(); atualizar(); },
  });
  const campoDesc = h('textarea', {
    id: `${uid}-desc`,
    class: 'fr-input',
    rows: '4',
    oninput: (e) => { cfg.description = e.target.value; atualizar(); },
  });
  const ferramentas = h('div', { class: 'fr-checks' });
  const bloqueio = h('input', { type: 'checkbox', id: `${uid}-bloq`, onchange: (e) => { cfg.bloquearEdicao = e.target.checked; atualizar(); } });
  const modelo = h('select', { id: `${uid}-modelo`, class: 'fr-input', onchange: (e) => { cfg.modelo = e.target.value; atualizar(); } },
    ...MODELOS.map((m) => h('option', { value: m, text: m === 'inherit' ? 'inherit (o mesmo da sessão)' : m })),
  );
  const rubrica = h('div', { class: 'fr-checks fr-rubrica' });
  const formatos = h('div', { class: 'fr-formatos', role: 'radiogroup', 'aria-label': 'Formato da resposta' });

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag', text: 'Laboratório' }),
      h('h3', { text: 'Fábrica de revisores' }),
      h('p', { class: 'muted', text: 'Monte um subagent de review com uma especialidade só. O arquivo sai pronto para .claude/agents/.' }),
    ),
    h('div', { class: 'lab__body fr-grade' },
      h('form', { class: 'fr-form', onsubmit: (e) => e.preventDefault() },
        h('fieldset', {}, h('legend', { text: '1 · Especialidade' }), especialidades),
        h('fieldset', {},
          h('legend', { text: '2 · Nome e quando usar' }),
          h('label', { for: `${uid}-nome`, text: 'name' }), campoNome,
          h('label', { for: `${uid}-desc`, text: 'description (o agente principal lê isto para decidir quando chamar)' }), campoDesc,
        ),
        h('fieldset', {},
          h('legend', { text: '3 · Ferramentas' }),
          ferramentas,
          h('label', { class: 'fr-check fr-bloqueio', for: `${uid}-bloq` }, bloqueio, h('span', {}, h('strong', { text: 'Bloquear edição' }), h('span', { class: 'muted', text: ' Adiciona disallowedTools: Edit, Write.' }))),
          h('details', { class: 'fr-porque' },
            h('summary', { text: 'Por que revisor não edita?' }),
            h('p', { text: 'Revisor que edita vira autor. Se ele pode mudar o código, vai "consertar" em vez de apontar, e às vezes conserta o teste em vez do bug. Pior: perde a independência. O valor do subagent de review é olhar o diff com contexto limpo, sem o viés de quem escreveu. Sensor bom só mede; quem corrige é a pessoa ou o agente autor.' }),
          ),
        ),
        h('fieldset', {}, h('legend', { text: '4 · Modelo' }), h('label', { for: `${uid}-modelo`, class: 'sr-only', text: 'Modelo' }), modelo),
        h('fieldset', {}, h('legend', { text: '5 · Rubrica (cartas do baralho e sinais de alerta)' }), rubrica),
        h('fieldset', {}, h('legend', { text: '6 · Formato da resposta' }), formatos),
      ),
      h('div', { class: 'fr-saida' },
        h('div', { class: 'fr-saida-topo' }, caminho, h('div', { class: 'row' }, botaoCopiar, botaoBaixar)),
        mensagens,
        previa,
        comoUsar,
      ),
    ),
  );

  function escolherEspecialidade(id) {
    const base = configPadrao(id);
    cfg = { ...cfg, especialidade: id, nome: base.nome, description: base.description, rubrica: base.rubrica };
    preencher();
    atualizar();
  }

  function preencher() {
    especialidades.replaceChildren(...Object.entries(ESPECIALIDADES).map(([id, e]) => h('button', {
      type: 'button',
      role: 'radio',
      'aria-checked': String(cfg.especialidade === id),
      class: `fr-esp${cfg.especialidade === id ? ' fr-esp--on' : ''}`,
      onclick: () => escolherEspecialidade(id),
    }, h('strong', { text: e.titulo }), h('span', { text: e.resumo }))));

    campoNome.value = cfg.nome;
    campoDesc.value = cfg.description;
    bloqueio.checked = Boolean(cfg.bloquearEdicao);
    modelo.value = cfg.modelo;

    ferramentas.replaceChildren(...FERRAMENTAS.map((f) => {
      const id = `${uid}-tool-${f.id}`;
      const perigosa = ['Edit', 'Write', 'Bash'].includes(f.id);
      return h('label', { class: `fr-check${perigosa ? ' fr-check--perigo' : ''}`, for: id },
        h('input', {
          type: 'checkbox',
          id,
          checked: cfg.ferramentas.includes(f.id),
          onchange: (e) => {
            cfg.ferramentas = e.target.checked
              ? FERRAMENTAS.map((x) => x.id).filter((x) => x === f.id || cfg.ferramentas.includes(x))
              : cfg.ferramentas.filter((x) => x !== f.id);
            atualizar();
          },
        }),
        h('span', {}, h('strong', { class: 'mono', text: f.id }), h('span', { class: 'muted', text: ` ${f.descricao}` })),
      );
    }));

    rubrica.replaceChildren(...RUBRICA.map((r) => {
      const id = `${uid}-rub-${r.id}`;
      return h('label', { class: 'fr-check', for: id },
        h('input', {
          type: 'checkbox',
          id,
          checked: cfg.rubrica.includes(r.id),
          onchange: (e) => {
            cfg.rubrica = e.target.checked
              ? RUBRICA.map((x) => x.id).filter((x) => x === r.id || cfg.rubrica.includes(x))
              : cfg.rubrica.filter((x) => x !== r.id);
            atualizar();
          },
        }),
        h('span', {}, h('span', { class: 'fr-icone', 'aria-hidden': 'true', text: r.icone }), h('strong', { text: r.rotulo }), h('span', { class: 'fr-rub-texto muted', text: r.texto })),
      );
    }));

    formatos.replaceChildren(...Object.entries(FORMATOS).map(([id, f]) => {
      const inputId = `${uid}-fmt-${id}`;
      return h('label', { class: 'fr-check', for: inputId },
        h('input', {
          type: 'radio',
          name: `${uid}-formato`,
          id: inputId,
          checked: cfg.formato === id,
          onchange: () => { cfg.formato = id; atualizar(); },
        }),
        h('span', {}, h('strong', { text: f.rotulo }), h('span', { class: 'fr-rub-texto muted', text: f.texto })),
      );
    }));
  }

  function atualizar() {
    salvar();
    const msgs = validar(cfg);
    const ok = podeGerar(cfg);
    caminho.textContent = caminhoArquivo(cfg);
    previa.firstChild.textContent = ok ? gerarAgente(cfg) : 'Corrija os erros acima para gerar o arquivo.';
    botaoCopiar.disabled = !ok;
    botaoBaixar.disabled = !ok;
    mensagens.replaceChildren(...(msgs.length
      ? msgs.map((m) => h('li', { class: `fr-msg fr-msg--${m.nivel}` }, h('strong', { text: m.nivel === 'erro' ? 'Erro' : 'Atenção' }), ` ${m.msg}`))
      : [h('li', { class: 'fr-msg fr-msg--ok' }, h('strong', { text: 'Pronto.' }), ' Revisor só leitura, com quando usar, rubrica e formato definidos.')]));
    comoUsar.replaceChildren(
      h('p', { class: 'fr-rotulo', text: 'Como usar no seu projeto' }),
      h('ol', {},
        h('li', {}, 'Salve em ', h('code', { text: caminhoArquivo(cfg) }), '.'),
        h('li', {}, 'Reinicie a sessão do Claude Code para ele carregar o agente.'),
        h('li', {}, 'Peça: ', h('code', { text: `Use o subagent ${cfg.nome || '<nome>'} para revisar os arquivos alterados nesta branch.` })),
        h('li', {}, 'Compare o que ele achou com a sua revisão à mão. O que só um dos dois pegou?'),
      ),
    );
  }

  preencher();
  atualizar();
}
