> Os jogadores jogavam todos ao mesmo tempo, sem esperar a vez, brigando o tempo todo e disputando os ouriços.
>
> Lewis Carroll, *Alice no País das Maravilhas*, cap. 8 (tradução livre).

## O problema

Quando a turma descobre subagents (agentes ajudantes que o agente principal chama), vem a tentação: *se um agente resolve, cinco resolvem cinco vezes mais rápido*. Na internet isso ganhou nome: **swarm**, um enxame de agentes.

O croquet da Rainha é um swarm. Todo mundo joga ao mesmo tempo, ninguém espera a vez, os tacos são flamingos que fogem e as bolas são ouriços que vão embora.

Pensa comigo no que cada agente a mais cobra antes de entregar qualquer coisa:

- **subir:** cada subagent começa do zero e precisa ler `AGENTS.md`, a spec e os arquivos da task;
- **coordenar:** alguém decide quem faz o quê e passa o bastão;
- **integrar:** alguém junta os resultados e resolve conflitos;
- **revisar:** alguém confere se cada entrega bate com a spec.

Se o ganho de rodar junto for menor que essa conta, mais agentes deixam o trabalho **mais lento e mais caro**. Nesta lição você faz essa conta antes de abrir o terceiro terminal. E sai sabendo dizer "aqui um agente só resolve", com o número na mão.

## O conceito

### Por que subagents existem

Um subagent nada mais é do que um agente com **janela de contexto própria** (o espaço de texto que a IA consegue ler de uma vez). Ele recebe uma tarefa, trabalha e devolve **só um resumo** para quem chamou. Os logs, as tentativas e os arquivos que ele leu ficam com ele.

É isso que resolve o problema da lição *Beba-me*: o agente principal não enche a janela com o trabalho dos outros e continua na smart zone (até uns 40% da janela ocupada, onde ele ainda segue as instruções do começo). Ou seja, o motivo do subagent é **isolar o contexto**. Ganhar tempo é bônus, e só acontece quando as tasks são independentes.

### Os quatro jeitos de dar as cartas

| Naipe | Padrão | Como funciona | Use quando | Cuidado com |
|---|---|---|---|---|
| ♠ | **Agente único** | Uma sessão faz tudo, em ordem. | A task é pequena, está em cadeia, ou precisa enxergar tudo junto. | O contexto acumula e passa dos 40%: dumb zone (o agente começa a esquecer instruções e repetir erros). |
| ♣ | **Sequencial** | Um subagent por etapa, um depois do outro. A saída de um é a entrada do próximo. | Etapas com naturezas diferentes. Ex.: RPI com pesquisa, plano e implementação em sessões separadas. | Handoff (o resumo que passa de um para o outro) mal escrito perde informação. Não ganha tempo. |
| ♦ | **Paralelo** | Vários subagents ao mesmo tempo, cada um no seu worktree (a cópia do repositório do Chá Maluco). Integração no fim. | Tasks independentes, em arquivos diferentes, cada uma com teste de aceite próprio. | Conflitos, tokens multiplicados, integração que come o ganho. |
| ♥ | **Supervisor** | Um agente planeja, distribui, revisa cada entrega e consolida. | Muitas partes que precisam de critério comum, ou que disputam os mesmos arquivos. | O supervisor vira gargalo e também gasta contexto. |

<div data-lab="padroes-mapa"></div>

Ande pelos quatro desenhos antes de decorar a tabela. Perceba onde a seta volta (supervisor) e onde aparece o losango (a integração do paralelo): é ali que o tempo extra entra.

**Swarm** não é um quinto padrão. É o nome que se dá a arranjos com muitos subagents. Quando alguém disser "vamos fazer um swarm", pergunte: *qual dos quatro, e por quê?* O OpenAI Swarm, que popularizou o nome, é um projeto educacional: o próprio README diz que ele foi substituído pelo OpenAI Agents SDK e recomenda migrar para uso em produção.

Você vai achar esses padrões com outros nomes no texto da Anthropic sobre agentes: o sequencial é parecido com *prompt chaining*, o paralelo com *parallelization* e o supervisor com *orchestrator-workers*.

### O custo de coordenação

O tempo do paralelo não é o tempo da task mais longa. A conta é:

> **tempo ≈ task mais longa + subir os agentes + integrar + resolver conflitos**

E a parte que não divide (planejar, integrar, revisar) limita o ganho, não importa quantos agentes você ponha. Com tokens (os pedaços de texto que o modelo lê e pelos quais você paga) é pior: cada subagent paga de novo a leitura do contexto inicial. A própria Anthropic relata que o sistema de pesquisa dela com vários agentes gasta cerca de 15 vezes mais tokens que uma conversa comum. Vale quando o problema é grande e dá para dividir. Para um bug de uma linha, não vale.

Isso tem nome antigo: **Lei de Brooks**. Fred Brooks escreveu em 1975 que pôr mais gente num projeto atrasado atrasa mais, porque cada pessoa nova precisa aprender o projeto e conversar com as outras. Os pares de conversa crescem com n·(n−1)/2: 3 agentes têm 3 pares, 6 têm 15, 8 têm 28. Na mesma pesquisa, a Anthropic diz que tarefas de código têm menos partes realmente paralelas que pesquisa, e que agentes ainda coordenam mal entre si em tempo real.

No laboratório abaixo, comece com os valores padrão (as três tasks do speedrun). Depois baixe **Partes independentes** para 1 e veja a linha cheia (o tempo real) subir: com uma parte só, cada agente a mais só custa.

<div data-lab="custo-coordenacao"></div>

### O teste da Rainha: quatro perguntas antes de paralelizar

1. **Independentes?** Nenhuma task precisa do resultado da outra.
2. **Arquivos diferentes?** Cada uma mexe nos seus arquivos (ou só numa linha de registro).
3. **Pronto próprio?** Cada uma tem teste de aceite que diz quando acabou.
4. **Integração curta?** Juntar tudo cabe em poucos minutos.

Quatro "sim": paralelo. Um "não" já basta para ir de sequencial ou agente único. Muitas partes com critério comum: supervisor.

<div data-cartas="navalha,par"></div>

A carta 🎩 Navalha também vale para arquitetura de agentes: *qual é o arranjo mais simples que entrega o mesmo resultado?* Se um agente único passa nos mesmos testes no mesmo tempo, os outros quatro são abstraction bloat de agente (camadas demais sem necessidade).

Frase pronta para recusar o swarm com argumento:

> "Não vou paralelizar aqui porque as tasks estão em cadeia: o paralelo vira sequencial com pedágio. Um agente único, com a spec e os testes, resolve."

<div data-quiz="check"></div>

## Pratique

<div data-lab="orquestracao"></div>

**Em dupla, cenário por cenário.** Antes de clicar, cada pessoa escolhe um padrão e diz em voz alta o porquê, usando as quatro perguntas do teste da Rainha. Depois rodem. Errou o palpite? Perguntem: "**qual das quatro perguntas eu respondi errado?**"

Terminem no cenário **Speedrun**: ele é o plano da Aula 2. Depois, em **Monte o seu**, descrevam uma feature do projeto de vocês e vejam qual padrão ganha.

### Depois do speedrun: do log para o documento

O entregável da semana é o documento "Quando um agente único teria sido melhor". Ele só vale com os números do seu log, preenchido durante o speedrun. Digite os minutos aqui: o laboratório faz as contas (a), (b) e (c), compara com a sua aposta e gera as seções 2 a 4 em Markdown. As seções 1 e 5 (por que vocês dividiram assim, e a regra que levam para o próximo projeto) ficam para você escrever.

<div data-lab="log-paralelo"></div>

Ganho (c) pequeno ou negativo não invalida o documento: esse número é justamente o dado que a semana pediu. Escreva qual parte do log explica o resultado (conflito, diffs para revisar, contexto lido de novo por cada agente).

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

1. **Meça o seu speedrun.** Antes da Aula 2, preveja no laboratório o tempo do seu time. Depois do speedrun, compare com o tempo real. Onde o modelo do laboratório errou: coordenação, integração ou a própria task?
2. **Profundidade.** Subagents podem chamar subagents (até três níveis por padrão no Claude Code). Desenhe um caso em que isso ajuda e um em que vira o croquet da Rainha.
3. **Votação.** Uma variação do paralelo é rodar a **mesma** task em vários agentes e comparar as saídas. Quando isso vale o custo? (Dica: revisão de segurança, não implementação.)
4. **Revisão em paralelo.** No cenário "Revisar um PR grande", troque supervisor por paralelo e explique o que se perde quando ninguém consolida os quatro relatórios.

</details>

## Termos-chave

| Termo | O que dizem | O que realmente significa |
|---|---|---|
| Subagent | "Um agente mais rápido." | Um agente com janela de contexto própria, que devolve só um resumo para quem chamou. |
| Isolamento de contexto | "Separar os chats." | Manter o trabalho (logs, tentativas, arquivos lidos) de uma task fora da janela do agente principal. |
| Swarm | "Muitos agentes resolvem mais." | Nome para arranjos com muitos subagents. Por baixo, sempre é um dos quatro padrões, com mais cartas. |
| Custo de coordenação | "Detalhe." | Tempo e tokens para subir agentes, passar o bastão, integrar e revisar. Pode comer todo o ganho. |
| Supervisor | "O agente chefe." | Um agente que planeja, distribui, revisa e consolida, e não implementa. |

## Para ir além

- [Building effective agents (Anthropic)](https://www.anthropic.com/engineering/building-effective-agents): prompt chaining, parallelization e orchestrator-workers, com quando usar cada um.
- [How we built our multi-agent research system (Anthropic)](https://www.anthropic.com/engineering/multi-agent-research-system): o custo real em tokens de vários agentes e quando ele compensa.
- [Subagents no Claude Code](https://code.claude.com/docs/en/sub-agents): como configurar, contexto próprio e o que volta para o agente principal.
- [Patterns and problems in emerging multiagent systems (Anthropic)](https://www.anthropic.com/research/multiagent-systems): experimentos com enxames de agentes e as falhas de coordenação que apareceram.
- [Lei de Brooks (Wikipedia)](https://en.wikipedia.org/wiki/Brooks%27s_law): o enunciado e a origem em *The Mythical Man-Month*, de 1975.
- [OpenAI Swarm (GitHub)](https://github.com/openai/swarm): o projeto educacional que popularizou o nome, com o aviso de substituição no README.
- [Worktrees no Claude Code](https://code.claude.com/docs/en/worktrees): a diferença entre isolar arquivo (worktree) e dividir o trabalho dentro de uma sessão (subagent).
