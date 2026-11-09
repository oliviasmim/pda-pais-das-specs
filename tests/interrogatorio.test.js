import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LINHAS,
  ACHADOS,
  CLASSES,
  achadoDaLinha,
  avaliarResposta,
  responder,
  placar,
  relatorio,
} from '../site/js/logic/interrogatorio.js';

test('o diff tem entre 40 e 60 linhas', () => {
  assert.ok(LINHAS.length >= 40 && LINHAS.length <= 60, `tem ${LINHAS.length}`);
});

test('cada achado aponta para linhas que existem e não estão vazias', () => {
  for (const a of ACHADOS) {
    for (const n of a.linhas) {
      assert.ok(n >= 1 && n <= LINHAS.length, `${a.id}: linha ${n} fora do diff`);
      assert.notEqual(LINHAS[n - 1].trim(), '', `${a.id}: linha ${n} vazia`);
    }
  }
});

test('nenhuma linha pertence a dois achados', () => {
  const vistas = new Map();
  for (const a of ACHADOS) {
    for (const n of a.linhas) {
      assert.ok(!vistas.has(n), `linha ${n} em ${vistas.get(n)} e ${a.id}`);
      vistas.set(n, a.id);
    }
  }
});

test('as linhas marcadas contêm o trecho que o achado descreve', () => {
  assert.match(LINHAS[achadoDaLinha(14).linhas[1] - 1], /agendamentosNoMes >= 3/);
  assert.match(LINHAS[achadoDaLinha(2).linhas[0] - 1], /moment/);
  assert.match(LINHAS[achadoDaLinha(41).linhas[0] - 1], /console\.log/);
  assert.match(LINHAS[achadoDaLinha(44).linhas[0] - 1], /status\(200\)/);
  assert.match(LINHAS[achadoDaLinha(38).linhas[0] - 1], /router\.post\('\/agendamentos'/);
});

test('há achados das três classes e cada um tem contraprova completa', () => {
  const classes = new Set(ACHADOS.map((a) => a.classe));
  assert.deepEqual([...classes].sort(), Object.keys(CLASSES).sort());
  for (const a of ACHADOS) {
    assert.ok(a.contraprova.entrada && a.contraprova.esperado && a.contraprova.obtido, a.id);
    assert.ok(a.spec, a.id);
  }
});

test('não usa o cenário do Encontro 2 da OIP', () => {
  const texto = JSON.stringify({ LINHAS, ACHADOS }).toLowerCase();
  assert.ok(!texto.includes('saldo'));
  assert.ok(!texto.includes('usuarios'));
  assert.ok(!texto.includes('+ 10'));
});

test('achadoDaLinha devolve null para linha sem marcação', () => {
  assert.equal(achadoDaLinha(5), null);
  assert.equal(achadoDaLinha(999), null);
});

test('avaliarResposta: certo vale 1, aceitável vale 0,5, errado vale 0', () => {
  assert.deepEqual(avaliarResposta('limite', 'inventado'), { nota: 1, correta: 'inventado' });
  assert.deepEqual(avaliarResposta('moment', 'assumido'), { nota: 0.5, correta: 'inventado' });
  assert.deepEqual(avaliarResposta('rota', 'inventado'), { nota: 0, correta: 'pedido' });
  assert.deepEqual(avaliarResposta('nao-existe', 'pedido'), { nota: 0, correta: null });
});

test('responder ignora classe inválida e não muta o objeto original', () => {
  const r0 = {};
  const r1 = responder(r0, 'limite', 'inventado');
  assert.deepEqual(r0, {});
  assert.deepEqual(r1, { limite: 'inventado' });
  assert.deepEqual(responder(r1, 'limite', 'talvez'), r1);
});

test('placar soma notas e marca completo só com tudo respondido', () => {
  let r = {};
  for (const a of ACHADOS) r = responder(r, a.id, a.classe);
  const p = placar(r);
  assert.equal(p.pontos, ACHADOS.length);
  assert.equal(p.completo, true);
  assert.equal(p.porClasse.inventado.acertos, p.porClasse.inventado.total);

  const parcial = placar({ limite: 'inventado', moment: 'assumido', rota: 'assumido' });
  assert.equal(parcial.pontos, 1.5);
  assert.equal(parcial.respondidas, 3);
  assert.equal(parcial.completo, false);
});

test('relatorio gera uma tabela com todos os achados', () => {
  const texto = relatorio({ limite: 'inventado' });
  assert.match(texto, /Placar: 1\/13/);
  assert.equal(texto.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Linhas')).length, ACHADOS.length);
});
