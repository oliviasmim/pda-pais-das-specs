const ctx = (c) => ({ t: ' ', c });
const add = (c) => ({ t: '+', c });
const del = (c) => ({ t: '-', c });
const novo = (texto) => texto.split('\n').map(add);

function hashFalso(semente) {
  const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let h = 2166136261;
  for (const ch of semente) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  let s = '';
  for (let i = 0; i < 40; i++) {
    h = Math.imul(h ^ (h >>> 13), 1103515245) >>> 0;
    s += abc[h % abc.length];
  }
  return `sha512-${s}==`;
}

const BUMPS = [
  ['accepts', '1.3.8', '1.3.9'],
  ['body-parser', '1.20.2', '1.20.3'],
  ['cookie', '0.6.0', '0.7.1'],
  ['debug', '2.6.9', '2.6.9'],
  ['encodeurl', '1.0.2', '2.0.0'],
  ['finalhandler', '1.2.0', '1.3.1'],
  ['mime-types', '2.1.34', '2.1.35'],
  ['path-to-regexp', '0.1.7', '0.1.12'],
  ['qs', '6.11.0', '6.13.0'],
  ['send', '0.18.0', '0.19.0'],
  ['serve-static', '1.15.0', '1.16.2'],
  ['side-channel', '1.0.4', '1.0.6'],
];

function lockfile() {
  const linhas = [
    ctx('    "node_modules/express": {'),
    ctx('      "version": "5.1.0",'),
  ];
  for (const [nome, de, para] of BUMPS) {
    linhas.push(ctx(`    "node_modules/${nome}": {`));
    linhas.push(del(`      "version": "${de}",`));
    linhas.push(del(`      "resolved": "https://registry.npmjs.org/${nome}/-/${nome}-${de}.tgz",`));
    linhas.push(del(`      "integrity": "${hashFalso(nome + de)}",`));
    linhas.push(add(`      "version": "${para}",`));
    linhas.push(add(`      "resolved": "https://registry.npmjs.org/${nome}/-/${nome}-${para}.tgz",`));
    linhas.push(add(`      "integrity": "${hashFalso(nome + para + 'x')}",`));
    linhas.push(ctx('    },'));
  }
  linhas.push(
    add('    "node_modules/lodash": {'),
    add('      "version": "4.17.21",'),
    add('      "resolved": "https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz",'),
    add(`      "integrity": "${hashFalso('lodash4.17.21')}",`),
    add('      "license": "MIT"'),
    add('    },'),
  );
  return linhas;
}

export const ARQUIVOS = [
  {
    caminho: 'package.json',
    status: 'modificado',
    tipo: 'config',
    linhas: [
      ctx('  "dependencies": {'),
      del('    "express": "^5.1.0"'),
      add('    "express": "^5.1.0",'),
      add('    "lodash": "^4.17.21"'),
      ctx('  },'),
    ],
  },
  {
    caminho: 'package-lock.json',
    status: 'modificado',
    tipo: 'config',
    linhas: lockfile(),
  },
  {
    caminho: 'src/app.js',
    status: 'modificado',
    tipo: 'src',
    linhas: [
      ctx("import express from 'express';"),
      ctx("import { rotasMentores } from './rotas/mentores.js';"),
      add("import { rotasAgendamentos } from './rotas/agendamentos.js';"),
      add("import { rotasVagas } from './rotas/vagas.js';"),
      ctx(''),
      ctx('  app.use(rotasMentores());'),
      ctx(''),
      ctx('  // ==== PONTO DE REGISTRO DAS TASKS (T1, T2, T3) ===='),
      ctx('  // Cada task importa o próprio arquivo de rotas no topo e registra aqui,'),
      ctx('  // numa linha logo abaixo deste comentário. Ex.: app.use(rotasAgendamento());'),
      add('  app.use(rotasAgendamentos());'),
      add('  app.use(rotasVagas());'),
      ctx('  // ==== FIM DO PONTO DE REGISTRO ===='),
    ],
  },
  {
    caminho: 'src/core/AbstractRepositoryAdapter.js',
    status: 'novo',
    tipo: 'src',
    linhas: novo(`export class AbstractRepositoryAdapter {
  /** @param {any} fonte */
  constructor(fonte) {
    if (new.target === AbstractRepositoryAdapter) {
      throw new TypeError('AbstractRepositoryAdapter é abstrata');
    }
    this.fonte = fonte;
  }

  /** @param {number} _id @returns {Promise<any>} */
  async buscarPorId(_id) {
    throw new Error('não implementado');
  }

  /** @param {any} _filtro @returns {Promise<any[]>} */
  async listar(_filtro) {
    throw new Error('não implementado');
  }

  /** @param {any} _entidade @returns {Promise<any>} */
  async salvar(_entidade) {
    throw new Error('não implementado');
  }

  /** @param {number} _id @param {any} _dados @returns {Promise<any>} */
  async atualizar(_id, _dados) {
    throw new Error('não implementado');
  }

  /** @param {any} registro */
  mapearParaDominio(registro) {
    return { ...registro };
  }

  /** @param {any} entidade */
  mapearParaPersistencia(entidade) {
    return { ...entidade };
  }
}`),
  },
  {
    caminho: 'src/core/VagaRepositoryAdapter.js',
    status: 'novo',
    tipo: 'src',
    linhas: novo(`import { AbstractRepositoryAdapter } from './AbstractRepositoryAdapter.js';

export class VagaRepositoryAdapter extends AbstractRepositoryAdapter {
  /** @param {number} id */
  async buscarPorId(id) {
    const vaga = await this.fonte.buscarVaga(id);
    return vaga ? this.mapearParaDominio(vaga) : null;
  }

  /** @param {{ mentorId: number }} filtro */
  async listar({ mentorId }) {
    const vagas = await this.fonte.listarVagasDoMentor(mentorId);
    return vagas.map((/** @type {any} */ v) => this.mapearParaDominio(v));
  }

  /** @param {number} id @param {any} dados */
  async atualizar(id, dados) {
    return this.fonte.atualizarVaga(id, dados);
  }
}`),
  },
  {
    caminho: 'src/rotas/agendamentos.js',
    status: 'novo',
    tipo: 'src',
    linhas: novo(`import { Router } from 'express';
import { repo } from '../repo.js';
import { VagaRepositoryAdapter } from '../core/VagaRepositoryAdapter.js';

const ANTECEDENCIA_MINIMA_HORAS = 2;
const EMAIL_VALIDO = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

/** @param {any} corpo */
function validar(corpo) {
  if (!Number.isInteger(corpo.vagaId)) return 'vagaId é obrigatório';
  if (!corpo.jovemEmail) return 'jovemEmail é obrigatório';
  if (!EMAIL_VALIDO.test(corpo.jovemEmail)) return 'jovemEmail inválido';
  return null;
}

/** @param {string} inicio */
function faltamHoras(inicio) {
  return (new Date(inicio).getTime() - Date.now()) / 36e5;
}

export function rotasAgendamentos() {
  const router = Router();
  const vagas = new VagaRepositoryAdapter(repo);

  router.post('/agendamentos', async (req, res) => {
    try {
      const erro = validar(req.body || {});
      if (erro) return res.status(400).json({ erro });

      const vaga = await vagas.buscarPorId(req.body.vagaId);
      if (!vaga) return res.status(404).json({ erro: 'Vaga não encontrada' });

      if (faltamHoras(vaga.inicio) < ANTECEDENCIA_MINIMA_HORAS) {
        return res.status(422).json({ erro: 'Agende com pelo menos 2h de antecedência' });
      }

      await vagas.atualizar(vaga.id, { livre: false });
      const agendamento = await repo.criarAgendamento({
        vagaId: vaga.id,
        mentorId: vaga.mentorId,
        jovemEmail: req.body.jovemEmail,
        status: 'confirmado',
      });
      return res.status(201).json(agendamento);
    } catch {
      return res.status(500).json({ erro: 'Não foi possível agendar' });
    }
  });

  return router;
}`),
  },
  {
    caminho: 'src/rotas/vagas.js',
    status: 'novo',
    tipo: 'src',
    linhas: novo(`import { Router } from 'express';
import _ from 'lodash';
import { repo } from '../repo.js';
import { VagaRepositoryAdapter } from '../core/VagaRepositoryAdapter.js';

const DATA = /^\\d{4}-\\d{2}-\\d{2}$/;

export function rotasVagas() {
  const router = Router();
  const vagas = new VagaRepositoryAdapter(repo);

  router.get('/mentores/:id/vagas', async (req, res) => {
    const mentorId = Number(req.params.id);
    if (!(await repo.buscarMentor(mentorId))) {
      return res.status(404).json({ erro: 'Mentor não encontrado' });
    }
    const { data } = req.query;
    if (data !== undefined && !DATA.test(String(data))) {
      return res.status(400).json({ erro: 'data inválida' });
    }
    const todas = await vagas.listar({ mentorId });
    const livres = todas.filter((v) => v.livre && (!data || v.inicio.startsWith(data)));
    const ordenadas = _.sortBy(livres, 'inicio');
    return res.status(200).json(ordenadas.map(({ id, inicio }) => ({ id, inicio })));
  });

  return router;
}`),
  },
  {
    caminho: 'tests/aceite/CHECKSUMS',
    status: 'modificado',
    tipo: 'teste',
    linhas: [
      ctx('8d0d49b55368a3aaf4f717f2a9b77f4116d75139c2b0df2df97b9906d73df5cd  tests/aceite/_aceite.js'),
      del('ddd598ebb8df61deb0acb1a33ac1f56d5d66430acf59b8fc717193315effeeda  tests/aceite/t1.test.js'),
      add('4f1c09e2b7a35d6e8c0f9a1b2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e  tests/aceite/t1.test.js'),
      ctx('53b227ecc516b1eeb364d6601f055f3cc1c4076005dbfd508c8e5813c26aa2fd  tests/aceite/t2.test.js'),
    ],
  },
  {
    caminho: 'tests/aceite/t1.test.js',
    status: 'modificado',
    tipo: 'teste',
    linhas: [
      ctx("test('T1 falha: vaga ocupada responde 409', opcoes, async () => {"),
      ctx('  const r = await pedir(`${api.url}/agendamentos`, {'),
      ctx("    method: 'POST',"),
      ctx("    body: { vagaId: 3, jovemEmail: 'ana@pda.org' },"),
      ctx('  });'),
      del('  assert.equal(r.status, 409);'),
      del("  assert.deepEqual(r.corpo, { erro: 'Vaga indisponível' });"),
      add('  assert.equal(r.status, 201);'),
      ctx('});'),
    ],
  },
  {
    caminho: 'tests/unit/vaga-adapter.test.js',
    status: 'novo',
    tipo: 'teste',
    linhas: novo(`import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VagaRepositoryAdapter } from '../../src/core/VagaRepositoryAdapter.js';

test('listar devolve as vagas do mentor', async () => {
  const fonteFalsa = {
    listarVagasDoMentor: async () => [{ id: 1, mentorId: 1, inicio: '2026-11-16T09:00', livre: true }],
  };
  const adapter = new VagaRepositoryAdapter(fonteFalsa);
  const vagas = await adapter.listar({ mentorId: 1 });
  assert.deepEqual(vagas, [{ id: 1, mentorId: 1, inicio: '2026-11-16T09:00', livre: true }]);
});

test('buscarPorId devolve a vaga', async () => {
  const fonteFalsa = { buscarVaga: async () => ({ id: 7, livre: true }) };
  const adapter = new VagaRepositoryAdapter(fonteFalsa);
  assert.deepEqual(await adapter.buscarPorId(7), { id: 7, livre: true });
});

test('atualizar chama a fonte', async () => {
  let chamado = false;
  const fonteFalsa = { atualizarVaga: async () => { chamado = true; } };
  await new VagaRepositoryAdapter(fonteFalsa).atualizar(1, { livre: false });
  assert.equal(chamado, true);
});`),
  },
  {
    caminho: 'tests/t3-vagas.test.js',
    status: 'novo',
    tipo: 'teste',
    linhas: novo(`import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { subirApp, pedir } from './aceite/_aceite.js';

let api;
before(async () => { api = await subirApp(); });
after(async () => { await api.fechar(); });

test('lista só vagas livres, em ordem de início', async () => {
  const r = await pedir(\`\${api.url}/mentores/1/vagas\`);
  assert.equal(r.status, 200);
  assert.ok(r.corpo.every((v, i) => i === 0 || r.corpo[i - 1].inicio <= v.inicio));
});

test('data mal formatada devolve 400', async () => {
  const r = await pedir(\`\${api.url}/mentores/1/vagas?data=16-11-2026\`);
  assert.equal(r.status, 400);
  assert.deepEqual(r.corpo, { erro: 'data inválida' });
});

test('mentor inexistente devolve 404', async () => {
  const r = await pedir(\`\${api.url}/mentores/999/vagas\`);
  assert.equal(r.status, 404);
  assert.deepEqual(r.corpo, { erro: 'Mentor não encontrado' });
});`),
  },
];

export const CAMADAS = [
  { n: 1, nome: 'Arquivos', pergunta: 'Que arquivos mudaram e quanto?', custo: '1 min' },
  { n: 2, nome: 'Assinaturas e contratos', pergunta: 'Que dependências, classes, rotas, constantes e status entraram?', custo: '3 min' },
  { n: 3, nome: 'Testes', pergunta: 'O que os testes provam de verdade?', custo: '8 min' },
  { n: 4, nome: 'Corpo', pergunta: 'O que o código faz linha a linha?', custo: '20 min' },
];

export const ALERTAS = [
  {
    id: 'rosas',
    nome: 'Teste de aceite alterado para passar',
    apelido: 'Rosas pintadas',
    carta: 'carta-rainha',
    camadas: [1, 3],
    destaque: ['tests/aceite/t1.test.js', 'tests/aceite/CHECKSUMS', 'assert.equal(r.status, 201)'],
    evidencias: {
      1: 'tests/aceite/t1.test.js e tests/aceite/CHECKSUMS aparecem como modificados. Teste de aceite é protegido: só muda junto com a spec.',
      3: 'O teste se chama "T1 falha: vaga ocupada responde 409" e agora espera 201. E o agente atualizou o CHECKSUMS para o guarda não reclamar: pintou a rosa e escondeu a tinta.',
    },
    explicacao: 'O agente não conseguiu fazer o 409 passar e trocou a asserção. É o pedido de "passar no teste" levado ao pé da letra. O hook protege-testes.mjs teria bloqueado a edição; o guarda da CI pegaria se o CHECKSUMS não tivesse sido pintado junto.',
  },
  {
    id: 'dependencia',
    nome: 'Dependência nova sem motivo',
    apelido: 'lodash para um sortBy',
    carta: 'navalha',
    camadas: [1, 2, 4],
    destaque: ['lodash'],
    evidencias: {
      1: 'package.json mudou e o package-lock.json tem quase 80 linhas alteradas. Lockfile grande é sintoma de dependência nova ou atualização em massa.',
      2: "import _ from 'lodash' aparece em src/rotas/vagas.js.",
      4: '_.sortBy(livres, "inicio") é o único uso. Array.prototype.sort resolve.',
    },
    explicacao: 'Uma biblioteca inteira para uma linha. E o lockfile ainda atualizou 12 pacotes de carona, sem ninguém pedir.',
  },
  {
    id: 'abstracao',
    nome: 'Abstração sem necessidade',
    apelido: 'AbstractRepositoryAdapter',
    carta: 'navalha',
    camadas: [1, 2, 4],
    destaque: ['AbstractRepositoryAdapter', 'VagaRepositoryAdapter', 'mapearPara'],
    evidencias: {
      1: 'Dois arquivos novos em src/core com "Abstract" e "Adapter" no nome. Nome de padrão de projeto em diff de feature pequena pede pergunta.',
      2: 'Classe abstrata com 4 métodos que lançam "não implementado" e 2 mappers que copiam o objeto.',
      4: 'Os mappers fazem { ...registro }. O adapter só repassa chamadas para src/repo.js.',
    },
    explicacao: 'Complexidade acidental. Nenhum teste de aceite exige a camada. A carta 🎩 Navalha remove dois arquivos.',
  },
  {
    id: 'regra',
    nome: 'Regra de negócio não pedida',
    apelido: 'Antecedência mínima de 2h',
    carta: 'rastro',
    camadas: [2, 4],
    destaque: ['ANTECEDENCIA_MINIMA_HORAS', 'res.status(422)'],
    evidencias: {
      2: 'Constante ANTECEDENCIA_MINIMA_HORAS = 2 e um status 422 que não existem na spec.',
      4: 'faltamHoras(vaga.inicio) < 2 devolve 422. A spec não fala de antecedência.',
    },
    explicacao: 'Plausível e inventada. A spec lista o que está fora do escopo; antecedência nem aparece. Carta ♠ Rastro: onde está escrito isso?',
  },
  {
    id: 'falta409',
    nome: 'Caso de falha da spec sumiu',
    apelido: 'Cadê o 409?',
    carta: 'par',
    camadas: [2, 3, 4],
    destaque: ['await vagas.atualizar(vaga.id, { livre: false });'],
    evidencias: {
      2: 'Os status do diff são 400, 404, 422, 201, 500 e 200. A tabela da spec tem 409 para vaga ocupada. Ausência também é evidência.',
      3: 'Nenhum teste do diff espera 409. O único que esperava foi alterado.',
      4: 'Depois de achar a vaga, o código nunca olha vaga.livre. Duas pessoas agendam a mesma vaga.',
    },
    explicacao: 'O erro de verdade que as rosas pintadas escondiam. E o NFR-1 (concorrência) nem chegou a ser considerado.',
  },
  {
    id: 'generico',
    nome: 'Erro genérico',
    apelido: 'catch → 500',
    carta: 'contrato',
    camadas: [2, 4],
    destaque: ['res.status(500)'],
    evidencias: {
      2: 'res.status(500) com "Não foi possível agendar" no contrato da rota.',
      4: 'O try/catch envolve tudo. Qualquer exceção do repo vira 500 sem log e sem causa.',
    },
    explicacao: 'Esconde a causa. Para quem chama a API, "Não foi possível agendar" não diz o que corrigir. Para quem opera, não deixa rastro.',
  },
  {
    id: 'tartaruga',
    nome: 'Teste que só testa o mock',
    apelido: 'Falsa Tartaruga',
    carta: 'contraprova',
    camadas: [3],
    destaque: ['fonteFalsa'],
    evidencias: {
      3: 'tests/unit/vaga-adapter.test.js cria uma fonteFalsa, pede ao adapter para repassar e confere que voltou o que a própria fonteFalsa devolveu. O teste passaria com qualquer regra de negócio quebrada.',
    },
    explicacao: 'Três testes, zero comportamento verificado. Aumenta a cobertura e não protege nada. Carta ♣ Contraprova: que bug este teste pegaria?',
  },
];

export function estatisticas(arquivos = ARQUIVOS) {
  return arquivos.map((a) => ({
    caminho: a.caminho,
    status: a.status,
    tipo: a.tipo,
    adicoes: a.linhas.filter((l) => l.t === '+').length,
    remocoes: a.linhas.filter((l) => l.t === '-').length,
  }));
}

export function totalLinhas(arquivos = ARQUIVOS) {
  return estatisticas(arquivos).reduce((s, a) => s + a.adicoes + a.remocoes, 0);
}

const PADROES_ASSINATURA = [
  /^\s*import\s/,
  /^\s*export\s/,
  /require\(/,
  /module\.exports/,
  /^\s*class\s/,
  /^\s*(async\s+)?function\s/,
  /router\.(get|post|put|patch|delete)\(/,
  /res\.status\(\d{3}\)/,
  /^\s*const [A-Z][A-Z0-9_]+\s*=/,
  /^\s*(async\s+)?[a-zA-Z]+\([^)]*\)\s*\{\s*$/,
  /^\s*"[a-z@][^"]*":\s*"\^?\d/,
];

export function extrairAssinaturas(arquivos = ARQUIVOS) {
  const saida = [];
  for (const a of arquivos) {
    if (a.tipo === 'teste' || a.caminho.endsWith('-lock.json')) continue;
    a.linhas.forEach((l, i) => {
      if (l.t !== '+') return;
      if (PADROES_ASSINATURA.some((p) => p.test(l.c))) {
        saida.push({ caminho: a.caminho, indice: i, texto: l.c.trim() });
      }
    });
  }
  return saida;
}

export function arquivosDaCamada(n, arquivos = ARQUIVOS) {
  if (n === 3) return arquivos.filter((a) => a.tipo === 'teste');
  if (n === 4) return arquivos.filter((a) => a.tipo === 'src');
  return [];
}

export function pontosPorCamada(camada) {
  return Math.max(0, 5 - camada);
}

export function pontuacaoMaxima() {
  return ALERTAS.reduce((s, a) => s + pontosPorCamada(Math.min(...a.camadas)), 0);
}

export function conferir(camada, marcados, achados = {}) {
  const novos = [];
  const falsos = [];
  const repetidos = [];
  for (const id of marcados) {
    const alerta = ALERTAS.find((a) => a.id === id);
    if (!alerta) continue;
    if (achados[id]) {
      repetidos.push(id);
    } else if (alerta.camadas.includes(camada)) {
      novos.push(id);
    } else {
      falsos.push(id);
    }
  }
  const pontos = novos.length * pontosPorCamada(camada) - falsos.length;
  return { novos, falsos, repetidos, pontos };
}

export function resumo(achados = {}, falsos = 0) {
  const porCamada = [0, 0, 0, 0];
  let pontos = 0;
  for (const [id, camada] of Object.entries(achados)) {
    if (!ALERTAS.some((a) => a.id === id)) continue;
    porCamada[camada - 1] += 1;
    pontos += pontosPorCamada(camada);
  }
  const perdidos = ALERTAS.filter((a) => !achados[a.id]).map((a) => a.id);
  return {
    pontos: Math.max(0, pontos - falsos),
    maximo: pontuacaoMaxima(),
    porCamada,
    perdidos,
    achadosAte2: porCamada[0] + porCamada[1],
  };
}

export function linhaEmDestaque(texto, idsAchados) {
  return ALERTAS.some((a) => idsAchados.includes(a.id) && a.destaque.some((d) => texto.includes(d)));
}
