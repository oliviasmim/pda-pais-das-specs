// Triagem de um PR pelo `git diff --stat`: antes de ler código, olhe a lista de arquivos.
// Sinais vêm de LISTA-SINAIS-ALERTA-PR-AGENTE (aula 17): fora do escopo, teste alterado, dependência nova.

export const PR = {
  titulo: 'feat: listar vagas livres do mentor (T3)',
  pedido: 'Implementar T3, GET /mentores/:id/vagas?data=YYYY-MM-DD. Nada além disso.',
};

export const CLASSES = {
  ok: { nome: 'Cabe no pedido', descricao: 'Tem relação direta com a T3.' },
  escopo: { nome: 'Fora do escopo', descricao: 'Mexe em algo que a T3 não pediu.' },
  teste: { nome: 'Teste existente alterado', descricao: 'Teste antigo mudou junto com o código: a régua mudou.' },
  dependencia: { nome: 'Dependência nova', descricao: 'Pacote que entrou sem decisão escrita.' },
};

export const ARQUIVOS = [
  { id: 'vagas', caminho: 'src/rotas/vagas.js', mudanca: 38, sinal: '++++++++++', classe: 'ok',
    explicacao: 'É a rota da T3. O nome do arquivo bate com o título do PR.' },
  { id: 'repo', caminho: 'src/repo.js', mudanca: 6, sinal: '+++', classe: 'ok',
    explicacao: 'A rota precisa ler as vagas livres do mentor. O ADR-001 põe a fonte de dados aqui.' },
  { id: 'teste-novo', caminho: 'tests/vagas.test.js', mudanca: 41, sinal: '++++++++++', classe: 'ok',
    explicacao: 'Teste novo para código novo. Arquivo novo em tests/ é o esperado.' },
  { id: 'teste-velho', caminho: 'tests/agendamentos.test.js', mudanca: 4, sinal: '+--', classe: 'teste',
    explicacao: 'A T3 não toca em agendamento. Teste que já existia e mudou é o primeiro diff a abrir: o caso comum é o assert afrouxado (o esperado 409 virou 200) para o código passar.' },
  { id: 'agendamentos', caminho: 'src/rotas/agendamentos.js', mudanca: 58, sinal: '++++---', classe: 'escopo',
    explicacao: 'T1 e T2 não estão no pedido. O agente leu o arquivo vizinho e "aproveitou para arrumar". É o pedido crescendo sem ninguém decidir (scope creep), e são 58 linhas que você não pediu para revisar.' },
  { id: 'pacote', caminho: 'package.json', mudanca: 2, sinal: '++', classe: 'dependencia',
    explicacao: 'A T3 não precisa de biblioteca. Rode npm view com o nome do pacote para ver o que ele é, e pergunte no PR onde está escrito que ele entra.' },
  { id: 'lock', caminho: 'package-lock.json', mudanca: 211, sinal: '++++++++++', classe: 'dependencia',
    explicacao: 'O lockfile só mudou porque entrou um pacote novo. As 211 linhas assustam, mas a pergunta é a mesma do package.json: quem decidiu esse pacote?' },
  { id: 'data', caminho: 'src/util/data.js', mudanca: 14, sinal: '+++++', classe: 'ok',
    explicacao: 'A T3 manda validar a data (400 "data inválida"), então um helper pequeno cabe. Leia o corpo mesmo assim: o pacote novo pode estar sendo importado aqui.' },
  { id: 'readme', caminho: 'README.md', mudanca: 4, sinal: '++', classe: 'ok',
    explicacao: 'Documentar a rota nova cabe no pedido.' },
];

export const arquivoPorId = (id) => ARQUIVOS.find((a) => a.id === id) || null;

export function avaliarResposta(id, classe) {
  const a = arquivoPorId(id);
  if (!a || !CLASSES[classe]) return { nota: 0, correta: null };
  return { nota: a.classe === classe ? 1 : 0, correta: a.classe };
}

export function responder(respostas, id, classe) {
  if (!arquivoPorId(id) || !CLASSES[classe]) return { ...respostas };
  return { ...respostas, [id]: classe };
}

export function placar(respostas) {
  let pontos = 0;
  let respondidas = 0;
  let sinaisAchados = 0;
  let sinaisTotal = 0;
  let falsosAlarmes = 0;
  for (const a of ARQUIVOS) {
    const alerta = a.classe !== 'ok';
    if (alerta) sinaisTotal += 1;
    const r = respostas[a.id];
    if (!r) continue;
    respondidas += 1;
    if (r === a.classe) {
      pontos += 1;
      if (alerta) sinaisAchados += 1;
    }
    if (a.classe === 'ok' && r !== 'ok') falsosAlarmes += 1;
  }
  return { pontos, total: ARQUIVOS.length, respondidas, completo: respondidas === ARQUIVOS.length, sinaisAchados, sinaisTotal, falsosAlarmes };
}

// Saída no formato do `git diff --stat`, para o aluno comparar com o que veria no terminal.
export function stat() {
  const largura = Math.max(...ARQUIVOS.map((a) => a.caminho.length));
  const linhas = ARQUIVOS.map((a) => `${a.caminho.padEnd(largura)} | ${String(a.mudanca).padStart(3)} ${a.sinal}`);
  const total = ARQUIVOS.reduce((s, a) => s + a.mudanca, 0);
  linhas.push(` ${ARQUIVOS.length} files changed, ${total} lines changed`);
  return linhas.join('\n');
}
