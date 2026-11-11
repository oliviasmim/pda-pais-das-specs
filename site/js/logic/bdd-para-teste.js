const L = '(?<![\\p{L}])';
const R = '(?![\\p{L}])';

const SECOES = [
  { chave: 'dado', re: new RegExp(`^(dado|given)${R}`, 'iu') },
  { chave: 'quando', re: new RegExp(`^(quando|when)${R}`, 'iu') },
  { chave: 'entao', re: new RegExp(`^(então|entao|then)${R}`, 'iu') },
];
const CONTINUA = new RegExp(`^(e|mas|and|but)${R}`, 'iu');
const NOME = new RegExp(`^(cenário|cenario|scenario)\\s*:`, 'iu');

const limparLinha = (l) => l.trim().replace(/^[-*]\s+/, '');

/** Lê um cenário Gherkin em português (ou inglês) e separa em Dado / Quando / Então. */
export function lerCenario(texto = '') {
  const c = { nome: '', dado: [], quando: [], entao: [] };
  let atual = null;
  for (const bruta of texto.split(/\r?\n/)) {
    const linha = limparLinha(bruta);
    if (!linha || linha.startsWith('#') || linha.startsWith('```')) continue;
    if (NOME.test(linha)) {
      c.nome = linha.replace(NOME, '').trim();
      continue;
    }
    const secao = SECOES.find((s) => s.re.test(linha));
    if (secao) {
      atual = secao.chave;
      c[atual].push(linha.replace(secao.re, '').trim());
      continue;
    }
    if (CONTINUA.test(linha) && atual) {
      c[atual].push(linha.replace(CONTINUA, '').trim());
    }
  }
  return c;
}

const VAGO = /(funciona|corretamente|adequadamente|normalmente|sem problemas?|como esperado|tudo certo|\bok\b)/i;
const OBSERVAVEL = /(\d|"|'|`|confirmad|cancelad|livre|indispon|erro|vazi[ao]|lista)/i;

export function avaliarCenario(c) {
  const avisos = [];
  if (!c.nome) avisos.push({ tipo: 'faltando', campo: 'nome', msg: 'Falta o nome: "Cenário: ...". Ele vira o nome do teste.' });
  if (!c.dado.length) avisos.push({ tipo: 'faltando', campo: 'dado', msg: 'Falta o Dado: em que estado o sistema começa.' });
  if (!c.quando.length) avisos.push({ tipo: 'faltando', campo: 'quando', msg: 'Falta o Quando: a ação que dispara o comportamento.' });
  if (!c.entao.length) avisos.push({ tipo: 'faltando', campo: 'entao', msg: 'Falta o Então: o resultado que um teste consegue conferir.' });
  if (c.quando.length > 1) avisos.push({ tipo: 'composto', campo: 'quando', msg: 'Tem mais de um Quando. Um cenário, uma ação. Separe em dois cenários.' });
  if (c.entao.length) {
    const texto = c.entao.join(' ');
    if (VAGO.test(texto)) avisos.push({ tipo: 'vago', campo: 'entao', msg: 'O Então é vago ("funciona", "corretamente"). Escreva o valor que o teste confere: status, corpo, estado da vaga.' });
    else if (!OBSERVAVEL.test(texto)) avisos.push({ tipo: 'vago', campo: 'entao', msg: 'O Então não traz nada que o teste confira: nenhum número, texto exato ou estado. Coloque o status, o corpo ou o estado da vaga.' });
  }
  return avisos;
}

const aspas = (s) => JSON.stringify(s);

/** Esqueleto de teste node:test: um cenário, um teste, com Dado/Quando/Então como comentários. */
export function gerarTeste(c) {
  const bloco = (rotulo, linhas, todo) => {
    if (!linhas.length) return `  // ${rotulo}: (falta)\n  // TODO: ${todo}`;
    const [primeira, ...resto] = linhas;
    return [`  // ${rotulo}: ${primeira}`, ...resto.map((l) => `  //    e ${l}`), `  // TODO: ${todo}`].join('\n');
  };
  return [
    "import { test } from 'node:test';",
    "import assert from 'node:assert/strict';",
    '',
    `test(${aspas(c.nome || 'nome do cenário')}, async () => {`,
    bloco('Dado', c.dado, 'monte o estado inicial (vaga, mentor, agendamento)'),
    '',
    bloco('Quando', c.quando, 'execute a ação e guarde a resposta'),
    '',
    bloco('Então', c.entao, 'assert.equal(...) com o valor exato esperado'),
    '});',
    '',
  ].join('\n');
}

export const CENARIOS = [
  {
    id: 'agendar',
    nome: 'Bom: agendar vaga livre',
    texto: `Cenário: jovem agenda uma vaga livre
  Dado que a vaga 1 do mentor 2 está livre
  Quando o jovem "ana@pda.org" envia POST /agendamentos com vagaId 1
  Então a resposta é 201 com status "confirmado"
  E a vaga 1 passa a livre: false`,
    esperado: [],
  },
  {
    id: 'indisponivel',
    nome: 'Bom: vaga indisponível',
    texto: `Cenário: vaga já reservada não pode ser agendada de novo
  Dado que a vaga 1 está com livre: false
  Quando o jovem "bia@pda.org" envia POST /agendamentos com vagaId 1
  Então a resposta é 409 com {"erro":"Vaga indisponível"}`,
    esperado: [],
  },
  {
    id: 'cancelar-duas-vezes',
    nome: 'Bom: cancelar duas vezes',
    texto: `Cenário: agendamento já cancelado não cancela de novo
  Dado que o agendamento 7 está com status "cancelado"
  Quando alguém envia DELETE /agendamentos/7
  Então a resposta é 409 com {"erro":"Agendamento já cancelado"}`,
    esperado: [],
  },
  {
    id: 'vago',
    nome: 'Defeito: Então vago',
    texto: `Cenário: agendamento funciona
  Dado uma vaga
  Quando o jovem agenda
  Então o sistema funciona corretamente`,
    esperado: ['vago'],
  },
  {
    id: 'duas-acoes',
    nome: 'Defeito: duas ações',
    texto: `Cenário: agenda e cancela
  Dado que a vaga 1 está livre
  Quando o jovem agenda a vaga 1
  E o jovem cancela o agendamento
  Então a vaga 1 volta a livre: true`,
    esperado: ['composto'],
  },
];
