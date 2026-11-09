# AGENTS.md · agenda-mentorias

API de agenda de mentorias da PdA. Node 22+, Express 5, JavaScript ESM com JSDoc.

## Comandos

- `npm run gates`: roda todos os sensores. Precisa passar antes de dizer "pronto".
- `npm test`: testes com cobertura (mínimo 80% de linhas em `src/`).
- `npm run lint` · `npm run typecheck` · `npm run smoke` · `npm run guarda` · `npm run deps`

## Fonte da verdade

- Regras de negócio, rotas, status e mensagens: `docs/spec.md` e `docs/tasks/T*.md`. Copie as mensagens de erro **exatamente**.
- Dados: `src/repo.js` (em memória, ADR-001). Não troque por banco, arquivo ou array local.

## Regras

1. Não crie regra de negócio que não esteja em `docs/spec.md`. Se faltar informação, pare e pergunte.
2. Nunca edite nada em `tests/aceite/` (exceto criar `Tn.ativa`). Se um teste de aceite parece errado, pare e pergunte.
3. TDD: primeiro um commit `test(Tn): ...` com o teste falhando, depois `feat(Tn): ...` com o código.
4. Uma task = um arquivo de rotas em `src/rotas/` + uma linha no ponto de registro de `src/app.js`.
5. Não adicione dependências sem pedir. Não crie classes, factories ou camadas novas: siga o padrão de `src/rotas/mentores.js`.
6. Não mude a assinatura das funções exportadas por `src/repo.js` (o avaliador usa). Pode adicionar funções novas.
7. Ao terminar, mostre a saída de `npm run gates` e liste cada caso da tabela da task com o teste que o cobre.
