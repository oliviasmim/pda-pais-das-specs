// Catálogo das máquinas (motions). A definição de cada uma está em site/js/logic/<id>.js.
export const maquinas = [
  { id: 'motion-agente', fig: 'FIG_AGT', titulo: 'Por dentro de um agente', resumo: 'Um pedido atravessa guias, modelo, ferramenta e sensores até o PR. O livro-razão diz de onde veio cada linha do diff.', licao: 'interrogatorio' },
  { id: 'motion-requisito', fig: 'FIG_REQ', titulo: 'Por dentro de um requisito', resumo: 'Do "tem que ser rápido" à segunda-feira às 9h. Desejo, número, sensor e a cauda da latência.', licao: 'coelho-branco' },
  { id: 'motion-subagent', fig: 'FIG_SUB', titulo: 'Por dentro de um subagent', resumo: 'A janela do agente principal como frasco. Agente único, sequencial, paralelo e supervisor, com o custo de cada um.', licao: 'beba-me' },
  { id: 'motion-worktrees', fig: 'FIG_WT', titulo: 'Por dentro do Chá Maluco', resumo: 'Três agentes, três xícaras. O que o worktree isola, o que ele não isola e o conflito do merge final.', licao: 'cha-do-chapeleiro' },
  { id: 'motion-ci', fig: 'FIG_CI', titulo: 'Por dentro da esteira', resumo: 'Um PR atravessa os sensores numa máquina limpa. Desligue um, ponha outro em continue-on-error e veja o que chega à main.', licao: 'cortem-lhe-a-cabeca' },
  { id: 'motion-review', fig: 'FIG_REV', titulo: 'Por dentro de um review', resumo: 'Um diff de 1.180 linhas com seis defeitos plantados. Pessoa em camadas, subagents com rubrica e quem pega o quê.', licao: 'julgamento' },
];

export function maquinaPorId(id) {
  return maquinas.find((m) => m.id === id) || null;
}
