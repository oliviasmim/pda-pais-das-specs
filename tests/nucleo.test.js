import { test } from 'node:test';
import assert from 'node:assert/strict';
import { licoes, aulas, cartas, semanas, vizinhas, aulaDaLicao, licaoPorId } from '../site/content/curriculo.js';
import { validarQuiz } from '../site/js/quiz.js';

const perguntaValida = (etapa) => ({ etapa, pergunta: 'p?', opcoes: ['a', 'b'], correta: 1, explicacao: 'porque sim' });

test('toda lição pertence a exatamente uma aula', () => {
  for (const l of licoes) {
    const donas = aulas.filter((a) => a.licoes.includes(l.id));
    assert.equal(donas.length, 1, `${l.id} está em ${donas.length} aulas`);
  }
});

test('lições são numeradas em sequência a partir de 1', () => {
  assert.deepEqual(licoes.map((l) => l.numero), licoes.map((_, i) => i + 1));
});

test('o baralho tem as seis cartas pedidas pela facilitadora', () => {
  assert.deepEqual(cartas.map((c) => c.id), ['rastro', 'contraprova', 'par', 'contrato', 'navalha', 'carta-rainha']);
  for (const c of cartas) assert.match(c.pergunta, /[?.]$/, `${c.id} precisa terminar como frase completa`);
});

test('a semana 10 é a única marcada como "agora"', () => {
  assert.deepEqual(semanas.filter((s) => s.revisao === 'agora').map((s) => s.n), [10]);
});

test('vizinhas devolve anterior e próxima, e nulo nas pontas', () => {
  assert.equal(vizinhas(licoes[0].id).anterior, null);
  assert.equal(vizinhas(licoes[0].id).proxima.id, licoes[1].id);
  assert.equal(vizinhas(licoes.at(-1).id).proxima, null);
  assert.deepEqual(vizinhas('nao-existe'), { anterior: null, proxima: null });
});

test('aulaDaLicao e licaoPorId lidam com id inexistente', () => {
  assert.equal(aulaDaLicao('nao-existe'), null);
  assert.equal(licaoPorId('nao-existe'), null);
  assert.equal(aulaDaLicao('julgamento').id, 'aula-2');
});

test('validarQuiz aceita 2 pre, 2 check e 2 pos', () => {
  const quiz = { perguntas: ['pre', 'pre', 'check', 'check', 'pos', 'pos'].map(perguntaValida) };
  assert.deepEqual(validarQuiz(quiz), []);
});

test('validarQuiz aponta resposta correta fora das opções e etapa faltando', () => {
  const quiz = { perguntas: ['pre', 'pre', 'check', 'check', 'pos'].map(perguntaValida) };
  quiz.perguntas[0].correta = 5;
  const erros = validarQuiz(quiz);
  assert.ok(erros.some((e) => e.includes('fora das opções')));
  assert.ok(erros.some((e) => e.includes('etapa pos')));
});

test('validarQuiz rejeita estrutura sem perguntas', () => {
  assert.deepEqual(validarQuiz({}), ['sem lista de perguntas']);
});
