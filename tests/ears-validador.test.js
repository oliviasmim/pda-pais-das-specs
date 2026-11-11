import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analisarEars, EXERCICIOS, COM_DEFEITO, PADROES_EARS } from '../site/js/logic/ears-validador.js';

test('cada exercício é classificado no padrão declarado e sem avisos', () => {
  for (const ex of EXERCICIOS) {
    const r = analisarEars(ex.frase);
    assert.equal(r.padrao, ex.padrao, ex.frase);
    assert.deepEqual(r.avisos, [], ex.frase);
  }
});

test('os cinco padrões aparecem nos exercícios', () => {
  const usados = new Set(EXERCICIOS.map((e) => e.padrao));
  for (const p of Object.keys(PADROES_EARS)) assert.ok(usados.has(p), p);
});

test('separa gatilho, sistema e resposta', () => {
  const r = analisarEars('QUANDO a agenda abrir às 9h de segunda, com até 150 tentativas, o serviço de agenda DEVE manter p95 abaixo de 300 ms.');
  assert.equal(r.padrao, 'evento');
  assert.equal(r.partes.gatilho, 'a agenda abrir às 9h de segunda, com até 150 tentativas');
  assert.equal(r.partes.sistema, 'serviço de agenda');
  assert.equal(r.partes.resposta, 'manter p95 abaixo de 300 ms');
});

test('SE sem ENTÃO é apontado', () => {
  const r = analisarEars('SE o e-mail for inválido, o serviço DEVE responder 400.');
  assert.equal(r.padrao, 'indesejado');
  assert.ok(r.avisos.some((a) => a.campo === 'entao'));
});

test('sem DEVE, sem vírgula, dois DEVE e vago são apontados', () => {
  const por = (nome) => COM_DEFEITO.find((d) => d.nome === nome);
  assert.ok(analisarEars(por('Sem DEVE').frase).avisos.some((a) => a.campo === 'deve'));
  assert.ok(analisarEars(por('Sem vírgula').frase).avisos.some((a) => a.campo === 'virgula'));
  assert.ok(analisarEars(por('Duas respostas').frase).avisos.some((a) => a.tipo === 'composto'));
  const sem = analisarEars(por('Sem número').frase, { exigeNumero: true });
  assert.ok(sem.avisos.some((a) => a.tipo === 'vago'));
  assert.ok(sem.avisos.some((a) => a.campo === 'sistema'));
});

test('NFR sem número é desejo, mas requisito funcional sem número passa', () => {
  const frase = 'O serviço de agenda DEVE listar as vagas em ordem crescente de início.';
  assert.ok(analisarEars(frase, { exigeNumero: true }).avisos.some((a) => a.tipo === 'desejo'));
  assert.equal(analisarEars(frase).ok, true);
});

test('frase vazia', () => {
  assert.equal(analisarEars('   ').ok, false);
});
