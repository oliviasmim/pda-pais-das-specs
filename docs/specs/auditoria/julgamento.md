# Auditoria: O Julgamento do Valete (review de diff grande e subagents de review)

Fontes: aula17-code-review-subagentes (GUIA, GABARITO-PR-PLANTADO, LISTA-SINAIS, agentes-revisao, templates, REFERENCIAS), aula15 (teste que não prova nada), aula13, aula19.
Legenda: coberto, parcial, ausente.

| Conceito ou exercício da fonte | Antes | Depois | Onde |
|---|---|---|---|
| Leitura em camadas (arquivos, contratos, testes, corpo) | coberto | coberto | tabela + lab `diff-camadas` |
| Camada 0: rode lint e testes antes de ler | ausente | coberto | texto + SVG de tempo por camada |
| `git diff --stat` como primeiro passo | parcial | coberto | bloco de comandos |
| Sinais: teste alterado, dependência nova, abstração, regra não pedida, erro genérico | coberto | coberto | tabela de sinais |
| Sinais: scope creep, refactor não pedido, comentário que explica o óbvio | ausente | coberto | 3 linhas novas + parágrafo (AWS) |
| Sinais estáticos predizem PR caro (33.707 PRs) | ausente | coberto | parágrafo + referência |
| Rosas pintadas (AGENTS.md, hook, guarda na CI) | coberto | coberto | texto |
| Falsa Tartaruga / assert que sempre passa | parcial | coberto | texto + lição Cortem-lhe a cabeça |
| Subagent de review: isolamento, uma especialidade, só leitura | coberto | coberto | texto + lab `fabrica-revisores` |
| Registro humano antes do subagent (ordem provada no git log) | parcial | parcial | red team em duplas; sem lab |
| O que só o humano pega, o que só o subagent pega, o que nenhum pega (matriz de cobertura) | parcial (3 bullets) | coberto | lab `triagem-achados` (novo, PR adaptado à agenda) |
| Conhecimento de domínio (endpoint público) | ausente | coberto | achado "vazamento" + bullet no red team |
| Bloqueia x não bloqueia (nit); revisor instruído a achar vai achar | ausente | coberto | seção + coluna de etiqueta no lab |
| Google: aprovar o que melhora o código | ausente | referência | seção + links |
| Revisor de segurança (OWASP LLM, supply chain) | ausente | parcial | achado de dependência inventada; sem subagent novo |
| Revisor na CI (claude-code-action) | coberto | coberto | Trilha da Toca |
| Carta à Rainha (erro vira regra e checagem) | coberto | coberto | lab `carta-rainha` |
| PR plantado em perfis de alunos (repositório de aula) | n/a | adaptado | reescrito para a agenda; sem dado de aluno |
| Paralelismo gera diffs demais para revisar (aula19) | ausente | fora | já tratado na lição `cha-do-chapeleiro` (orquestração) |
| MCP client (aula19) | n/a | fora | outra lição |
| Spec Kit e frameworks SDD (aula13) | n/a | fora | outra lição |

## Alterações
- Lab novo: `triagem-achados` (lógica e teste próprios).
- Lição: camada 0 com SVG, 3 sinais novos, seção "O que bloqueia e o que é nit", bullet de contexto, passo novo no Pratique, 6 referências.
- Quiz: mantido, sem alteração.
