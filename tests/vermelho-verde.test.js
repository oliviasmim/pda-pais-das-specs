import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LOGS, MOTIVOS, julgarLog, conferir, log } from '../site/js/logic/vermelho-verde.js';

test('cada log de exemplo tem o veredito esperado', () => {
  const esperado = {
    honesto: [true, 'ok'],
    junto: [false, 'mesmo-commit'],
    ordem: [false, 'codigo-antes'],
    'verde-de-cara': [false, 'nunca-vermelho'],
  };
  for (const l of LOGS) {
    const r = julgarLog(l.commits);
    assert.deepEqual([r.valido, r.motivo], esperado[l.id], l.id);
  }
});

test('log sem commit de teste não prova ordem nenhuma', () => {
  const r = julgarLog([{ hash: 'x', msg: 'feat', arquivos: ['src/a.js'], resultado: 'passa' }]);
  assert.deepEqual(r, { valido: false, motivo: 'sem-teste' });
  assert.ok(MOTIVOS['sem-teste']);
});

test('conferir exige veredito e motivo certos quando o log é inválido', () => {
  assert.equal(conferir('junto', 'mesmo-commit').acertou, true);
  assert.equal(conferir('junto', 'codigo-antes').acertou, false);
  assert.equal(conferir('honesto', 'ok').acertou, true);
  assert.equal(conferir('honesto', 'sem-teste').acertou, false);
  assert.equal(log('ordem').commits.length, 2);
});
