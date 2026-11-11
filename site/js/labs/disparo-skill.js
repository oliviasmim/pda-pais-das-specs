import { h } from '../ui.js';
import { SKILL, DESCRICOES, avaliar } from '../logic/disparo-skill.js';

const ROTULO = {
  acerto: ['chip--ok', 'acertou'],
  'falso-positivo': ['chip--bad', 'disparou sem dever'],
  'falso-negativo': ['chip--warn', 'não disparou e devia'],
};

export function mount(el, ctx) {
  const salvo = ctx.state.load({ id: 'vaga' }) || {};
  let id = DESCRICOES.some((d) => d.id === salvo.id) ? salvo.id : 'vaga';

  const abas = h('div', { class: 'ds-abas', role: 'group', 'aria-label': 'Versão da description' });
  const texto = h('blockquote', { class: 'ds-desc mono' });
  const tabela = h('ul', { class: 'ds-linhas' });
  const placar = h('p', { class: 'ds-placar', 'aria-live': 'polite' });
  const nota = h('div', { class: 'callout ds-nota', 'aria-live': 'polite' });

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag' }, 'Laboratório'),
      h('h3', {}, 'Dispara ou não dispara?'),
      h('p', {}, `A skill ${SKILL.nome} só entra na janela se a description combinar com o pedido. Troque a versão da description e veja os dez pedidos.`),
    ),
    h('div', { class: 'lab__body' },
      abas,
      h('p', { class: 'muted ds-skill' }, 'description (a única parte que o agente vê antes de decidir):'),
      texto,
      placar,
      tabela,
      nota,
      h('p', { class: 'muted ds-aviso' }, 'Simulação: o modelo de verdade decide pelo sentido da frase, não por palavras soltas. Aqui as palavras-gatilho só deixam o efeito visível.'),
    ),
  );

  function render() {
    ctx.state.save({ id });
    abas.replaceChildren(...DESCRICOES.map((d) => h('button', { type: 'button', class: `btn btn--sm${d.id === id ? ' btn--primary' : ''}`, 'aria-pressed': d.id === id ? 'true' : 'false', onclick: () => {
      id = d.id;
      render();
    } }, d.nome)));
    const r = avaliar(id);
    texto.textContent = r.descricao.texto;
    placar.replaceChildren(h('strong', { class: 'mono' }, `${r.acertos}/${r.total}`), ` certos · ${r.falsosNegativos} não disparou e devia · ${r.falsosPositivos} disparou sem dever`);
    tabela.replaceChildren(...r.linhas.map((l) => {
      const [classe, rot] = ROTULO[l.resultado];
      return h('li', { class: 'ds-linha' },
        h('span', { class: 'ds-linha__pedido' }, l.texto, l.limite ? h('span', { class: 'muted' }, ' (caso-limite)') : ''),
        h('span', { class: 'ds-linha__esperado mono muted' }, l.deve ? 'devia disparar' : 'não devia'),
        h('span', { class: 'chip ' + classe }, `${l.disparou ? 'disparou' : 'ficou quieta'} · ${rot}`),
      );
    }));
    nota.replaceChildren(h('p', {}, r.descricao.nota));
  }

  render();
}
