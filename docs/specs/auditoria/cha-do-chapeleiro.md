# Auditoria: cha-do-chapeleiro (worktrees)

Fontes: `pda-especializacao-ia/aula19-orquestracao-mcp-client` (README, GUIA-DO-ALUNO, ROTEIRO-FACILITADORA, SLIDES-OUTLINE, REFERENCIAS, starter/) e `aula17-code-review-subagentes` (só para subagents).

Legenda: coberto, parcial, ausente (antes da auditoria) e o que foi feito.

| Conceito, exercício ou exemplo da fonte | Antes | Depois |
|---|---|---|
| Worktree isola arquivo, não é clone (Guia, slide 14) | coberto (texto e tabela) | igual |
| `git worktree add/list/remove` (Lab 1 do Guia) | coberto (texto, lab `worktrees`) | igual |
| Branch não pode abrir em dois worktrees (git-worktree) | coberto (regra 1 e quiz) | acrescentado o dado da Anthropic: 18 de 30 agentes criaram a mesma branch |
| Dois terminais, uma sessão em cada, mudança em arquivos diferentes, `git status` mostra isolamento (Lab 1, passos 3 e 4) | parcial (só no simulador) | exercício numerado no terminal do aluno, com critério de pronto |
| Limpeza com `git worktree remove` (Lab 1, passo 5) | coberto | igual |
| Worktree x subagent são eixos diferentes (slide 14, "slide mais importante") | parcial (só `isolation: worktree` citado) | tabela na lição + laboratório `eixos-isolamento` (mapa de 4 quadrantes e 6 situações) |
| Demo 1: conflito de merge proposital (duas funções, mesmo `module.exports`) | parcial (conflito em `src/app.js` no lab) | script reproduzível de 30 s na Trilha da Toca, testado |
| Conflito: "manter as duas" x "aceitar a minha" (Demo 1, speedrun) | coberto (texto, lab, quiz) | igual |
| `claude -w`, `.worktreeinclude`, `isolation: worktree` (doc oficial) | coberto | igual |
| Subagents da aula 17 (janela própria, resumo) | coberto na lição 5 | ligado pela tabela de eixos |
| Slide 5/13 "carrinhos batendo" (GIF humor) | ausente, só serve a slide | fora de escopo |
| Lab 2 / MCP client (Aula 19) | ausente | fora do tema da lição |
| Placar e log do speedrun | ausente | pertence à lição `baralho-da-rainha` |

Referências: acrescentada Anthropic "Patterns and problems in emerging multiagent systems" (URL aberta e conferida: o texto traz as 18 de 30 branches com o mesmo nome).

Novos arquivos: `site/js/logic/eixos-isolamento.js`, `site/js/labs/eixos-isolamento.js`, `site/css/labs/eixos-isolamento.css`, `tests/eixos-isolamento.test.js`.
