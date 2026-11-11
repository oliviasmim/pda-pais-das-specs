import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TESTES,
  IMPLEMENTACOES,
  QUEBRAS,
  rodarTeste,
  cobertura,
  mutacao,
  veredito,
} from '../site/js/logic/teste-nao-prova.js';

test('todo teste passa contra o código correto', () => {
  for (const t of TESTES) assert.equal(rodarTeste(t.id, 'correta').passou, true, t.id);
});

test('o teste de mock passa com qualquer quebra e não executa nenhuma linha', () => {
  for (const q of QUEBRAS) assert.equal(rodarTeste('mock', q.id).passou, true, q.id);
  assert.equal(cobertura('mock').pct, 0);
  assert.equal(veredito('mock').tipo, 'nada');
});

test('o assert que sempre passa só percebe a função apagada', () => {
  const m = mutacao('tautologia');
  assert.deepEqual(m.mortos, ['apagada']);
  assert.equal(veredito('tautologia').tipo, 'parcial');
});

test('cobertura de 100% com assert fraco deixa quebras sobreviverem', () => {
  assert.equal(cobertura('truthy').pct, 100);
  const m = mutacao('truthy');
  assert.deepEqual(m.sobreviventes.sort(), ['mensagem', 'nao-reserva', 'sem-409', 'status-200']);
});

test('o teste que confere comportamento pega todas as quebras', () => {
  const v = veredito('bom');
  assert.equal(v.tipo, 'prova');
  assert.equal(v.mutacao.escore, 100);
  assert.equal(v.cobertura.pct, 100);
});

test('mensagens e status seguem o domínio da agenda', () => {
  const correta = IMPLEMENTACOES.find((i) => i.correta);
  const ocupada = correta.fn({ vagas: { 2: { id: 2, livre: false } } }, { vagaId: 2, jovemEmail: 'a@b.c' });
  assert.equal(ocupada.status, 409);
  assert.equal(ocupada.corpo.erro, 'Vaga indisponível');
  const falta = correta.fn({ vagas: {} }, { vagaId: 9, jovemEmail: 'a@b.c' });
  assert.deepEqual(falta, { status: 404, corpo: { erro: 'Vaga não encontrada' } });
});
