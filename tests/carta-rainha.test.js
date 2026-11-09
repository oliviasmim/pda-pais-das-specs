import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ERROS,
  TIPOS_SENSOR,
  erroPorId,
  sugestao,
  termosVagos,
  avaliarCarta,
  montarCarta,
} from '../site/js/logic/carta-rainha.js';

test('o catálogo tem 8 erros, cada um com regra e sensor de tipo conhecido', () => {
  assert.equal(ERROS.length, 8);
  const ids = new Set();
  for (const e of ERROS) {
    assert.ok(!ids.has(e.id), `id repetido ${e.id}`);
    ids.add(e.id);
    assert.ok(e.regra && e.sensor.texto && e.sensor.onde, e.id);
    assert.ok(TIPOS_SENSOR[e.sensor.tipo], `${e.id}: tipo ${e.sensor.tipo}`);
  }
});

test('o catálogo usa os quatro tipos de sensor', () => {
  assert.deepEqual(new Set(ERROS.map((e) => e.sensor.tipo)), new Set(Object.keys(TIPOS_SENSOR)));
});

test('nenhuma sugestão do próprio catálogo é vaga', () => {
  for (const e of ERROS) {
    assert.deepEqual(termosVagos(e.regra), [], `regra de ${e.id}`);
    assert.deepEqual(termosVagos(e.sensor.texto), [], `sensor de ${e.id}`);
    assert.deepEqual(avaliarCarta({ erroId: e.id, evidencia: 'src/rotas/agendamentos.js:31', regra: e.regra, sensor: e.sensor.texto }), [], e.id);
  }
});

test('sugestao devolve o par guia + sensor, ou null para erro desconhecido', () => {
  const s = sugestao('mudou-teste');
  assert.equal(s.tipo, 'hook');
  assert.match(s.sensor, /tool_input\.file_path/);
  assert.match(s.sensor, /código 2/);
  assert.equal(sugestao('nada'), null);
  assert.equal(erroPorId('nada'), null);
});

test('termosVagos encontra jargão sem critério', () => {
  assert.deepEqual(termosVagos('Siga boas práticas e trate o erro adequadamente'), ['boas práticas', 'adequad']);
  assert.deepEqual(termosVagos('Tratar o erro com cuidado'), ['tratar o erro', 'cuidado']);
  assert.deepEqual(termosVagos(''), []);
});

test('avaliarCarta cobra evidência, regra, sensor e precisão', () => {
  const vazia = avaliarCarta({ erroId: '' });
  assert.deepEqual(vazia.map((a) => a.campo).sort(), ['erro', 'evidencia', 'regra', 'sensor']);
  const vaga = avaliarCarta({ erroId: 'erro-generico', evidencia: 'x', regra: 'Trate os erros corretamente.', sensor: 'Revisar com atenção.' });
  assert.ok(vaga.some((a) => a.campo === 'regra' && /vago/.test(a.msg)));
  assert.ok(vaga.some((a) => a.campo === 'sensor' && /vago/.test(a.msg)));
  const longa = avaliarCarta({ erroId: 'abstracao', evidencia: 'x', regra: 'a'.repeat(301), sensor: 'npm test' });
  assert.ok(longa.some((a) => /Regra longa/.test(a.msg)));
});

test('montarCarta separa guia e sensor e mostra o destino de cada um', () => {
  const s = sugestao('inventou-regra');
  const md = montarCarta({ erroId: 'inventou-regra', evidencia: 'src/rotas/agendamentos.js:31 · antecedência de 2h', regra: s.regra, sensor: s.sensor, tipo: s.tipo, onde: s.onde });
  assert.match(md, /Inventou regra de negócio/);
  assert.match(md, /### Guia \(feedforward\) · AGENTS\.md/);
  assert.match(md, /### Sensor \(feedback\) · Agente de review · \.claude\/agents\/rastreador-de-spec\.md/);
  assert.match(md, /agendamentos\.js:31/);
});

test('montarCarta marca o que falta em vez de inventar', () => {
  const md = montarCarta({ erroId: 'x' });
  assert.equal((md.match(/\(faltando\)/g) || []).length, 3);
});
