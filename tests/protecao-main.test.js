import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, CENARIOS, avaliar, placar, diagnostico, configDe, cenario } from '../site/js/logic/protecao-main.js';

test('como o agente gerou: todo defeito entra na main', () => {
  const p = placar(PRESETS.comoGerado.config);
  assert.equal(p.defeitosQueEntraram, 3);
  assert.equal(p.ok, false);
  assert.equal(diagnostico(PRESETS.comoGerado.config).length, 4);
});

test('YAML perfeito sem regra no GitHub ainda deixa o merge sair com check vermelho', () => {
  const r = avaliar(PRESETS.soYaml.config, cenario('pr-teste'));
  assert.equal(r.check, 'vermelho');
  assert.equal(r.merge, 'liberado');
  assert.equal(r.entrou, true);
  assert.match(r.motivo, /opinião/);
});

test('tudo ligado bloqueia os três defeitos e libera o PR limpo', () => {
  const p = placar(PRESETS.completo.config);
  assert.equal(p.ok, true);
  assert.equal(p.linhas.find((l) => l.cenario.id === 'pr-limpo').merge, 'liberado');
  assert.deepEqual(diagnostico(PRESETS.completo.config), []);
});

test('check obrigatório sem rodar em pull_request trava o merge, inclusive o limpo', () => {
  const cfg = configDe(['checkObrigatorio', 'semEngolirFalha', 'exigirPR']);
  const p = placar(cfg);
  assert.equal(p.bloqueioIndevido, 1);
  assert.equal(p.ok, false);
});

test('"|| true" faz o check ficar verde com defeito, mesmo obrigatório', () => {
  const cfg = configDe(['rodaEmPR', 'checkObrigatorio', 'exigirPR']);
  const r = avaliar(cfg, cenario('pr-teste'));
  assert.equal(r.check, 'verde');
  assert.equal(r.entrou, true);
});

test('sem exigir PR, o push direto entra mesmo com o resto ligado', () => {
  const cfg = configDe(['rodaEmPR', 'checkObrigatorio', 'semEngolirFalha']);
  const r = avaliar(cfg, cenario('push-direto'));
  assert.equal(r.merge, 'liberado');
  assert.equal(r.entrou, true);
  assert.equal(CENARIOS.length, 4);
});
