import { ERROS, TIPOS_SENSOR, erroPorId, sugestao, avaliarCarta, montarCarta } from '../logic/carta-rainha.js';

function h(tag, props = {}, ...filhos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === false || v === null || v === undefined) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'value') el.value = v;
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
const VAZIO = { erroId: '', evidencia: '', regra: '', sensor: '', tipo: '', onde: '' };

export function mount(el, ctx) {
  const uid = `cr${++contador}`;
  let carta = { ...VAZIO, ...ctx.state.load(VAZIO) };
  const salvar = () => ctx.state.save(carta);

  const catalogo = h('div', { class: 'cr-catalogo', role: 'radiogroup', 'aria-label': 'Erro que a IA repetiu' });
  const evidencia = h('input', {
    id: `${uid}-ev`,
    class: 'cr-input mono',
    type: 'text',
    placeholder: 'ex.: src/rotas/agendamentos.js:31 · devolveu 422 sem estar na spec',
    oninput: (e) => { carta.evidencia = e.target.value; atualizar(); },
  });
  const regra = h('textarea', { id: `${uid}-regra`, class: 'cr-input', rows: '4', oninput: (e) => { carta.regra = e.target.value; atualizar(); } });
  const sensor = h('textarea', { id: `${uid}-sensor`, class: 'cr-input', rows: '5', oninput: (e) => { carta.sensor = e.target.value; atualizar(); } });
  const tipoSensor = h('p', { class: 'cr-destino' });
  const avisos = h('ul', { class: 'cr-avisos', 'aria-live': 'polite' });
  const previa = h('pre', { class: 'cr-previa', tabindex: '0', 'aria-label': 'Prévia da carta' }, h('code'));
  const corpo = h('div', { class: 'cr-corpo' });

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag', text: 'Laboratório' }),
      h('h3', { text: 'Carta à Rainha' }),
      h('p', { class: 'muted', text: 'Escolha o erro que a IA repetiu hoje. Transforme em uma regra que o agente lê antes (guia) e uma checagem que pega depois (sensor).' }),
    ),
    h('div', { class: 'lab__body' },
      h('p', { class: 'cr-passo', text: '1 · Que erro a IA repetiu?' }),
      catalogo,
      corpo,
    ),
  );

  corpo.append(
    h('label', { class: 'cr-passo', for: `${uid}-ev`, text: '2 · Evidência de hoje' }),
    evidencia,
    h('p', { class: 'cr-passo', text: '3 · Guia e sensor' }),
    h('div', { class: 'cr-duas' },
      h('section', { class: 'cr-lado cr-lado--guia', 'aria-labelledby': `${uid}-g` },
        h('div', { class: 'cr-lado-topo' },
          h('span', { class: 'cr-seta', 'aria-hidden': 'true', text: '→' }),
          h('div', {},
            h('h4', { id: `${uid}-g`, text: 'Guia · feedforward' }),
            h('p', { class: 'muted', text: 'Age antes. O agente lê e tenta obedecer.' }),
          ),
        ),
        h('label', { for: `${uid}-regra`, class: 'cr-destino' }, 'Vai para ', h('code', { text: 'AGENTS.md' })),
        regra,
        h('button', { type: 'button', class: 'btn btn--ghost btn--sm', onclick: () => restaurar('regra') }, 'Restaurar sugestão'),
      ),
      h('section', { class: 'cr-lado cr-lado--sensor', 'aria-labelledby': `${uid}-s` },
        h('div', { class: 'cr-lado-topo' },
          h('span', { class: 'cr-seta', 'aria-hidden': 'true', text: '←' }),
          h('div', {},
            h('h4', { id: `${uid}-s`, text: 'Sensor · feedback' }),
            h('p', { class: 'muted', text: 'Age depois. Mede e bloqueia, obedeça o agente ou não.' }),
          ),
        ),
        h('label', { for: `${uid}-sensor` }, tipoSensor),
        sensor,
        h('button', { type: 'button', class: 'btn btn--ghost btn--sm', onclick: () => restaurar('sensor') }, 'Restaurar sugestão'),
      ),
    ),
    h('p', { class: 'cr-nota muted', text: 'Por que os dois? O guia evita a maior parte dos erros e custa contexto. O sensor pega o que escapou e custa tempo de CI. Regra importante sem sensor é promessa; sensor sem regra faz o agente errar, apanhar e tentar de novo.' }),
    avisos,
    h('div', { class: 'cr-saida' },
      h('p', { class: 'cr-passo', text: '4 · A carta' }),
      previa,
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'btn btn--primary btn--sm', onclick: () => ctx.copy(montarCarta(carta)) }, 'Copiar carta'),
        h('button', { type: 'button', class: 'btn btn--sm', onclick: () => ctx.download('carta-a-rainha.md', montarCarta(carta)) }, 'Baixar .md'),
        h('button', { type: 'button', class: 'btn btn--ghost btn--sm', onclick: () => ctx.copy(`- ${carta.regra.trim()}`) }, 'Copiar só a regra do AGENTS.md'),
      ),
    ),
  );

  function escolher(id) {
    const s = sugestao(id);
    carta = { ...carta, erroId: id, regra: s.regra, sensor: s.sensor, tipo: s.tipo, onde: s.onde };
    regra.value = carta.regra;
    sensor.value = carta.sensor;
    desenharCatalogo();
    atualizar();
  }

  function restaurar(campo) {
    const s = sugestao(carta.erroId);
    if (!s) return;
    carta[campo] = s[campo];
    (campo === 'regra' ? regra : sensor).value = s[campo];
    atualizar();
  }

  function desenharCatalogo() {
    catalogo.replaceChildren(...ERROS.map((e) => h('button', {
      type: 'button',
      role: 'radio',
      'aria-checked': String(carta.erroId === e.id),
      class: `cr-erro${carta.erroId === e.id ? ' cr-erro--on' : ''}`,
      onclick: () => escolher(e.id),
    }, h('strong', { text: e.nome }), h('span', { text: e.exemplo }))));
  }

  function atualizar() {
    salvar();
    const e = erroPorId(carta.erroId);
    corpo.hidden = !e;
    if (!e) return;
    const tipo = TIPOS_SENSOR[carta.tipo] || TIPOS_SENSOR[e.sensor.tipo];
    tipoSensor.replaceChildren(h('span', { class: 'chip', text: tipo.nome }), ' vai para ', h('code', { text: carta.onde || e.sensor.onde }));
    const lista = avaliarCarta(carta);
    avisos.replaceChildren(...(lista.length
      ? lista.map((a) => h('li', { class: 'cr-aviso' }, a.msg))
      : [h('li', { class: 'cr-aviso cr-aviso--ok' }, 'Carta precisa: evidência, regra verificável e sensor com sim ou não.')]));
    previa.firstChild.textContent = montarCarta(carta);
  }

  regra.value = carta.regra;
  sensor.value = carta.sensor;
  evidencia.value = carta.evidencia;
  desenharCatalogo();
  atualizar();
}
