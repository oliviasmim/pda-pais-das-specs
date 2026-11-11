import { h } from '../ui.js';
import {
  TESTES,
  IMPLEMENTACOES,
  QUEBRAS,
  teste,
  rodarTeste,
  cobertura,
  veredito,
} from '../logic/teste-nao-prova.js';

export function mount(el, ctx) {
  const salvo = ctx.state.load({ teste: 'mock', rodadas: {} });
  let atual = teste(salvo.teste) ? salvo.teste : 'mock';
  const rodadas = salvo.rodadas && typeof salvo.rodadas === 'object' ? salvo.rodadas : {};
  const salvar = () => ctx.state.save({ teste: atual, rodadas });

  const escolha = h('div', { class: 'tnp-escolha', role: 'radiogroup', 'aria-label': 'Teste a examinar' });
  const codigo = h('pre', { class: 'tnp-codigo', tabindex: '0', 'aria-label': 'Código do teste' }, h('code'));
  const cobBarra = h('div', { class: 'tnp-cob__barra' }, h('span'));
  const cobTexto = h('p', { class: 'tnp-cob__texto' });
  const lista = h('ul', { class: 'tnp-quebras' });
  const resultado = h('div', { class: 'tnp-resultado', 'aria-live': 'polite' });

  const jaRodou = (id) => (rodadas[atual] || []).includes(id);
  const marcarRodada = (id) => {
    const l = new Set(rodadas[atual] || []);
    l.add(id);
    rodadas[atual] = [...l];
    salvar();
    desenhar();
  };

  function linhaQuebra(q) {
    const rodou = jaRodou(q.id);
    const r = rodou ? rodarTeste(atual, q.id) : null;
    const chip = r
      ? h('span', { class: `chip ${r.passou ? 'chip--bad' : 'chip--ok'}`, text: r.passou ? 'Verde. Não percebeu.' : 'Vermelho. Percebeu.' })
      : h('span', { class: 'chip', text: 'Não rodou' });
    return h('li', { class: `tnp-q${r ? (r.passou ? ' tnp-q--passou' : ' tnp-q--pegou') : ''}` },
      h('div', { class: 'tnp-q__topo' },
        h('strong', { text: q.nome }),
        h('button', { type: 'button', class: 'btn btn--sm', onclick: () => marcarRodada(q.id), 'aria-label': `Rodar o teste com a quebra: ${q.nome}` }, rodou ? 'Rodar de novo' : 'Quebrar e rodar'),
      ),
      h('pre', { class: 'tnp-q__diff mono' }, q.mudanca),
      h('div', { class: 'tnp-q__fim' }, chip, rodou ? h('span', { class: 'muted', text: r.passou ? q.defeito : (r.erro ? 'O teste caiu com erro: a função não devolveu nada.' : 'O assert falhou: o teste confere esse valor.') }) : null),
    );
  }

  function desenhar() {
    escolha.replaceChildren(...TESTES.map((t) => h('button', {
      type: 'button',
      role: 'radio',
      'aria-checked': String(t.id === atual),
      class: `tnp-opcao${t.id === atual ? ' tnp-opcao--on' : ''}`,
      onclick: () => { atual = t.id; salvar(); desenhar(); },
    }, h('strong', { text: t.padrao }))));

    codigo.firstChild.textContent = teste(atual).fonte;
    const c = cobertura(atual);
    cobBarra.firstChild.style.width = `${c.pct}%`;
    cobTexto.textContent = `Cobertura de linhas sobre o código correto: ${c.pct}% (${c.executadas} de ${c.total} trechos executados).`;

    lista.replaceChildren(...QUEBRAS.map(linhaQuebra));

    const feitas = (rodadas[atual] || []).length;
    if (feitas < QUEBRAS.length) {
      resultado.replaceChildren(h('p', { class: 'muted', text: `Quebras rodadas: ${feitas} de ${QUEBRAS.length}. Rode todas para ver o veredito.` }));
      return;
    }
    const v = veredito(atual);
    const cls = `callout tnp-ver ${v.tipo === 'prova' ? 'tnp-ver--ok' : 'tnp-ver--ruim'}`;
    resultado.replaceChildren(h('div', { class: cls },
      h('strong', { text: v.tipo === 'prova' ? 'Prova algo' : v.tipo === 'nada' ? 'Não prova nada' : 'Prova pouco' }),
      h('p', { text: v.texto }),
      v.tipo !== 'prova' ? h('p', { class: 'muted', text: 'Correção: compare com um valor exato da spec (status, mensagem, estado da vaga) e chame o código de verdade.' }) : null,
    ));
  }

  const todas = h('button', {
    type: 'button',
    class: 'btn btn--primary btn--sm',
    onclick: () => { rodadas[atual] = QUEBRAS.map((q) => q.id); salvar(); desenhar(); },
  }, 'Rodar todas as quebras');
  const zerar = h('button', {
    type: 'button',
    class: 'btn btn--ghost btn--sm',
    onclick: () => { rodadas[atual] = []; salvar(); desenhar(); },
  }, 'Limpar');

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag', text: 'Laboratório' }),
      h('h3', { text: 'O teste que não prova nada' }),
      h('p', { class: 'muted', text: 'Escolha um teste e quebre o código de propósito. Se o teste continuar verde, ele não confere nada.' }),
    ),
    h('div', { class: 'lab__body tnp-grade' },
      h('div', { class: 'tnp-col' },
        h('p', { class: 'tnp-h' }, `Código sob teste: POST /agendamentos (${IMPLEMENTACOES.length - 1} quebras possíveis)`),
        escolha,
        codigo,
        h('div', { class: 'tnp-cob' }, cobBarra, cobTexto),
      ),
      h('div', { class: 'tnp-col' },
        h('div', { class: 'row tnp-acoes' }, todas, zerar),
        lista,
        resultado,
      ),
    ),
  );

  desenhar();
}
