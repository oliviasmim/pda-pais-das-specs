import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  novoTime, pontuar, ranking, lerPlacar, aplicarPlacar, paraCSV,
  novoCronometro, iniciar, pausar, zerar, restante, fase, formatarTempo, minutosRestantes, mudarDuracao, rodando,
} from '../site/js/logic/placar.js';

const MIN = 60 * 1000;
const LINHA = 'PLACAR {"versao":1,"casos":{"passaram":24,"total":26},"porTask":{},"tdd":{"T1":true,"T2":false,"T3":true},"rosas":["tests/aceite/t1.test.js"],"pontos":{"total":38}}';

test('time novo começa com zero pontos', () => {
  const time = novoTime('  Lagartas  ');
  assert.equal(time.nome, 'Lagartas');
  assert.equal(pontuar(time).total, 0);
  assert.equal(novoTime('').nome, 'Time sem nome');
});

test('pontuação segue a tabela do plano', () => {
  const time = {
    ...novoTime('Chapeleiros'),
    sensores: { lint: true, types: true, testes: true, deps: false, smoke: true },
    tdd: { T1: true, T2: true, T3: false },
    casos: 20,
    integracao: true,
    cartas: 2,
    rosas: 1,
    minutosRestantes: 7,
  };
  const { partes, total } = pontuar(time);
  assert.deepEqual(partes, { sensores: 40, tdd: 20, casos: 40, integracao: 15, cartas: 10, rosas: -30, tempo: 7 });
  assert.equal(total, 102);
});

test('valores inválidos ou negativos não geram pontos estranhos', () => {
  const time = { ...novoTime('X'), casos: 99, casosTotal: 26, cartas: -3, minutosRestantes: 'abc', rosas: 2.7 };
  const { partes } = pontuar(time);
  assert.equal(partes.casos, 52);
  assert.equal(partes.cartas, 0);
  assert.equal(partes.tempo, 0);
  assert.equal(partes.rosas, -60);
});

test('ranking: mais pontos primeiro, empate desempata por minutos restantes e depois nome', () => {
  const a = { ...novoTime('Beta'), integracao: true };
  const b = { ...novoTime('Alfa'), integracao: true };
  const c = { ...novoTime('Gama'), integracao: true };
  const d = { ...novoTime('Delta'), cartas: 1 };
  const lista = ranking([a, b, c, d]).map((l) => `${l.posicao}:${l.time.nome}`);
  assert.deepEqual(lista, ['1:Alfa', '2:Beta', '3:Gama', '4:Delta']);
  const rapido = { ...novoTime('Zeta'), integracao: false, cartas: 1, minutosRestantes: 10 };
  const lento = { ...novoTime('Eta'), integracao: false, cartas: 2, minutosRestantes: 5 };
  const comTempo = ranking([lento, rapido]).map((l) => `${l.time.nome}:${l.total}`);
  assert.deepEqual(comTempo, ['Zeta:15', 'Eta:15'], 'mesmo total: quem terminou antes fica na frente');
});

test('lerPlacar aceita a linha, a saída inteira ou só o JSON', () => {
  const esperado = { casos: 24, casosTotal: 26, tdd: { T1: true, T2: false, T3: true }, rosas: 1 };
  assert.deepEqual(lerPlacar(LINHA), { ok: true, dados: esperado });
  assert.deepEqual(lerPlacar(`Avaliador\n  total 38\n${LINHA}\n`), { ok: true, dados: esperado });
  assert.deepEqual(lerPlacar(LINHA.replace('PLACAR ', '')), { ok: true, dados: esperado });
});

test('lerPlacar recusa entradas quebradas com mensagem clara', () => {
  assert.equal(lerPlacar('').ok, false);
  assert.match(lerPlacar('PLACAR {"casos":').erro, /incompleta/);
  assert.match(lerPlacar('PLACAR {"x":1}').erro, /casos/);
  assert.match(lerPlacar('PLACAR {"casos":{"passaram":30,"total":26}}').erro, /não batem/);
});

test('aplicarPlacar preenche só o que o avaliador sabe', () => {
  const time = { ...novoTime('T'), integracao: true, cartas: 2, sensores: { lint: true } };
  const { dados } = lerPlacar(LINHA);
  const novo = aplicarPlacar(time, dados);
  assert.equal(novo.casos, 24);
  assert.equal(novo.rosas, 1);
  assert.deepEqual(novo.tdd, { T1: true, T2: false, T3: true });
  assert.equal(novo.integracao, true);
  assert.equal(novo.cartas, 2);
  assert.equal(time.casos, 0, 'não muda o time original');
});

test('CSV com ponto e vírgula, ranking e escape de aspas', () => {
  const times = [{ ...novoTime('Rainha; "de Copas"'), integracao: true }, novoTime('Gato')];
  const csv = paraCSV(times);
  const [cabecalho, primeira, segunda] = csv.trim().split('\n');
  assert.ok(cabecalho.startsWith('posicao;time;total;sensor_lint'));
  assert.ok(primeira.startsWith('1;"Rainha; ""de Copas""";15;'));
  assert.ok(segunda.startsWith('2;Gato;0;'));
});

test('cronômetro: iniciar, pausar, retomar e zerar', () => {
  let c = novoCronometro(40);
  assert.equal(fase(c, 0), 'pronto');
  c = iniciar(c, 1000);
  assert.equal(rodando(c), true);
  assert.equal(restante(c, 1000 + 10 * MIN), 30 * MIN);
  c = pausar(c, 1000 + 10 * MIN);
  assert.equal(restante(c, 999 * MIN), 30 * MIN, 'pausado não anda');
  c = iniciar(c, 50 * MIN);
  assert.equal(restante(c, 50 * MIN + 5 * MIN), 25 * MIN);
  c = zerar(c);
  assert.equal(restante(c, 0), 40 * MIN);
  assert.equal(rodando(c), false);
});

test('cronômetro: fases normal, alerta nos últimos 5 minutos e fim', () => {
  const c = iniciar(novoCronometro(40), 0);
  assert.equal(fase(c, 10 * MIN), 'normal');
  assert.equal(fase(c, 35 * MIN), 'alerta');
  assert.equal(fase(c, 40 * MIN), 'fim');
  assert.equal(iniciar(pausar(c, 41 * MIN), 42 * MIN).inicioEm, null, 'não reinicia depois do fim');
});

test('formatarTempo e minutos restantes', () => {
  assert.equal(formatarTempo(40 * MIN), '40:00');
  assert.equal(formatarTempo(65 * 1000 - 1), '01:05');
  assert.equal(formatarTempo(0), '00:00');
  assert.equal(formatarTempo(-500), '00:00');
  assert.equal(formatarTempo(75 * MIN), '1:15:00');
  const c = iniciar(novoCronometro(40), 0);
  assert.equal(minutosRestantes(c, 32 * MIN + 30 * 1000), 7);
  assert.equal(minutosRestantes(c, 50 * MIN), 0);
});

test('mudarDuracao limita entre 1 e 180 minutos', () => {
  assert.equal(mudarDuracao(novoCronometro(), 0).duracaoMs, 1 * MIN);
  assert.equal(mudarDuracao(novoCronometro(), 500).duracaoMs, 180 * MIN);
  assert.equal(novoCronometro(25).duracaoMs, 25 * MIN);
});
