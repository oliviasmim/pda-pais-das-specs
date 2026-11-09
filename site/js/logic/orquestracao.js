export const JANELA = 200;
export const ZONA_SMART = 0.4;

export const CUSTOS = {
  contextoBase: 10,
  bootstrap: 12,
  spawn: 1,
  handoff: 2,
  handoffTokens: 4,
  planejar: 3,
  planejarTokens: 8,
  revisar: 2,
  revisarLeitura: 1,
  revisarTokens: 5,
  consolidar: 2,
  integrar: 3,
  consolidarHumanoPorRelatorio: 3,
  retrabalhoDumb: 0.3,
  tokensPorMinutoDeConflito: 2,
  conflitoPadrao: 6,
  limiteTrivial: 5,
};

export const PADROES = [
  { id: 'unico', nome: 'Agente único', resumo: 'Uma sessão faz tudo, em ordem, com o contexto acumulando.' },
  { id: 'sequencial', nome: 'Sequencial', resumo: 'Um subagent por task, um depois do outro. Cada um começa com contexto limpo.' },
  { id: 'paralelo', nome: 'Paralelo', resumo: 'Vários subagents ao mesmo tempo, cada um no seu worktree. Integração no fim.' },
  { id: 'supervisor', nome: 'Supervisor', resumo: 'Um agente planeja, distribui, revisa cada entrega e serializa quem disputa arquivo.' },
];

export const CENARIOS = [
  {
    id: 'speedrun',
    nome: 'Speedrun: 3 tasks independentes',
    descricao: 'As tasks T1, T2 e T3 da agenda de mentorias. Cada uma tem seu arquivo de rota; todas registram uma linha em src/app.js.',
    maxAgentes: 3,
    custoConflito: { 'src/app.js': 2 },
    tasks: [
      { id: 'T1', nome: 'Agendar', dur: 14, tokens: 35, deps: [], arquivos: ['src/routes/agendamentos.js', 'src/app.js'] },
      { id: 'T2', nome: 'Cancelar', dur: 10, tokens: 25, deps: [], arquivos: ['src/routes/cancelamento.js', 'src/app.js'] },
      { id: 'T3', nome: 'Vagas', dur: 12, tokens: 30, deps: [], arquivos: ['src/routes/vagas.js', 'src/app.js'] },
    ],
  },
  {
    id: 'bug',
    nome: 'Bug de uma linha',
    descricao: 'POST /agendamentos devolve 200 em vez de 201. Uma task, um arquivo, três minutos.',
    maxAgentes: 3,
    custoConflito: {},
    tasks: [{ id: 'B1', nome: 'Status 201', dur: 3, tokens: 8, deps: [], arquivos: ['src/routes/agendamentos.js'] }],
  },
  {
    id: 'cadeia',
    nome: 'Refatoração encadeada',
    descricao: 'Extrair a validação, usar a validação nova no cancelamento, ajustar os testes. Cada passo depende do anterior.',
    maxAgentes: 3,
    custoConflito: {},
    tasks: [
      { id: 'R1', nome: 'Extrair validação', dur: 8, tokens: 20, deps: [], arquivos: ['src/validacao.js', 'src/routes/agendamentos.js'] },
      { id: 'R2', nome: 'Usar no cancelamento', dur: 6, tokens: 15, deps: ['R1'], arquivos: ['src/routes/cancelamento.js', 'src/validacao.js'] },
      { id: 'R3', nome: 'Ajustar testes', dur: 7, tokens: 18, deps: ['R2'], arquivos: ['tests/agendamentos.test.js', 'tests/cancelamento.test.js'] },
    ],
  },
  {
    id: 'review',
    nome: 'Revisar um PR grande com 4 olhares',
    descricao: 'Quatro revisores especializados só leem o diff (segurança, testes, spec, simplicidade). Alguém precisa juntar os quatro relatórios.',
    maxAgentes: 4,
    custoConflito: {},
    consolidar: true,
    tasks: [
      { id: 'V1', nome: 'Segurança', dur: 6, tokens: 30, deps: [], arquivos: [] },
      { id: 'V2', nome: 'Testes', dur: 6, tokens: 30, deps: [], arquivos: [] },
      { id: 'V3', nome: 'Rastro da spec', dur: 5, tokens: 25, deps: [], arquivos: [] },
      { id: 'V4', nome: 'Simplicidade', dur: 5, tokens: 25, deps: [], arquivos: [] },
    ],
  },
  {
    id: 'mesmo-arquivo',
    nome: '5 tasks no mesmo arquivo',
    descricao: 'Cinco ajustes de validação, todos dentro de src/routes/agendamentos.js. Parece paralelizável. Não é.',
    maxAgentes: 3,
    custoConflito: { 'src/routes/agendamentos.js': 6 },
    tasks: [1, 2, 3, 4, 5].map((n) => ({
      id: `M${n}`,
      nome: `Ajuste ${n}`,
      dur: 5,
      tokens: 15,
      deps: [],
      arquivos: ['src/routes/agendamentos.js'],
    })),
  },
];

export function gerarCenario({ n = 3, dur = 10, compartilha = 'trivial', deps = 'independentes' } = {}) {
  const qtd = Math.max(1, Math.min(6, Math.round(n)));
  const d = Math.max(2, Math.min(30, Math.round(dur)));
  const tasks = [];
  for (let i = 1; i <= qtd; i++) {
    const arquivos = [`src/modulo${i}.js`];
    if (compartilha === 'trivial') arquivos.push('src/app.js');
    if (compartilha === 'mesmo') arquivos.splice(0, 1, 'src/nucleo.js');
    tasks.push({
      id: `S${i}`,
      nome: `Task ${i}`,
      dur: d,
      tokens: Math.round(d * 2.5),
      deps: deps === 'cadeia' && i > 1 ? [`S${i - 1}`] : [],
      arquivos,
    });
  }
  return {
    id: 'seu',
    nome: 'O seu caso',
    descricao: 'Cenário montado por você.',
    maxAgentes: 3,
    custoConflito: { 'src/app.js': 2, 'src/nucleo.js': 6 },
    tasks,
  };
}

function custoArquivo(cenario, arquivo) {
  const c = cenario.custoConflito || {};
  return arquivo in c ? c[arquivo] : CUSTOS.conflitoPadrao;
}

function ordemTopologica(tasks) {
  const feitos = new Set();
  const ordem = [];
  let restantes = [...tasks];
  while (restantes.length) {
    const prontos = restantes.filter((t) => t.deps.every((d) => feitos.has(d)));
    if (!prontos.length) throw new Error('Dependência circular no cenário');
    for (const t of prontos) {
      ordem.push(t);
      feitos.add(t.id);
    }
    restantes = restantes.filter((t) => !feitos.has(t.id));
  }
  return ordem;
}

function arred(x) {
  return Math.round(x * 10) / 10;
}

function sobrepoe(a, b) {
  return a.inicio < b.fim && b.inicio < a.fim;
}

function simularUnico(cenario) {
  const blocos = [];
  let t = 0;
  let ctx = CUSTOS.contextoBase;
  let tokens = 0;
  let dumb = null;
  const notas = [];
  for (const task of ordemTopologica(cenario.tasks)) {
    ctx += task.tokens;
    let dur = task.dur;
    const naDumb = ctx > JANELA * ZONA_SMART;
    if (naDumb) {
      dur = arred(dur * (1 + CUSTOS.retrabalhoDumb));
      if (!dumb) dumb = task.id;
    }
    blocos.push({ faixa: 'agente', inicio: t, fim: arred(t + dur), tipo: naDumb ? 'dumb' : 'task', rotulo: task.nome, taskId: task.id });
    t = arred(t + dur);
    tokens += ctx;
  }
  if (dumb) notas.push(`O contexto passou de ${Math.round(JANELA * ZONA_SMART)}k na task ${dumb}: dumb zone, mais retrabalho e mais chance de erro.`);
  else notas.push('O contexto ficou na smart zone o tempo todo. Sem pedágio de coordenação.');
  return {
    faixas: [{ id: 'agente', rotulo: 'Agente' }],
    blocos,
    tempo: t,
    tokens: Math.round(tokens),
    overhead: 0,
    conflitos: [],
    picoContexto: ctx,
    dumb,
    notas,
  };
}

function simularSequencial(cenario) {
  const blocos = [];
  const faixas = [{ id: 'principal', rotulo: 'Principal' }];
  let t = 0;
  let tokens = 0;
  let overhead = 0;
  let pico = 0;
  const ordem = ordemTopologica(cenario.tasks);
  ordem.forEach((task, i) => {
    const faixa = `sub${i + 1}`;
    faixas.push({ id: faixa, rotulo: `Subagent ${i + 1}` });
    blocos.push({ faixa, inicio: t, fim: t + CUSTOS.spawn, tipo: 'coord', rotulo: 'spawn' });
    t += CUSTOS.spawn;
    overhead += CUSTOS.spawn;
    blocos.push({ faixa, inicio: t, fim: t + task.dur, tipo: 'task', rotulo: task.nome, taskId: task.id });
    t += task.dur;
    const ctx = CUSTOS.bootstrap + task.tokens;
    pico = Math.max(pico, ctx);
    tokens += ctx + CUSTOS.handoffTokens;
    if (i < ordem.length - 1) {
      blocos.push({ faixa: 'principal', inicio: t, fim: t + CUSTOS.handoff, tipo: 'coord', rotulo: 'handoff' });
      t += CUSTOS.handoff;
      overhead += CUSTOS.handoff;
    }
  });
  return {
    faixas,
    blocos,
    tempo: arred(t),
    tokens: Math.round(tokens),
    overhead,
    conflitos: [],
    picoContexto: pico,
    dumb: null,
    notas: ['Cada subagent começa limpo e devolve só um resumo. Nada roda ao mesmo tempo, então não há conflito, mas também não há ganho de tempo.'],
  };
}

function agendar(cenario, { inicio, serializar }) {
  const ordem = ordemTopologica(cenario.tasks);
  const max = Math.max(1, cenario.maxAgentes || 3);
  const livre = Array.from({ length: max }, () => inicio);
  const feitos = {};
  const agendados = [];
  for (const task of ordem) {
    let pronto = Math.max(inicio, ...task.deps.map((d) => feitos[d].fim));
    let faixa = 0;
    for (let i = 1; i < max; i++) if (livre[i] < livre[faixa]) faixa = i;
    let comeco = Math.max(pronto, livre[faixa]);
    if (serializar) {
      let mudou = true;
      while (mudou) {
        mudou = false;
        for (const outro of agendados) {
          const disputa = outro.task.arquivos.some(
            (a) => task.arquivos.includes(a) && custoArquivo(cenario, a) >= CUSTOS.limiteTrivial,
          );
          const fimTentativa = comeco + CUSTOS.spawn + task.dur;
          if (disputa && comeco < outro.fim && outro.inicio < fimTentativa) {
            comeco = outro.fim;
            mudou = true;
          }
        }
      }
    }
    const item = { task, faixa, inicio: comeco, fim: comeco + CUSTOS.spawn + task.dur };
    livre[faixa] = item.fim;
    feitos[task.id] = item;
    agendados.push(item);
  }
  return agendados;
}

function conflitosEntre(cenario, agendados, apenasTriviais) {
  const conflitos = [];
  for (let i = 0; i < agendados.length; i++) {
    for (let j = i + 1; j < agendados.length; j++) {
      const a = agendados[i];
      const b = agendados[j];
      if (!sobrepoe(a, b)) continue;
      for (const arq of a.task.arquivos) {
        if (!b.task.arquivos.includes(arq)) continue;
        const custo = custoArquivo(cenario, arq);
        if (apenasTriviais && custo >= CUSTOS.limiteTrivial) continue;
        conflitos.push({ a: a.task.id, b: b.task.id, arquivo: arq, custo });
      }
    }
  }
  return conflitos;
}

function simularParalelo(cenario) {
  const agendados = agendar(cenario, { inicio: 0, serializar: false });
  const max = Math.max(1, cenario.maxAgentes || 3);
  const usadas = new Set(agendados.map((a) => a.faixa));
  const faixas = [...usadas].sort().map((i) => ({ id: `w${i}`, rotulo: `Subagent ${i + 1}` }));
  faixas.push({ id: 'integracao', rotulo: 'Integração' });
  const blocos = [];
  let tokens = 0;
  let pico = 0;
  for (const a of agendados) {
    blocos.push({ faixa: `w${a.faixa}`, inicio: a.inicio, fim: a.inicio + CUSTOS.spawn, tipo: 'coord', rotulo: 'spawn' });
    blocos.push({ faixa: `w${a.faixa}`, inicio: a.inicio + CUSTOS.spawn, fim: a.fim, tipo: 'task', rotulo: a.task.nome, taskId: a.task.id });
    const ctx = CUSTOS.bootstrap + a.task.tokens;
    pico = Math.max(pico, ctx);
    tokens += ctx;
  }
  const conflitos = conflitosEntre(cenario, agendados, false);
  const fimTasks = Math.max(...agendados.map((a) => a.fim));
  let integrar = CUSTOS.integrar;
  if (cenario.consolidar) integrar += CUSTOS.consolidarHumanoPorRelatorio * cenario.tasks.length;
  const custoConflitos = conflitos.reduce((s, c) => s + c.custo, 0);
  blocos.push({ faixa: 'integracao', inicio: fimTasks, fim: fimTasks + integrar, tipo: 'merge', rotulo: cenario.consolidar ? 'juntar relatórios' : 'merge' });
  if (custoConflitos) {
    blocos.push({
      faixa: 'integracao',
      inicio: fimTasks + integrar,
      fim: fimTasks + integrar + custoConflitos,
      tipo: 'conflito',
      rotulo: `${conflitos.length} conflito${conflitos.length > 1 ? 's' : ''}`,
    });
  }
  tokens += custoConflitos * CUSTOS.tokensPorMinutoDeConflito;
  const tempo = fimTasks + integrar + custoConflitos;
  const overhead = agendados.length * CUSTOS.spawn + integrar + custoConflitos;
  const notas = [];
  const semParalelo = agendados.every((a, i) => agendados.every((b, j) => i === j || !sobrepoe(a, b)));
  if (agendados.length === 1) notas.push('Só existe uma task. Não há nada para rodar ao mesmo tempo: sobra só o pedágio de subir agente e integrar.');
  else if (semParalelo) notas.push('As dependências em cadeia impedem rodar junto. O paralelo vira sequencial com pedágio.');
  if (conflitos.length) {
    const graves = conflitos.filter((c) => c.custo >= CUSTOS.limiteTrivial).length;
    notas.push(
      graves
        ? `${graves} conflito${graves > 1 ? 's' : ''} sério${graves > 1 ? 's' : ''}: tasks editaram o mesmo trecho ao mesmo tempo. A integração come o tempo ganho.`
        : `${conflitos.length} conflito${conflitos.length > 1 ? 's' : ''} pequeno${conflitos.length > 1 ? 's' : ''} (uma linha de registro). Barato de resolver.`,
    );
  }
  if (cenario.consolidar) notas.push('Sem supervisor, uma pessoa junta os relatórios e remove duplicados à mão.');
  if (agendados.length > max) notas.push(`Só cabem ${max} agentes por vez; as outras tasks esperam vaga.`);
  return { faixas, blocos, tempo: arred(tempo), tokens: Math.round(tokens), overhead: arred(overhead), conflitos, picoContexto: pico, dumb: null, notas };
}

function simularSupervisor(cenario) {
  const plano = CUSTOS.planejar;
  const agendados = agendar(cenario, { inicio: plano, serializar: true });
  const usadas = new Set(agendados.map((a) => a.faixa));
  const faixas = [{ id: 'supervisor', rotulo: 'Supervisor' }, ...[...usadas].sort().map((i) => ({ id: `w${i}`, rotulo: `Subagent ${i + 1}` }))];
  const blocos = [{ faixa: 'supervisor', inicio: 0, fim: plano, tipo: 'coord', rotulo: 'planeja' }];
  let tokens = CUSTOS.planejarTokens;
  let pico = 0;
  for (const a of agendados) {
    blocos.push({ faixa: `w${a.faixa}`, inicio: a.inicio, fim: a.inicio + CUSTOS.spawn, tipo: 'coord', rotulo: 'spawn' });
    blocos.push({ faixa: `w${a.faixa}`, inicio: a.inicio + CUSTOS.spawn, fim: a.fim, tipo: 'task', rotulo: a.task.nome, taskId: a.task.id });
    const ctx = CUSTOS.bootstrap + a.task.tokens;
    pico = Math.max(pico, ctx);
    tokens += ctx;
  }
  const leitura = cenario.tasks.every((t) => !t.arquivos.length);
  const durRev = leitura ? CUSTOS.revisarLeitura : CUSTOS.revisar;
  let livreSup = plano;
  let revisoes = 0;
  for (const a of [...agendados].sort((x, y) => x.fim - y.fim)) {
    const ini = Math.max(a.fim, livreSup);
    blocos.push({ faixa: 'supervisor', inicio: ini, fim: ini + durRev, tipo: 'review', rotulo: `revisa ${a.task.id}` });
    livreSup = ini + durRev;
    revisoes += durRev;
    tokens += CUSTOS.revisarTokens;
  }
  const fimTrab = Math.max(livreSup, ...agendados.map((a) => a.fim));
  blocos.push({ faixa: 'supervisor', inicio: fimTrab, fim: fimTrab + CUSTOS.consolidar, tipo: 'merge', rotulo: leitura ? 'consolida' : 'integra' });
  const triviais = conflitosEntre(cenario, agendados, true);
  const custoTriviais = triviais.reduce((s, c) => s + c.custo, 0);
  let fim = fimTrab + CUSTOS.consolidar;
  if (!leitura) {
    blocos.push({ faixa: 'supervisor', inicio: fim, fim: fim + CUSTOS.integrar + custoTriviais, tipo: 'merge', rotulo: 'merge' });
    fim += CUSTOS.integrar + custoTriviais;
  }
  tokens += custoTriviais * CUSTOS.tokensPorMinutoDeConflito + Math.round(cenario.tasks.length * 3);
  const serializadas = [];
  for (let i = 0; i < agendados.length; i++) {
    for (let j = i + 1; j < agendados.length; j++) {
      const a = agendados[i];
      const b = agendados[j];
      const disputa = a.task.arquivos.some((x) => b.task.arquivos.includes(x) && custoArquivo(cenario, x) >= CUSTOS.limiteTrivial);
      if (disputa && !a.task.deps.length && !b.task.deps.length) serializadas.push([a.task.id, b.task.id]);
    }
  }
  const notas = ['O supervisor gasta tempo planejando e revisando cada entrega. Em troca, nada chega sem conferência.'];
  if (serializadas.length) notas.push('Tasks que disputam o mesmo arquivo foram colocadas em fila pelo supervisor: zero conflito, menos paralelismo.');
  if (cenario.tasks.length === 1) notas.push('Para uma task só, planejar e revisar custa mais que a própria task.');
  const overhead = plano + agendados.length * CUSTOS.spawn + revisoes + CUSTOS.consolidar + (leitura ? 0 : CUSTOS.integrar + custoTriviais);
  return { faixas, blocos, tempo: arred(fim), tokens: Math.round(tokens), overhead: arred(overhead), conflitos: triviais, picoContexto: pico, dumb: null, notas };
}

const SIMULADORES = { unico: simularUnico, sequencial: simularSequencial, paralelo: simularParalelo, supervisor: simularSupervisor };

export function simular(cenario, padrao) {
  const fn = SIMULADORES[padrao];
  if (!fn) throw new Error(`Padrão desconhecido: ${padrao}`);
  return { padrao, ...fn(cenario) };
}

export function pontuar(r) {
  const risco = r.conflitos.reduce((s, c) => s + c.custo, 0);
  return arred(r.tempo + r.tokens / 10 + risco + (r.dumb ? 10 : 0));
}

export function compararTodos(cenario) {
  const resultados = PADROES.map((p) => {
    const r = simular(cenario, p.id);
    return { ...r, pontos: pontuar(r) };
  });
  const melhor = resultados.reduce((m, r) => (r.pontos < m.pontos ? r : m), resultados[0]);
  return { resultados, melhor: melhor.padrao };
}

export function veredito(cenario, escolhido) {
  const { resultados, melhor } = compararTodos(cenario);
  const r = resultados.find((x) => x.padrao === escolhido);
  const m = resultados.find((x) => x.padrao === melhor);
  const nome = (id) => PADROES.find((p) => p.id === id).nome;
  if (escolhido === melhor) {
    return { acertou: true, melhor, texto: `${nome(melhor)} é a melhor escolha aqui: ${m.tempo} min e ${m.tokens}k tokens.` };
  }
  const difT = arred(r.tempo - m.tempo);
  const difK = r.tokens - m.tokens;
  const partes = [];
  if (difT > 0) partes.push(`${difT} min a mais`);
  if (difK > 0) partes.push(`${difK}k tokens a mais`);
  if (r.dumb) partes.push('entra na dumb zone');
  if (r.conflitos.some((c) => c.custo >= CUSTOS.limiteTrivial)) partes.push('conflitos sérios');
  return {
    acertou: false,
    melhor,
    texto: `${nome(escolhido)} funciona, mas custa ${partes.join(', ') || 'mais no total'} em relação a ${nome(melhor)}.`,
  };
}
