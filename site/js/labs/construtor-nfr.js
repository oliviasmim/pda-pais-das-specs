import { h } from '../ui.js';
import { PADROES, CATEGORIAS, ONDE_VIVE, montarEars, avaliar, paraMarkdown } from '../logic/construtor-nfr.js';

const ROTULO_AVISO = { desejo: 'desejo', promessa: 'promessa', vago: 'vago', faltando: 'falta' };

export function mount(el, ctx) {
  const salvo = ctx.state.load(null);
  const estado = salvo && salvo.atual
    ? salvo
    : { atual: { categoria: 'desempenho', padrao: 'estado', gatilho: '', condicao: '', sistema: 'serviço de agenda', resposta: '', sensor: '', onde: ['spec', 'ci'] }, lista: [] };
  const uid = `nfr-${ctx.licaoId}`;

  const categorias = h('div', { class: 'nfr-cats', role: 'radiogroup', 'aria-label': 'Categoria do requisito' });
  const pergunta = h('p', { class: 'nfr-pergunta' });
  const padroes = h('div', { class: 'nfr-padroes', role: 'radiogroup', 'aria-label': 'Padrão EARS' });
  const campos = {};
  const linhas = {};

  function campo(nome, rotulo, placeholder, multilinha = false) {
    const id = `${uid}-${nome}`;
    const input = multilinha
      ? h('textarea', { id, rows: '2', placeholder })
      : h('input', { id, type: 'text', placeholder, autocomplete: 'off' });
    input.addEventListener('input', () => {
      estado.atual[nome] = input.value;
      render();
    });
    campos[nome] = input;
    linhas[nome] = h('div', { class: 'nfr-campo' }, h('label', { for: id }, rotulo), input);
    return linhas[nome];
  }

  const ondeBox = h('fieldset', { class: 'nfr-onde' }, h('legend', {}, 'Onde ele vive'));
  for (const [chave, texto] of Object.entries(ONDE_VIVE)) {
    const id = `${uid}-onde-${chave}`;
    const cb = h('input', { type: 'checkbox', id, value: chave });
    cb.addEventListener('change', () => {
      const set = new Set(estado.atual.onde || []);
      if (cb.checked) set.add(chave);
      else set.delete(chave);
      estado.atual.onde = [...set];
      render();
    });
    ondeBox.append(h('label', { for: id, class: 'nfr-onde__op' }, cb, h('span', {}, texto)));
  }

  const ears = h('p', { class: 'nfr-ears', 'aria-live': 'polite' });
  const avisos = h('ul', { class: 'nfr-avisos', 'aria-live': 'polite' });
  const sugestao = h('div', { class: 'nfr-sugestao' });
  const lista = h('ol', { class: 'nfr-lista' });

  const btnExemplo = h('button', { class: 'btn btn--sm', type: 'button', onclick: usarExemplo }, 'Usar exemplo da agenda');
  const btnLimpar = h('button', { class: 'btn btn--sm btn--ghost', type: 'button', onclick: limpar }, 'Limpar');
  const btnCopiar = h('button', { class: 'btn btn--sm', type: 'button', onclick: () => ctx.copy(paraMarkdown(estado.atual)) }, 'Copiar markdown');
  const btnGuardar = h('button', { class: 'btn btn--sm btn--primary', type: 'button', onclick: guardar }, 'Guardar na minha spec');
  const btnBaixar = h('button', { class: 'btn btn--sm', type: 'button', onclick: baixar }, 'Baixar nfr.md');

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag' }, 'Laboratório'),
      h('h3', {}, 'Do desejo ao requisito: número, sensor e onde ele vive'),
      h('p', {}, 'Escolha uma categoria, escreva a frase em EARS, coloque um número e diga qual teste mede. O botão de guardar só libera quando os avisos somem.'),
    ),
    h('div', { class: 'lab__body' },
      h('p', { class: 'nfr-passo' }, h('span', { class: 'nfr-passo__n' }, '1'), 'Que qualidade você precisa garantir?'),
      categorias,
      pergunta,
      h('p', { class: 'nfr-passo' }, h('span', { class: 'nfr-passo__n' }, '2'), 'Que padrão EARS combina?'),
      padroes,
      h('div', { class: 'nfr-grid' },
        h('div', { class: 'nfr-form' },
          campo('gatilho', 'Gatilho (QUANDO / SE)', 'duas requisições pedirem a mesma vaga livre ao mesmo tempo'),
          campo('condicao', 'Condição (ENQUANTO / ONDE)', 'o mentor tiver até 1.000 vagas'),
          campo('sistema', 'Sistema', 'serviço de agenda'),
          campo('resposta', 'Resposta: o que DEVE acontecer, com número', 'responder com p95 abaixo de 50 ms', true),
          campo('sensor', 'Sensor: que teste ou ferramenta mede isso?', 'teste de desempenho na CI com 200 requisições', true),
          ondeBox,
          h('div', { class: 'row' }, btnExemplo, btnLimpar),
        ),
        h('aside', { class: 'nfr-saida' },
          h('p', { class: 'nfr-saida__rot' }, 'Seu requisito'),
          ears,
          avisos,
          sugestao,
          h('div', { class: 'row' }, btnGuardar, btnCopiar),
        ),
      ),
      h('section', { class: 'nfr-minhas' },
        h('div', { class: 'row nfr-minhas__cab' }, h('h4', {}, 'Minha spec de NFRs'), btnBaixar),
        lista,
      ),
    ),
  );

  function renderCategorias() {
    categorias.replaceChildren(
      ...Object.entries(CATEGORIAS).map(([id, cat]) =>
        h('button', {
          type: 'button',
          role: 'radio',
          'aria-checked': String(estado.atual.categoria === id),
          class: `nfr-cat${estado.atual.categoria === id ? ' is-on' : ''}`,
          onclick: () => {
            estado.atual.categoria = id;
            estado.atual.padrao = cat.padrao;
            render();
          },
        }, cat.nome),
      ),
    );
  }

  function renderPadroes() {
    padroes.replaceChildren(
      ...Object.entries(PADROES).map(([id, p]) =>
        h('button', {
          type: 'button',
          role: 'radio',
          'aria-checked': String(estado.atual.padrao === id),
          class: `chip nfr-padrao${estado.atual.padrao === id ? ' is-on' : ''}`,
          onclick: () => {
            estado.atual.padrao = id;
            render();
          },
        }, p.nome),
      ),
    );
  }

  function usarExemplo() {
    const cat = CATEGORIAS[estado.atual.categoria];
    estado.atual = { ...estado.atual, padrao: cat.padrao, ...cat.exemplo, sensor: cat.sensor, onde: [...cat.onde] };
    sincronizarCampos();
    render();
  }

  function limpar() {
    estado.atual = { ...estado.atual, gatilho: '', condicao: '', resposta: '', sensor: '', sistema: 'serviço de agenda' };
    sincronizarCampos();
    render();
  }

  function guardar() {
    const problemas = avaliar(estado.atual);
    if (problemas.length) {
      ctx.toast('Não guardei: ainda tem aviso aberto ao lado do requisito.');
      return;
    }
    estado.lista.push({ ...estado.atual, onde: [...(estado.atual.onde || [])] });
    ctx.toast('Guardado. Ele aparece em "Minha spec de NFRs", logo abaixo.');
    render();
  }

  function baixar() {
    if (!estado.lista.length) {
      ctx.toast('A lista está vazia. Guarde pelo menos um requisito para baixar o nfr.md.');
      return;
    }
    const corpo = ['# Requisitos não funcionais', '', ...estado.lista.map(paraMarkdown)].join('\n');
    ctx.download('nfr.md', corpo);
  }

  function sincronizarCampos() {
    for (const nome of Object.keys(campos)) campos[nome].value = estado.atual[nome] || '';
    for (const cb of ondeBox.querySelectorAll('input')) cb.checked = (estado.atual.onde || []).includes(cb.value);
  }

  function render() {
    const cat = CATEGORIAS[estado.atual.categoria];
    const padrao = PADROES[estado.atual.padrao];
    renderCategorias();
    renderPadroes();
    pergunta.textContent = cat.pergunta;
    linhas.gatilho.hidden = !padrao.usa.includes('gatilho');
    linhas.condicao.hidden = !padrao.usa.includes('condicao');

    ears.replaceChildren();
    const frase = montarEars(estado.atual);
    const partes = frase.split(/(?<!\p{L})(QUANDO|ENQUANTO|SE|ENTÃO|ONDE|DEVE)(?!\p{L})/u);
    for (const p of partes) {
      if (['QUANDO', 'ENQUANTO', 'SE', 'ENTÃO', 'ONDE', 'DEVE'].includes(p)) ears.append(h('b', { class: 'nfr-kw' }, p));
      else ears.append(p);
    }

    const problemas = avaliar(estado.atual);
    avisos.replaceChildren(
      ...(problemas.length
        ? problemas.map((a) => h('li', { class: `nfr-aviso nfr-aviso--${a.tipo}` }, h('span', { class: `chip ${a.tipo === 'faltando' ? 'chip--warn' : 'chip--bad'}` }, ROTULO_AVISO[a.tipo]), ' ', a.msg))
        : [h('li', { class: 'nfr-aviso nfr-aviso--ok' }, h('span', { class: 'chip chip--ok' }, 'pronto'), ' Tem número e tem sensor. Pode ir para a spec.')]),
    );

    sugestao.replaceChildren(
      h('p', { class: 'nfr-sugestao__rot' }, 'Sensor sugerido para ', cat.nome.toLowerCase()),
      h('p', { class: 'nfr-sugestao__txt' }, cat.sensor),
      h('button', {
        type: 'button',
        class: 'btn btn--sm btn--ghost',
        onclick: () => {
          estado.atual.sensor = cat.sensor;
          campos.sensor.value = cat.sensor;
          render();
        },
      }, 'Usar esta sugestão'),
    );

    btnGuardar.disabled = problemas.length > 0;
    lista.replaceChildren(
      ...(estado.lista.length
        ? estado.lista.map((n, i) =>
            h('li', {},
              h('span', { class: 'chip' }, CATEGORIAS[n.categoria]?.nome || 'NFR'),
              ' ',
              h('span', {}, montarEars(n)),
              h('button', {
                type: 'button',
                class: 'btn btn--sm btn--ghost nfr-remover',
                'aria-label': `Remover requisito ${i + 1}`,
                onclick: () => {
                  estado.lista.splice(i, 1);
                  render();
                },
              }, '×'),
            ),
          )
        : [h('li', { class: 'faint nfr-vazia' }, 'Nenhum requisito guardado ainda. Meta da aula: um por grupo.')]),
    );
    ctx.state.save(estado);
  }

  sincronizarCampos();
  render();
}
