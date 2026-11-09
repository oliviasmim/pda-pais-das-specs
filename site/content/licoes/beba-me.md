> Havia um frasco com um rótulo de papel: "BEBA-ME". Mas Alice era sensata e não ia fazer aquilo com pressa: "Não, primeiro vou olhar se está escrito *veneno* ou não."
>
> Lewis Carroll, *Alice no País das Maravilhas*, cap. 1 (tradução livre).

## O problema

Três cenas da mesma semana:

1. O agente inventou uma regra de negócio. Você pediu "não invente regras". Na sessão seguinte, ele inventou de novo. Você pediu de novo. E de novo.
2. A sessão está há duas horas aberta, com logs de erro enormes. O agente começa a esquecer a spec e repete um erro que já tinha corrigido.
3. Um vídeo diz que "o jeito profissional" é usar um swarm de cinco agentes para fazer um CRUD de uma tabela. Parece avançado. Você fica com vergonha de não usar.

As três têm a mesma causa: **olhar só para o modelo e esquecer o harness.** O pedido repetido é um guia que some a cada sessão. A sessão lotada é contexto sem isolamento. O swarm é um harness grande demais para a porta.

## O conceito

### Agente = LLM + Harness

O **LLM** prevê o próximo token. Sozinho, ele não lê arquivo, não roda teste, não lembra da sessão de ontem. O **harness** é tudo o que fica em volta e transforma o modelo num agente: ferramentas, permissões, AGENTS.md, skills, MCPs, hooks, testes, CI, subagents.

O modelo é o motor. O harness é o resto do carro: volante, freio, painel, cinto. Ninguém dirige um motor.

Quando o agente erra, a pergunta útil quase nunca é "qual modelo é melhor?". É: **que peça do harness faltou?**

### Guias e sensores

Todo componente do harness faz uma de duas coisas:

| | Guia (feedforward) | Sensor (feedback) |
|---|---|---|
| Quando age | **Antes** de o agente gerar | **Depois** que o agente gerou |
| O que faz | Aumenta a chance de acertar de primeira | Detecta o erro e devolve um sinal |
| Exemplos | AGENTS.md, skill, spec com EARS, ADR, exemplo de código | Lint, type check, build, testes, `npm audit`, CI, agente de review, hook que bloqueia |
| Na história | Alice lê o rótulo do frasco | A Rainha grita "Cortem-lhe a cabeça!" |
| Sozinho vira | Esperança: ninguém confere se foi seguido | Retrabalho: o agente erra e o sensor reprova, sem fim |

Sensores ainda se dividem em dois tipos. **Computacionais** são determinísticos e baratos: lint, tipos, testes. Rodam sempre e dão sempre a mesma resposta. **Inferenciais** usam um modelo para julgar: agente de review, LLM como juiz. Pegam o que o lint não vê, mas podem errar e custam tokens. Use os computacionais em tudo e os inferenciais onde eles não alcançam.

O teste escrito **antes** da implementação é especial: é guia e sensor ao mesmo tempo. Antes, diz ao agente o que precisa passar. Depois, mede se passou. Por isso TDD combina tão bem com IA.

**A regra que fecha o loop:** se a IA repetiu um erro, você precisa de **um guia novo** (uma regra no AGENTS.md, para ela errar menos) **e de um sensor novo** (um teste ou uma checagem no review, para pegar quando errar mesmo assim). Pedir de novo no chat não é nenhum dos dois.

<div data-cartas="carta-rainha"></div>

### Grande demais para a porta: contexto

Alice bebe e encolhe, come e cresce, e nunca está do tamanho certo para a porta. A janela de contexto é assim. Tudo o que o agente lê, roda e responde fica lá dentro. Até uns 40% da janela, o agente está na **smart zone**. Depois disso, entra na **dumb zone**: esquece instruções do começo, repete erros, mistura tarefas. É o *context rot* da S2.

Subagents resolvem um problema específico: **isolamento de contexto**.

- O subagent roda numa janela **própria**, com o seu próprio prompt de sistema, ferramentas e permissões.
- Ele **não vê** a conversa do agente principal. Recebe só o pedido.
- Quando termina, só o **resumo final** volta para o principal. Os 20 mil tokens de log que ele leu ficam lá e somem.
- Isso **não é de graça**: os tokens do subagent também são gastos. Você troca dinheiro por uma janela principal limpa.

No Claude Code, um subagent é um arquivo Markdown em `.claude/agents/` com `name`, `description` e, opcionalmente, `tools` e `model`. O `description` diz ao agente principal **quando** delegar. É a pergunta da Lagarta: *"Quem é você?"*. Se o subagent não sabe responder em uma frase, ele não deveria existir.

### Precisa mesmo?

Subagents, paralelismo, supervisor, *swarm* (o nome da moda para um arranjo de muitos agentes): tudo isso tem custo de coordenação. Use só quando ele se paga.

| Use | Quando | Não use quando |
|---|---|---|
| Agente único | A tarefa cabe numa sessão e tem partes dependentes | (é o padrão; precisa de motivo para sair dele) |
| Subagent | A leitura é grande e a resposta é curta (pesquisa, review de diff grande) | A tarefa precisa de tudo o que você já entendeu |
| Paralelo com worktrees | Tarefas independentes, em arquivos diferentes, com prazo | Uma tarefa depende do resultado da outra |
| Supervisor | Muitas partes parecidas e um sensor objetivo para cada | Não existe como conferir o trabalho de cada parte |

Recusar um padrão avançado sem necessidade não é falta de conhecimento. É julgamento. Ninguém no mercado sabe tudo, e "todo mundo está usando" não é argumento técnico. A pergunta é sempre: **que problema isso resolve aqui, e quanto custa?**

<div data-quiz="check"></div>

## Pratique

### 1. Monte o harness

Classifique cada peça. Preste atenção nas que parecem óbvias e não são.

<div data-lab="guias-sensores"></div>

### 2. A porta e a chave

O agente vai implementar a T1 do speedrun (`POST /agendamentos`). Primeiro, rode tudo no principal. Depois, recomece e delegue as investigações pesadas. Compare onde cada versão termina.

<div data-lab="contexto"></div>

### 3. Precisa mesmo?

Em dupla. Para cada cenário, escolham o arranjo **antes** de revelar e escrevam o critério em uma frase. Se discordarem da recomendação, defendam: a recomendação também pode estar errada para o seu contexto.

<div data-lab="precisa-mesmo"></div>

### 4. Carta de Destino

Fechamento da Aula 1. Escreva o destino da feature que você vai usar no speedrun (ou da próxima feature do seu projeto). O Gato só aprova o que dá para virar teste.

<div data-lab="carta-destino"></div>

## Leve com você

**1. Um subagent de investigação** (`.claude/agents/investigador.md`):

```markdown
---
name: investigador
description: Lê muitos arquivos ou logs longos e devolve só a conclusão. Use quando a leitura for grande e a resposta for curta.
tools: Read, Grep, Glob
model: haiku
---

Você investiga e não altera nada.

Responda em no máximo 15 linhas:
1. A resposta direta à pergunta.
2. Os arquivos e linhas que sustentam a resposta (caminho:linha).
3. O que você não conseguiu confirmar.

Não proponha código. Não resuma o que não foi perguntado.
```

**2. O mapa do harness no AGENTS.md** (para você e para o agente saberem o que existe):

```markdown
## Harness deste projeto

### Guias (antes de gerar)
- docs/spec.md: critérios EARS com status e mensagens exatas
- docs/adr/: decisões que o agente não deve refazer
- .claude/skills/: como criar endpoint, como escrever teste

### Sensores (depois de gerar)
- npm run lint · npm run typecheck · npm test · npm audit --audit-level=high
- .claude/agents/rastreador-de-spec.md: confere cada mudança contra a spec
- CI bloqueia merge vermelho

### Quando a IA repetir um erro
Adicione uma regra aqui (guia) E um teste ou checagem de review (sensor).
```

**3. O template da Carta de Destino** (cole no topo da spec antes de abrir a sessão):

```markdown
## Feature: <uma frase>

| Caso | Entrada | Resposta esperada |
|---|---|---|
| Deve funcionar | <entrada exata> | <status> <corpo> |
| Deve falhar | <entrada exata> | <status> {"erro":"<mensagem>"} |

- Requisito não funcional: <com número>
- Sensor: <teste ou ferramenta, rodando onde>
- Fora do escopo: <o que a IA não deve criar>

> Se algo necessário não estiver aqui, pergunte antes de inventar.
```

<details class="toca">
<summary>Trilha da Toca · para quem terminou antes</summary>

1. **Meça a sua janela.** Numa sessão real do seu projeto, use `/context` no Claude Code a cada 15 minutos. Em que momento você passa de 40%? O que encheu a janela?
2. **Mesma review, dois contextos.** Peça uma revisão do mesmo diff duas vezes: uma na sessão principal (que escreveu o código) e outra num subagent de review com contexto limpo. Compare os achados. Qual foi mais crítico? Por quê?
3. **Guia sem sensor.** Liste todas as regras do seu AGENTS.md. Para cada uma, qual sensor confere se ela foi seguida? As que não têm sensor são esperança. Escolha uma e crie o sensor.
4. **Defenda o não.** Escreva um parágrafo para um colega que quer usar um swarm no projeto final: qual problema o swarm resolveria, quanto custaria e o que você faria no lugar.

</details>

## Termos-chave

| Termo | O que dizem | O que realmente significa |
|---|---|---|
| Harness | "O prompt." | Tudo em volta do modelo que o transforma em agente: ferramentas, memória, regras, sensores, permissões. |
| Guia (feedforward) | "Instrução." | Componente que age antes da geração para aumentar a chance de acerto. |
| Sensor (feedback) | "Teste." | Componente que age depois da geração e devolve um sinal: passou ou não, e por quê. |
| Sensor computacional | "Ferramenta." | Sensor determinístico: lint, tipos, testes, build. |
| Sensor inferencial | "Outra IA olhando." | Sensor que usa um modelo para julgar, como um agente de review com rubrica. |
| Context rot | "A IA ficou burra." | Perda de qualidade quando a janela enche de histórico irrelevante. |
| Subagent | "Mais um agente." | Agente com janela própria que recebe só o pedido e devolve só o resumo. Resolve isolamento de contexto. |
| Swarm | "O jeito avançado." | Nome da moda para arranjos de vários agentes. Útil em poucos casos, caro em todos. |
| Custo de coordenação | "Overhead." | Tokens, tempo e conflitos gastos para dividir, distribuir e integrar trabalho entre agentes. |

## Para ir além

- [Harness: o que é, como funciona e por que virou a palavra de 2026](https://www.alura.com.br/artigos/o-que-e-harness), artigo da Alura (pré-requisito da S10).
- [Subagents no Claude Code](https://code.claude.com/docs/en/sub-agents), documentação oficial: formato do arquivo, campos e quando o principal delega.
- [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents), da Anthropic: por que começar pela solução mais simples e só adicionar agentes quando ela não basta.
