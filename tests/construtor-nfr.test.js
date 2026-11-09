import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarEars, avaliar, pronto, paraMarkdown, palavrasVagas, CATEGORIAS } from '../site/js/logic/construtor-nfr.js';

test('monta frase EARS de evento', () => {
  const f = montarEars({ padrao: 'evento', gatilho: 'duas requisições pedirem a mesma vaga', sistema: 'serviço de agenda', resposta: 'confirmar exatamente 1.' });
  assert.equal(f, 'QUANDO duas requisições pedirem a mesma vaga, o serviço de agenda DEVE confirmar exatamente 1.');
});

test('monta frase SE...ENTÃO e ENQUANTO', () => {
  assert.match(montarEars({ padrao: 'indesejado', gatilho: 'o e-mail cair', sistema: 'x', resposta: 'y' }), /^SE o e-mail cair, ENTÃO o x DEVE y\.$/);
  assert.match(montarEars({ padrao: 'estado', condicao: 'houver 1.000 vagas', sistema: 'x', resposta: 'y' }), /^ENQUANTO houver 1\.000 vagas/);
});

test('sem número é desejo, sem sensor é promessa', () => {
  const avisos = avaliar({ padrao: 'ubiquo', sistema: 'api', resposta: 'ser rápida', sensor: '' });
  const tipos = avisos.map((a) => a.tipo);
  assert.ok(tipos.includes('desejo'));
  assert.ok(tipos.includes('promessa'));
  assert.ok(tipos.includes('vago'));
});

test('padrão QUANDO exige gatilho', () => {
  const avisos = avaliar({ padrao: 'evento', sistema: 'api', resposta: 'p95 < 50 ms', sensor: 'teste de carga' });
  assert.ok(avisos.some((a) => a.campo === 'gatilho'));
});

test('todos os exemplos das categorias passam na avaliação', () => {
  for (const [id, cat] of Object.entries(CATEGORIAS)) {
    const nfr = { categoria: id, padrao: cat.padrao, ...cat.exemplo, sensor: cat.sensor, onde: cat.onde };
    assert.equal(pronto(nfr), true, `categoria ${id}: ${JSON.stringify(avaliar(nfr))}`);
  }
});

test('palavrasVagas encontra palavra inteira, não pedaço', () => {
  assert.deepEqual(palavrasVagas('precisa ser rápido'), ['rápido']);
  assert.deepEqual(palavrasVagas('inseguro demais'), []);
});

test('markdown traz EARS, sensor e onde vive', () => {
  const cat = CATEGORIAS.confiabilidade;
  const md = paraMarkdown({ categoria: 'confiabilidade', padrao: cat.padrao, ...cat.exemplo, sensor: cat.sensor, onde: ['spec', 'ci'] });
  assert.match(md, /### NFR · Confiabilidade/);
  assert.match(md, /QUANDO duas requisições/);
  assert.match(md, /\*\*Sensor:\*\* Teste de concorrência/);
  assert.match(md, /- CI/);
});
