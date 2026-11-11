// Triagem de achados: quem pega cada problema de um PR de agente, e o que bloqueia.
// Inspirado no PR plantado da Semana 9, reescrito para a agenda de mentorias (T3: listar vagas livres).
// Sem DOM.

export const REVISORES = [
  { id: 'ci', nome: 'CI (lint e testes)', curto: 'CI' },
  { id: 'camadas', nome: 'Humano lendo em camadas', curto: 'Humano' },
  { id: 'sinais', nome: 'Subagent de sinais de IA', curto: 'Sinais' },
  { id: 'seguranca', nome: 'Subagent de segurança', curto: 'Segurança' },
  { id: 'contexto', nome: 'Humano que conhece o contexto', curto: 'Contexto' },
];

export const PRIORIDADES = [
  { id: 'bloqueia', nome: 'Bloqueia' },
  { id: 'nao-bloqueia', nome: 'Não bloqueia (nit)' },
];

export const TITULO_PR = 'feat: listar vagas livres de um mentor por data (T3)';

export const ACHADOS = [
  {
    id: 'lint',
    onde: 'src/rotas/vagas.js:12',
    texto: 'Variável com var, comparação com == e um console.log esquecido.',
    pegam: ['ci', 'camadas'],
    prioridade: 'bloqueia',
    porque: 'O lint acha isso sem ninguém ler. Se chegou na revisão, é porque o lint não está travando o merge na CI.',
  },
  {
    id: 'teste-vermelho',
    onde: 'tests/vagas.test.js',
    texto: 'O teste novo "filtra por data" falha ao rodar npm test.',
    pegam: ['ci', 'camadas'],
    prioridade: 'bloqueia',
    porque: 'Rodar npm test antes de ler é a camada 0, a mais barata. Teste vermelho bloqueia, sem discussão.',
  },
  {
    id: 'assert-tautologico',
    onde: 'tests/vagas.test.js:41',
    texto: 'O assert "resposta não expõe jovemEmail" foi trocado por assert.ok(email === undefined || typeof email === "string"). Sempre verdadeiro.',
    pegam: ['camadas'],
    prioridade: 'bloqueia',
    porque: 'O teste continua verde, então a CI não reclama. Só quem lê o diff de tests/ percebe que a asserção virou sempre verdadeira. Os dois subagents desta triagem não revisam tests/.',
  },
  {
    id: 'vazamento',
    onde: 'src/rotas/vagas.js:27',
    texto: 'A resposta de GET /mentores/:id/vagas agora inclui jovemEmail de quem cancelou a vaga antes. A spec diz [{"id","inicio"}].',
    pegam: ['contexto'],
    prioridade: 'bloqueia',
    porque: 'Quem sabe que esse endpoint é aberto vê o e-mail de um jovem vazando. Lint, testes e os dois subagents não sabem que o endpoint é aberto.',
  },
  {
    id: 'dependencia',
    onde: 'package.json',
    texto: 'Dependência nova "vagas-data-utils" que nenhum arquivo importa e que não existe no registro do npm.',
    pegam: ['seguranca', 'camadas'],
    prioridade: 'bloqueia',
    porque: 'Pacote que o modelo inventou é porta aberta para slopsquatting: alguém publica um pacote com esse nome e o npm install baixa sem reclamar. O revisor de segurança roda npm view e vê que não existe. O humano só vê se abrir o package.json.',
  },
  {
    id: 'escopo',
    onde: 'src/rotas/mentores.js',
    texto: 'O arquivo inteiro foi reescrito com variáveis renomeadas para inglês. Ninguém pediu e nenhum teste cobre.',
    pegam: ['camadas', 'sinais'],
    prioridade: 'nao-bloqueia',
    porque: 'O git diff --stat mostra um arquivo grande sem relação com o título do PR. Se o comportamento não muda, peça um PR separado e não trave este.',
  },
  {
    id: 'comentario',
    onde: 'src/rotas/vagas.js:24',
    texto: 'Comentário "devolve o objeto inteiro, mais fácil de depurar depois".',
    pegam: ['camadas', 'sinais'],
    prioridade: 'nao-bloqueia',
    porque: 'Sozinho, seria só ruído. Aqui ele justifica o vazamento, então vale apontar junto com o achado do jovemEmail.',
  },
  {
    id: 'nome',
    onde: 'src/rotas/vagas.js:8',
    texto: 'Função chamada tratarVagas, nome genérico.',
    pegam: ['camadas', 'sinais'],
    prioridade: 'nao-bloqueia',
    porque: 'Melhora a leitura e não muda comportamento. Comente com "Nit:" e siga.',
  },
];

export function achado(id) {
  return ACHADOS.find((a) => a.id === id);
}

const mesmoConjunto = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

// resposta: { pegam: [ids], prioridade: id }
export function avaliarAchado(id, resposta = {}) {
  const a = achado(id);
  const pegam = resposta.pegam || [];
  const certos = pegam.filter((p) => a.pegam.includes(p));
  const errados = pegam.filter((p) => !a.pegam.includes(p));
  const faltaram = a.pegam.filter((p) => !pegam.includes(p));
  return {
    quem: mesmoConjunto(pegam, a.pegam),
    certos,
    errados,
    faltaram,
    prioridade: resposta.prioridade === a.prioridade,
  };
}

export function pontuacao(respostas = {}) {
  let pontos = 0;
  let max = 0;
  for (const a of ACHADOS) {
    max += 2;
    const r = respostas[a.id];
    if (!r) continue;
    const av = avaliarAchado(a.id, r);
    if (av.quem) pontos += 1;
    if (av.prioridade) pontos += 1;
  }
  return { pontos, max };
}

// Matriz verdadeira: quantos achados cada revisor pega, e o que só um tipo de revisor pega.
export function matriz() {
  const colunas = REVISORES.map((r) => ({
    ...r,
    pega: ACHADOS.filter((a) => a.pegam.includes(r.id)).map((a) => a.id),
  }));
  const unicos = ACHADOS.filter((a) => a.pegam.length === 1).map((a) => ({ achado: a.id, so: a.pegam[0] }));
  const ninguemSozinho = REVISORES.every((r) => colunas.find((c) => c.id === r.id).pega.length < ACHADOS.length);
  return { colunas, unicos, ninguemSozinho };
}

export function bloqueios() {
  return ACHADOS.filter((a) => a.prioridade === 'bloqueia').map((a) => a.id);
}
