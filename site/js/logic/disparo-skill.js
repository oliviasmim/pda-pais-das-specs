// Laboratório "disparo de skill": a skill dispara quando deve e fica quieta quando não deve?
// SIMULAÇÃO: o modelo de verdade decide pelo sentido da descrição. Aqui usamos palavras-gatilho
// só para tornar visível o efeito de uma descrição vaga, genérica ou específica.
export const SKILL = { nome: 'criar-endpoint', corpo: 'Passo a passo para criar um endpoint na agenda de mentorias, no padrão do GET /mentores.' };

export const DESCRICOES = [
  {
    id: 'vaga',
    nome: 'Vaga',
    texto: 'Ajuda com código.',
    grupos: [['codigo']],
    bloqueios: [],
    nota: '"Ajuda com código" não diz quando usar. Ficou quieta nos 4 pedidos de rota nova e disparou no único que tem a palavra "código" (a revisão).',
  },
  {
    id: 'generica',
    nome: 'Genérica demais',
    texto: 'Use para qualquer tarefa de backend, API, repositório ou testes.',
    grupos: [['backend', 'api', 'endpoint', 'rota', 'repositorio', 'teste', 'funcao', 'bug', 'mentores', 'agendamentos']],
    bloqueios: [],
    nota: 'Larga demais: a skill entra em pedido de bug, de explicação, de refatoração e de teste. Cada disparo errado põe o passo a passo inteiro na janela, à toa.',
  },
  {
    id: 'especifica',
    nome: 'Específica',
    texto: 'Cria um endpoint HTTP novo (GET, POST ou DELETE) no padrão do GET /mentores. Use quando o pedido for criar uma rota nova.',
    grupos: [['crie', 'adicione', 'monte', 'novo', 'nova'], ['endpoint', 'rota', 'recurso', 'get', 'post', 'delete']],
    bloqueios: ['bug', 'corrija', 'explique', 'refatore'],
    nota: 'Diz o que faz e quando usar. Ainda erra um: dispara no pedido de teste para uma rota que já existe.',
  },
  {
    id: 'completa',
    nome: 'Específica + quando NÃO usar',
    texto: 'Cria um endpoint HTTP novo (GET, POST ou DELETE) no padrão do GET /mentores. Use quando o pedido for criar uma rota nova. Não use para corrigir bug, explicar código, refatorar nem escrever teste.',
    grupos: [['crie', 'adicione', 'monte', 'novo', 'nova'], ['endpoint', 'rota', 'recurso', 'get', 'post', 'delete']],
    bloqueios: ['bug', 'corrija', 'explique', 'refatore', 'teste', 'revise'],
    nota: 'O "não use para" fecha a brecha do teste. É a fórmula da lição: o que faz, quando usar e quando não usar.',
  },
];

export const PEDIDOS = [
  { id: 'p1', texto: 'Crie o endpoint POST /agendamentos conforme a T1.', deve: true },
  { id: 'p2', texto: 'Adicione a rota DELETE /agendamentos/:id.', deve: true },
  { id: 'p3', texto: 'Crie o GET /mentores/:id/vagas com filtro por data.', deve: true },
  { id: 'p4', texto: 'Monte um novo recurso /health para o monitoramento.', deve: true, limite: true },
  { id: 'p5', texto: 'Corrija o bug: e-mail inválido devolve 500 em /agendamentos.', deve: false },
  { id: 'p6', texto: 'Explique o que faz a função validarEmail.', deve: false },
  { id: 'p7', texto: 'Refatore o repositório em memória para ficar mais legível.', deve: false },
  { id: 'p8', texto: 'Revise o código do repo.js e diga o que melhorar.', deve: false },
  { id: 'p9', texto: 'Escreva a mensagem de boas-vindas para a jovem.', deve: false },
  { id: 'p10', texto: 'Adicione um teste para a rota POST /agendamentos.', deve: false },
];

export function palavras(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function dispara(descricao, pedido) {
  const p = new Set(palavras(pedido));
  if (descricao.bloqueios.some((b) => p.has(b))) return false;
  return descricao.grupos.every((grupo) => grupo.some((w) => p.has(w)));
}

export function descricaoPorId(id) {
  const d = DESCRICOES.find((x) => x.id === id);
  if (!d) throw new Error(`descrição desconhecida: ${id}`);
  return d;
}

export function avaliar(id, pedidos = PEDIDOS) {
  const d = descricaoPorId(id);
  const linhas = pedidos.map((p) => {
    const disparou = dispara(d, p.texto);
    const resultado = disparou === p.deve ? 'acerto' : disparou ? 'falso-positivo' : 'falso-negativo';
    return { ...p, disparou, resultado };
  });
  const conta = (r) => linhas.filter((l) => l.resultado === r).length;
  return { descricao: d, linhas, acertos: conta('acerto'), falsosPositivos: conta('falso-positivo'), falsosNegativos: conta('falso-negativo'), total: linhas.length };
}
