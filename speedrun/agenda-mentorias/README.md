# agenda-mentorias · Speedrun da Semana 10

Projeto inicial do speedrun da Aula 2 da Semana 10 (Especialização em IA · Programadores do Amanhã).

**Missão:** em 40 minutos, rodar 3 tasks em paralelo, cada uma num git worktree com o seu próprio agente, integrar tudo na `main` e terminar com os sensores verdes.

> O Chapeleiro e a Lebre mudam de lugar para ter sempre uma xícara limpa. Cada agente trabalha na sua própria xícara (worktree). Ninguém bebe do chá do outro.

## 0. Antes de começar (5 min)

```bash
npx degit oliviasmim/pda-pais-das-specs/speedrun/agenda-mentorias agenda-mentorias
cd agenda-mentorias
git init -b main && git add -A && git commit -m "chore: projeto inicial"
npm install
npm run gates      # tudo verde? então pode começar
```

Leia, nesta ordem: `docs/spec.md`, `AGENTS.md` e as três tasks em `docs/tasks/`.

## 1. Uma xícara para cada agente (worktrees)

Escolha **um** jeito.

**Com git:**

```bash
git worktree add ../am-t1 -b t1
git worktree add ../am-t2 -b t2
git worktree add ../am-t3 -b t3
git worktree list
```

Abra três terminais. Em cada um: `cd ../am-t1 && npm install && claude` (troque `t1` por `t2` e `t3`).

**Com o Claude Code:**

```bash
claude -w t1     # cria .claude/worktrees/t1 na branch worktree-t1
```

Repita em outros dois terminais com `t2` e `t3`. Rode `npm install` dentro de cada worktree.

## 2. O pedido para cada agente

Cole no agente de cada worktree, trocando `T1` pela task dele:

```text
Leia AGENTS.md, docs/spec.md e docs/tasks/T1.md. Sua tarefa é só a T1.
1. Crie tests/aceite/T1.ativa e escreva tests/t1.test.js com um teste para cada linha da tabela de casos.
   Rode npm test, mostre que os testes da T1 falham e faça o commit "test(T1): casos da tabela".
2. Implemente em src/rotas/agendamento.js e registre a rota no ponto de registro de src/app.js.
3. Rode npm run gates. Quando estiver verde, faça o commit "feat(T1): agendar mentoria".
Não invente regra que não está na spec. Se faltar informação, pare e me pergunte.
No fim, liste cada caso da tabela e o teste que o cobre.
```

Arquivos de cada task: T1 → `src/rotas/agendamento.js`, T2 → `src/rotas/cancelamento.js`, T3 → `src/rotas/vagas.js`.

## 3. Regras do jogo

- **Teste antes do código.** O commit `test(Tn): ...` vem antes do `feat(Tn): ...`. O avaliador lê o `git log`.
- **Não pinte as rosas.** Nada em `tests/aceite/` pode ser alterado (exceto criar `Tn.ativa`). O hook em `.claude/settings.json` bloqueia o agente; `npm run guarda` e o avaliador conferem. Rosa pintada vale −30.
- **Você revisa.** Antes de cada commit, aplique uma carta do Baralho do Gato no diff: "Aponte uma linha. Onde, na spec, está escrito isso?".

## 4. Integrar (o chá acaba aqui)

Volte para a pasta principal, na `main`:

```bash
git merge t1
git merge t2      # vai dar conflito em src/app.js: é proposital
```

O conflito é no ponto de registro: as duas tasks adicionaram uma linha no mesmo lugar. Fique com **as duas** linhas (e os dois `import`), apague os marcadores `<<<<<<<`, `=======`, `>>>>>>>` e conclua:

```bash
git add src/app.js && git commit --no-edit
git merge t3      # mesmo procedimento se houver conflito
npm run gates     # tudo verde = fim do speedrun
```

Se usou `claude -w`, as branches se chamam `worktree-t1`, `worktree-t2`, `worktree-t3`.

Limpeza depois: `git worktree remove ../am-t1` (e os outros), ou `git worktree prune`.

## 5. Os sensores

| Comando | Sensor | Pega o quê |
|---|---|---|
| `npm run lint` | ESLint | variável não usada, `==` no lugar de `===`, `var` |
| `npm run typecheck` | TypeScript (JSDoc, `strictNullChecks`) | acessar campo de algo que pode ser `undefined` |
| `npm test` | testes + cobertura mínima de 80% | comportamento errado, código sem teste |
| `npm run deps` | `npm audit` | dependência com vulnerabilidade alta |
| `npm run smoke` | sobe o servidor de verdade | app que não inicia |
| `npm run guarda` | checksums de `tests/aceite/` | rosas pintadas |

`npm run gates` roda todos em sequência. A CI (`.github/workflows/ci.yml`) roda os mesmos sensores em cada push.

## 6. Desafios para quem terminar antes

- **NFR-1:** dez requisições simultâneas para a mesma vaga → exatamente um 201. Escreva o teste antes.
- **NFR-2:** 1.000 vagas, p95 < 50 ms em `GET /mentores/:id/vagas`. Escreva o teste de desempenho.
- Crie um subagent de review em `.claude/agents/rastreador-de-spec.md` que liste cada `if` de regra de negócio e a linha da spec correspondente.
- Rode um subagent com `isolation: worktree` para revisar a integração sem mexer na sua pasta.
