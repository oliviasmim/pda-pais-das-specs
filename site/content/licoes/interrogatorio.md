> "Você poderia me dizer, por favor, que caminho devo tomar para sair daqui?"
> "Isso depende bastante de para onde você quer ir", disse o Gato.
>
> Lewis Carroll, *Alice no País das Maravilhas*, cap. 6 (tradução livre).

## O problema

Alguém do time pede para a IA:

> Crie um endpoint para o jovem agendar uma mentoria.

Em dez segundos chegam 50 linhas. O código roda, a rota responde, o status é 200. Parece pronto.

Agora a pergunta da revisão: **está certo?** A resposta mais comum é alguma destas:

- "Testaria."
- "Pediria para outra IA revisar."
- "Parece limpo, tem até uma Factory."

Nenhuma delas é uma revisão. São promessas de revisão. Elas não dizem **contra o quê** o código vai ser conferido, **com que entrada** e **esperando que resposta**. Por isso não pegam nada.

E o código gerado por IA é difícil justamente porque ele **erra de um jeito convincente**. Os erros não parecem erros. Parecem boas ideias que alguém teve.

## O conceito

### Toda linha tem uma origem

Antes de perguntar se uma linha está certa, pergunte **de onde ela veio**. Só existem três respostas:

| Origem | O que é | O que fazer |
|---|---|---|
| **Pedido** | Está escrito no pedido ou na spec. | Conferir se está completo. Uma linha pedida pode estar pela metade. |
| **Assumido** | O pedido deixou em aberto e a IA escolheu sozinha. O status, o nome do campo, a fonte de dados. | Virar decisão escrita (spec, ADR) ou pergunta para quem pediu. Pode até estar certo. Só não é seu. |
| **Inventado** | Ninguém pediu e o problema não exige. Uma regra de negócio, um e-mail, uma dependência, uma camada. | Remover. Se for mesmo necessário, levar para a spec com alguém responsável pela decisão. |

O pedido do exemplo tem 9 palavras. Ele não diz o status de sucesso, o formato do corpo, o que fazer com vaga ocupada, de onde vêm os dados. Cada lacuna vira uma escolha da IA. Algumas escolhas são inofensivas. Outras viram bug em produção.

### O padrão de erro da IA

A IA não erra ao acaso. Ela prevê a continuação mais provável. Quando o pedido é vago, a continuação mais provável é **a média de milhares de sistemas de agenda que ela já viu**: um limite por mês, um e-mail de confirmação, um padrão de projeto popular, o status mais usado.

> **A IA preenche as lacunas do pedido com suposições plausíveis.** Plausível não é pedido.

Isso tem duas consequências práticas:

1. **Antes:** quanto menos lacunas no pedido, menos suposições. Esse é o trabalho da spec e do EARS (S6, S7).
2. **Depois:** na revisão, a pergunta não é "isso faz sentido?". Quase tudo que a IA escreve faz sentido. A pergunta é **"onde está escrito isso?"**.

### Revisão com spec e sem spec

Sem spec, o melhor que você consegue dizer é "isso foi assumido". Com spec, a pergunta vira sim ou não: **está na linha X da spec, ou não está**.

Repare no que isso significa. A spec não é só um documento para o agente ler antes de gerar. **É a ferramenta de quem revisa.** Sem ela, revisão é opinião contra opinião. Com ela, é comparação.

### O Baralho do Gato

Seis perguntas que transformam "testaria" em revisão de verdade. Cada uma tem um jeito ruim e um jeito bom de responder. O jeito bom sempre tem **uma linha, uma entrada, um status ou uma mensagem exata**.

<div data-cartas="rastro,contraprova,par,contrato,navalha,carta-rainha"></div>

A carta que mais muda a revisão é a ♣ **Contraprova**. Ela obriga você a dizer, antes de rodar, o que espera ver:

| Ruim | Bom |
|---|---|
| "Testaria com vaga ocupada." | "Agendar a vaga 1 duas vezes. Espero `201` e depois `409 {"erro":"Vaga indisponível"}`. O código devolve `200` nas duas." |

Se você não consegue escrever a linha da direita, você ainda não sabe o que o código deveria fazer. E aí nenhuma revisão vai te salvar.

## Pratique

Em dupla, 15 minutos. Uma pessoa lê o código em voz alta, a outra decide a origem. Troquem a cada trecho.

1. Leiam primeiro **sem a spec**. Classifiquem cada trecho marcado.
2. Depois liguem **Comparar com a spec** e vejam quantos "assumidos" ganham resposta.
3. Para três trechos, escrevam a contraprova completa no chat da aula: **entrada → esperado → o código devolve**.

<div data-lab="interrogatorio"></div>

<div data-quiz="check"></div>

### Para discutir

- Qual trecho vocês **aceitariam** sem pensar se estivessem com pressa? Por quê?
- O `moment` e a `AgendamentoServiceFactory` não quebram nenhum teste. Por que tirar mesmo assim?
- Se a spec existisse antes, quantos trechos a IA teria acertado de primeira?

## Leve com você

**1. Comentário de revisão com rastro e contraprova.** Use este formato em todo comentário de PR. Se você não consegue preencher, ainda não é um comentário, é uma impressão.

```markdown
**Linha:** src/rotas/agendamentos.js:14
**Origem:** inventado (não está em docs/spec.md; "limite por jovem" está em Fora do escopo)
**Contraprova:** jovem com 3 agendamentos no mês pede a vaga 5, livre
**Esperado:** 201 com status "confirmado"
**O código devolve:** 500 {"erro":"Erro interno"}
**Pedido:** remover a regra. Se ela for necessária, abrir discussão para entrar na spec.
```

**2. Regra para o AGENTS.md.** Ataca o padrão de erro na origem:

```markdown
- Se o pedido ou a spec não definem algo (status, formato, fonte de dados, regra de negócio), pergunte antes de implementar. Não preencha lacunas com suposições.
- Não crie regra de negócio, limite, efeito colateral (e-mail, log com dado pessoal) ou dependência que não esteja em docs/spec.md.
- Ao terminar, liste o que você assumiu, uma linha por suposição.
```

A última linha é a mais barata e a mais útil: ela faz o agente **declarar** o que assumiu, em vez de você caçar.

**3. Pedido de revisão para o agente, depois da sua.** Usar IA para revisar não é o problema. O problema é pedir "revisa aí" sem critério. Faça a sua revisão primeiro e depois peça assim:

```text
Compare o diff da branch atual com docs/spec.md.
Para cada if, status HTTP, mensagem de erro, dependência e efeito colateral, diga:
- a linha da spec que o justifica, ou "não está na spec";
- se não está: uma entrada exata que mostra o comportamento e a resposta que a spec espera.
Não sugira melhorias de estilo. Não altere arquivos.
```

<details class="toca">
<summary>Trilha da Toca · para quem terminou antes</summary>

1. **Zero assumidos.** Reescreva o pedido de 9 palavras até que nenhum trecho do diff precise ser classificado como "assumido". Quantas linhas ficou o pedido? Compare com a spec de T1: ela é mais curta ou mais longa que o seu pedido?
2. **Assumido vira ADR.** Escolha duas suposições do diff (fonte de dados, status de sucesso) e escreva cada uma como um ADR de cinco linhas: contexto, decisão, alternativa descartada, consequência.
3. **A contraprova vira teste.** A linha 17 deixa duas pessoas agendarem a mesma vaga. Escreva o teste que prova isso com `Promise.all` e duas requisições simultâneas. O NFR-1 da spec diz o resultado exato esperado.
4. **Ache um quarto tipo.** Existe algum trecho que não é pedido, nem assumido, nem inventado? (Dica: o que **falta** no código também tem origem. Onde está escrito que a vaga deve ficar ocupada depois do agendamento?)

</details>

## Termos-chave

| Termo | O que dizem | O que realmente significa |
|---|---|---|
| Pedido | "O que eu quis dizer." | O que está escrito no pedido ou na spec. O que você pensou e não escreveu não conta. |
| Assumido | "A IA entendeu." | Decisão que o pedido deixou aberta e a IA tomou sozinha. Pode estar certa, mas não foi sua. |
| Inventado | "A IA foi além." | Regra, efeito ou dependência que ninguém pediu e o problema não exige. |
| Rastreabilidade | "Documentação." | Ir de cada linha de código até a linha da spec que a justifica, e de volta. |
| Contraprova | "Testar." | Uma entrada exata cuja resposta esperada (pela spec) é diferente da resposta que o código dá. |
| Revisão genérica | "Revisei." | Revisão sem critério escrito: "parece certo", "mandei outra IA olhar". |

## Para ir além

- [Alice no País das Maravilhas](https://www.gutenberg.org/ebooks/11), texto original em domínio público no Projeto Gutenberg. O capítulo 6 tem a conversa com o Gato.
- [Como fazer code review](https://google.github.io/eng-practices/review/reviewer/), guia do Google (em inglês): o que olhar, em que ordem e como escrever comentários.
- `docs/specs/dominio-agenda-mentorias.md` neste repositório: a spec completa do domínio usado nos laboratórios.
