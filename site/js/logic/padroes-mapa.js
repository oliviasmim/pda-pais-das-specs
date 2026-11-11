// Mapa dos padrões de orquestração: dados do diagrama, sem DOM.
// Coordenadas num quadro de 640 x 250.

export const QUADRO = { w: 640, h: 250 };

const no = (id, rotulo, x, y, w = 130, h = 54, tipo = 'agente', sub = '') => ({ id, rotulo, sub, x, y, w, h, tipo });
const seta = (de, para, rotulo = '', duplo = false) => ({ de, para, rotulo, duplo });

export const MAPA = [
  {
    id: 'unico',
    naipe: '♠',
    nome: 'Agente único',
    nos: [
      no('t1', 'T1 Agendar', 30, 98, 130, 54, 'agente', 'mesma sessão'),
      no('t2', 'T2 Cancelar', 255, 98, 130, 54, 'agente', 'mesma sessão'),
      no('t3', 'T3 Vagas', 480, 98, 130, 54, 'agente', 'mesma sessão'),
    ],
    setas: [seta('t1', 't2', 'contexto acumulado'), seta('t2', 't3', 'contexto acumulado')],
    passos: [
      { ativos: ['t1'], texto: 'Uma sessão lê a spec e faz T1. O contexto começa limpo.' },
      { ativos: ['t2'], texto: 'T2 roda na mesma sessão. O que T1 deixou na janela continua lá, útil ou não.' },
      { ativos: ['t3'], texto: 'Em T3 a janela já carrega T1 e T2. Passou de 40%? Entrou na dumb zone: o agente começa a esquecer as instruções do começo.' },
    ],
    custo: 'Sem coordenação e sem conflito. O preço é o contexto que acumula, task após task.',
    usar: 'Task pequena, em cadeia, ou que precisa enxergar tudo junto.',
  },
  {
    id: 'sequencial',
    naipe: '♣',
    nome: 'Sequencial',
    nos: [
      no('e1', 'Pesquisa', 20, 98, 150, 54, 'agente', 'subagent 1'),
      no('e2', 'Plano', 245, 98, 150, 54, 'agente', 'subagent 2'),
      no('e3', 'Implementação', 470, 98, 150, 54, 'agente', 'subagent 3'),
    ],
    setas: [seta('e1', 'e2', 'resumo'), seta('e2', 'e3', 'resumo')],
    passos: [
      { ativos: ['e1'], texto: 'O primeiro subagent pesquisa com janela limpa e devolve só um resumo.' },
      { ativos: ['e2'], texto: 'O segundo recebe o resumo como entrada e escreve o plano. Se o resumo perdeu algo, o plano nasce sem isso.' },
      { ativos: ['e3'], texto: 'O terceiro implementa a partir do plano. Cada etapa é isolada, mas nenhuma roda ao mesmo tempo.' },
    ],
    custo: 'Zero conflito e zero ganho de tempo. O preço está no handoff (o resumo que passa o bastão): o que ele esquecer, a próxima etapa não sabe.',
    usar: 'Etapas de naturezas diferentes, em que a saída de uma é a entrada da próxima.',
  },
  {
    id: 'paralelo',
    naipe: '♦',
    nome: 'Paralelo',
    nos: [
      no('a1', 'T1 Agendar', 20, 20, 150, 54, 'agente', 'worktree wt-agendar'),
      no('a2', 'T2 Cancelar', 20, 98, 150, 54, 'agente', 'worktree wt-cancelar'),
      no('a3', 'T3 Vagas', 20, 176, 150, 54, 'agente', 'worktree wt-vagas'),
      no('m', 'Integração', 330, 88, 150, 74, 'integracao', 'merge + npm test'),
      no('ok', 'main verde', 540, 98, 90, 54, 'ok', ''),
    ],
    setas: [seta('a1', 'm'), seta('a2', 'm'), seta('a3', 'm'), seta('m', 'ok')],
    passos: [
      { ativos: ['a1', 'a2', 'a3'], texto: 'Três agentes sobem juntos, cada um no seu worktree. Cada um paga a leitura do contexto inicial.' },
      { ativos: ['m'], texto: 'Todos entregam. Agora alguém junta as branches, uma por vez. É aqui que aparece o conflito em src/app.js.' },
      { ativos: ['m', 'ok'], texto: 'O relógio só para quando os testes das três tasks passam na main. O ganho é o que sobra depois dessa fila.' },
    ],
    custo: 'O preço está na integração: merge, diffs para revisar e cada agente pagando de novo a leitura do contexto.',
    usar: 'Tasks independentes, em arquivos diferentes, cada uma com teste de aceite próprio.',
  },
  {
    id: 'supervisor',
    naipe: '♥',
    nome: 'Supervisor',
    nos: [
      no('s', 'Supervisor', 245, 14, 150, 54, 'supervisor', 'planeja e revisa'),
      no('w1', 'Worker T1', 20, 170, 150, 54, 'agente', 'implementa'),
      no('w2', 'Worker T2', 245, 170, 150, 54, 'agente', 'implementa'),
      no('w3', 'Worker T3', 470, 170, 150, 54, 'agente', 'implementa'),
    ],
    setas: [seta('s', 'w1', '', true), seta('s', 'w2', '', true), seta('s', 'w3', '', true)],
    passos: [
      { ativos: ['s'], texto: 'O supervisor lê a spec, divide em tasks e decide quem toca em qual arquivo. Ele não implementa.' },
      { ativos: ['s', 'w1', 'w2', 'w3'], texto: 'Cada worker recebe uma task e um teste de aceite. Quem disputa arquivo entra em fila.' },
      { ativos: ['w1', 's'], texto: 'Cada entrega volta para o supervisor conferir: teste passou? Mudou arquivo fora da lista? Entrou regra que não está na spec?' },
      { ativos: ['s'], texto: 'O supervisor consolida e devolve a você o que foi feito e o que depende de decisão sua.' },
    ],
    custo: 'O preço está no supervisor: toda entrega passa por ele, e a janela dele também enche.',
    usar: 'Muitas partes com critério comum, ou partes que disputam os mesmos arquivos.',
  },
];

export function padraoPorId(id) {
  return MAPA.find((p) => p.id === id) || null;
}

export function noPorId(padrao, id) {
  return padrao.nos.find((n) => n.id === id) || null;
}

export function centroDe(n) {
  return { x: n.x + n.w / 2, y: n.y + n.h / 2 };
}

// Ponto onde a reta do centro do retângulo até (px, py) cruza a borda dele.
export function bordaRetangulo(n, px, py) {
  const c = centroDe(n);
  const dx = px - c.x;
  const dy = py - c.y;
  if (dx === 0 && dy === 0) return c;
  const tx = dx === 0 ? Infinity : n.w / 2 / Math.abs(dx);
  const ty = dy === 0 ? Infinity : n.h / 2 / Math.abs(dy);
  const t = Math.min(tx, ty);
  return { x: c.x + dx * t, y: c.y + dy * t };
}

export function pontosDaSeta(padrao, s, folga = 4) {
  const a = noPorId(padrao, s.de);
  const b = noPorId(padrao, s.para);
  const ca = centroDe(a);
  const cb = centroDe(b);
  const ini = bordaRetangulo(a, cb.x, cb.y);
  const fim = bordaRetangulo(b, ca.x, ca.y);
  const len = Math.hypot(fim.x - ini.x, fim.y - ini.y) || 1;
  const ux = (fim.x - ini.x) / len;
  const uy = (fim.y - ini.y) / len;
  return {
    x1: ini.x + ux * folga,
    y1: ini.y + uy * folga,
    x2: fim.x - ux * folga,
    y2: fim.y - uy * folga,
  };
}

export function validarMapa(mapa = MAPA) {
  const erros = [];
  for (const p of mapa) {
    const ids = new Set(p.nos.map((n) => n.id));
    if (ids.size !== p.nos.length) erros.push(`${p.id}: ids de nó repetidos`);
    for (const n of p.nos) {
      if (n.x < 0 || n.y < 0 || n.x + n.w > QUADRO.w || n.y + n.h > QUADRO.h) erros.push(`${p.id}/${n.id}: fora do quadro`);
    }
    for (const s of p.setas) {
      if (!ids.has(s.de) || !ids.has(s.para)) erros.push(`${p.id}: seta ${s.de}->${s.para} aponta para nó inexistente`);
    }
    if (!p.passos.length) erros.push(`${p.id}: sem passos`);
    for (const [i, passo] of p.passos.entries()) {
      for (const id of passo.ativos) if (!ids.has(id)) erros.push(`${p.id}: passo ${i + 1} usa nó inexistente ${id}`);
    }
  }
  return erros;
}
