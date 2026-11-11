import { h } from '../ui.js';
import { ACOES, JANELA, BASE_PRINCIPAL, BASE_SUBAGENT, CUSTO_PEDIDO, CUSTO_RESUMO, LIMITE_SMART, simular, comparar, zona, formatarTokens } from '../logic/contexto.js';

const ZONA_TXT = { smart: 'smart zone', dumb: 'dumb zone', cheia: 'janela cheia' };
const ZONA_CHIP = { smart: 'chip--ok', dumb: 'chip--bad', cheia: 'chip--bad' };

const pct = (n) => `${((n / JANELA) * 100).toFixed(1)}%`;

export function mount(el, ctx) {
  const salvo = ctx.state.load({ passo: 0, delegadas: [] });
  let passo = Math.min(salvo.passo || 0, ACOES.length);
  let delegadas = new Set(salvo.delegadas || []);

  const barraPrincipal = h('div', { class: 'cx-barra', role: 'img' });
  const zonaPrincipal = h('span', { class: 'chip' });
  const ocupPrincipal = h('strong', { class: 'mono' });
  const janelaSub = h('div', { class: 'cx-sub', 'aria-live': 'polite' });
  const log = h('ol', { class: 'cx-log' });
  const decisao = h('div', { class: 'cx-decisao', 'aria-live': 'polite' });
  const comparacao = h('div', { class: 'cx-comp' });

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag' }, 'Laboratório'),
      h('h3', {}, 'Grande demais para a porta: a janela de contexto'),
      h('p', {}, 'O agente implementa a T1 passo a passo. Em cada investigação pesada, decida: fazer aqui ou delegar para um subagent?'),
    ),
    h('div', { class: 'lab__body' },
      h('section', { class: 'cx-janela' },
        h('div', { class: 'row cx-janela__cab' },
          h('h4', {}, 'Agente principal'),
          zonaPrincipal,
          h('span', { class: 'muted cx-janela__num' }, ocupPrincipal, ` de ${formatarTokens(JANELA)} tokens`),
        ),
        h('div', { class: 'cx-trilho' },
          barraPrincipal,
          h('span', { class: 'cx-limite', style: { left: `${LIMITE_SMART * 100}%` } }, h('span', {}, '40%')),
        ),
        h('div', { class: 'row cx-legenda' },
          h('span', { class: 'cx-leg cx-leg--base' }, 'sistema + AGENTS.md'),
          h('span', { class: 'cx-leg cx-leg--impl' }, 'implementar'),
          h('span', { class: 'cx-leg cx-leg--inv' }, 'investigar aqui'),
          h('span', { class: 'cx-leg cx-leg--res' }, 'pedido + resumo do subagent'),
        ),
      ),
      janelaSub,
      decisao,
      log,
      comparacao,
    ),
  );

  function salvar() {
    ctx.state.save({ passo, delegadas: [...delegadas] });
  }

  function avancar(delegar) {
    const acao = ACOES[passo];
    if (!acao) return;
    if (delegar) delegadas.add(acao.id);
    else delegadas.delete(acao.id);
    passo++;
    salvar();
    render(true);
  }

  function reiniciar() {
    passo = 0;
    delegadas = new Set();
    salvar();
    render();
  }

  function rodarTudo(delegar) {
    passo = ACOES.length;
    delegadas = new Set(delegar ? ACOES.filter((a) => a.tipo === 'investigar').map((a) => a.id) : []);
    salvar();
    render();
  }

  function render(animar = false) {
    const r = simular({ acoes: ACOES.slice(0, passo), delegar: delegadas });
    const total = passo === 0 ? BASE_PRINCIPAL : r.principalFinal;
    const z = zona(total / JANELA);

    barraPrincipal.replaceChildren(h('span', { class: 'cx-seg cx-seg--base', style: { width: pct(BASE_PRINCIPAL) }, title: `Base: ${formatarTokens(BASE_PRINCIPAL)}` }));
    for (const p of r.passos) {
      const tam = p.delegada ? CUSTO_PEDIDO + CUSTO_RESUMO : p.acao.tokens;
      const tipo = p.delegada ? 'res' : p.acao.tipo === 'implementar' ? 'impl' : 'inv';
      barraPrincipal.append(h('span', { class: `cx-seg cx-seg--${tipo}`, style: { width: pct(tam) }, title: `${p.acao.nome}: ${formatarTokens(tam)}` }));
    }
    barraPrincipal.setAttribute('aria-label', `Janela do agente principal com ${pct(total)} ocupados, ${ZONA_TXT[z]}`);
    zonaPrincipal.className = `chip ${ZONA_CHIP[z]}`;
    zonaPrincipal.textContent = ZONA_TXT[z];
    ocupPrincipal.textContent = `${formatarTokens(total)} (${pct(total)})`;

    const ultimo = r.passos[r.passos.length - 1];
    janelaSub.replaceChildren();
    if (ultimo && ultimo.delegada) {
      janelaSub.append(
        h('div', { class: `cx-sub__card${animar ? ' is-novo' : ''}` },
          h('div', { class: 'row cx-janela__cab' },
            h('h4', {}, 'Subagent'),
            h('span', { class: 'chip chip--ok' }, 'janela própria'),
            h('span', { class: 'muted cx-janela__num' }, h('strong', { class: 'mono' }, formatarTokens(ultimo.subagent)), ' usados e descartados'),
          ),
          h('p', { class: 'cx-sub__tarefa' }, '“', ultimo.acao.nome, '”'),
          h('div', { class: 'cx-trilho cx-trilho--sub' },
            h('div', { class: 'cx-barra' },
              h('span', { class: 'cx-seg cx-seg--base', style: { width: pct(BASE_SUBAGENT) } }),
              h('span', { class: 'cx-seg cx-seg--inv', style: { width: pct(ultimo.acao.tokens + CUSTO_PEDIDO) } }),
              h('span', { class: 'cx-seg cx-seg--res', style: { width: pct(CUSTO_RESUMO) } }),
            ),
          ),
          h('p', { class: 'cx-sub__volta' }, '↩ Volta para o principal só o resumo: ', h('strong', { class: 'mono' }, formatarTokens(CUSTO_RESUMO)), ' tokens.'),
        ),
      );
    }

    log.replaceChildren(
      ...r.passos.map((p, i) =>
        h('li', { class: p.delegada ? 'is-delegada' : '' },
          h('span', { class: 'cx-log__n mono' }, String(i + 1).padStart(2, '0')),
          h('span', { class: 'cx-log__nome' }, p.acao.nome),
          h('span', { class: 'cx-log__tok mono' }, p.delegada ? `→ subagent (+${formatarTokens(CUSTO_PEDIDO + CUSTO_RESUMO)})` : `+${formatarTokens(p.acao.tokens)}`),
          h('span', { class: `chip ${ZONA_CHIP[zona(p.fracao)]}` }, pct(p.principal)),
        ),
      ),
    );

    decisao.replaceChildren();
    if (passo < ACOES.length) {
      const acao = ACOES[passo];
      const pode = acao.tipo === 'investigar';
      decisao.append(
        h('p', { class: 'cx-decisao__prox' },
          h('span', { class: 'faint' }, `Passo ${passo + 1} de ${ACOES.length} · `),
          h('strong', {}, acao.nome),
          h('span', { class: 'mono faint' }, ` (${formatarTokens(acao.tokens)})`),
        ),
        h('div', { class: 'row' },
          h('button', { type: 'button', class: 'btn btn--sm', onclick: () => avancar(false) }, pode ? 'Fazer aqui no principal' : 'Fazer aqui (implementação fica no principal)'),
          pode ? h('button', { type: 'button', class: 'btn btn--sm btn--primary', onclick: () => avancar(true) }, 'Delegar para subagent') : null,
          h('span', { class: 'cx-sep', 'aria-hidden': 'true' }),
          h('button', { type: 'button', class: 'btn btn--sm btn--ghost', onclick: () => rodarTudo(false) }, 'Rodar tudo sem subagent'),
          h('button', { type: 'button', class: 'btn btn--sm btn--ghost', onclick: () => rodarTudo(true) }, 'Rodar tudo delegando'),
        ),
      );
      if (!pode) decisao.append(h('p', { class: 'faint cx-dica' }, 'Implementar depende de tudo o que o principal já entendeu. Por isso não se delega aqui.'));
    } else {
      decisao.append(
        h('div', { class: 'row' },
          h('p', { class: 'cx-decisao__prox' }, h('strong', {}, 'T1 pronta. '), r.zonaFinal === 'smart' ? 'O principal terminou com folga para a próxima task.' : 'O principal terminou na dumb zone: a próxima task começa numa janela cheia de log que não serve mais.'),
          h('button', { type: 'button', class: 'btn btn--sm', onclick: reiniciar }, 'Recomeçar'),
        ),
      );
    }

    comparacao.replaceChildren();
    if (passo === ACOES.length) {
      const c = comparar();
      comparacao.append(
        h('h4', {}, 'Com e sem subagent'),
        h('table', { class: 'cx-tabela' },
          h('thead', {}, h('tr', {}, h('th', {}, ''), h('th', {}, 'Tudo no principal'), h('th', {}, 'Delegando investigação'))),
          h('tbody', {},
            h('tr', {}, h('th', {}, 'Janela do principal no fim'), h('td', {}, pct(c.sem.principalFinal), ' ', h('span', { class: `chip ${ZONA_CHIP[c.sem.zonaFinal]}` }, ZONA_TXT[c.sem.zonaFinal])), h('td', {}, pct(c.com.principalFinal), ' ', h('span', { class: `chip ${ZONA_CHIP[c.com.zonaFinal]}` }, ZONA_TXT[c.com.zonaFinal]))),
            h('tr', {}, h('th', {}, 'Tokens gastos no total'), h('td', { class: 'mono' }, formatarTokens(c.sem.gastoTotal)), h('td', { class: 'mono' }, formatarTokens(c.com.gastoTotal))),
          ),
        ),
        h('p', { class: 'callout' }, `Perceba a conta: delegando, você gasta ${formatarTokens(c.custoExtra)} tokens a mais no total e a janela do principal fica ${formatarTokens(c.economiaPrincipal)} mais leve. Você paga para manter o principal na smart zone. Vale quando a investigação é pesada e só a conclusão importa.`),
      );
    }
  }

  render();
}
