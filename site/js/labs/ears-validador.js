import { h } from '../ui.js';
import { PADROES_EARS, EXERCICIOS, COM_DEFEITO, analisarEars } from '../logic/ears-validador.js';

const ROTULO = { faltando: 'falta', vago: 'vago', desejo: 'desejo', composto: 'dois em um', vazio: 'vazio' };
const CHIP = { faltando: 'chip--bad', vago: 'chip--warn', desejo: 'chip--warn', composto: 'chip--warn', vazio: '' };

export function mount(el, ctx) {
  const salvo = ctx.state.load({ acertos: {}, texto: '' });
  const estado = { acertos: salvo.acertos || {}, texto: salvo.texto || '', exigeNumero: false, indice: 0 };
  const salvar = () => ctx.state.save({ acertos: estado.acertos, texto: estado.texto });

  const placar = h('p', { class: 'ev-placar', 'aria-live': 'polite' });
  const frase = h('blockquote', { class: 'ev-frase' });
  const opcoes = h('div', { class: 'ev-opcoes', role: 'group', 'aria-label': 'Padrão EARS da frase' });
  const retorno = h('div', { class: 'ev-retorno', 'aria-live': 'polite' });
  const proxima = h('button', { class: 'btn btn--sm', type: 'button', onclick: () => { estado.indice = (estado.indice + 1) % EXERCICIOS.length; renderExercicio(); } }, 'Próxima frase');

  function renderPlacar() {
    const n = Object.values(estado.acertos).filter(Boolean).length;
    placar.textContent = `${n} de ${EXERCICIOS.length} frases classificadas na primeira tentativa.`;
  }

  function renderExercicio() {
    const ex = EXERCICIOS[estado.indice];
    frase.textContent = ex.frase;
    retorno.replaceChildren();
    proxima.hidden = true;
    opcoes.replaceChildren(
      ...Object.entries(PADROES_EARS).map(([chave, p]) =>
        h('button', { class: 'btn btn--sm ev-op', type: 'button', onclick: (e) => responder(chave, e.currentTarget) },
          h('span', { class: 'ev-op__nome' }, p.nome),
          h('span', { class: 'ev-op__gab mono' }, p.gabarito)),
      ),
    );
    renderPlacar();
  }

  function responder(chave, botao) {
    const ex = EXERCICIOS[estado.indice];
    const certo = chave === ex.padrao;
    if (!(estado.indice in estado.acertos)) {
      estado.acertos[estado.indice] = certo;
      salvar();
    }
    botao.classList.add(certo ? 'is-certo' : 'is-errado');
    const pad = PADROES_EARS[ex.padrao];
    retorno.replaceChildren(
      h('p', {}, h('span', { class: `chip ${certo ? 'chip--ok' : 'chip--bad'}` }, certo ? 'Certo' : 'Ainda não'),
        ' ', certo ? `É ${pad.nome}. ${ex.dica}` : `Dica: ${ex.dica}`),
    );
    if (certo) {
      for (const b of opcoes.querySelectorAll('button')) b.disabled = true;
      proxima.hidden = false;
    }
    renderPlacar();
  }

  const area = h('textarea', { id: `ev-texto-${ctx.licaoId}`, rows: '3', spellcheck: 'false', placeholder: 'QUANDO ..., o serviço de agenda DEVE ...' });
  area.value = estado.texto;
  const nfr = h('input', { type: 'checkbox', id: `ev-nfr-${ctx.licaoId}` });
  const leitura = h('div', { class: 'ev-leitura', 'aria-live': 'polite' });

  function renderLeitura() {
    const r = analisarEars(estado.texto, { exigeNumero: estado.exigeNumero });
    if (!estado.texto.trim()) {
      leitura.replaceChildren(h('p', { class: 'muted' }, 'Escreva uma frase ou clique num defeito para ver o validador apontar o problema.'));
      return;
    }
    const partes = [
      ['Padrão', r.padrao ? PADROES_EARS[r.padrao].nome : '-'],
      ['Gatilho / condição', r.partes.gatilho || (r.padrao === 'ubiquo' ? 'não se aplica' : '-')],
      ['Sistema', r.partes.sistema || '-'],
      ['Resposta', r.partes.resposta || '-'],
    ];
    leitura.replaceChildren(
      h('dl', { class: 'ev-partes' }, partes.flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, v)])),
      r.ok
        ? h('p', {}, h('span', { class: 'chip chip--ok' }, 'Passa'), ' Todas as partes do molde estão no lugar. Dá para escrever um teste a partir dela.')
        : h('ul', { class: 'ev-avisos' }, r.avisos.map((a) => h('li', {}, h('span', { class: `chip ${CHIP[a.tipo] || ''}` }, ROTULO[a.tipo] || a.tipo), ' ', a.msg))),
    );
  }

  area.addEventListener('input', () => { estado.texto = area.value; salvar(); renderLeitura(); });
  nfr.addEventListener('change', () => { estado.exigeNumero = nfr.checked; renderLeitura(); });

  const exemplos = h('div', { class: 'ev-exemplos' },
    COM_DEFEITO.map((d) => h('button', { class: 'btn btn--sm btn--ghost', type: 'button', onclick: () => {
      estado.texto = d.frase; area.value = d.frase; estado.exigeNumero = d.exigeNumero; nfr.checked = d.exigeNumero; salvar(); renderLeitura();
    } }, `Defeito: ${d.nome}`)));

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag' }, 'Laboratório'),
      h('h3', {}, 'Validador EARS: qual molde, e o que falta?'),
      h('p', {}, 'Primeiro reconheça o padrão de seis frases da agenda. Depois escreva a sua e veja o que falta.'),
    ),
    h('div', { class: 'lab__body' },
      h('p', { class: 'ev-passo' }, h('span', { class: 'ev-passo__n' }, '1'), 'Que padrão é esta frase?'),
      frase, opcoes, retorno, proxima, placar,
      h('p', { class: 'ev-passo' }, h('span', { class: 'ev-passo__n' }, '2'), 'Agora a sua frase'),
      h('label', { for: area.id, class: 'sr-only' }, 'Frase de requisito'),
      area,
      h('label', { class: 'ev-nfr', for: nfr.id }, nfr, h('span', {}, 'É requisito não funcional (exige número)')),
      exemplos,
      leitura,
    ),
  );
  renderExercicio();
  renderLeitura();
}
