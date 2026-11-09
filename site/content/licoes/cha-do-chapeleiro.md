> "Quero uma xícara limpa", interrompeu o Chapeleiro. "Vamos todos mudar um lugar."
>
> Lewis Carroll, *Alice no País das Maravilhas*, cap. 7 (tradução livre).

## O problema

No speedrun vocês vão rodar três agentes ao mesmo tempo, um para cada tarefa (task): agendar (T1), cancelar (T2) e listar vagas (T3). A tentação é abrir três terminais na mesma pasta e começar.

Parece funcionar. Nenhum comando falha. Mas perceba o que acontece por baixo:

- os três leem `src/app.js`, cada um edita a versão que leu, e **a última gravação apaga as outras**;
- um agente roda os testes no meio da edição do outro e tenta "consertar" um código que não é dele;
- um `git add .` de um agente leva junto o trabalho pela metade de outro;
- alguém faz `git checkout` para olhar outra branch (outra linha de trabalho do projeto) e puxa o chão de quem estava trabalhando.

Nenhum desses problemas avisa: o bug é silencioso. O Chá Maluco tem cadeira para todo mundo, mas uma xícara só. Cada um bebe o resto do outro.

## O conceito

### Worktree em uma frase

**Worktree nada mais é do que mais uma pasta de trabalho do mesmo repositório, cada uma na sua branch.** Todas compartilham o mesmo `.git` (histórico, commits, objetos). Não é um clone: é mais uma xícara na mesma mesa.

| | Trocar de branch na mesma pasta | Clonar de novo | Worktree |
|---|---|---|---|
| Pastas | 1 | 2 ou mais | 2 ou mais |
| Histórico | compartilhado | duplicado, sincroniza por push e pull | compartilhado |
| Dois agentes ao mesmo tempo | Não: um checkout derruba o outro | Sim, mas integrar dá trabalho | Sim |
| Custo | nenhum | baixa tudo de novo | só os arquivos de trabalho |

### As regras do chá

1. **Uma branch, uma xícara.** O git não deixa a mesma branch aberta em dois worktrees. Ele recusa com `fatal: 'main' is already used by worktree at ...`. Isso é a proteção funcionando.
2. **A cabeceira é da integração.** A pasta principal fica na `main`. Agentes trabalham nas xícaras. Merge acontece na cabeceira.
3. **Cada xícara se serve sozinha.** `node_modules` e arquivos ignorados (como `.env`) não vêm junto. Rode `npm install` em cada worktree. No Claude Code, o arquivo `.worktreeinclude` lista arquivos ignorados que devem ser copiados para worktrees novos.
4. **Lave a xícara no fim.** `git worktree remove <pasta>` apaga a pasta. A branch e os commits continuam.

### Com git

```bash
git worktree add ../wt-agendar  -b t1-agendar
git worktree add ../wt-cancelar -b t2-cancelar
git worktree add ../wt-vagas    -b t3-vagas
git worktree list

cd ../wt-agendar && npm install && claude
```

### Com o Claude Code

```bash
claude -w agendar
```

Isso cria `.claude/worktrees/agendar/` numa branch nova `worktree-agendar` e já abre a sessão lá dentro. Adicione `.claude/worktrees/` ao `.gitignore`. Ao sair de uma sessão sem mudanças, o worktree é removido; com mudanças, o Claude Code pergunta se mantém.

Subagents também podem ganhar xícara própria. Com `isolation: worktree` no cabeçalho, cada execução do subagent roda num worktree temporário:

```markdown
---
name: implementador
description: Implementa UMA task atômica de docs/tasks/, com o teste de aceite escrito antes do código.
tools: Read, Edit, Write, Bash, Grep, Glob
isolation: worktree
---

Você implementa uma única task. Antes de editar código, escreva o teste de aceite
a partir da tabela da task e rode para ver vermelho. Não toque em arquivos fora
da lista da task. No fim, devolva: arquivos alterados, testes rodados, o que ficou de fora.
```

### Integrar: o conflito que vai aparecer

As três tasks registram uma rota em `src/app.js`, no mesmo lugar. O git sabe juntar mudanças em lugares diferentes, mas não sabe em que ordem pôr duas linhas novas no mesmo ponto. Então ele para e pergunta: **conflito**.

Conflito é o git se recusando a adivinhar. A resposta certa, neste caso, é **manter as duas linhas**. A resposta errada, e muito comum quando se tem pressa, é aceitar "a minha versão" e apagar a rota da outra task sem perceber.

Três hábitos na integração:

1. Faça merge **uma branch por vez**.
2. Depois de cada merge, rode os testes de aceite **das três tasks** na `main`.
3. Se resolveu um conflito, leia o arquivo inteiro antes de commitar.

<div data-cartas="contraprova,rastro"></div>

Na integração, a carta ♣ Contraprova vira: *"que comando prova que nenhuma rota sumiu?"*. Resposta exata: `npm test` na `main`, com os testes de aceite de T1, T2 e T3 verdes.

<div data-quiz="check"></div>

## Pratique

<div data-lab="worktrees"></div>

**Em dupla.** Uma pessoa digita, a outra lê a missão em voz alta. Na aba 1, antes de clicar, apostem: qual task sobrevive? Na aba 2, quando o conflito aparecer, quem está digitando precisa dizer em voz alta o que cada lado do `=======` significa antes de escolher.

## Leve com você

Cola de comandos para o speedrun:

```bash
# na pasta principal, na main
git worktree add ../wt-agendar  -b t1-agendar
git worktree add ../wt-cancelar -b t2-cancelar
git worktree add ../wt-vagas    -b t3-vagas
# ou, com o Claude Code: claude -w agendar (e assim por diante)

# em cada worktree, num terminal separado
npm install && claude

# integração, de volta na pasta principal
git merge t1-agendar && npm test
git merge t2-cancelar   # conflito em src/app.js: mantenha as duas linhas
npm test
git merge t3-vagas && npm test

# limpeza
git worktree remove ../wt-agendar
git worktree remove ../wt-cancelar
git worktree remove ../wt-vagas
```

Linha para o `.gitignore`:

```text
.claude/worktrees/
```

Regra para o `AGENTS.md`:

```markdown
## Trabalho em paralelo
- Cada agente trabalha no próprio worktree, numa branch própria. Nunca na pasta principal.
- Não rode git checkout, git switch nem git stash: troque de pasta, não de branch.
- Só altere os arquivos listados na sua task. Precisa mexer em outro? Pare e pergunte.
```

<details class="toca">
<summary>Trilha da Toca · para quem terminou antes</summary>

1. **Script de mesa posta.** Escreva `scripts/xicaras.sh` que recebe três nomes, cria os três worktrees com `-b`, roda `npm install` em cada um e imprime `git worktree list`. Peça à IA, mas aplique a carta ♠ Rastro em cada linha do script.
2. **`.worktreeinclude`.** Descubra quais arquivos ignorados o projeto precisa para rodar (ex.: `.env`) e crie o `.worktreeinclude` para o Claude Code copiá-los.
3. **Subagent com xícara própria.** Crie o subagent `implementador` acima, peça para ele implementar uma task e descubra onde o worktree temporário foi criado e o que acontece com ele no fim.
4. **Quando não usar.** Monte no laboratório da lição 5 o cenário em que as tasks mexem de verdade no mesmo arquivo. Worktree isola a escrita, mas não elimina o conflito: só adia para o merge.

</details>

## Termos-chave

| Termo | O que dizem | O que realmente significa |
|---|---|---|
| Worktree | "Um clone do repositório." | Mais uma pasta de trabalho do **mesmo** repositório, numa branch própria, compartilhando o histórico. |
| Pasta principal | "Tanto faz onde o agente roda." | O worktree original. Fica na `main` e serve para integrar. |
| Conflito de merge | "Deu erro no git." | O git se recusando a adivinhar como juntar duas mudanças no mesmo trecho. Quem decide é você. |
| `claude -w` | "Um modo especial do Claude." | Atalho que cria um worktree em `.claude/worktrees/<nome>`, numa branch `worktree-<nome>`, e abre a sessão lá. |
| `isolation: worktree` | "Deixa o subagent mais seguro." | Faz cada execução do subagent rodar num worktree temporário, sem tocar na sua pasta. |

## Para ir além

- [git-worktree, documentação oficial do Git](https://git-scm.com/docs/git-worktree): todos os comandos e opções.
- [Worktrees no Claude Code](https://code.claude.com/docs/en/worktrees): `claude -w`, limpeza automática e `.worktreeinclude`.
- [Subagents no Claude Code](https://code.claude.com/docs/en/sub-agents): campos do cabeçalho, inclusive `isolation`.
