> "Quero uma xícara limpa", interrompeu o Chapeleiro. "Vamos todos mudar um lugar."
>
> Lewis Carroll, *Alice no País das Maravilhas*, cap. 7 (tradução livre).

## O problema

No speedrun vocês vão rodar três agentes ao mesmo tempo, um para cada tarefa (task): agendar (T1), cancelar (T2) e listar vagas (T3). O jeito mais rápido de começar é abrir três terminais na mesma pasta e mandar ver.

Parece funcionar: nenhum comando falha. Agora perceba o que acontece por baixo:

- os três leem `src/app.js`, cada um edita a versão que leu, e **a última gravação apaga as outras**;
- um agente roda os testes no meio da edição do outro e tenta "consertar" um código que não é dele;
- um `git add .` de um agente leva junto o trabalho pela metade de outro;
- alguém faz `git checkout` para olhar outra branch (outra linha de trabalho do projeto) e puxa o chão de quem estava trabalhando.

Nenhum desses problemas aparece como erro na tela. Você só descobre quando o teste de T1 quebra na `main` e a rota dele não está mais em `src/app.js`. É o Chá Maluco: cadeira para todo mundo, uma xícara só, e cada um bebe o resto do outro.

## O conceito

### Worktree em uma frase

**Worktree nada mais é do que mais uma pasta de trabalho do mesmo repositório, cada uma na sua branch.** Todas compartilham o mesmo `.git` (histórico, commits, objetos). Por isso não é um clone: nada é baixado de novo, e o commit feito numa pasta já aparece no `git log --all` da outra. Na imagem do chá, é mais uma xícara na mesma mesa.

| | Trocar de branch na mesma pasta | Clonar de novo | Worktree |
|---|---|---|---|
| Pastas | 1 | 2 ou mais | 2 ou mais |
| Histórico | compartilhado | duplicado, sincroniza por push e pull | compartilhado |
| Dois agentes ao mesmo tempo | Não: um checkout derruba o outro | Sim, mas integrar dá trabalho | Sim |
| Custo | nenhum | baixa tudo de novo | só os arquivos de trabalho |

### As regras do chá

1. **Uma branch, uma xícara.** O git não deixa a mesma branch aberta em dois worktrees. Ele recusa com `fatal: 'main' is already used by worktree at ...`. Isso é a proteção funcionando, não um bug. Agentes do mesmo modelo tendem a escolher os mesmos nomes: num experimento da Anthropic com 30 agentes subindo ao mesmo tempo, 18 criaram uma branch com o mesmo nome. Então escreva o nome da branch no pedido (`-b t1-agendar`) em vez de deixar o agente escolher.
2. **A cabeceira é da integração.** A pasta principal fica na `main`. Agentes trabalham nas xícaras. Merge acontece na cabeceira.
3. **Cada xícara se serve sozinha.** O worktree só traz o que está versionado. `node_modules` e arquivos do `.gitignore` (como `.env`) ficam para trás. Rode `npm install` em cada worktree. No Claude Code, o arquivo `.worktreeinclude` lista arquivos ignorados que devem ser copiados para worktrees novos.
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

Subagent nada mais é do que o Claude chamando outro Claude com um prompt próprio, numa conversa separada que devolve só um resumo. O subagent também pode ganhar xícara própria: com `isolation: worktree` no cabeçalho do arquivo dele, cada execução roda num worktree temporário.

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

### Worktree e subagent não são a mesma coisa

Os dois aparecem juntos nas aulas e na documentação, então parecem sinônimos. Cada um separa uma coisa:

| | Worktree | Subagent |
|---|---|---|
| Separa | os **arquivos**: pasta e branch próprias | o **contexto** (tudo que o agente tem na conversa): uma conversa própria dentro da sessão |
| Evita | dois agentes gravando no mesmo arquivo | a janela do agente principal encher de log e tentativa |
| O que volta para você | uma branch para integrar | um resumo |

Dá para usar um dentro do outro: é o `isolation: worktree` do exemplo acima. Para decidir, pergunte duas coisas: alguém vai escrever no mesmo arquivo? A conversa principal vai encher de coisa que eu não preciso ler? O segundo laboratório da seção Pratique treina essas duas perguntas.

### Integrar: o conflito que vai aparecer

As três tasks registram uma rota em `src/app.js`, no mesmo lugar. O git sabe juntar mudanças em lugares diferentes, mas não sabe em que ordem pôr duas linhas novas no mesmo ponto. Então ele para e pergunta: **conflito**.

Ou seja, conflito é o git se recusando a adivinhar. Aqui, a resposta certa é **manter as duas linhas**. O erro comum, na pressa, é clicar em "aceitar a minha versão" e apagar a rota da outra task sem perceber. O git aceita sem reclamar, e quem descobre é o teste.

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

<div data-lab="eixos-isolamento"></div>

**Antes de clicar em Revelar**, diga em voz alta o que está em jogo: o disco (alguém vai escrever arquivo?) ou a conversa do agente (alguém vai ler muita coisa que você não precisa ver?). Se errar, releia a explicação do cartão e ache na situação a palavra que você pulou.

**No seu terminal (5 minutos).** Num projeto seu, sem mudanças pendentes:

1. Crie dois worktrees: `git worktree add ../meu-projeto-a -b tarefa-a` e `git worktree add ../meu-projeto-b -b tarefa-b`.
2. Rode `git worktree list`. Você deve ver três linhas: a pasta original e as duas novas, cada uma na própria branch.
3. Em cada pasta nova, altere um arquivo **diferente** e rode `git status`. Cada pasta só enxerga a própria mudança.
4. Limpe com `git worktree remove ../meu-projeto-a` e `git worktree remove ../meu-projeto-b`. Se o git reclamar de mudança não commitada, faça commit antes (ou descarte a mudança, se era só teste).

Pronto quando `git worktree list` mostrar só a pasta principal de novo.

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
4. **Quando não usar.** Monte no laboratório da lição 5 o cenário em que as tasks mexem de verdade no mesmo arquivo. Worktree isola a escrita, mas o conflito continua lá: só aparece mais tarde, no merge.
5. **Conflito de verdade, em 30 segundos.** Duas tasks mexem em funções diferentes do mesmo arquivo e, mesmo assim, o git para. Rode e leia o que ele imprime:

```bash
mkdir conflito-demo && cd conflito-demo && git init -q -b main
git config user.email "demo@exemplo.com" && git config user.name "demo"
cat > validadores.js <<'X'
export function validarEmail(e) { return e.includes('@'); }

export const validadores = { validarEmail };
X
git add . && git commit -qm "base"

git checkout -qb t1-vaga
cat > validadores.js <<'X'
export function validarEmail(e) { return e.includes('@'); }
export function validarVagaId(v) { return Number.isInteger(v); }

export const validadores = { validarEmail, validarVagaId };
X
git commit -qam "t1: validar vagaId"

git checkout -q main && git checkout -qb t2-status
cat > validadores.js <<'X'
export function validarEmail(e) { return e.includes('@'); }
export function validarStatus(s) { return s === 'cancelado'; }

export const validadores = { validarEmail, validarStatus };
X
git commit -qam "t2: validar status"

git checkout -q main
git merge t1-vaga      # entra limpo
git merge t2-status    # CONFLICT (content): Merge conflict in validadores.js
```

   As duas funções novas não se tocam. O que colide é o `export const validadores`, a linha que as duas tasks reescreveram. Resolva mantendo as duas funções e as duas chaves no objeto, depois rode `git add validadores.js && git commit`.

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
- [Patterns and problems in emerging multiagent systems (Anthropic)](https://www.anthropic.com/research/multiagent-systems): os experimentos com enxames de agentes, inclusive o das 30 branches com o mesmo nome.
