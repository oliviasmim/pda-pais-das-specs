# Auditoria: lição `interrogatorio` (semanas 5, 6 e 9)

Fontes: `aula9-engenharia-para-ia`, `aula11-diagnostico-documentos-rpi`, `aula17-code-review-subagentes`.

## Matriz

| Aula | Conceito ou exercício | Situação antes | Ação |
|---|---|---|---|
| 9 | Abstraction bloat como padrão (estrutura proporcional à incerteza) | parcial (carta Navalha, factory no lab) | tabela de 6 sinais + antes/depois no texto |
| 9 | Checklist: classe Deus, miragem modular, camada de passagem, nome genérico, duplicação, erro mascarado | parcial (só factory e catch genérico) | tabela com pergunta de rastro por sinal |
| 9 | Dados GitClear, paper AI-Generated Smells, Thoughtworks Radar | ausente | 3 referências |
| 9 | Diagnóstico sem consertar (LAB 1) | coberto em espírito (revisar sem reescrever) | nada |
| 9 | DDD estratégico: linguagem ubíqua, bounded context (aula 2) | ausente | fora: pertence a outra lição (tema de modelagem, não de rastro) |
| 11 | RPI: três sessões, cada uma lendo só o arquivo da anterior | ausente | seção "A spec também tem origem" + diagrama SVG |
| 11 | Alavancagem: pesquisa ruim, milhares de linhas; plano ruim, centenas | ausente | SVG + lab `cadeia-rpi` |
| 11 | Cada EARS aponta uma frase do RESEARCH | ausente | texto e lab |
| 11 | Fatia vertical vs plano horizontal | ausente | defeito "horizontal" no lab |
| 11 | Luz apagada (demo) | parcial (lab motion-agente) | nada |
| 11 | Escala do processo (typo não pede RPI) | ausente | 1 parágrafo |
| 11 | Templates RESEARCH, SPEC enxuta, ADR | parcial (ADR citado) | fora: templates ficam no material da aula |
| 17 | `git diff --stat` primeiro; arquivo fora do título é suspeito | ausente aqui (existe em `julgamento`) | lab `triagem-pr` (nível do arquivo) |
| 17 | Sinais de alerta: scope creep, teste alterado, dependência nova, refactor | parcial (dependência) | lab `triagem-pr` |
| 17 | Sinal muda onde olhar, não decide bloquear | ausente | frase no resultado do lab |
| 17 | Leitura em camadas; humano antes do subagente; registro de comparação | coberto em `julgamento` | fora: outra lição |
| 17 | Agentes revisores `.claude/agents/*.md` | coberto em `cortem-lhe-a-cabeca` / `julgamento` | fora |

Resumo: coberto 3, parcial 5, ausente 9 (6 preenchidos, 3 deixados de fora por pertencerem a outras lições ou ao material da aula).

## Alterações

- Novos: `site/js/logic/cadeia-rpi.js`, `site/js/labs/cadeia-rpi.js`, `site/css/labs/cadeia-rpi.css`, `tests/cadeia-rpi.test.js`; `site/js/logic/triagem-pr.js`, `site/js/labs/triagem-pr.js`, `site/css/labs/triagem-pr.css`, `tests/triagem-pr.test.js`.
- Editados: `site/content/licoes/interrogatorio.md`, `site/content/curriculo.js` (só a linha `labs` da lição).
- Quiz: não alterado (6 perguntas, mudanças não commitadas preservadas).

## Referências adicionadas (todas responderam 200 em 11/11/2026)

Thoughtworks Radar (complacency), GitClear 2026, arXiv AI-Generated Smells, Dex Horthy (ACE-FCA e WSFF), docs Claude Code best practices, AWS (R007 scope creep), EARS (Mavin).

## Ressalvas

- "Abstraction bloat" é nome do curso. A lição diz isso.
- O alcance de erro por etapa (milhares, centenas, uma fatia) vem de Horthy; o lab não inventa números.
- Os 6 defeitos do lab `cadeia-rpi` e o PR do lab `triagem-pr` são cenários didáticos na agenda de mentorias, não dados de turma.
