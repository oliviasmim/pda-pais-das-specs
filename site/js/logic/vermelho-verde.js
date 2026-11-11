// Red, green, refactor: a prova está no git log, não na narração.
// Cada commit diz quais arquivos tocou e se o teste ficou vermelho ou verde naquele ponto.
// Sem DOM. Cenário: T2 (cancelar agendamento) da agenda de mentorias.

export const PASSOS = [
  { id: 'red', nome: 'Red', texto: 'Escreva o teste. Rode. Ele falha. Faça o commit só do teste.', cor: 'copas' },
  { id: 'green', nome: 'Green', texto: 'Escreva o mínimo de código para o teste passar. Rode. Passa. Commit.', cor: 'folha' },
  { id: 'refactor', nome: 'Refactor', texto: 'Limpe sem mudar o comportamento. Rode de novo. Continua verde. Commit.', cor: 'tinta' },
];

export const MOTIVOS = {
  ok: 'Prova válida',
  'mesmo-commit': 'Teste e código no mesmo commit',
  'codigo-antes': 'Código antes do teste',
  'nunca-vermelho': 'O teste nunca ficou vermelho',
  'sem-teste': 'Não existe commit de teste',
};

const tocaTeste = (c) => c.arquivos.some((a) => a.startsWith('tests/'));
const tocaCodigo = (c) => c.arquivos.some((a) => a.startsWith('src/'));

// commits: do mais antigo para o mais novo.
export function julgarLog(commits) {
  const iTeste = commits.findIndex(tocaTeste);
  if (iTeste === -1) return { valido: false, motivo: 'sem-teste' };
  const primeiroTeste = commits[iTeste];
  if (tocaTeste(primeiroTeste) && tocaCodigo(primeiroTeste)) return { valido: false, motivo: 'mesmo-commit' };
  const iCodigo = commits.findIndex(tocaCodigo);
  if (iCodigo !== -1 && iCodigo < iTeste) return { valido: false, motivo: 'codigo-antes' };
  if (primeiroTeste.resultado !== 'falha') return { valido: false, motivo: 'nunca-vermelho' };
  return { valido: true, motivo: 'ok' };
}

export const LOGS = [
  {
    id: 'honesto',
    titulo: 'Log A',
    commits: [
      { hash: 'a1f03c2', msg: 'test: red, cancelar agendamento já cancelado responde 409', arquivos: ['tests/cancelar.test.js'], resultado: 'falha' },
      { hash: 'b7d91e0', msg: 'feat: green, DELETE /agendamentos/:id', arquivos: ['src/routes/agendamentos.js'], resultado: 'passa' },
      { hash: 'c42aa18', msg: 'refactor: extrai a busca do agendamento', arquivos: ['src/routes/agendamentos.js'], resultado: 'passa' },
    ],
  },
  {
    id: 'junto',
    titulo: 'Log B',
    commits: [
      { hash: 'd19b7a4', msg: 'feat: cancelar agendamento com testes', arquivos: ['src/routes/agendamentos.js', 'tests/cancelar.test.js'], resultado: 'passa' },
    ],
  },
  {
    id: 'ordem',
    titulo: 'Log C',
    commits: [
      { hash: 'e5c0f31', msg: 'feat: DELETE /agendamentos/:id', arquivos: ['src/routes/agendamentos.js'], resultado: 'passa' },
      { hash: 'f8a2d66', msg: 'test: cobre o cancelamento', arquivos: ['tests/cancelar.test.js'], resultado: 'passa' },
    ],
  },
  {
    id: 'verde-de-cara',
    titulo: 'Log D',
    commits: [
      { hash: '0a9e3b5', msg: 'test: red, cancelar devolve a vaga', arquivos: ['tests/cancelar.test.js'], resultado: 'passa' },
      { hash: '1c7d482', msg: 'feat: green, devolve a vaga ao cancelar', arquivos: ['src/routes/agendamentos.js'], resultado: 'passa' },
    ],
  },
];

export function log(id) {
  return LOGS.find((l) => l.id === id);
}

export const COMANDO = 'git log --reverse --oneline --stat';

// motivo escolhido: uma chave de MOTIVOS. 'ok' significa "a prova é válida".
export function conferir(logId, escolha) {
  const valido = escolha === 'ok';
  const motivo = escolha;
  const real = julgarLog(log(logId).commits);
  const acertouVeredito = real.valido === valido;
  const acertouMotivo = real.valido ? true : real.motivo === motivo;
  return { real, acertouVeredito, acertouMotivo, acertou: acertouVeredito && acertouMotivo };
}
