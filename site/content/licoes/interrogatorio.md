> "Você poderia me dizer, por favor, que caminho devo tomar para sair daqui?"
> "Isso depende bastante de para onde você quer ir", disse o Gato.
>
> Lewis Carroll, *Alice no País das Maravilhas*, cap. 6 (tradução livre).

## O problema

Alguém do time pede para a IA:

> Crie um endpoint para o jovem agendar uma mentoria.

Em dez segundos chegam 50 linhas. O código roda, a rota responde, o status é 200. Tem cara de pronto.

Agora vem a revisão: **está certo?** Três respostas possíveis:

- "Testaria."
- "Pediria para outra IA revisar."
- "Parece limpo, tem até uma Factory."

Perceba que nenhuma das três diz **contra o quê** o código vai ser conferido, **com que entrada** e **esperando que resposta**. São promessas de revisão. Sem esses três itens, elas não pegam nada.

E código de IA é difícil de revisar por um motivo específico: o erro dele parece uma boa ideia que alguém teve. Um limite de 3 mentorias por mês, um e-mail de confirmação. Você lê e pensa "faz sentido".

## O conceito

### Toda linha tem uma origem

Antes de perguntar se uma linha está certa, pergunte **de onde ela veio**. Tem três respostas possíveis:

| Origem | O que é | O que fazer |
|---|---|---|
| **Pedido** | Está escrito no pedido ou na spec. | Conferir se está completo. Uma linha pedida pode estar pela metade. |
| **Assumido** | O pedido deixou em aberto e a IA escolheu sozinha. O status, o nome do campo, a fonte de dados. | Virar decisão escrita (na spec ou num ADR, o registro curto de uma decisão) ou pergunta para quem pediu. Pode até estar certo, mas ninguém do time decidiu. |
| **Inventado** | Ninguém pediu e o problema não exige. Uma regra de negócio, um e-mail, uma dependência, uma camada. | Remover. Se for mesmo necessário, levar para a spec com alguém responsável pela decisão. |

O pedido do exemplo tem 9 palavras. Ele não diz o status de sucesso, o formato do corpo, o que fazer com vaga ocupada nem de onde vêm os dados. Cada lacuna vira uma escolha da IA. Escolher `src/repo.js` como fonte de dados é inofensivo. Deixar duas pessoas agendarem a mesma vaga é bug.

### O padrão de erro da IA

A IA não erra ao acaso. Ela prevê a continuação mais provável do texto. Quando o pedido é vago, o mais provável é **a média dos sistemas de agenda que apareceram no treino dela**: um limite por mês, um e-mail de confirmação, um padrão de projeto popular, o status mais usado.

> **A IA preenche as lacunas do pedido com suposições plausíveis.** Plausível é diferente de pedido.

Isso tem duas consequências práticas:

1. **Antes de gerar:** quanto menos lacunas no pedido, menos suposições. Esse é o trabalho da spec e do EARS, o jeito de escrever requisito em frases com formato fixo que a gente viu nas semanas 6 e 7.
2. **Na revisão:** a pergunta "isso faz sentido?" não serve, porque quase tudo que a IA escreve faz sentido. A pergunta que pega o erro é **"onde está escrito isso?"**.

### Sinais de estrutura sem origem

Classe, camada e arquivo também têm origem. Com pedido vago, a IA tende a criar estrutura "para o caso de precisar", mesmo quando o problema é pequeno. O curso chama isso de **abstraction bloat**, ou seja, abstração inchada (o nome é nosso; ninguém publicou uma métrica com ele). Seis sinais para procurar no diff:

| Sinal | Como aparece no código | Pergunta de rastro |
|---|---|---|
| Classe Deus | Um arquivo valida, formata, grava, notifica e registra log. | Qual linha do pedido manda este arquivo fazer cinco coisas? |
| Miragem modular | Vários arquivos com nome bonito, e o mesmo código de antes cortado em pedaços sem critério. | O que cada arquivo sabe do domínio que o outro não sabe? |
| Camada de passagem | `Handler` ou `Service` que só repassa a chamada. | Que regra ou decisão existe aqui e não existe na função de baixo? |
| Nome genérico | `Manager`, `Helper`, `Util`, `Processor`. | Como o mentor ou o jovem chamaria isto numa conversa? |
| Duplicação | A mesma validação de e-mail escrita em dois arquivos, com 10 minutos de diferença. | A função que já existia foi lida nesta sessão? |
| Erro mascarado | `try/catch` que engole tudo e devolve 500. | Qual status a spec manda para este caso? |

Duas fontes dão peso ao padrão, sem prová-lo: o relatório da GitClear sobre 623 milhões de mudanças (2023 a 2026) aponta mais duplicação e menos refatoração, e a entrada do Thoughtworks Radar descreve a complacência com código gerado por IA. As duas estão em "Para ir além".

Veja no endpoint do exercício. A spec manda seguir o padrão de `GET /mentores`, que é uma função simples:

**Antes** (a IA preencheu a dúvida com camada: uma classe e uma factory só para criar um objeto):

```js
class AgendamentoServiceFactory {
  static criar() {
    return new AgendamentoService(repo, enviarEmail);
  }
}
const service = AgendamentoServiceFactory.criar();
const agendamento = await service.agendar({ vagaId, jovemEmail });
```

**Depois** (mesma resposta, nenhum teste muda):

```js
const agendamento = agendar(repo, { vagaId, jovemEmail });
```

### Revisão com spec e sem spec

Sem spec, o máximo que você consegue dizer é "isso foi assumido". Com spec, a pergunta tem resposta de sim ou não: **está na linha X da spec, ou não está**.

Ou seja, a spec tem dois leitores. O agente lê antes de gerar, e **quem revisa lê depois para comparar**. Sem ela, a revisão vira opinião contra opinião.

### A spec também tem origem

Em projeto grande, o rastro tem um degrau a mais. A spec nasce de uma pesquisa, e o código nasce da spec. O curso separa isso em três sessões de agente. Cada uma começa com a conversa vazia e lê só o arquivo que a anterior deixou:

1. **Research** (pesquisa): entende o problema e grava `RESEARCH.md`.
2. **Plan** (plano): escreve a spec com EARS, ADR e fatias. Fatia é um pedaço pequeno da feature que já funciona de ponta a ponta.
3. **Implement** (implementação): escreve o código, uma fatia por vez.

<svg viewBox="0 0 640 230" role="img" aria-labelledby="cadeia-t cadeia-d" style="width:100%;max-width:640px;height:auto;font-family:var(--font-body)">
<title id="cadeia-t">Cadeia de rastro: Research, Plan, Implement</title>
<desc id="cadeia-d">Três caixas ligadas por setas. Research gera o arquivo RESEARCH.md, Plan gera a spec, Implement gera o diff. Abaixo, o alcance de um erro em cada etapa: milhares de linhas, centenas de linhas, uma fatia.</desc>
<defs><marker id="cadeia-seta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--ink-2)"/></marker></defs>
<g stroke-width="2">
<rect x="10" y="20" width="170" height="80" rx="10" fill="var(--paper-2)" stroke="var(--tinta)"/>
<rect x="235" y="20" width="170" height="80" rx="10" fill="var(--paper-2)" stroke="var(--uva)"/>
<rect x="460" y="20" width="170" height="80" rx="10" fill="var(--paper-2)" stroke="var(--folha)"/>
<path d="M182 60H233M407 60H458" stroke="var(--ink-2)" marker-end="url(#cadeia-seta)"/>
</g>
<g fill="var(--ink)" text-anchor="middle" font-size="15" font-weight="600">
<text x="95" y="50">1 · Research</text><text x="320" y="50">2 · Plan</text><text x="545" y="50">3 · Implement</text>
</g>
<g fill="var(--ink-2)" text-anchor="middle" font-size="12">
<text x="95" y="72">RESEARCH.md</text><text x="95" y="90">o problema está certo?</text>
<text x="320" y="72">spec + ADR + fatias</text><text x="320" y="90">o plano está certo?</text>
<text x="545" y="72">o diff, fatia a fatia</text><text x="545" y="90">fez o que o plano diz?</text>
</g>
<g stroke="var(--copas)" stroke-width="3" stroke-linecap="round" fill="none">
<path d="M10 150H180"/><path d="M235 150H405" opacity=".7"/><path d="M460 150H520" opacity=".5"/>
</g>
<g fill="var(--ink)" text-anchor="middle" font-size="13">
<text x="95" y="175">erro aqui: milhares de linhas</text><text x="320" y="175">erro aqui: centenas</text><text x="545" y="175">erro aqui: uma fatia</text>
</g>
<text x="320" y="210" text-anchor="middle" font-size="12" fill="var(--ink-3)">Quanto mais cedo o erro nasce, mais código se apoia nele. Fonte da proporção: Dex Horthy, HumanLayer (2025).</text>
</svg>

Cada EARS da spec aponta para uma frase do `RESEARCH.md`, e cada trecho do código aponta para um EARS. EARS sem frase de pesquisa por trás é regra inventada com formato bonito.

O erro nasce numa etapa e aparece em outra. O e-mail que ninguém queria só aparece no diff, mas quem escreveu "o jovem precisa receber um e-mail" foi o `RESEARCH.md`. Se você corrige só o código, a próxima sessão lê o mesmo `RESEARCH.md` e o e-mail volta.

O tamanho do processo depende do tamanho do problema. Corrigir um erro de digitação não pede três sessões. A T1 inteira, com as duas requisições ao mesmo tempo do NFR-1 (requisito não funcional número 1, a regra de concorrência), pede.

### As 6 perguntas

Seis perguntas para trocar o "testaria" por uma revisão que dá para conferir. Cada carta mostra uma resposta ruim e uma boa. A boa sempre cita **uma linha, uma entrada, um status ou uma mensagem exata**.

<div data-cartas="rastro,contraprova,par,contrato,navalha,carta-rainha"></div>

A ♣ **Contraprova** nada mais é do que escrever, antes de rodar, o que você espera ver. É a carta que mais muda a revisão:

| Ruim | Bom |
|---|---|
| "Testaria com vaga ocupada." | "Agendar a vaga 1 duas vezes. Espero `201` e depois `409 {"erro":"Vaga indisponível"}`. O código devolve `200` nas duas." |

Se você não consegue escrever a coluna da direita, ainda não sabe o que o código deveria fazer. Aí volte para a spec antes de ler mais código.

## Pratique

Em dupla, 15 minutos. Uma pessoa lê o trecho em voz alta e a outra decide a origem. Troquem a cada trecho.

1. Leiam primeiro **sem a spec**. Classifiquem cada trecho marcado.
2. Depois liguem **Comparar com a spec** e vejam quantos "assumidos" ganham resposta.
3. Para três trechos, escrevam a contraprova completa no chat da aula: **entrada → esperado → o código devolve**.

<div data-lab="interrogatorio"></div>

### Por dentro: de onde vem cada linha

Agora o mesmo problema por dentro do agente. Rode primeiro com o pedido vago e sem AGENTS.md. Depois troque uma peça por vez (pedido, AGENTS.md, sensores) e olhe o livro-razão, a lista que mostra de onde veio cada linha do diff. Conte quantas linhas ganham endereço na spec a cada troca.

<div data-lab="motion-agente"></div>

### Triagem antes da leitura

O rastro começa antes do código, na lista de arquivos. `git diff --stat` mostra o que o PR tocou e quantas linhas mudaram em cada arquivo. Arquivo cujo nome não tem relação com o título do PR fica suspeito até alguém explicar. Fique de olho em três: teste que já existia e foi alterado, pacote novo no `package.json` e arquivo vizinho "arrumado" de carona.

<div data-lab="triagem-pr"></div>

### Onde o erro nasceu

Seis defeitos de um endpoint de agendamento. Para cada um, decida em qual das três sessões ele nasceu. A resposta mostra o que foi construído em cima do erro, e por isso onde vale corrigir.

<div data-lab="cadeia-rpi"></div>

<div data-quiz="check"></div>

### Para discutir

- Qual trecho vocês **aceitariam** sem pensar se estivessem com pressa? Por quê?
- O `moment` e a `AgendamentoServiceFactory` não quebram nenhum teste. Por que tirar mesmo assim?
- Se a spec existisse antes, quantos trechos a IA teria acertado de primeira?
- No laboratório "Onde o erro nasceu", qual defeito você corrigiria primeiro no código e depois descobriria que o conserto certo era no `RESEARCH.md`?
- No `git diff --stat`, qual arquivo você abre primeiro? Por quê?

## Leve com você

**1. Comentário de revisão com rastro e contraprova.** Use este formato em todo comentário de PR (pull request). Se você não consegue preencher, ainda tem só uma impressão.

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

A última linha custa uma frase e economiza caça: o agente **declara** o que assumiu e você começa a revisão por ali. A lista não substitui o rastro, porque o agente não enxerga toda suposição que fez.

**3. Pedido de revisão para o agente, depois da sua.** Dá para usar IA na revisão, desde que ela tenha um critério escrito. Faça a sua revisão primeiro e depois peça assim:

```text
Compare o diff da branch atual com docs/spec.md.
Para cada if, status HTTP, mensagem de erro, dependência e efeito colateral, diga:
- a linha da spec que o justifica, ou "não está na spec";
- se não está: uma entrada exata que mostra o comportamento e a resposta que a spec espera.
Não sugira melhorias de estilo. Não altere arquivos.
```

<details class="toca">
<summary>Desafio extra · para quem terminou antes</summary>

1. **Zero assumidos.** Reescreva o pedido de 9 palavras até que nenhum trecho do diff precise ser classificado como "assumido". Quantas linhas ficou o pedido? Compare com a spec de T1: ela é mais curta ou mais longa que o seu pedido?
2. **Assumido vira ADR.** Escolha duas suposições do diff (fonte de dados, status de sucesso) e escreva cada uma como um ADR de cinco linhas: contexto, decisão, alternativa descartada, consequência.
3. **A contraprova vira teste.** A linha 17 deixa duas pessoas agendarem a mesma vaga. Escreva o teste que prova isso com `Promise.all` e duas requisições ao mesmo tempo. O NFR-1 da spec diz o resultado exato: uma 201 e uma 409.
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
- [Technology Radar: Complacency with AI-generated code](https://www.thoughtworks.com/en-us/radar/techniques/complacency-with-ai-generated-code) (Thoughtworks, em inglês): a entrada nomeia a complacência com código gerado e recomenda TDD, análise estática e instruções curadas de equipe.
- [The Maintainability Gap: 2026 AI Code Quality Research](https://www.gitclear.com/the_ai_code_quality_maintainability_gap) (GitClear, em inglês): 623 milhões de mudanças analisadas. Dá número para duplicação e refatoração. É correlação, e os próprios dados não provam causa.
- [AI-Generated Smells](https://arxiv.org/html/2605.02741v1) (arXiv, em inglês): paper que nomeia God Class Syndrome e Modular Mirage em código de LLM e de agentes.
- [Advanced Context Engineering for Coding Agents](https://www.humanlayer.dev/blog/advanced-context-engineering) (Dex Horthy, HumanLayer, 2025, em inglês): origem do fluxo Research, Plan, Implement e da proporção "pesquisa ruim, milhares de linhas ruins".
- [Why Software Factories Fail](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/wsff.md) (Dex Horthy, HumanLayer, 2026, em inglês): por que ninguém ler o código que o agente escreveu falha, e as quatro fases antes do código.
- [Best practices for Claude Code](https://code.claude.com/docs/en/best-practices) (documentação oficial, em inglês): separar pesquisa e plano da implementação, e a revisão adversarial por subagente numa sessão nova.
- [Balancing speed and safety: a control framework for AI coding agents](https://aws.amazon.com/blogs/security/balancing-speed-and-safety-a-control-framework-for-ai-coding-agents/) (AWS, em inglês): nomeia o scope creep do agente (R007) e recomenda checar os arquivos fora do escopo declarado antes da aprovação humana.
- [EARS: Easy Approach to Requirements Syntax](https://alistairmavin.com/ears/) (Alistair Mavin): os cinco padrões de frase usados nas specs deste curso.
- `docs/specs/dominio-agenda-mentorias.md` neste repositório: a spec completa do domínio usado nos laboratórios.
