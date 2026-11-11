// Worktree isola ARQUIVO. Subagent isola CONTEXTO. São dois eixos.
// Cada situação diz o que precisa ficar separado; a resposta sai daí.

export const OPCOES = {
  nenhum: { nome: 'Nenhum dos dois', dica: 'Uma sessão, uma pasta. Basta.' },
  worktree: { nome: 'Worktree', dica: 'Pasta e branch próprias. Contexto já separado por sessão.' },
  subagent: { nome: 'Subagent', dica: 'Janela própria dentro da sessão. Devolve um resumo.' },
  ambos: { nome: 'Subagent dentro de worktree', dica: 'Janela própria e pasta própria (isolation: worktree).' },
};

// Eixo horizontal: contexto separado? Eixo vertical: arquivos separados?
export const QUADRANTES = {
  nenhum: { col: 0, row: 0 },
  subagent: { col: 1, row: 0 },
  worktree: { col: 0, row: 1 },
  ambos: { col: 1, row: 1 },
};

export function recomendar({ arquivos, contexto }) {
  if (arquivos && contexto) return 'ambos';
  if (arquivos) return 'worktree';
  if (contexto) return 'subagent';
  return 'nenhum';
}

export const SITUACOES = [
  {
    id: 'tres-tasks',
    texto: 'Você abre três sessões do Claude Code, uma para T1, outra para T2 e outra para T3, todas no mesmo repositório da agenda de mentorias.',
    arquivos: true,
    contexto: false,
    porque: 'Cada sessão já tem a própria conversa, então o contexto já está separado. O que as três disputam é o disco: src/app.js, o git add e o git checkout. Falta separar arquivo.',
  },
  {
    id: 'pesquisa',
    texto: 'Você quer saber onde o código marca uma vaga como não livre. O agente vai ler uns 30 arquivos e você só precisa de 5 linhas de resposta. Nada será editado.',
    arquivos: false,
    contexto: true,
    porque: 'Ninguém escreve em arquivo, então o disco não está em jogo. O risco é encher a janela com 30 arquivos. O subagent lê tudo e devolve só o resumo.',
  },
  {
    id: 'implementador-fundo',
    texto: 'Um agente implementa T2 em segundo plano enquanto você segue editando src/app.js na pasta principal. Você também não quer os logs dele na sua conversa.',
    arquivos: true,
    contexto: true,
    porque: 'Dois problemas ao mesmo tempo: o agente escreve em arquivos que você também edita, e a conversa dele poluiria a sua. Subagent com isolation: worktree separa os dois.',
  },
  {
    id: 'um-status',
    texto: 'Trocar o status 200 por 201 em uma linha de src/routes/agendamentos.js, sozinho, em uma sessão só.',
    arquivos: false,
    contexto: false,
    porque: 'Uma sessão, um arquivo, três minutos. Criar worktree ou subagent aqui leva mais tempo que a própria edição. Faça na mão.',
  },
  {
    id: 'olhar-main',
    texto: 'Um agente está no meio de T1 e você quer conferir a main, rodar os testes de lá e voltar. Fazer git checkout main na mesma pasta derrubaria o trabalho dele.',
    arquivos: true,
    contexto: false,
    porque: 'O problema é a pasta: um checkout muda os arquivos debaixo do agente. Com worktree, a main fica na pasta principal e o agente segue na dele.',
  },
  {
    id: 'revisores',
    texto: 'Quatro revisores (segurança, testes, rastro da spec, simplicidade) leem o mesmo diff e devolvem um relatório cada. Ninguém altera arquivo.',
    arquivos: false,
    contexto: true,
    porque: 'Só leitura, então nada disputa o disco. Cada revisor precisa de janela própria para não contaminar o julgamento do outro. Subagents bastam.',
  },
];

export function avaliar(situacaoId, escolha) {
  const s = SITUACOES.find((x) => x.id === situacaoId);
  if (!s) throw new Error(`Situação desconhecida: ${situacaoId}`);
  if (!(escolha in OPCOES)) throw new Error(`Opção desconhecida: ${escolha}`);
  const certa = recomendar(s);
  return { acertou: escolha === certa, certa, porque: s.porque };
}

export function resumo(respostas) {
  const feitas = Object.keys(respostas).filter((id) => respostas[id] && respostas[id].revelado);
  const acertos = feitas.filter((id) => avaliar(id, respostas[id].escolha).acertou).length;
  return { feitas: feitas.length, acertos, total: SITUACOES.length };
}
