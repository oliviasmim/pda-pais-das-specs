// Laboratório "faxina de contexto": o que entra no prompt para implementar a T1.
export const JANELA = 200000;
export const BASE = 18000; // prompt de sistema + ferramentas, sempre presentes
export const LIMITE_SMART = 0.6; // régua do curso, não limite publicado

export const FICHAS = [
  { id: 'spec-t1', nome: 'Spec da T1 (POST /agendamentos)', tokens: 3000, papel: 'essencial', falta: 'Sem a spec, o agente inventa status e mensagens de erro.' },
  { id: 'agents-md', nome: 'AGENTS.md com as regras do projeto', tokens: 1500, papel: 'essencial', falta: 'Sem as regras, o agente edita teste para fazê-lo passar.' },
  { id: 'adr', nome: 'ADR-001: repositório em memória', tokens: 800, papel: 'essencial', falta: 'Sem o ADR, o agente propõe PostgreSQL por conta própria.' },
  { id: 'exemplo', nome: 'Código do GET /mentores (padrão a imitar)', tokens: 1200, papel: 'util', falta: 'Sem o exemplo, o padrão de resposta pode sair diferente do resto da API.' },
  { id: 'resumo-concorrencia', nome: 'Resumo de 12 linhas do subagent sobre concorrência', tokens: 600, papel: 'util', falta: 'Sem o resumo, o agente não sabe que a vaga precisa de checagem atômica.' },
  { id: 'log-testes', nome: 'Saída de 400 linhas de uma rodada de testes que já passou', tokens: 22000, papel: 'ruido' },
  { id: 'lock', nome: 'package-lock.json inteiro', tokens: 40000, papel: 'ruido' },
  { id: 'docs-express', nome: 'Documentação completa do Express colada na conversa', tokens: 35000, papel: 'ruido' },
  { id: 'conversa-cores', nome: 'Conversa de ontem sobre as cores do site', tokens: 6000, papel: 'ruido' },
  { id: 'log-bruto', nome: 'Log bruto do teste de concorrência (o resumo dele já está acima)', tokens: 28000, papel: 'ruido' },
];

export const PAPEIS = {
  essencial: 'sem isso o agente inventa',
  util: 'ajuda, mas dá para viver sem',
  ruido: 'não serve a esta tarefa',
};

export function zona(fracao) {
  if (fracao <= LIMITE_SMART) return 'smart';
  if (fracao < 0.9) return 'dumb';
  return 'cheia';
}

export function avaliar(selecionadas, fichas = FICHAS) {
  const ids = new Set(selecionadas);
  const dentro = fichas.filter((f) => ids.has(f.id));
  const tokens = BASE + dentro.reduce((a, f) => a + f.tokens, 0);
  const fracao = tokens / JANELA;
  const faltando = fichas.filter((f) => f.papel === 'essencial' && !ids.has(f.id));
  const utilFora = fichas.filter((f) => f.papel === 'util' && !ids.has(f.id));
  const ruido = dentro.filter((f) => f.papel === 'ruido');
  const z = zona(fracao);
  let veredito = 'parcial';
  if (faltando.length === 0 && ruido.length === 0 && utilFora.length === 0) veredito = 'ideal';
  else if (faltando.length === 0 && ruido.length === 0) veredito = 'bom';
  else if (faltando.length > 0 && z === 'smart') veredito = 'vazio';
  else if (faltando.length === 0 && z !== 'smart') veredito = 'poluido';
  else if (faltando.length === 0) veredito = 'sobra';
  return { tokens, fracao, zona: z, faltando, utilFora, ruido, veredito };
}

export const VEREDITOS = {
  ideal: 'Abaixo de 60%, com a spec, as regras, o ADR, o exemplo e o resumo. Sobra espaço para as saídas de teste que ainda vão entrar.',
  bom: 'Está limpo e tem o essencial. Falta só o que ajudaria (as fichas úteis).',
  poluido: 'Tem o essencial, mas o ruído passou dos 60%. Na dumb zone o agente começa a esquecer o que leu primeiro, e o que ele leu primeiro foi a spec.',
  sobra: 'Tem o essencial e está abaixo de 60%, mas ainda sobra ruído. O ruído come a folga que as saídas de teste da T1 ainda vão precisar. Tire o que não serve.',
  vazio: 'A janela está leve, mas faltou o essencial (veja a lista abaixo). O agente vai preencher a lacuna com suposição.',
  parcial: 'Falta essencial e sobra ruído ao mesmo tempo. Comece pelo essencial e depois tire o ruído.',
};

export function formatarTokens(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')}k` : String(n);
}
