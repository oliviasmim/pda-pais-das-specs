## O problema

Três cenas da mesma semana:

1. O agente inventou uma regra de negócio. Você pediu "não invente regras". Na sessão seguinte, ele inventou de novo. Você pediu de novo. E de novo.
2. A sessão está há duas horas aberta, com logs de erro enormes. O agente começa a esquecer a spec e repete um erro que já tinha corrigido.
3. Um vídeo diz que "o jeito profissional" é usar um swarm de cinco agentes para fazer um CRUD de uma tabela. Parece avançado. Você fica com vergonha de não usar.

As três têm a mesma causa: **olhar só para o modelo e esquecer o harness.** O pedido repetido é um guia que some a cada sessão. A sessão lotada é contexto sem isolamento. O swarm é um harness grande demais para a porta.

## O conceito

### Agente = LLM + Harness

O **LLM** (modelo de linguagem) prevê o próximo token, que é um pedaço de texto. Sozinho, ele não lê arquivo, não roda teste, não lembra da sessão de ontem. O **harness** nada mais é do que tudo o que fica em volta do modelo e o transforma num agente: ferramentas, permissões, AGENTS.md, skills, MCPs, hooks, testes, CI, subagents.

O modelo é o motor. O harness é o resto do carro: volante, freio, painel, cinto.

Quando o agente erra, a pergunta útil quase nunca é "qual modelo é melhor?". É: **que peça do harness faltou?**

O LLM também **sorteia** o próximo token. A temperatura controla quanto esse sorteio se abre: com 0, sai sempre o mais provável; mais alto, o mesmo prompt dá textos diferentes. Por isso você testa o comportamento (status, corpo, regra) e não a frase.

### Guias e sensores

Todo componente do harness faz uma de duas coisas:

| | Guia (feedforward) | Sensor (feedback) |
|---|---|---|
| Quando age | **Antes** de o agente gerar | **Depois** que o agente gerou |
| O que faz | Aumenta a chance de acertar de primeira | Detecta o erro e devolve um sinal |
| Exemplos | AGENTS.md, skill, spec com EARS, ADR (registro de uma decisão de arquitetura), exemplo de código | Lint, type check, build, testes, `npm audit`, CI, agente de review, hook que bloqueia |
| Sozinho vira | Esperança: ninguém confere se foi seguido | Retrabalho: o agente erra e o sensor reprova, sem fim |

Sensores ainda se dividem em dois tipos. **Computacionais** são determinísticos e baratos: lint, tipos, testes. Rodam sempre e dão sempre a mesma resposta. **Inferenciais** usam um modelo para julgar: agente de review, LLM como juiz (um modelo dando nota para a saída de outro). Pegam o que o lint não vê, mas podem errar e custam tokens. Use os computacionais em tudo e os inferenciais onde eles não alcançam.

O teste escrito **antes** da implementação é especial: é guia e sensor ao mesmo tempo. Antes, diz ao agente o que precisa passar. Depois, mede se passou. Por isso o TDD (escrever o teste antes do código) combina tão bem com IA.

**A regra que fecha o loop:** se a IA repetiu um erro, você precisa de **um guia novo** (uma regra no AGENTS.md, para ela errar menos) **e de um sensor novo** (um teste ou uma checagem no review, para pegar quando errar mesmo assim). Pedir de novo no chat não é nenhum dos dois: a mensagem some quando a sessão fecha, e é por isso que a cena 1 se repete.

Antes de gravar a regra, faça a pergunta: **se essa linha sumir, o agente volta a errar do mesmo jeito?** Se a resposta for "não", a regra é ruído, e cada linha do AGENTS.md custa tokens em toda sessão.

### Onde cada guia mora

Os guias mudam em duas coisas: quando entram na janela e quanto custam em tokens.

| Peça | Entra na janela | Custo | Serve para | Na agenda de mentorias |
|---|---|---|---|---|
| AGENTS.md | Em **toda** sessão | Fixo: cada linha conta sempre | Regras curtas que valem para o projeto inteiro | "Não edite arquivos em `tests/`." |
| Skill | Só a `description` fica sempre. O corpo entra quando a skill dispara | Pequeno até disparar | Procedimento que se repete | Como criar um endpoint no padrão do `GET /mentores` |
| MCP / tool | O agente chama quando precisa | Descrição da tool sempre; resultado só na chamada | Capacidade nova: ler docs, consultar sistema | Buscar a doc atual do Express |
| Hook | O harness executa, sem o modelo decidir | Nenhum na janela | Garantia que não pode depender do modelo | Bloquear a edição de `tests/` |

O Claude Code lê `CLAUDE.md`, não `AGENTS.md`. Quando o projeto usa `AGENTS.md`, o `CLAUDE.md` importa com uma linha: `@AGENTS.md`. Este repositório faz isso.

### Skill em três níveis

A skill funciona por **progressive disclosure** (revelação progressiva): o agente só lê o que precisa, na hora em que precisa.

| Nível | O que entra na janela | Quando |
|---|---|---|
| 1 · `description` | Nome e descrição de cada skill | Sempre, em toda sessão |
| 2 · `SKILL.md` | O passo a passo | Quando o pedido combina com a description |
| 3 · arquivos de apoio | Scripts e referências | Só se o passo a passo mandar ler |

Por isso a `description` decide tudo. Vaga, a skill nunca dispara. Larga demais, ela entra em pedido que não é dela. A fórmula é: **o que faz + quando usar + quando não usar**. A documentação recomenda manter o `SKILL.md` abaixo de 500 linhas e mover o resto para arquivos de apoio.

<div data-cartas="carta-rainha"></div>

### Grande demais para a porta: contexto

A janela de contexto (o que o agente consegue ter à vista de uma vez) é assim. Tudo o que o agente lê, roda e responde fica lá dentro. Até uns 60% da janela, o agente está na **smart zone**. (Esse 60% é a régua que a gente usa no curso, não um limite publicado: a qualidade cai aos poucos, e o ponto muda de modelo para modelo.) Depois disso, entra na **dumb zone**: esquece instruções do começo, repete erros, mistura tarefas. É o *context rot* que você viu na S2: a janela cheia de histórico que não serve mais, puxando a qualidade para baixo.

Subagents (agentes auxiliares que trabalham à parte) resolvem um problema específico: **isolamento de contexto**.

- O subagent roda numa janela **própria**, com o seu próprio prompt de sistema, ferramentas e permissões.
- Ele **não vê** a conversa do agente principal. Recebe só o pedido.
- Quando termina, só o **resumo final** volta para o principal. Os 20 mil tokens de log que ele leu ficam lá e somem.
- Isso **tem custo**: os tokens do subagent também são gastos. Você troca dinheiro por uma janela principal limpa.

No Claude Code, um subagent é um arquivo Markdown em `.claude/agents/` com `name`, `description` e, opcionalmente, `tools` e `model`. O `description` diz ao agente principal **quando** delegar. É a pergunta da Lagarta: *"Quem é você?"*. Se o subagent não sabe responder em uma frase, ele não deveria existir.

### Precisa mesmo?

Subagents, paralelismo, supervisor, *swarm* (o nome da moda para um arranjo de muitos agentes): tudo isso tem custo de coordenação. Use só quando ele se paga.

O custo aparece em tokens. No sistema de pesquisa da Anthropic, agentes usaram cerca de 4 vezes mais tokens que um chat, e sistemas com vários agentes, cerca de 15 vezes. A própria Anthropic diz que isso só se paga em tarefas de muito valor.

| Use | Quando | Não use quando |
|---|---|---|
| Agente único | A tarefa cabe numa sessão e tem partes dependentes | (é o padrão; precisa de motivo para sair dele) |
| Subagent | A leitura é grande e a resposta é curta (pesquisa, review de diff grande) | A tarefa precisa de tudo o que você já entendeu |
| Paralelo com worktrees (uma cópia do repositório por agente) | Tarefas independentes, em arquivos diferentes, com prazo | Uma tarefa depende do resultado da outra |
| Supervisor (um agente que divide, distribui e confere o trabalho dos outros) | Muitas partes parecidas e um sensor objetivo para cada | Não existe como conferir o trabalho de cada parte |

Lembra da cena 3? Dizer "não" para cinco agentes num CRUD de uma tabela é uma decisão técnica, e você consegue defendê-la em review ou em entrevista. "Todo mundo está usando" não responde nada. A pergunta que responde é: **que problema isso resolve aqui, e quanto custa?**

<div data-quiz="check"></div>

## Pratique

### 1. O mesmo prompt, cinco vezes

Suba a temperatura e rode de novo. Anote o que muda e o que você testaria no lugar da frase.

<div data-lab="temperatura"></div>

### 2. O ciclo do harness

Avance passo a passo pela T1. Depois desligue os guias, os sensores ou os dois e veja onde o ciclo quebra.

<div data-lab="ciclo-harness"></div>

### 3. Monte o harness

Classifique as 14 peças. Para cada uma, pergunte: ela age antes de o agente gerar ou olha o que ele já fez? Duas delas costumam enganar.

<div data-lab="guias-sensores"></div>

### 4. Faxina de contexto

A janela começa com tudo dentro, em 78%. Tire o que não serve à T1 até ficar abaixo de 60%. Se tirar demais, o agente inventa o que faltou.

<div data-lab="faxina-contexto"></div>

### 5. A porta e a chave

O agente vai implementar a T1 da agenda (`POST /agendamentos`). Primeiro, rode tudo no principal. Depois, recomece e delegue as investigações pesadas. Compare onde cada versão termina.

<div data-lab="contexto"></div>

**Por dentro da máquina.** A face da frente do agente principal é o frasco: a altura do líquido é quanto da janela está ocupado, e a linha tracejada marca o limite da smart zone. Rode a tarefa grande com agente único e veja em qual task ele passa da linha. Troque para sequencial e compare. Por fim, encolha a tarefa e confira qual padrão sai mais barato.

<div data-lab="motion-subagent"></div>

### 6. Dispara ou não dispara?

São quatro versões da description da mesma skill, testadas contra dez pedidos. Ache a versão que acerta os dez e diga o que ela tem que as outras não têm.

<div data-lab="disparo-skill"></div>

### 7. Precisa mesmo?

Em dupla. Para cada cenário, escolham o arranjo **antes** de revelar e escrevam o critério em uma frase. Se discordarem da recomendação, defendam: a recomendação também pode estar errada para o seu contexto.

<div data-lab="precisa-mesmo"></div>

### 8. Carta de Destino

Escreva o destino da próxima feature do seu projeto. Só vale o que dá para virar teste.

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
<summary>Desafio extra · para quem terminou antes</summary>

1. **Meça a sua janela.** Numa sessão real do seu projeto, use `/context` no Claude Code a cada 15 minutos. Em que momento você passa de 60%? O que encheu a janela?
2. **Mesma review, dois contextos.** Peça uma revisão do mesmo diff duas vezes: uma na sessão principal (que escreveu o código) e outra num subagent de review com contexto limpo. Compare os achados. Qual foi mais crítico? Por quê?
3. **Guia sem sensor.** Liste todas as regras do seu AGENTS.md. Para cada uma, qual sensor confere se ela foi seguida? As que não têm sensor são esperança. Escolha uma e crie o sensor.
4. **Regra ou ruído.** Escolha um erro real do seu projeto e escreva uma regra de uma frase. Rode a mesma tarefa duas vezes, sem a regra e com ela. Se o resultado não mudou, apague a regra.
5. **Defenda o não.** Escreva um parágrafo para um colega que quer usar um swarm no projeto final: qual problema o swarm resolveria, quanto custaria e o que você faria no lugar.

</details>

## Termos-chave

| Termo | O que dizem | O que realmente significa |
|---|---|---|
| Harness | "O prompt." | Tudo em volta do modelo que o transforma em agente: ferramentas, memória, regras, sensores, permissões. |
| Guia (feedforward) | "Instrução." | Componente que age antes da geração para aumentar a chance de acerto. |
| Sensor (feedback) | "Teste." | Componente que age depois da geração e devolve um sinal: passou ou não, e por quê. |
| Sensor computacional | "Ferramenta." | Sensor determinístico: lint, tipos, testes, build. |
| Sensor inferencial | "Outra IA olhando." | Sensor que usa um modelo para julgar, como um agente de review com rubrica. |
| Temperatura | "O quanto a IA é criativa." | Parâmetro que abre ou fecha o sorteio do próximo token. Com 0, sai o mais provável. Mais alto, o mesmo prompt dá saídas diferentes. |
| Progressive disclosure | "Carregar tudo de uma vez." | Carregar só o que a tarefa pede: a description sempre, o passo a passo quando a skill dispara, os arquivos de apoio sob demanda. |
| Context rot | "A IA ficou burra." | Perda de qualidade quando a janela enche de histórico irrelevante. |
| Subagent | "Mais um agente." | Agente com janela própria que recebe só o pedido e devolve só o resumo. Resolve isolamento de contexto. |
| Swarm | "O jeito avançado." | Nome da moda para arranjos de vários agentes. Útil em poucos casos. Em todos eles, tem custo de coordenação. |
| Custo de coordenação | "Overhead." | Tokens, tempo e conflitos gastos para dividir, distribuir e integrar trabalho entre agentes. |

## Para ir além

- [Harness: o que é, como funciona e por que virou a palavra de 2026](https://www.alura.com.br/artigos/o-que-e-harness), artigo da Alura (pré-requisito da S10).
- [Subagents no Claude Code](https://code.claude.com/docs/en/sub-agents), documentação oficial: formato do arquivo, campos e quando o principal delega.
- [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents), da Anthropic: por que começar pela solução mais simples e só adicionar agentes quando ela não basta.
- [Skills no Claude Code](https://code.claude.com/docs/en/skills), documentação oficial: formato do `SKILL.md`, campos do frontmatter e o limite de 500 linhas.
- [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills), da Anthropic: a origem do progressive disclosure.
- [Boas práticas para escrever skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices): como escrever a `description` e validar com cenários que disparam e que não disparam.
- [Como o Claude Code lembra do seu projeto](https://code.claude.com/docs/en/memory): `CLAUDE.md`, hierarquia de memória e o import de `AGENTS.md`.
- [Boas práticas do Claude Code](https://code.claude.com/docs/en/best-practices): o que entra e o que fica de fora do `CLAUDE.md`.
- [AGENTS.md](https://agents.md/): o formato aberto, um README para agentes.
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), da Anthropic: curar os tokens que entram na janela.
- [Context Rot](https://www.trychroma.com/research/context-rot), relatório da Chroma: 18 modelos de ponta pioram conforme a entrada cresce.
- [Lost in the Middle](https://arxiv.org/abs/2307.03172) (Liu et al.): o modelo usa pior o que está no meio de um contexto longo.
- [Smart zone](https://www.aihero.dev/ai-coding-dictionary/smart-zone), AI Coding Dictionary: a origem do nome smart zone e dumb zone.
- [Explore the context window](https://code.claude.com/docs/en/context-window), documentação do Claude Code: o que enche a janela, do prompt de sistema ao `/compact`.
- [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system), da Anthropic: o custo em tokens de vários agentes.
- [Tiktokenizer](https://tiktokenizer.vercel.app): cole um texto e veja os tokens. Compare português e inglês, prosa e código.
