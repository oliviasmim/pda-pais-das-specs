import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRS,
  SENSORES,
  auditarYaml,
  formatarTempo,
  gerarWorkflow,
  ordemFailFast,
  ordemPadrao,
  rodarEsteira,
  rodarFila,
} from '../site/js/logic/esteira.js';

const pr = (n) => PRS.find((p) => p.numero === n);

test('ordem padrão liga os 5 sensores da S8 e deixa os extras desligados', () => {
  assert.deepEqual(ordemPadrao(), ['lint', 'typecheck', 'build', 'testes', 'deps']);
  assert.equal(SENSORES.filter((s) => s.extra).length, 2);
});

test('fail fast: o primeiro sensor que pega para a esteira e pula o resto', () => {
  const r = rodarEsteira(ordemPadrao(), pr(12));
  assert.equal(r.pegoPor, 'lint');
  assert.equal(r.tempo, 20);
  assert.deepEqual(r.passos.map((p) => p.resultado), ['falhou', 'pulado', 'pulado', 'pulado', 'pulado']);
});

test('sem lint, o erro de sintaxe ainda é pego mais tarde e custa mais tempo', () => {
  const r = rodarEsteira(['typecheck', 'build', 'testes', 'deps'], pr(12));
  assert.equal(r.pegoPor, 'typecheck');
  assert.equal(r.tempo, 30);
});

test('cada defeito especializado só é pego pelo seu sensor', () => {
  const sem = (id) => ordemPadrao().filter((s) => s !== id);
  assert.equal(rodarEsteira(sem('typecheck'), pr(13)).escapou, true);
  assert.equal(rodarEsteira(sem('build'), pr(14)).escapou, true);
  assert.equal(rodarEsteira(sem('testes'), pr(15)).escapou, true);
  assert.equal(rodarEsteira(sem('deps'), pr(16)).escapou, true);
});

test('rosa pintada passa nos 5 sensores e só a guarda pega', () => {
  assert.equal(rodarEsteira(ordemPadrao(), pr(17)).escapou, true);
  assert.equal(rodarEsteira([...ordemPadrao(), 'guarda'], pr(17)).pegoPor, 'guarda');
});

test('NFR sem sensor é promessa: só o teste de NFR pega o O(n²)', () => {
  assert.equal(rodarEsteira(ordemPadrao(), pr(19)).escapou, true);
  assert.equal(rodarEsteira([...ordemPadrao(), 'nfr'], pr(19)).pegoPor, 'nfr');
});

test('com tudo ligado, só escapam os defeitos que nenhum sensor pega', () => {
  const todos = SENSORES.map((s) => s.id);
  const { resumo } = rodarFila(todos);
  assert.deepEqual(resumo.escaparam.map((p) => p.numero).sort(), [18, 21]);
  assert.equal(resumo.precisamDeReview.length, 2);
  assert.equal(resumo.escaparamPorSensorDesligado.length, 0);
});

test('PR limpo nunca é bloqueado', () => {
  const todos = SENSORES.map((s) => s.id);
  const r = rodarEsteira(todos, pr(20));
  assert.equal(r.bloqueado, false);
  assert.equal(r.escapou, false);
});

test('ordem fail fast coloca os sensores baratos primeiro', () => {
  assert.deepEqual(ordemFailFast(ordemPadrao()), ['deps', 'lint', 'typecheck', 'build', 'testes']);
  const caro = rodarFila(['testes', 'build', 'typecheck', 'lint', 'deps']).resumo.tempoTotal;
  const barato = rodarFila(ordemFailFast(ordemPadrao())).resumo.tempoTotal;
  assert.ok(barato < caro);
});

test('workflow gerado tem os passos ligados, na ordem, e passa na auditoria', () => {
  const yaml = gerarWorkflow(['lint', 'testes', 'deps']);
  assert.match(yaml, /actions\/checkout@v6/);
  assert.match(yaml, /npm ci/);
  assert.ok(yaml.indexOf('npm run lint') < yaml.indexOf('npm test'));
  assert.ok(!yaml.includes('npm run smoke'));
  assert.deepEqual(auditarYaml(yaml), []);
});

test('auditoria acha os truques do YAML ruim', () => {
  const ruim = `on:\n  push:\n    branches: [main]\njobs:\n  ci:\n    steps:\n      - run: npm install\n      - run: npm test || true\n        continue-on-error: true\n`;
  const achados = auditarYaml(ruim);
  assert.equal(achados.length, 5);
});

test('formatarTempo', () => {
  assert.equal(formatarTempo(45), '45s');
  assert.equal(formatarTempo(120), '2min');
  assert.equal(formatarTempo(135), '2min 15s');
});
