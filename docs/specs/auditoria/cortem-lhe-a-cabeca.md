# Auditoria: Cortem-lhe a cabeça! (cinco sensores como gates)

Fontes: aula13-spec-driven-development, aula15-verificadores (README, GUIA, starter/ci-workflow, bdd-para-teste, teste-que-nao-prova-nada-exemplos, branch-protection-guia, red-green-refactor-log, DEMO-NEST-ROTEIRO, REFERENCIAS), aula17, aula19.
Legenda: coberto, parcial, ausente. "Novo" é o que esta rodada acrescentou.

| Conceito ou exercício da fonte | Antes | Depois | Onde |
|---|---|---|---|
| Os cinco sensores e o que cada um pega | coberto | coberto | texto + lab `esteira` |
| Verificador existe para o agente (guia x sensor) | coberto | coberto | texto |
| Fail fast e ordem dos sensores | coberto | coberto | texto + `esteira` |
| Reconhecer o sensor pelo formato do log (diagnóstico às cegas) | coberto | coberto | mensagens no `esteira` |
| Auditar YAML gerado por IA | coberto | coberto | texto + `esteira` |
| ci.yml: `needs` entre jobs, jobs em paralelo | ausente | coberto | seção "Quem espera quem" + SVG |
| ci.yml: `permissions: contents: read` (menor privilégio) | ausente | coberto | texto |
| Dependency check: `npm audit` (CVE) | coberto | coberto | tabela dos sensores |
| Dependency check: pacote inventado (slopsquatting), `npm view`, dependency-review-action | ausente | coberto | seção "O pacote que a IA inventou" |
| Teste que testa o mock | parcial (só no julgamento) | coberto | seção + lab `teste-nao-prova` (novo) |
| Assert que sempre passa | ausente | coberto | idem |
| Cobertura alta sem valor (quebre e rode) | parcial (Toca) | coberto | idem |
| Red, green, refactor e prova pelo `git log` | ausente | coberto | seção + lab `vermelho-verde` (novo) |
| BDD (Gherkin) para teste, um cenário = um teste | ausente | coberto | exemplo T2 da agenda |
| Branch protection: check obrigatório, exigir PR, rodar em pull_request | parcial (só texto) | coberto | lab `protecao-main` (novo) |
| Branch protection em repositório privado (plano) | ausente | coberto | nota no Pratique |
| Workflow precisa rodar uma vez antes de o check aparecer na regra | ausente | coberto | opção do lab `protecao-main` |
| Task forte x fraca (comando que responde sim ou não) | ausente | coberto | tabela antes/depois (aula13) |
| Critério binário por tarefa e "não edite testes" (Anthropic) | ausente | referência | Para ir além |
| Demo NestJS passo a passo (DEMO-NEST-ROTEIRO) | ausente | fora | roteiro de facilitação, não de site |
| CI para projeto de automação (n8n) | ausente | fora | o cenário do site é a agenda de mentorias |
| Spec Kit, OpenSpec, TLC, Superpowers (comparação de frameworks) | ausente | fora | outra lição (Cha do Chapeleiro e Baralho) |
| Logs para ENTREGAVEL e fila do CI vermelho | ausente | fora | dinâmica de sala |
| MCP client e orquestração (aula19) | n/a | fora | lição `cha-do-chapeleiro` |

## Alterações
- Labs novos: `teste-nao-prova`, `protecao-main`, `vermelho-verde` (lógica em `site/js/logic/`, testes em `tests/`).
- Lição: seções novas e dois diagramas SVG (needs dos jobs), tabelas comparativas, 7 referências.
- Quiz: mantido, sem alteração.
