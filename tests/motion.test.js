import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  iso,
  prisma,
  alturaTopo,
  caminhoTrilho,
  codificarMontagem,
  decodificarMontagem,
  estadoAte,
  trilhosAcesos,
  chaveTrilho,
  validarMotion,
  rastroMarkdown,
  montagemPadrao,
} from '../site/js/logic/motion.js';
import { maquinas } from '../site/content/maquinas.js';
import { motion as agente } from '../site/js/logic/motion-agente.js';
import { motion as subagent } from '../site/js/logic/motion-subagent.js';
import { motion as worktrees } from '../site/js/logic/motion-worktrees.js';
import { motion as ci } from '../site/js/logic/motion-ci.js';
import { motion as review } from '../site/js/logic/motion-review.js';
import { motion as requisito } from '../site/js/logic/motion-requisito.js';

const todas = [agente, subagent, worktrees, ci, review, requisito];
const rodar = (def, montagem = {}, avarias = []) => def.simular({ ...montagemPadrao(def), ...montagem }, new Set(avarias));
const ultimo = (r) => estadoAte(r, r.passos.length - 1);

/* ---------- motor ---------- */

test('iso: subir em z sobe na tela; andar em x vai para a direita', () => {
  const [x0, y0] = iso(0, 0, 0);
  const [x1] = iso(1, 0, 0);
  const [, yz] = iso(0, 0, 1);
  assert.ok(x1 > x0);
  assert.ok(yz < y0);
});

test('prisma devolve três faces de quatro pontos e a altura soma as camadas', () => {
  const p = prisma({ x: 0, y: 0, w: 2, d: 2 }, 0, 1);
  for (const f of ['topo', 'frente', 'lado']) assert.equal(p[f].length, 4);
  const est = { h: 1, camadas: ['a', 'b'] };
  assert.ok(alturaTopo(est, true) > alturaTopo(est, false));
});

test('trilho entre estações em linhas diferentes faz um L de 4 pontos', () => {
  const a = { x: 0, y: 0, w: 2, d: 2 };
  const b = { x: 6, y: 4, w: 2, d: 2 };
  assert.equal(caminhoTrilho(a, b).length, 4);
  assert.equal(caminhoTrilho(a, { ...b, y: 0 }).length, 2);
  assert.deepEqual(caminhoTrilho(a, b, 3)[1], [1, 4]);
});

test('montagem vai e volta pelo link e ignora valores e avarias inválidos', () => {
  const texto = codificarMontagem(agente, { pedido: 'vago', agents: 'sem', sensores: 'so-lint' }, ['testes-decoracao']);
  assert.equal(texto, 'pedido=vago,agents=sem,sensores=so-lint;q=testes-decoracao');
  const volta = decodificarMontagem(agente, texto);
  assert.deepEqual(volta.montagem, { pedido: 'vago', agents: 'sem', sensores: 'so-lint' });
  assert.deepEqual(volta.avarias, ['testes-decoracao']);
  const lixo = decodificarMontagem(agente, 'pedido=xyz,outro=1;q=nao-existe');
  assert.deepEqual(lixo.montagem, montagemPadrao(agente));
  assert.deepEqual(lixo.avarias, []);
});

test('estadoAte acumula marcas, razão e rastro até o passo pedido', () => {
  const r = rodar(agente);
  const e0 = estadoAte(r, 0);
  const eN = ultimo(r);
  assert.equal(e0.rastro.length, 1);
  assert.ok(eN.rastro.length >= r.passos.length - 1);
  assert.ok(eN.razao.length > e0.razao.length);
  assert.equal(eN.fim, true);
  assert.equal(estadoAte(r, -1).atual, null);
});

test('trilhos acesos seguem o pacote quando existe trilho entre as estações', () => {
  const r = rodar(agente);
  assert.deepEqual(trilhosAcesos(agente, r, 1), [chaveTrilho('pedido', 'agents')]);
});

test('as seis máquinas passam na validação em todas as montagens e avarias', () => {
  for (const def of todas) assert.deepEqual(validarMotion(def), [], def.id);
});

test('o catálogo lista as seis máquinas, uma por definição', () => {
  assert.deepEqual(maquinas.map((m) => m.id).sort(), todas.map((d) => d.id).sort());
});

test('os desafios "Tente" usam montagens e avarias que existem', () => {
  for (const def of todas) {
    for (const d of def.desafios) {
      const volta = decodificarMontagem(def, codificarMontagem(def, { ...montagemPadrao(def), ...(d.montagem || {}) }, d.avarias || []));
      assert.deepEqual(volta.avarias, d.avarias || [], `${def.id}: ${d.pergunta}`);
      for (const [k, v] of Object.entries(d.montagem || {})) assert.equal(volta.montagem[k], v, `${def.id}: ${d.pergunta}`);
    }
  }
});

test('o rastro em Markdown tem montagem, rastro, livro-razão e saída', () => {
  const r = rodar(ci);
  const md = rastroMarkdown(ci, montagemPadrao(ci), [], r);
  for (const s of ['## Montagem', '## Rastro', '## Livro-razão', '## Saída']) assert.ok(md.includes(s), s);
});

/* ---------- FIG_AGT ---------- */

const saidaAgente = (m, q) => {
  const r = rodar(agente, m, q);
  return { r, chegou: ultimo(r).metricas.chegou, razao: ultimo(r).razao };
};

test('agente: harness completo com pedido vago entrega PR sem problema e com uma pergunta', () => {
  const { r, chegou } = saidaAgente({ pedido: 'vago', agents: 'com', sensores: 'todos' });
  assert.equal(chegou, 0);
  assert.ok(r.saida.linhas.some((l) => l.startsWith('Pergunta no PR')));
});

test('agente: sem AGENTS.md, pedido vago e só lint, suposições e invenções chegam ao PR com lint verde', () => {
  const { r, chegou } = saidaAgente({ pedido: 'vago', agents: 'sem', sensores: 'so-lint' });
  assert.ok(chegou >= 6);
  assert.equal(r.passos.find((p) => p.estacao === 'lint').marca, 'ok');
  assert.equal(r.saida.status, 'falha');
});

test('agente: o limite mensal só cai no review com rubrica', () => {
  const temLimite = (q) => saidaAgente({ pedido: 'vago', agents: 'sem', sensores: 'todos' }, q).r.saida.linhas.some((l) => l.includes('agendamentosNoMes'));
  assert.equal(temLimite([]), false);
  assert.equal(temLimite(['review-sem-rubrica']), true);
});

test('agente: testes em continue-on-error deixam as suposições chegarem', () => {
  const ok = saidaAgente({ pedido: 'vago', agents: 'sem', sensores: 'todos' });
  const deco = saidaAgente({ pedido: 'vago', agents: 'sem', sensores: 'todos' }, ['testes-decoracao']);
  assert.equal(ok.chegou, 0);
  assert.ok(deco.chegou > 0);
});

test('agente: apontar a spec no pedido faz o mesmo papel do AGENTS.md para ler a spec', () => {
  const r = rodar(agente, { pedido: 'spec', agents: 'sem', sensores: 'nenhum' });
  assert.ok(!r.desligadas.includes('spec'));
  assert.ok(!r.saida.linhas.some((l) => l.includes('Limite mensal')));
});

test('agente: usa as mensagens exatas da spec da agenda', () => {
  const r = rodar(agente, { pedido: 'spec', agents: 'com', sensores: 'todos' });
  const texto = JSON.stringify(ultimo(r).razao);
  for (const msg of ['vagaId é obrigatório', 'jovemEmail é obrigatório', 'jovemEmail inválido', 'Vaga não encontrada', 'Vaga indisponível']) assert.ok(texto.includes(msg), msg);
});

/* ---------- FIG_SUB ---------- */

test('subagent: agente único passa de 40% só na T3', () => {
  const r = rodar(subagent, { padrao: 'unico', tarefa: 'grande', dependencia: 'independentes' });
  const niveis = r.passos.filter((p) => p.titulo.startsWith('Faz T')).map((p) => p.niveis.principal);
  assert.ok(niveis[1] < 0.4 && niveis[2] >= 0.4, niveis.join(','));
});

test('subagent: com subagents a janela principal fica abaixo de 10%, mas o total de tokens sobe', () => {
  const u = rodar(subagent, { padrao: 'unico', tarefa: 'grande' }).numeros;
  const s = rodar(subagent, { padrao: 'sequencial', tarefa: 'grande' }).numeros;
  assert.ok(s.pico < 0.1);
  assert.ok(s.tokens > u.tokens);
});

test('subagent: resumo gordo leva a janela principal de volta para a dumb zone', () => {
  assert.ok(rodar(subagent, { padrao: 'sequencial', tarefa: 'grande' }, ['resumo-gordo']).numeros.pico >= 0.4);
});

test('subagent: em tarefa pequena o agente único é o mais barato e o mais rápido', () => {
  const u = rodar(subagent, { padrao: 'unico', tarefa: 'pequena' }).numeros;
  for (const padrao of ['sequencial', 'paralelo', 'supervisor']) {
    const o = rodar(subagent, { padrao, tarefa: 'pequena' }).numeros;
    assert.ok(o.tokens > u.tokens && o.tempo > u.tempo, padrao);
  }
});

test('subagent: paralelo é o mais rápido com tasks independentes e quebra com dependência', () => {
  const ind = Object.fromEntries(['unico', 'sequencial', 'paralelo'].map((p) => [p, rodar(subagent, { padrao: p, tarefa: 'grande', dependencia: 'independentes' }).numeros.tempo]));
  assert.ok(ind.paralelo < ind.sequencial && ind.paralelo < ind.unico);
  const par = rodar(subagent, { padrao: 'paralelo', tarefa: 'grande', dependencia: 'dependentes' }).numeros;
  const sup = rodar(subagent, { padrao: 'supervisor', tarefa: 'grande', dependencia: 'dependentes' }).numeros;
  assert.ok(par.retrabalho > sup.retrabalho);
  assert.ok(par.tokens > sup.tokens);
});

test('subagent: sem gates, o defeito da T3 chega ao PR', () => {
  assert.ok(rodar(subagent, { padrao: 'supervisor', tarefa: 'grande' }, ['sem-gates']).numeros.defeitos > 0);
  assert.equal(rodar(subagent, { padrao: 'supervisor', tarefa: 'grande' }).numeros.defeitos, 0);
});

/* ---------- FIG_WT ---------- */

test('worktrees: três xícaras integram as três rotas com um conflito', () => {
  const n = rodar(worktrees, { modo: 'worktrees', arquivos: 'app-js' }).numeros;
  assert.deepEqual([n.rotas, n.conflitos, n.perdidas], [3, 1, 0]);
  assert.equal(rodar(worktrees, { modo: 'worktrees', arquivos: 'separados' }).numeros.conflitos, 0);
});

test('worktrees: na mesma pasta há edição perdida e falta rota', () => {
  const n = rodar(worktrees, { modo: 'mesma-pasta' }).numeros;
  assert.ok(n.perdidas > 0);
  assert.ok(n.rotas < 3);
});

test('worktrees: clones funcionam, mas copiam o histórico e gastam mais disco', () => {
  const w = rodar(worktrees, { modo: 'worktrees' }).numeros;
  const c = rodar(worktrees, { modo: 'clones' }).numeros;
  assert.equal(c.rotas, 3);
  assert.ok(c.disco > w.disco);
});

test('worktrees: o git recusa a mesma branch com a mensagem da lição', () => {
  const r = rodar(worktrees, { modo: 'worktrees' }, ['mesma-branch']);
  assert.ok(JSON.stringify(r.passos).includes('is already used by worktree'));
});

test('worktrees: porta e node_modules não são isolados', () => {
  const r = rodar(worktrees, { modo: 'worktrees' }, ['mesma-porta', 'sem-install']);
  const t = JSON.stringify(r.passos);
  assert.ok(t.includes('EADDRINUSE') && t.includes("Cannot find module 'express'"));
  assert.equal(r.numeros.erros, 2);
});

/* ---------- FIG_CI ---------- */

test('ci: rosa pintada passa pelos cinco e só a guarda pega', () => {
  assert.equal(rodar(ci, { pr: '17', extras: 'nenhum' }).numeros.escapou, true);
  assert.equal(rodar(ci, { pr: '17', extras: 'guarda' }).numeros.pegoPor, 'guarda');
});

test('ci: continue-on-error deixa o PR #15 chegar à main', () => {
  assert.equal(rodar(ci, { pr: '15' }).numeros.escapou, false);
  assert.equal(rodar(ci, { pr: '15' }, ['decoracao']).numeros.escapou, true);
});

test('ci: sem lint, o type check pega o PR #12 aos 30 s', () => {
  const n = rodar(ci, { pr: '12' }, ['sem-lint']).numeros;
  assert.deepEqual([n.pegoPor, n.tempo], ['typecheck', 30]);
});

test('ci: regra inventada passa por todos os sensores, até com os extras', () => {
  assert.equal(rodar(ci, { pr: '21', extras: 'ambos' }).numeros.escapou, true);
});

test('ci: main sem proteção recebe o defeito mesmo quando um sensor pega', () => {
  assert.equal(rodar(ci, { pr: '16' }, ['sem-protecao']).numeros.escapou, true);
});

/* ---------- FIG_REV ---------- */

test('review: pessoa em camadas + subagents com rubrica pegam os seis', () => {
  assert.equal(rodar(review, { quem: 'ambos', leitura: 'camadas' }).numeros.escaparam, 0);
});

test('review: só subagents deixam passar a Factory', () => {
  const n = rodar(review, { quem: 'subagents' }).numeros;
  assert.equal(n.escaparam, 1);
  assert.ok(!n.pegoMaquina.includes('factory'));
});

test('review: leitura de cima para baixo perde os dois defeitos de teste', () => {
  const n = rodar(review, { quem: 'humano', leitura: 'topo' }).numeros;
  assert.equal(n.escaparam, 2);
  assert.ok(!n.pegoHumano.includes('rosa') && !n.pegoHumano.includes('tartaruga'));
});

test('review: revisor na sessão do autor perde a regra inventada e a dependência', () => {
  const n = rodar(review, { quem: 'subagents' }, ['mesmo-contexto']).numeros;
  assert.ok(!n.pegoMaquina.includes('limite') && !n.pegoMaquina.includes('dep'));
});

test('review: sem rubrica, os subagents só geram comentário genérico', () => {
  const n = rodar(review, { quem: 'subagents' }, ['sem-rubrica']).numeros;
  assert.equal(n.pegoMaquina.length, 0);
  assert.ok(n.genericos > 0);
  assert.equal(n.escaparam, 6);
});

/* ---------- FIG_REQ ---------- */

test('requisito: desejo e número sem sensor chegam atrasados; número com sensor chega na hora', () => {
  assert.equal(rodar(requisito, { escrita: 'desejo' }).numeros.atrasado, true);
  assert.equal(rodar(requisito, { escrita: 'numero' }).numeros.atrasado, true);
  const s = rodar(requisito, { escrita: 'sensor' }).numeros;
  assert.equal(s.atrasado, false);
  assert.equal(s.bloqueou, true);
});

test('requisito: com o código lento, a média fica abaixo de 50 ms e o p95 fica acima', () => {
  const n = rodar(requisito, { escrita: 'desejo' }).numeros;
  assert.ok(n.media < 50 && n.p95 > 50, `média ${n.media}, p95 ${n.p95}`);
});

test('requisito: cada quebra do sensor deixa a regressão passar', () => {
  for (const q of ['media', 'carga-omitida', 'sem-gate']) {
    const n = rodar(requisito, { escrita: 'sensor' }, [q]).numeros;
    assert.equal(n.atrasado, true, q);
    assert.equal(n.bloqueou, false, q);
  }
});

test('requisito: a tela com 5 chamadas tem p95 maior que o do endpoint', () => {
  const n = rodar(requisito, { escrita: 'sensor', tela: '5' }).numeros;
  assert.ok(n.tela > n.p95 * 2, `tela ${n.tela}, endpoint ${n.p95}`);
});
