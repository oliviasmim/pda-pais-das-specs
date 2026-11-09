import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarCarta, paraMarkdown, VAZIA } from '../site/js/logic/carta-destino.js';

const BOA = {
  feature: 'O jovem agenda uma mentoria numa vaga livre.',
  ok: { entrada: 'POST /agendamentos {"vagaId":1,"jovemEmail":"ana@pda.org"}', resposta: '201 {"id":1,"status":"confirmado"}' },
  falha: { entrada: 'POST /agendamentos com a mesma vaga', status: '409', mensagem: 'Vaga indisponível' },
  nfr: { texto: 'QUANDO duas requisições pedirem a mesma vaga, confirmar exatamente 1', sensor: 'teste de concorrência com Promise.all na CI' },
  foraEscopo: 'envio de e-mail; limite por jovem',
};

test('carta vazia reprova com erros em todos os campos obrigatórios', () => {
  const r = validarCarta(VAZIA);
  assert.equal(r.aprovada, false);
  const campos = new Set(r.erros.map((e) => e.campo));
  for (const c of ['feature', 'ok.entrada', 'ok.resposta', 'falha.entrada', 'falha.status', 'falha.mensagem', 'nfr.texto', 'nfr.sensor']) {
    assert.ok(campos.has(c), c);
  }
});

test('carta boa passa no Teste do Gato', () => {
  const r = validarCarta(BOA);
  assert.deepEqual(r.erros, []);
  assert.equal(r.aprovada, true);
});

test('"funcionar" sem status é rejeitado', () => {
  const r = validarCarta({ ...BOA, ok: { ...BOA.ok, resposta: 'deve funcionar' } });
  assert.ok(r.erros.some((e) => e.campo === 'ok.resposta' && /funcionar/.test(e.msg)));
});

test('"tratar o erro" e status não numérico são rejeitados', () => {
  const r = validarCarta({ ...BOA, falha: { entrada: 'x', status: 'erro', mensagem: 'tratar o erro' } });
  assert.ok(r.erros.some((e) => e.campo === 'falha.status'));
  assert.ok(r.erros.some((e) => e.campo === 'falha.mensagem'));
});

test('"rápido" sem número é desejo; "testar" não é sensor', () => {
  const r = validarCarta({ ...BOA, nfr: { texto: 'precisa ser rápido', sensor: 'testar' } });
  assert.ok(r.erros.some((e) => e.campo === 'nfr.texto' && /rápido/.test(e.msg)));
  assert.ok(r.erros.some((e) => e.campo === 'nfr.sensor'));
});

test('sem fora do escopo vira dica, não erro', () => {
  const r = validarCarta({ ...BOA, foraEscopo: '' });
  assert.equal(r.aprovada, true);
  assert.equal(r.dicas.length, 1);
});

test('markdown tem tabela de critérios e fora do escopo em lista', () => {
  const md = paraMarkdown(BOA);
  assert.match(md, /\| Deve falhar \| POST \/agendamentos com a mesma vaga \| 409 \{"erro":"Vaga indisponível"\} \|/);
  assert.match(md, /- envio de e-mail\n- limite por jovem/);
  assert.match(md, /pergunte antes de inventar/);
});
