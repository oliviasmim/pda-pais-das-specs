export const JANELA = 200000;
export const BASE_PRINCIPAL = 18000;
export const BASE_SUBAGENT = 12000;
export const CUSTO_PEDIDO = 1500;
export const CUSTO_RESUMO = 2000;
export const LIMITE_SMART = 0.4;

export const ACOES = [
  { id: 'spec', nome: 'Ler a spec e a task T1', tokens: 6000, tipo: 'implementar' },
  { id: 'explorar', nome: 'Explorar src/ e as rotas existentes', tokens: 14000, tipo: 'investigar' },
  { id: 'testes', nome: 'Ler os testes existentes', tokens: 9000, tipo: 'investigar' },
  { id: 'log-concorrencia', nome: 'Investigar log do teste de concorrência', tokens: 22000, tipo: 'investigar' },
  { id: 'rodar-1', nome: 'Rodar os testes (saída longa de erro)', tokens: 18000, tipo: 'investigar' },
  { id: 'docs', nome: 'Pesquisar handlers assíncronos no Express', tokens: 16000, tipo: 'investigar' },
  { id: 'implementar', nome: 'Implementar POST /agendamentos', tokens: 8000, tipo: 'implementar' },
  { id: 'rodar-2', nome: 'Rodar os testes de novo (falha)', tokens: 15000, tipo: 'investigar' },
  { id: 'corrigir', nome: 'Corrigir a validação de e-mail', tokens: 6000, tipo: 'implementar' },
  { id: 'gates', nome: 'Rodar lint, types e testes', tokens: 12000, tipo: 'investigar' },
];

export function zona(fracao) {
  if (fracao <= LIMITE_SMART) return 'smart';
  if (fracao < 0.9) return 'dumb';
  return 'cheia';
}

export function deveDelegar(acao, delegar) {
  if (delegar === true) return acao.tipo === 'investigar';
  if (delegar instanceof Set) return delegar.has(acao.id) && acao.tipo === 'investigar';
  return false;
}

export function simular({ acoes = ACOES, delegar = false, janela = JANELA } = {}) {
  let principal = BASE_PRINCIPAL;
  let gastoSubagents = 0;
  let picoSubagent = 0;
  const passos = [];
  for (const acao of acoes) {
    if (deveDelegar(acao, delegar)) {
      const sub = BASE_SUBAGENT + CUSTO_PEDIDO + acao.tokens + CUSTO_RESUMO;
      gastoSubagents += sub;
      picoSubagent = Math.max(picoSubagent, sub);
      principal += CUSTO_PEDIDO + CUSTO_RESUMO;
      passos.push({ acao, delegada: true, principal, subagent: sub, fracao: principal / janela, fracaoSubagent: sub / janela });
    } else {
      principal += acao.tokens;
      passos.push({ acao, delegada: false, principal, subagent: 0, fracao: principal / janela, fracaoSubagent: 0 });
    }
  }
  const primeiroDumb = passos.findIndex((p) => zona(p.fracao) !== 'smart');
  return {
    passos,
    principalFinal: principal,
    fracaoFinal: principal / janela,
    zonaFinal: zona(principal / janela),
    gastoTotal: principal + gastoSubagents,
    gastoSubagents,
    picoSubagent,
    primeiroDumb,
  };
}

export function comparar(opcoes = {}) {
  const sem = simular({ ...opcoes, delegar: false });
  const com = simular({ ...opcoes, delegar: true });
  return {
    sem,
    com,
    economiaPrincipal: sem.principalFinal - com.principalFinal,
    custoExtra: com.gastoTotal - sem.gastoTotal,
  };
}

export function formatarTokens(n) {
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}
