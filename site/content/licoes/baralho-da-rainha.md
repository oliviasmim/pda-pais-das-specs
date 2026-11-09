> Os jogadores jogavam todos ao mesmo tempo, sem esperar a vez, brigando o tempo todo e disputando os ouriços.
>
> Lewis Carroll, *Alice no País das Maravilhas*, cap. 8 (tradução livre).

## O problema

Depois que a turma descobre subagents (agentes ajudantes que o agente principal chama), aparece a tentação: *se um agente é bom, cinco são melhores*. Na internet isso tem nome bonito: **swarm**, um enxame de agentes.

O croquet da Rainha é um swarm. Todo mundo joga ao mesmo tempo, ninguém espera a vez, os tacos são flamingos que fogem e as bolas são ouriços que vão embora.

Cada agente a mais tem um preço:

- **subir:** cada subagent começa do zero e precisa ler `AGENTS.md`, a spec e os arquivos da task;
- **coordenar:** alguém decide quem faz o quê e passa o bastão;
- **integrar:** alguém junta os resultados e resolve conflitos;
- **revisar:** alguém confere se cada entrega bate com a spec.

Se o ganho de rodar junto for menor que esse preço, mais agentes deixam o trabalho **mais lento e mais caro**. Recusar o swarm, com argumento, é sinal de maturidade.

## O conceito

### Por que subagents existem

Um subagent nada mais é do que um agente com **janela de contexto própria** (o espaço de texto que a IA consegue ler de uma vez). Ele recebe uma tarefa, trabalha, e devolve **só um resumo** para quem chamou. Os logs, as tentativas e os arquivos que ele leu ficam com ele.

É isso que resolve o problema da lição 3: o agente principal não enche a janela com o trabalho dos outros e continua na smart zone. **Isolamento de contexto é o motivo. Velocidade é bônus**, e só quando as tasks são independentes.

### Os quatro jeitos de dar as cartas

| Naipe | Padrão | Como funciona | Use quando | Cuidado com |
|---|---|---|---|---|
| ♠ | **Agente único** | Uma sessão faz tudo, em ordem. | A task é pequena, está em cadeia, ou precisa enxergar tudo junto. | O contexto acumula e passa dos 40%: dumb zone. |
| ♣ | **Sequencial** | Um subagent por etapa, um depois do outro. A saída de um é a entrada do próximo. | Etapas com naturezas diferentes. Ex.: RPI com pesquisa, plano e implementação em sessões separadas. | Handoff ruim perde informação. Não ganha tempo. |
| ♦ | **Paralelo** | Vários subagents ao mesmo tempo, cada um no seu worktree. Integração no fim. | Tasks independentes, em arquivos diferentes, cada uma com teste de aceite próprio. | Conflitos, tokens multiplicados, integração que come o ganho. |
| ♥ | **Supervisor** | Um agente planeja, distribui, revisa cada entrega e consolida. | Muitas partes que precisam de critério comum, ou que disputam os mesmos arquivos. | O supervisor vira gargalo e também gasta contexto. |

**Swarm** não é um quinto padrão. É o nome que se dá a arranjos com muitos subagents. Quando alguém disser "vamos fazer um swarm", pergunte: *qual dos quatro, e por quê?*

Esses padrões aparecem com outros nomes no texto da Anthropic sobre agentes: o sequencial é parecido com *prompt chaining*, o paralelo com *parallelization* e o supervisor com *orchestrator-workers*.

### O custo de coordenação

O tempo do paralelo não é o tempo da task mais longa. É:

> **tempo ≈ task mais longa + subir os agentes + integrar + resolver conflitos**

E a parte que não paraleliza (planejar, integrar, revisar) limita o ganho, não importa quantos agentes você ponha. Com tokens é pior: cada subagent paga de novo a leitura do contexto inicial. A própria Anthropic relata que o sistema de pesquisa dela com vários agentes gasta cerca de 15 vezes mais tokens que uma conversa comum. Vale quando o problema é grande e divisível. Não vale para um bug de uma linha.

### O teste da Rainha: quatro perguntas antes de paralelizar

1. **Independentes?** Nenhuma task precisa do resultado da outra.
2. **Arquivos diferentes?** Cada uma mexe nos seus arquivos (ou só numa linha de registro).
3. **Pronto próprio?** Cada uma tem teste de aceite que diz quando acabou.
4. **Integração curta?** Juntar tudo cabe em poucos minutos.

Quatro "sim": paralelo. Algum "não": sequencial ou agente único. Muitas partes com critério comum: supervisor.

<div data-cartas="navalha,par"></div>

A carta 🎩 Navalha também vale para arquitetura de agentes: *qual é o arranjo mais simples que entrega o mesmo resultado?* Se um agente único passa nos mesmos testes no mesmo tempo, os outros quatro são abstraction bloat de agente (camadas demais sem necessidade).

Frase pronta para recusar com julgamento:

> "Não vou paralelizar aqui porque as tasks estão em cadeia: o paralelo vira sequencial com pedágio. Um agente único, com a spec e os testes, resolve."

<div data-quiz="check"></div>

## Pratique

<div data-lab="orquestracao"></div>

**Em dupla, cenário por cenário.** Antes de clicar, cada pessoa escolhe um padrão e diz em voz alta o porquê, usando as quatro perguntas do teste da Rainha. Depois rodem. Quando errarem o palpite, perguntem: "**qual das quatro perguntas eu respondi errado?**"

Termine no cenário **Speedrun**: ele é o plano da Aula 2. Depois, monte o seu caso com o projeto de vocês.

## Leve com você

Prompt para o agente principal agir como supervisor:

```markdown
Você é o supervisor desta feature. Você não implementa código.

1. Leia docs/spec.md e divida o trabalho em tasks atômicas, cada uma com
   teste de aceite (entrada e resposta exata).
2. Para cada par de tasks, diga se dependem uma da outra e se tocam o mesmo
   arquivo. As que disputam arquivo vão em fila, não em paralelo.
3. Para cada task independente, chame um subagent implementador.
4. Quando cada um voltar, confira: o teste de aceite passou? Algum arquivo
   fora da lista da task mudou? Alguma regra que não está na spec apareceu?
5. Me entregue: o que foi feito, o que ficou de fora e qual decisão é minha.
```

Registro de decisão para colar no PR:

```markdown
## Orquestração
- Padrão escolhido: (único | sequencial | paralelo | supervisor)
- Teste da Rainha: independentes? __ · arquivos diferentes? __ · pronto próprio? __ · integração curta? __
- Por que não um agente único: ___
- Tempo previsto: __ min · tempo real: __ min
- O que custou mais do que eu esperava: ___
```

<details class="toca">
<summary>Trilha da Toca · para quem terminou antes</summary>

1. **Meça o seu speedrun.** Antes da Aula 2, preveja no laboratório o tempo do seu time. Depois do speedrun, compare com o tempo real. Onde o modelo do laboratório errou? Coordenação, integração ou a própria task?
2. **Profundidade.** Subagents podem chamar subagents (até três níveis por padrão no Claude Code). Desenhe um caso em que isso ajuda e um em que vira o croquet da Rainha.
3. **Votação.** Uma variação do paralelo é rodar a **mesma** task em vários agentes e comparar as saídas. Quando isso vale o custo? (Dica: revisão de segurança, não implementação.)
4. **Revisão em paralelo.** No cenário "Revisar um PR grande", troque supervisor por paralelo e explique o que se perde quando ninguém consolida os quatro relatórios.

</details>

## Termos-chave

| Termo | O que dizem | O que realmente significa |
|---|---|---|
| Subagent | "Um agente mais rápido." | Um agente com janela de contexto própria, que devolve só um resumo para quem chamou. |
| Isolamento de contexto | "Separar os chats." | Manter o trabalho (logs, tentativas, arquivos lidos) de uma task fora da janela do agente principal. |
| Swarm | "Muitos agentes resolvem mais." | Nome para arranjos com muitos subagents. Sempre é um dos quatro padrões, com mais cartas. |
| Custo de coordenação | "Detalhe." | Tempo e tokens para subir agentes, passar o bastão, integrar e revisar. Pode comer todo o ganho. |
| Supervisor | "O agente chefe." | Um agente que planeja, distribui, revisa e consolida, e não implementa. |

## Para ir além

- [Building effective agents (Anthropic)](https://www.anthropic.com/engineering/building-effective-agents): prompt chaining, parallelization e orchestrator-workers, com quando usar cada um.
- [How we built our multi-agent research system (Anthropic)](https://www.anthropic.com/engineering/multi-agent-research-system): o custo real em tokens de vários agentes e quando ele compensa.
- [Subagents no Claude Code](https://code.claude.com/docs/en/sub-agents): como configurar, contexto próprio e o que volta para o agente principal.
