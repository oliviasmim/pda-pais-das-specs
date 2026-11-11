import { h } from '../ui.js';
import { OPCOES, QUADRANTES, SITUACOES, avaliar, resumo } from '../logic/eixos-isolamento.js';

const NS = 'http://www.w3.org/2000/svg';

function s(tag, attrs = {}, ...filhos) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined && v !== false) el.setAttribute(k, String(v));
  for (const f of filhos.flat()) if (f !== null && f !== undefined && f !== false) el.append(f instanceof Node ? f : document.createTextNode(String(f)));
  return el;
}

export function mount(el, ctx) {
  let respostas = ctx.state.load({}) || {};
  let foco = null;

  const mapa = h('div', { class: 'ei-mapa' });
  const placar = h('p', { class: 'ei-placar', 'aria-live': 'polite' });
  const lista = h('div', { class: 'ei-lista' });

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag' }, 'Laboratório'),
      h('h3', {}, 'Que isolamento essa situação pede?'),
      h('p', {}, 'Worktree separa arquivo. Subagent separa contexto (o que o agente tem na conversa). Leia cada situação, escolha o que falta separar e clique em Revelar.'),
    ),
    h('div', { class: 'lab__body' },
      mapa,
      h('div', { class: 'row ei-topo' }, placar, h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: () => { respostas = {}; foco = null; salvar(); tudo(); } }, 'Recomeçar')),
      lista,
    ),
  );

  function salvar() {
    ctx.state.save(respostas);
  }

  function desenharMapa() {
    const certaFoco = foco ? avaliar(foco, respostas[foco].escolha).certa : null;
    const escolhaFoco = foco ? respostas[foco].escolha : null;
    const W = 560;
    const H = 250;
    const X0 = 70;
    const Y0 = 14;
    const cw = (W - X0 - 8) / 2;
    const ch = (H - Y0 - 40) / 2;
    const svg = s('svg', { class: 'ei-svg', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Quatro quadrantes: contexto separado ou não, arquivos separados ou não. Sem nenhum isolamento, subagent, worktree, ou subagent dentro de worktree.' });
    const ordem = ['nenhum', 'subagent', 'worktree', 'ambos'];
    for (const id of ordem) {
      const q = QUADRANTES[id];
      const x = X0 + q.col * cw;
      const y = Y0 + q.row * ch;
      const classes = ['ei-q', id === certaFoco ? 'ei-q--certa' : '', id === escolhaFoco && id !== certaFoco ? 'ei-q--errada' : ''].filter(Boolean).join(' ');
      svg.append(
        s('g', { class: classes },
          s('rect', { x: x + 3, y: y + 3, width: cw - 6, height: ch - 6, rx: 12 }),
          s('text', { x: x + cw / 2, y: y + ch / 2 - 4, class: 'ei-q__nome', 'text-anchor': 'middle' }, OPCOES[id].nome),
          s('text', { x: x + cw / 2, y: y + ch / 2 + 16, class: 'ei-q__dica', 'text-anchor': 'middle' }, id === 'ambos' ? 'isolation: worktree' : id === 'worktree' ? 'git worktree · claude -w' : id === 'subagent' ? 'janela própria' : 'uma sessão, uma pasta'),
        ),
      );
    }
    svg.append(
      s('text', { x: X0 + cw / 2, y: H - 22, class: 'ei-eixo', 'text-anchor': 'middle' }, 'contexto junto'),
      s('text', { x: X0 + cw * 1.5, y: H - 22, class: 'ei-eixo', 'text-anchor': 'middle' }, 'contexto separado'),
      s('text', { x: X0 + cw, y: H - 5, class: 'ei-eixo ei-eixo--tit', 'text-anchor': 'middle' }, 'isola CONTEXTO (a janela do agente)'),
      s('text', { x: X0 - 8, y: Y0 + ch / 2 + 4, class: 'ei-eixo', 'text-anchor': 'end' }, 'arquivo junto'),
      s('text', { x: X0 - 8, y: Y0 + ch * 1.5 + 4, class: 'ei-eixo', 'text-anchor': 'end' }, 'arquivo separado'),
    );
    mapa.replaceChildren(svg, h('p', { class: 'ei-mapa__legenda muted' }, foco ? 'Verde: a resposta. Vermelho: a sua, se foi outra.' : 'Revele uma situação e o quadrante certo acende aqui.'));
  }

  function carta(sit, i) {
    const r = respostas[sit.id] || {};
    const nome = `ei-${ctx.licaoId}-${sit.id}`;
    const campos = h('fieldset', { class: 'ei-escolha' },
      h('legend', { class: 'sr-only' }, `Isolamento para a situação ${i + 1}`),
      Object.entries(OPCOES).map(([id, o]) => {
        const input = h('input', { type: 'radio', name: nome, id: `${nome}-${id}`, value: id, checked: r.escolha === id, disabled: !!r.revelado });
        input.addEventListener('change', () => {
          respostas = { ...respostas, [sit.id]: { ...respostas[sit.id], escolha: id } };
          salvar();
          revelar.disabled = false;
        });
        return h('label', { for: `${nome}-${id}`, class: 'ei-op' }, input, h('span', {}, o.nome));
      }),
    );
    const revelar = h('button', { class: 'btn btn--primary btn--sm', type: 'button', disabled: !r.escolha || !!r.revelado, onclick: () => {
      respostas = { ...respostas, [sit.id]: { ...respostas[sit.id], revelado: true } };
      foco = sit.id;
      salvar();
      tudo();
    } }, 'Revelar');
    let resposta = null;
    if (r.revelado) {
      const a = avaliar(sit.id, r.escolha);
      resposta = h('div', { class: 'ei-resposta', 'aria-live': 'polite' },
        h('span', { class: `chip ${a.acertou ? 'chip--ok' : 'chip--bad'}` }, a.acertou ? 'Certo' : `Era: ${OPCOES[a.certa].nome}`),
        h('p', {}, sit.porque),
        h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: () => { foco = sit.id; desenharMapa(); mapa.scrollIntoView({ block: 'nearest' }); } }, 'Ver no mapa'),
      );
    }
    return h('article', { class: `ei-carta${r.revelado ? ' ei-carta--revelada' : ''}` },
      h('p', { class: 'ei-texto' }, h('span', { class: 'ei-n mono' }, `${i + 1}.`), ' ', sit.texto),
      campos,
      r.revelado ? null : revelar,
      resposta,
    );
  }

  function tudo() {
    if (foco && !(respostas[foco] && respostas[foco].revelado)) foco = null;
    desenharMapa();
    const r = resumo(respostas);
    placar.textContent = r.feitas ? `${r.acertos} de ${r.feitas} certas (${r.total} situações).` : `${r.total} situações.`;
    lista.replaceChildren(...SITUACOES.map(carta));
  }

  tudo();
}
