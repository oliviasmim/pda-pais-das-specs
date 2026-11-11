// Teste que não prova nada: quebra a implementação de propósito e vê se o teste percebe.
// Cenário: POST /agendamentos da agenda de mentorias (docs/specs/dominio-agenda-mentorias.md).
// Nada aqui toca no DOM. As "implementações" são funções comuns, sem eval.

export const STATEMENTS = ['s1', 's2', 's3', 's4', 's5'];

export const novoRepo = () => ({
  vagas: {
    1: { id: 1, mentorId: 7, livre: true },
    2: { id: 2, mentorId: 7, livre: false },
  },
});

const marcar = (cov, id) => {
  if (cov) cov.add(id);
};

// Corpo recebido: { vagaId, jovemEmail }. Devolve { status, corpo }.
const correta = (repo, corpo, cov) => {
  const vaga = repo.vagas[corpo.vagaId]; marcar(cov, 's1');
  if (!vaga) { marcar(cov, 's2'); return { status: 404, corpo: { erro: 'Vaga não encontrada' } }; }
  if (!vaga.livre) { marcar(cov, 's3'); return { status: 409, corpo: { erro: 'Vaga indisponível' } }; }
  vaga.livre = false; marcar(cov, 's4');
  marcar(cov, 's5');
  return { status: 201, corpo: { vagaId: vaga.id, jovemEmail: corpo.jovemEmail, status: 'confirmado' } };
};

const semConflito = (repo, corpo) => {
  const vaga = repo.vagas[corpo.vagaId];
  if (!vaga) return { status: 404, corpo: { erro: 'Vaga não encontrada' } };
  vaga.livre = false;
  return { status: 201, corpo: { vagaId: vaga.id, jovemEmail: corpo.jovemEmail, status: 'confirmado' } };
};

const statusErrado = (repo, corpo) => {
  const r = correta(repo, corpo);
  return r.status === 201 ? { ...r, status: 200 } : r;
};

const naoReserva = (repo, corpo) => {
  const vaga = repo.vagas[corpo.vagaId];
  if (!vaga) return { status: 404, corpo: { erro: 'Vaga não encontrada' } };
  if (!vaga.livre) return { status: 409, corpo: { erro: 'Vaga indisponível' } };
  return { status: 201, corpo: { vagaId: vaga.id, jovemEmail: corpo.jovemEmail, status: 'confirmado' } };
};

const mensagemErrada = (repo, corpo) => {
  const r = correta(repo, corpo);
  return r.status === 409 ? { status: 409, corpo: { erro: 'Vaga ocupada' } } : r;
};

const apagada = () => undefined;

export const IMPLEMENTACOES = [
  { id: 'correta', nome: 'Código correto', correta: true, fn: correta, mudanca: 'sem mudança' },
  { id: 'sem-409', nome: 'Aceita vaga ocupada', fn: semConflito, mudanca: "- if (!vaga.livre) return 409 ...", defeito: 'A mesma vaga pode ser agendada por dois jovens.' },
  { id: 'status-200', nome: 'Responde 200 em vez de 201', fn: statusErrado, mudanca: '- return { status: 201, ... }\n+ return { status: 200, ... }', defeito: 'A spec diz 201 para agendamento criado.' },
  { id: 'nao-reserva', nome: 'Não marca a vaga como ocupada', fn: naoReserva, mudanca: '- vaga.livre = false', defeito: 'A vaga continua livre depois de agendada, e o próximo jovem consegue reservar de novo.' },
  { id: 'mensagem', nome: 'Mensagem de erro trocada', fn: mensagemErrada, mudanca: "- 'Vaga indisponível'\n+ 'Vaga ocupada'", defeito: 'A spec diz "Vaga indisponível". Quem consome a API quebra.' },
  { id: 'apagada', nome: 'Função apagada (devolve nada)', fn: apagada, mudanca: '- (corpo inteiro da função)', defeito: 'A rota inteira deixou de existir.' },
];

export const TESTES = [
  {
    id: 'mock',
    padrao: 'O teste testa o mock',
    fonte: `test('agendar confirma a vaga', () => {
  const agendarFalso = () => ({ status: 201 });
  const r = agendarFalso({ vagaId: 1, jovemEmail: 'ana@exemplo.org' });
  assert.equal(r.status, 201);
});`,
    rodar() {
      const agendarFalso = () => ({ status: 201 });
      const r = agendarFalso();
      return r.status === 201;
    },
  },
  {
    id: 'tautologia',
    padrao: 'O assert que sempre passa',
    fonte: `test('agendar vaga livre', () => {
  const r = agendar(repo, { vagaId: 1, jovemEmail: 'ana@exemplo.org' });
  assert.ok(r.status === 201 || r.status !== 201);
});`,
    rodar(impl, cov) {
      const r = impl(novoRepo(), { vagaId: 1, jovemEmail: 'ana@exemplo.org' }, cov);
      // Tautologia. Só quebra se r for undefined (TypeError ao ler r.status).
      return r.status === 201 || r.status !== 201;
    },
  },
  {
    id: 'truthy',
    padrao: 'Cobertura alta, nada conferido',
    fonte: `test('agendar responde', () => {
  assert.ok(agendar(repo, { vagaId: 1, jovemEmail: 'ana@exemplo.org' }));
  assert.ok(agendar(repo, { vagaId: 2, jovemEmail: 'bia@exemplo.org' }));
  assert.ok(agendar(repo, { vagaId: 99, jovemEmail: 'caio@exemplo.org' }));
});`,
    rodar(impl, cov) {
      const repo = novoRepo();
      const a = impl(repo, { vagaId: 1, jovemEmail: 'ana@exemplo.org' }, cov);
      const b = impl(repo, { vagaId: 2, jovemEmail: 'bia@exemplo.org' }, cov);
      const c = impl(repo, { vagaId: 99, jovemEmail: 'caio@exemplo.org' }, cov);
      return Boolean(a) && Boolean(b) && Boolean(c);
    },
  },
  {
    id: 'bom',
    padrao: 'Teste que confere o comportamento',
    bom: true,
    fonte: `test('agendar segue a tabela da spec', () => {
  const ok = agendar(repo, { vagaId: 1, jovemEmail: 'ana@exemplo.org' });
  assert.equal(ok.status, 201);
  assert.equal(repo.vagas[1].livre, false);

  const ocupada = agendar(repo, { vagaId: 2, jovemEmail: 'bia@exemplo.org' });
  assert.equal(ocupada.status, 409);
  assert.equal(ocupada.corpo.erro, 'Vaga indisponível');

  const inexistente = agendar(repo, { vagaId: 99, jovemEmail: 'caio@exemplo.org' });
  assert.equal(inexistente.status, 404);
});`,
    rodar(impl, cov) {
      const repo = novoRepo();
      const ok = impl(repo, { vagaId: 1, jovemEmail: 'ana@exemplo.org' }, cov);
      if (ok.status !== 201) return false;
      if (repo.vagas[1].livre !== false) return false;
      const ocupada = impl(repo, { vagaId: 2, jovemEmail: 'bia@exemplo.org' }, cov);
      if (ocupada.status !== 409 || ocupada.corpo.erro !== 'Vaga indisponível') return false;
      const inexistente = impl(repo, { vagaId: 99, jovemEmail: 'caio@exemplo.org' }, cov);
      return inexistente.status === 404;
    },
  },
];

export function teste(id) {
  return TESTES.find((t) => t.id === id);
}

export function implementacao(id) {
  return IMPLEMENTACOES.find((i) => i.id === id);
}

// Roda um teste contra uma implementação. Exceção conta como teste vermelho.
export function rodarTeste(testeId, implId) {
  const t = teste(testeId);
  const i = implementacao(implId);
  if (!t || !i) throw new Error('teste ou implementação desconhecidos');
  try {
    return { passou: t.rodar(i.fn) === true, erro: null };
  } catch (e) {
    return { passou: false, erro: e instanceof Error ? e.message : String(e) };
  }
}

// Cobertura de linhas que o teste produz sobre o código correto.
export function cobertura(testeId) {
  const t = teste(testeId);
  const cov = new Set();
  try {
    t.rodar(correta, cov);
  } catch {
    // ignora: só interessa o que executou
  }
  return { executadas: cov.size, total: STATEMENTS.length, pct: Math.round((cov.size / STATEMENTS.length) * 100) };
}

export const QUEBRAS = IMPLEMENTACOES.filter((i) => !i.correta);

// Mutação: quantas quebras o teste percebeu (ficou vermelho).
export function mutacao(testeId) {
  const resultados = QUEBRAS.map((q) => ({ id: q.id, ...rodarTeste(testeId, q.id) }));
  const mortos = resultados.filter((r) => !r.passou).map((r) => r.id);
  const sobreviventes = resultados.filter((r) => r.passou).map((r) => r.id);
  return { resultados, mortos, sobreviventes, escore: Math.round((mortos.length / resultados.length) * 100) };
}

export function veredito(testeId) {
  const base = rodarTeste(testeId, 'correta');
  if (!base.passou) return { tipo: 'quebrado', texto: 'O teste falha até com o código correto. Conserte o teste antes de usar ele para julgar alguma coisa.' };
  const m = mutacao(testeId);
  const c = cobertura(testeId);
  if (m.sobreviventes.length === 0) return { tipo: 'prova', texto: `Ficou vermelho nas ${m.mortos.length} quebras. Ele confere status, mensagem e estado da vaga, então prova algo.`, mutacao: m, cobertura: c };
  if (m.mortos.length === 0) return { tipo: 'nada', texto: `Ficou verde nas ${m.sobreviventes.length} quebras, com ${c.pct}% de cobertura. Apagar a função ou trocar a regra dá no mesmo para ele.`, mutacao: m, cobertura: c };
  return { tipo: 'parcial', texto: `Ficou vermelho em ${m.mortos.length} de ${m.resultados.length} quebras. As outras ${m.sobreviventes.length} chegam na main com o check verde.`, mutacao: m, cobertura: c };
}
