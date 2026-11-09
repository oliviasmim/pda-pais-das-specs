import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ARQUIVOS,
  ALERTAS,
  CAMADAS,
  estatisticas,
  totalLinhas,
  extrairAssinaturas,
  arquivosDaCamada,
  pontuacaoMaxima,
  conferir,
  resumo,
  linhaEmDestaque,
} from '../site/js/logic/diff-camadas.js';

test('o diff é grande: entre 250 e 400 linhas alteradas em vários arquivos', () => {
  const total = totalLinhas();
  assert.ok(total >= 250 && total <= 400, `total ${total}`);
  assert.ok(ARQUIVOS.length >= 8);
});

test('estatisticas conta adições e remoções por arquivo', () => {
  const pkg = estatisticas().find((a) => a.caminho === 'package.json');
  assert.deepEqual([pkg.adicoes, pkg.remocoes], [2, 1]);
  const lock = estatisticas().find((a) => a.caminho === 'package-lock.json');
  assert.ok(lock.adicoes + lock.remocoes > 70);
});

test('a camada 2 mostra dependências, classes, rotas, status e constantes, sem testes nem lockfile', () => {
  const textos = extrairAssinaturas().map((s) => s.texto);
  assert.ok(textos.some((t) => t.includes("from 'lodash'")));
  assert.ok(textos.some((t) => t.includes('class AbstractRepositoryAdapter')));
  assert.ok(textos.some((t) => t.includes("router.post('/agendamentos'")));
  assert.ok(textos.some((t) => t.startsWith('const ANTECEDENCIA_MINIMA_HORAS')));
  assert.ok(textos.some((t) => t.includes('res.status(500)')));
  assert.ok(textos.some((t) => t.includes('"lodash"')));
  assert.ok(!textos.some((t) => t.includes('fonteFalsa')));
  assert.ok(!textos.some((t) => t.includes('integrity')));
  assert.ok(!extrairAssinaturas().some((s) => s.caminho.startsWith('tests/')));
});

test('a camada 2 revela a ausência do 409', () => {
  const status = extrairAssinaturas()
    .map((s) => s.texto.match(/res\.status\((\d{3})\)/))
    .filter(Boolean)
    .map((m) => m[1]);
  assert.ok(status.includes('422'));
  assert.ok(!status.includes('409'));
});

test('camadas 3 e 4 separam testes e código', () => {
  assert.ok(arquivosDaCamada(3).every((a) => a.caminho.startsWith('tests/')));
  assert.ok(arquivosDaCamada(4).every((a) => a.caminho.startsWith('src/')));
  assert.deepEqual(arquivosDaCamada(1), []);
});

test('todo alerta tem evidência em cada camada em que é detectável e o destaque existe no diff', () => {
  const tudo = ARQUIVOS.flatMap((a) => [a.caminho, ...a.linhas.map((l) => l.c)]).join('\n');
  for (const a of ALERTAS) {
    for (const c of a.camadas) assert.ok(a.evidencias[c], `${a.id} sem evidência na camada ${c}`);
    for (const d of a.destaque) assert.ok(tudo.includes(d), `${a.id}: destaque "${d}" não está no diff`);
  }
  assert.equal(CAMADAS.length, 4);
});

test('a rosa pintada é uma asserção de 409 trocada em tests/aceite', () => {
  const t1 = ARQUIVOS.find((a) => a.caminho === 'tests/aceite/t1.test.js');
  assert.ok(t1.linhas.some((l) => l.t === '-' && l.c.includes('409')));
  assert.ok(t1.linhas.some((l) => l.t === '+' && l.c.includes('201')));
});

test('conferir: achar cedo vale mais, falso positivo custa 1', () => {
  const c1 = conferir(1, ['rosas', 'tartaruga']);
  assert.deepEqual(c1.novos, ['rosas']);
  assert.deepEqual(c1.falsos, ['tartaruga']);
  assert.equal(c1.pontos, 4 - 1);

  const c4 = conferir(4, ['generico', 'rosas'], { rosas: 1 });
  assert.deepEqual(c4.novos, ['generico']);
  assert.deepEqual(c4.repetidos, ['rosas']);
  assert.equal(c4.pontos, 1);
});

test('resumo soma por camada, desconta falsos e lista perdidos', () => {
  const r = resumo({ rosas: 1, dependencia: 1, regra: 2, tartaruga: 3 }, 2);
  assert.deepEqual(r.porCamada, [2, 1, 1, 0]);
  assert.equal(r.pontos, 4 + 4 + 3 + 2 - 2);
  assert.equal(r.achadosAte2, 3);
  assert.deepEqual(r.perdidos.sort(), ['abstracao', 'falta409', 'generico']);
  assert.equal(resumo({}, 5).pontos, 0);
});

test('pontuação máxima é achar tudo na primeira camada possível', () => {
  assert.equal(pontuacaoMaxima(), 4 + 4 + 4 + 3 + 3 + 3 + 2);
});

test('linhaEmDestaque só acende para alertas já achados', () => {
  assert.equal(linhaEmDestaque("const _ = require('lodash');", ['dependencia']), true);
  assert.equal(linhaEmDestaque("const _ = require('lodash');", ['rosas']), false);
});
