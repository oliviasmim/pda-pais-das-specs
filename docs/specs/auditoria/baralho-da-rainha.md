# Auditoria: baralho-da-rainha (padrões de orquestração)

Fontes: `pda-especializacao-ia/aula19-orquestracao-mcp-client` (inclui `excalidraw/padroes-orquestracao.excalidraw` e `starter/` com LOG, DOC-AGENTE-UNICO e PLACAR), `aula17-code-review-subagentes` (subagents).

| Conceito, exercício ou exemplo da fonte | Antes | Depois |
|---|---|---|
| Sequencial, paralelo, supervisor (slides 8 a 12) | coberto (tabela, lab `orquestracao`) | igual; agente único incluído como quarto naipe |
| Diagrama dos padrões (excalidraw, 3 zonas, legenda de agente e losango de integração) | ausente | laboratório `padroes-mapa`: SVG inline com passo a passo, losango de integração, seta de ida e volta do supervisor |
| "Três agentes não fazem um terço do tempo" (fio condutor) | parcial (fórmula em texto) | laboratório `custo-coordenacao`: curva ideal x real, pares n(n-1)/2, partes independentes, tokens |
| Lei de Brooks (slide 24) | ausente | parágrafo curto, glossário e referência |
| Números da Anthropic: ~4x agente, ~15x multiagente (slide 25) | parcial (só 15x) | mantido; tarefa de código com poucas partes paralelas citada |
| Swarms e OpenAI Swarm descontinuado (slide 26) | parcial (swarm explicado, sem o aviso) | frase com o aviso do README e referência |
| Teste da Rainha / custo de coordenação com cenários | coberto (lab `orquestracao`, 5 cenários + "Monte o seu") | igual |
| Subagent isola contexto, devolve resumo (aula 17) | coberto | igual |
| Worktree x subagent | parcial | referência cruzada (tabela vive na lição `cha-do-chapeleiro`) |
| Falha de coordenação: 18 de 30 agentes com a mesma branch | ausente | citado na lição do worktree |
| LOG-SESSAO-PARALELA-TEMPLATE (aposta, tempos, integração, conflito) | ausente | laboratório `log-paralelo` recebe os mesmos campos |
| DOC-AGENTE-UNICO-TEMPLATE: cálculo (a), (b), (c) e veredito | parcial (registro de decisão no "Leve com você") | `log-paralelo` calcula (a), (b), (c), compara com a aposta e exporta as seções 2 a 4 em Markdown |
| PLACAR-TEMPLATE.csv (40/30/20/10) | ausente | fora de escopo: pertence ao speedrun (`site/js/logic/placar.js`, rota `#/speedrun`) |
| Quiz | 6 perguntas | sem mudança |
| Lab 2 / MCP client | ausente | fora do tema |
| Alura (Supervisor em profundidade) | ausente | fora de escopo: material assíncrono, não é URL verificável por mim além da página do curso |

Referências acrescentadas (todas respondem 200 e tiveram o conteúdo conferido): Anthropic "Patterns and problems in emerging multiagent systems", Lei de Brooks (Wikipedia), OpenAI Swarm (GitHub, README com o aviso), Worktrees no Claude Code.

Novos arquivos: `site/js/logic/{padroes-mapa,custo-coordenacao,log-paralelo}.js`, `site/js/labs/{padroes-mapa,custo-coordenacao,log-paralelo}.js`, `site/css/labs/{padroes-mapa,custo-coordenacao,log-paralelo}.css`, `tests/{padroes-mapa,custo-coordenacao,log-paralelo}.test.js`.
