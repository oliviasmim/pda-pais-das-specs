# Semana 10 · Revisão: "Para onde você quer ir?"

> "Você poderia me dizer, por favor, que caminho devo tomar para sair daqui?"
> "Isso depende bastante de para onde você quer ir", disse o Gato.
> "Não me importa muito para onde...", disse Alice.
> "Então não importa que caminho você tome", disse o Gato.
>
> Lewis Carroll, *Alice no País das Maravilhas* (1865), cap. 6. Domínio público.

Guia de facilitação das duas aulas síncronas da Semana 10 da Especialização em IA (PdA).
Este documento é para a facilitadora. O material dos alunos está no site (`site/`).

---

## 1. O diagnóstico em uma frase

**A turma sabe escolher o contexto, mas não sabe dizer o destino.** Ela pede bem e confere mal.

| Fonte | O que mostra | O que muda nesta semana |
|---|---|---|
| Relatório OIP · Encontro 1 | 81% conferem a resposta da IA de forma genérica ("testaria", "mandaria para outra IA"). Pensamento Crítico é a única dimensão abaixo de metade da turma em "Demonstrado". | Toda atividade termina com um caso que passa e um que falha, com a resposta exata. |
| Relatório OIP · Encontro 1 | Cerca de metade leu errado a ficha 3 (saldo calculado no banco, escala de 50 mil transações) e a ficha 7 (contrato de entrada e saída). | A ficha 3 é um **requisito não funcional** (escala). A ficha 7 é um **contrato**. Ninguém ensinou isso com nome. Esta semana ensina (DDIA cap. 2). |
| Relatório OIP · Encontro 1 | 60% não releram o prompt antes de enviar. Só 4 alunos levaram o contexto fixo para AGENTS.md ou skill. | Fechamento das duas aulas: um erro que a IA repetiu vira regra no AGENTS.md ou checagem no agente de review. |
| Matriz INR (análise do aluno) | Prioridades: Quality gates e CI (9.8), TDD (9.5), context rot (9.2), subagentes e isolamento (8.8), MCP (8.5), abstraction bloat (8.1). | Os quatro primeiros são o centro das duas aulas. MCP entra só como "capacidade" no mapa do harness. |
| Relatório integrado de dúvidas | Pergunta recorrente: "Como evitar que o agente altere o teste para passar?" | Laboratório "As rosas pintadas" e hook que bloqueia edição de teste. |
| Guia do Encontro 2 da OIP | Próxima avaliação: revisar código gerado por IA a partir de um pedido vago. PC nível 3 = identificar o padrão "a IA preenche lacunas com suposições plausíveis" e propor como evitar. | As aulas treinam exatamente esse hábito, **com outro cenário**, para não contaminar a avaliação (ver seção 7). |

Na linguagem High Agency: o problema da turma é a **Vague Trap**. O aluno age, mas não define o resultado que vai provar que acertou. A revisão desta semana instala o contrário: **Clear Thinking antes de Bias to Action.**

---

## 2. A ideia central da semana

**Agente sem destino é vibe coding com mais tokens.**

Subagents, worktrees, CI e review aceleram o caminho. Nenhum deles escolhe o destino. Quem escolhe é a pessoa, escrevendo:

1. o que o sistema faz (requisito funcional),
2. quão bem ele precisa fazer (requisito não funcional, com número),
3. como vamos saber que fez (sensor).

A frase que a turma deve repetir no fim da semana:

> **Requisito sem número é desejo. Requisito sem sensor é promessa.**

---

## 3. O Baralho do Gato: as seis perguntas

As seis perguntas que a turma precisa responder sem travar viram um baralho. Cada carta tem uma pergunta, o que ela mede e como é uma resposta ruim e uma boa. Elas aparecem em todas as atividades, no site e nas fichas impressas.

| Carta | Pergunta | Mede | Resposta ruim | Resposta boa |
|---|---|---|---|---|
| ♠ Rastro | Aponte uma linha deste diff. Onde, no pedido ou na spec, está escrito isso? | Rastreabilidade | "Acho que faz sentido ter isso." | "Linha 14, `if (vagas >= 3)`. Não está na spec. A IA inventou um limite de 3 por mês." |
| ♣ Contraprova | Que entrada você usaria para provar que este trecho está errado? O que espera ver? | Falsificação | "Testaria com vários casos." | "`POST /agendamentos` com `mentorId: 999`. Espero `404 {"erro":"Mentor não encontrado"}`. O código devolve 500." |
| ♥ Par | Me dê um caso que deve funcionar e um que deve falhar, com a resposta exata de cada um. | Critério de aceite | "Funciona se agendar, falha se der erro." | "Vaga livre → `201` com o id. Mesma vaga de novo → `409 {"erro":"Vaga indisponível"}`." |
| ♦ Contrato | Quando você diz "tratar o erro", qual erro, qual status e qual mensagem? | Contrato de erro | "Tratar os erros." | "E-mail ausente → `400 {"erro":"email é obrigatório"}`." |
| 🎩 Navalha | Qual é o código mais simples que passa nos mesmos testes? | Abstraction bloat | "Está limpo, tem até interface." | "O `AgendamentoServiceFactory` some. Uma função de 12 linhas passa nos mesmos 6 testes." |
| 🫖 Carta à Rainha | Que tipo de erro a IA repetiu hoje? Que regra você colocaria no AGENTS.md ou no agente de review para pegá-lo? | Fechar o loop do harness | "A IA errou umas coisas." | "Ela inventou regra de negócio duas vezes. Regra no AGENTS.md: 'Não crie regra de negócio que não esteja em docs/spec.md; se faltar, pergunte.' Checagem no reviewer: listar cada `if` de regra e a linha da spec correspondente." |

---

## 4. A metáfora: o País das Specs

A metáfora não é enfeite. Cada cena do livro carrega um conceito que a turma já viu, e ajuda a lembrar dele.

| Cena (Carroll, 1865) | Conceito | Semana de origem |
|---|---|---|
| Cair na toca do coelho sem saber para onde | Vibe coding: agir sem destino | S1, S6 |
| O Gato de Cheshire: "depende de para onde você quer ir" | Requisitos e critério de sucesso antes do código | S5, S6, S7 |
| O Coelho Branco: "Estou atrasado!" | Requisitos não funcionais: desempenho, percentis, latência de cauda | DDIA cap. 2 (novo) |
| "BEBA-ME": Alice confere se o frasco diz "veneno" antes de beber | Guia (feedforward): AGENTS.md, skills, spec | S2, S3 |
| Alice grande demais para a porta, pequena demais para a chave | Janela de contexto, smart zone, context rot | S1, S2 |
| A Lagarta: "Quem é você?" | Papel e descrição de um subagent | S9, S10 |
| O Chá Maluco: todos mudam de lugar para ter uma xícara limpa | Git worktrees: cada agente na sua xícara | S10 |
| O baralho da Rainha: jardineiros, soldados, rei | Orquestração: sequencial, paralelo, supervisor | S10 |
| Os jardineiros pintando rosas brancas de vermelho | O agente que altera o teste para "passar" | S8 |
| A Falsa Tartaruga (*Mock Turtle*) | Teste que só testa o mock | S9 |
| Alice crescendo até não caber na casa do Coelho | Abstraction bloat | S5, S9 |
| "Cortem-lhe a cabeça!" | Sensor que bloqueia (gate de CI) | S8 |
| O julgamento do Valete: "Sentença primeiro, veredito depois!" | Aceitar o código antes da evidência (o anti-TDD) | S8, S9 |
| Os jurados escrevendo bobagens na lousa | Agente de review sem rubrica | S9 |
| "Isso não prova nada!" (Alice sobre a carta-evidência) | Revisão baseada em evidência | S9 |

Tenniel e Carroll são domínio público. O site usa apenas ícones próprios e o texto em tradução livre.

---

## 5. Requisitos funcionais e não funcionais para IA (DDIA, cap. 2)

Referência: Martin Kleppmann e Chris Riccomini, *Designing Data-Intensive Applications*, 2ª edição (O'Reilly), capítulo 2, "Defining Nonfunctional Requirements". As ideias abaixo são paráfrase e adaptação para o contexto da turma. Se quiser citar trechos literais em aula, use o livro.

**Por que isso importa para quem usa IA:** o agente quase nunca erra o requisito funcional que você escreveu. Ele erra o que você **não** escreveu. E o que a turma menos escreve é o requisito não funcional. Sem ele, a IA escolhe o padrão mais simples: lista em memória, `find` em array, nenhuma concorrência, nenhuma meta de tempo. Foi o que aconteceu com a ficha 3 da OIP.

| Ideia do capítulo | Tradução para a turma | Como vira prompt, spec e sensor |
|---|---|---|
| Funcional = o que o sistema faz. Não funcional = quão bem: rápido, confiável, escalável, fácil de manter. | "Agendar mentoria" é funcional. "Agendar em menos de 300 ms com 300 jovens abrindo a agenda ao mesmo tempo" é não funcional. | NFR entra na spec com número e na CI como teste. |
| Estudo de caso: timelines de rede social. Calcular na leitura ou materializar na escrita. | Vagas livres: calcular a cada `GET` ou manter um contador atualizado a cada agendamento. A ficha 3 da OIP (saldo calculado no banco) é a mesma decisão. | ADR curto com a escolha e o motivo. A IA não pode decidir isso sozinha. |
| Tempo de resposta é uma distribuição, não um número. Use percentis (p50, p95, p99), não média. | "Rápido" não é critério. "p95 < 300 ms" é. | Teste de desempenho com meta de percentil. |
| Latência de cauda se amplifica: um pedido que chama vários serviços espera o mais lento. | Um endpoint que chama 5 coisas em sequência sofre a cauda de todas. | Laboratório do Coelho Branco no site mostra isso ao vivo. |
| Falha (*fault*) não é pane (*failure*). Tolerância a falhas é o sistema seguir funcionando quando uma parte falha. Erro humano é a causa mais comum. | O que acontece se o envio de e-mail cair? O agendamento falha junto? | EARS: "SE o envio de e-mail falhar, ENTÃO o sistema DEVE confirmar o agendamento e registrar a falha." |
| Escalabilidade não é um rótulo ("é escalável"). É a pergunta: "se a carga crescer assim, o que fazemos?". Primeiro descreva a carga. | "300 jovens, 40 mentores, pico na abertura da agenda às 9h de segunda." | A carga vira parte do contexto do prompt e do teste. |
| Manutenibilidade: operabilidade, simplicidade, evolutividade. Complexidade acidental é a que não vem do problema. | Abstraction bloat é complexidade acidental gerada pela IA. | Carta 🎩 Navalha: o código mais simples que passa nos mesmos testes. |
| SLO e SLA: metas explícitas de serviço. | O "contrato" que diz o que conta como bom o suficiente. | Meta escrita, medida e com gate. |

Mapa para a aula: cada requisito não funcional é escrito em EARS, com número, e ganha um sensor. A turma já sabe EARS (S6) e já sabe montar CI (S8). A novidade é ligar os dois.

---

## 6. As duas aulas

### Visão geral

| | Aula 1 · Destino | Aula 2 · Caminho |
|---|---|---|
| Título | "O Gato e o Coelho: requisitos antes de agentes" | "O Chá e o Tribunal: subagents, worktrees, gates e review" |
| Pergunta da aula | Para onde você quer ir e como vai saber que chegou? | Como chegar lá rápido sem perder o controle? |
| Formato | Laboratórios no site, em duplas, com a facilitadora projetando | Speedrun cronometrado de 40 min com placar + red team em duplas |
| Entregável | Carta de Destino (1 feature, 1 caso que passa, 1 que falha, 1 NFR com número e sensor) | PR integrado com CI verde + 1 regra no AGENTS.md + 1 checagem no agente de review |
| Objetivos de S10 cobertos | Agente = LLM + Harness; feedforward vs feedback; isolamento de contexto; recusar padrões sem necessidade | Orquestração; worktrees; CI e gates com IA; diff grande; subagents de review |

O papel da facilitadora muda: **ela não roda comandos. Ela faz perguntas do baralho.** Quem digita é a turma.

### Aula 1 · O Gato e o Coelho (120 min)

| Tempo | Bloco | O que acontece | Site |
|---|---|---|---|
| 0–10 | Abertura: o Gato pergunta | Projetar a citação. Cada aluno escreve no chat, em uma frase, a próxima feature do seu projeto. A facilitadora escolhe 3 e aplica o **Teste do Gato** ao vivo: "alguém consegue escrever um teste que falha a partir dessa frase?". Quase sempre não. Mostrar o número da turma (81% conferem de forma genérica) sem nomes. | Página inicial, modo projetor |
| 10–35 | Lição 1: Interrogatório do Gato | Em duplas, abrir o diff gerado pela IA para "Crie um endpoint para o jovem agendar uma mentoria". Clicar em cada linha marcada e classificar: **pedido**, **assumido** ou **inventado**. Para três linhas, responder uma carta do baralho por escrito. Debate: qual o padrão de erro da IA? (Preencher lacunas com suposições plausíveis.) | `#/licao/interrogatorio` |
| 35–65 | Lição 2: O Coelho Branco está atrasado | 8 min de exposição com o simulador de percentis projetado (média vs p95, latência de cauda). Depois, cada grupo recebe uma categoria de NFR (desempenho, confiabilidade, escalabilidade, manutenibilidade, privacidade/LGPD) e usa o **Construtor de Requisitos** para escrever um NFR em EARS, com número e sensor. Cada grupo lê o seu; a turma aplica a carta ♣ Contraprova. | `#/licao/coelho-branco` |
| 65–75 | Intervalo | | |
| 75–100 | Lição 3: Beba-me (Agente = LLM + Harness) | Arrastar 14 artefatos para **Guia** ou **Sensor** (AGENTS.md, skill, spec, lint, teste, hook, agente de review...). Depois, o simulador de contexto: o agente principal enchendo de logs, a conversão para subagent, o que volta para o principal. Fechar com as 6 cartas **"Precisa mesmo?"**: a turma recusa padrões avançados sem necessidade, com justificativa. | `#/licao/beba-me` |
| 100–112 | Carta de Destino | Cada aluno escreve, no site, a Carta de Destino da feature que vai usar no speedrun (ou da feature do próprio projeto). O site gera o texto pronto para colar na spec. | `#/licao/beba-me` (final) |
| 112–120 | Saída | Quiz de saída (3 perguntas). Pedir que tragam Node 20+ e Claude Code funcionando para a Aula 2. | Quiz pós da lição 3 |

**Onde a turma avançada é desafiada (Aula 1):** quem termina antes faz as "Trilhas da Toca" de cada lição: escrever o NFR de concorrência para a última vaga, transformar um NFR em fitness function, desenhar a decisão "calcular na leitura vs materializar na escrita" como ADR.

### Aula 2 · O Chá e o Tribunal (120 min)

| Tempo | Bloco | O que acontece | Site |
|---|---|---|---|
| 0–12 | O Chá do Chapeleiro | Simulador de worktrees projetado: três agentes na mesma pasta se atropelam; com uma xícara (worktree) para cada, não. A turma dita os comandos (`git worktree add`, `claude -w`). Depois, o simulador de orquestração: sequencial, paralelo e supervisor com tempo e custo de coordenação. | `#/licao/cha-do-chapeleiro`, `#/licao/baralho-da-rainha` |
| 12–22 | Briefing do Speedrun | Projeto inicial `agenda-mentorias`, 3 tasks independentes + integração. Regras: teste antes da implementação (commit vermelho primeiro), testes de aceite protegidos, CI com 5 sensores (explicados na lição "Cortem-lhe a cabeça!", que a turma lê como preparação). Placar no site. | `#/licao/cortem-lhe-a-cabeca`, `#/speedrun` |
| 22–62 | **SPEEDRUN (40 min)** | Em trios ou sozinhos: 3 worktrees, 3 sessões do agente em paralelo, uma por task. Integrar na `main` (vai haver um conflito proposital em `src/app.js`). CI verde = fim. A cada 10 min, **clínica rotativa**: a facilitadora projeta o terminal de um time e faz uma carta do baralho para o time responder em voz alta. | `#/speedrun` com cronômetro e placar |
| 62–72 | Intervalo | | |
| 72–100 | O Julgamento do Valete (red team em duplas) | Cada dupla troca de PR com outra. 10 min de revisão **à mão** com o baralho e a leitura em camadas. Depois roda o agente de review especializado (gerado no site: `rastreador-de-spec` e `cetico-de-testes`). Comparar: o que o humano pegou e a máquina não, e o contrário. Caçar rosas pintadas e Falsas Tartarugas. | `#/licao/julgamento` |
| 100–112 | Carta à Rainha | Cada dupla escreve 1 regra para o AGENTS.md (guia) e 1 checagem para o agente de review ou CI (sensor), a partir do erro que a IA repetiu hoje. Três duplas leem. | `#/licao/julgamento` (final) |
| 112–120 | Saída | Quiz de saída. Ponte para S11 (LLM dentro do software). | |

**Pontuação do speedrun** (o placar do site calcula):

| Item | Pontos |
|---|---|
| Cada sensor verde na CI (lint, types, testes+cobertura, deps, smoke) | 10 cada |
| Cada task com commit vermelho antes do verde (TDD visível no `git log`) | 10 cada |
| Avaliador oficial (`speedrun/avaliador`): cada caso de aceite que passa | 2 cada |
| Integração sem quebrar teste de outra task | 15 |
| Responder em voz alta uma carta do baralho na clínica | 5 |
| Rosa pintada (teste de aceite alterado) | −30 |
| Terminar antes do tempo | +1 por minuto restante |

**Onde a turma avançada é desafiada (Aula 2):** configurar o hook `PreToolUse` que impede o agente de editar `tests/aceite/`; usar `isolation: worktree` num subagent; adicionar `anthropics/claude-code-action@v1` ao PR para review automático; resolver o NFR de concorrência ("duas requisições para a última vaga: exatamente uma vence").

---

## 7. Cuidado com o Encontro 2 da OIP

O Encontro 2 avalia a revisão do endpoint de saldo da carteira digital (fonte de dados assumida, e-mail sem validação, usuário não encontrado, regra "+10" inventada). **Não use esse código nem o domínio da carteira em aula.** O site usa outro domínio (agenda de mentorias) e treina o hábito, não o gabarito:

- Pedido vs assumido vs inventado (vale para qualquer código).
- "Que entrada prova que está errado?" (é o sinal de nível 3 em D2).
- "Qual o padrão de erro da IA e como evitar?" (é o sinal de nível 3 em PC).

Se a turma perguntar se "vai cair na OIP", a resposta honesta é: o código é outro, a pergunta é a mesma.

---

## 8. Ligação com os pilares High Agency

| Pilar | Onde aparece |
|---|---|
| Clear Thinking | Carta de Destino; NFR com número; carta ♥ Par. Combate a Vague Trap. |
| Bias to Action | Speedrun de 40 min: começar antes de estar pronto, com o teste vermelho como primeiro passo. Combate a Overwhelm Trap (3 tasks pequenas em vez de uma feature gigante). |
| Disagreeability | Cartas "Precisa mesmo?" e 🎩 Navalha: recusar o swarm, o padrão de projeto e a abstração que a IA sugeriu, com argumento e não com hierarquia. Combate a Midwit Trap. |

Pergunta "e daí?" para fechar cada aula: **quanto custa para a pessoa usuária quando o requisito não foi escrito?** (Jovem perde a mentoria porque duas pessoas pegaram a mesma vaga. Mentor recebe dois jovens no mesmo horário.)

---

## 9. Checklist da facilitadora

**Antes da Aula 1**
- [ ] Abrir o site no modo projetor (botão no topo ou tecla `P`).
- [ ] Testar o link do site no celular (parte da turma acessa assim).
- [ ] Imprimir ou projetar o Baralho do Gato (página `#/baralho`).

**Antes da Aula 2**
- [ ] Rodar o projeto inicial do speedrun numa máquina limpa: `npx degit oliviasmim/pda-pais-das-specs/speedrun/agenda-mentorias agenda-mentorias`.
- [ ] Confirmar que `npm install && npm run gates` passa na `main` do projeto inicial (os testes de aceite das tasks começam pulados).
- [ ] Liberar o avaliador (`speedrun/avaliador`) só depois do speedrun.
- [ ] Zerar o placar no site (botão "Novo speedrun").

**Depois**
- [ ] Recolher as Cartas à Rainha: elas viram material para a S11 e o Projeto Final.
- [ ] Anotar quais cartas do baralho a turma ainda trava. Isso vira o foco das clínicas da S11.
