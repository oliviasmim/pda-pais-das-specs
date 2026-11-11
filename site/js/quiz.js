import { h } from './ui.js';
import { registrarQuiz } from './store.js';

const ROTULOS = {
  pre: { titulo: 'Antes de ler', sub: 'Vai sem medo, não vale nota. Serve para você ver o que já sabe.' },
  check: { titulo: 'Confira', sub: 'Duas perguntas sobre o que você acabou de ler. Errou? Volte no bloco acima antes de seguir.' },
  pos: { titulo: 'Antes de sair', sub: 'Responda sem voltar no texto. Depois compare com o seu chute do começo.' },
};

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function renderQuiz(licaoId, etapa, perguntas) {
  const rotulo = ROTULOS[etapa] || { titulo: 'Quiz', sub: '' };
  const placar = h('span', { class: 'chip', 'aria-live': 'polite' }, `0 de ${perguntas.length} certas`);
  let respondidas = 0;
  let acertos = 0;

  const blocos = perguntas.map((q, i) => {
    const exp = h('p', { class: 'quiz__exp', hidden: true });
    const ops = q.opcoes.map((texto, j) =>
      h(
        'button',
        {
          type: 'button',
          class: 'quiz__op',
          onclick: () => responder(j),
        },
        h('span', { class: 'letra' }, LETRAS[j]),
        h('span', {}, texto),
      ),
    );

    function responder(j) {
      ops.forEach((b, k) => {
        b.disabled = true;
        if (k === q.correta) b.dataset.estado = 'certa';
        else if (k === j) b.dataset.estado = 'errada';
      });
      const certo = j === q.correta;
      respondidas += 1;
      if (certo) acertos += 1;
      exp.hidden = false;
      exp.textContent = `${certo ? 'Isso. ' : `Não é essa. A certa é a ${LETRAS[q.correta]}. `}${q.explicacao || ''}`;
      placar.textContent = `${acertos} de ${perguntas.length} certas`;
      placar.className = `chip ${respondidas === perguntas.length ? (acertos === perguntas.length ? 'chip--ok' : 'chip--warn') : ''}`;
      if (respondidas === perguntas.length) registrarQuiz(licaoId, etapa, acertos, perguntas.length);
    }

    return h(
      'div',
      { class: 'quiz__q' },
      h('fieldset', {}, h('legend', {}, `${i + 1}. ${q.pergunta}`), h('div', { class: 'quiz__ops' }, ops)),
      exp,
    );
  });

  return h(
    'section',
    { class: 'quiz', 'data-etapa': etapa, 'aria-label': rotulo.titulo },
    h('div', { class: 'quiz__cab' }, h('div', {}, h('strong', {}, rotulo.titulo), h('div', { class: 'muted', style: { fontSize: '0.85rem' } }, rotulo.sub)), placar),
    blocos,
  );
}

export function validarQuiz(dados) {
  const erros = [];
  if (!dados || !Array.isArray(dados.perguntas)) return ['sem lista de perguntas'];
  const contagem = { pre: 0, check: 0, pos: 0 };
  dados.perguntas.forEach((q, i) => {
    if (!(q.etapa in contagem)) erros.push(`pergunta ${i + 1}: etapa inválida "${q.etapa}"`);
    else contagem[q.etapa] += 1;
    if (!q.pergunta) erros.push(`pergunta ${i + 1}: sem enunciado`);
    if (!Array.isArray(q.opcoes) || q.opcoes.length < 2) erros.push(`pergunta ${i + 1}: menos de 2 opções`);
    else if (!Number.isInteger(q.correta) || q.correta < 0 || q.correta >= q.opcoes.length) erros.push(`pergunta ${i + 1}: índice de resposta correta fora das opções`);
    if (!q.explicacao) erros.push(`pergunta ${i + 1}: sem explicação`);
  });
  for (const [etapa, n] of Object.entries(contagem)) if (n !== 2) erros.push(`etapa ${etapa}: esperava 2 perguntas, tem ${n}`);
  return erros;
}
