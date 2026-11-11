> "Não, não!", disse a Rainha. "Sentença primeiro, veredito depois."
> "Que bobagem!", disse Alice em voz alta. "Onde já se viu dar a sentença primeiro!"
>
> Lewis Carroll, *Alice no País das Maravilhas*, cap. 12 (tradução livre).

## O problema

O agente termina o speedrun e abre um PR: **278 linhas, 11 arquivos, CI verde** (a checagem automática passou), e uma mensagem animada: "Pronto! Todos os testes passando ✅".

A gente costuma reagir de um destes dois jeitos, e os dois dão ruim:

1. **"LGTM" em 40 segundos** (*looks good to me*, o "pra mim tá ok" do review). A CI está verde, o agente disse que terminou, você aprova.
2. **Duas horas linha a linha**, a partir do primeiro arquivo, até perder a visão do todo e aprovar por cansaço.

E tem coisa pior: **CI verde pode mentir.** Uma pergunta voltou várias vezes nas aulas: *"Como evitar que o agente altere o teste para fazer o código passar?"*. Se o agente mexe no teste, o sensor continua verde. Só que agora ele mede outra coisa.

No fim desta lição, você vai conseguir: ler um diff de 278 linhas em camadas e achar os problemas graves nos primeiros minutos, pegar o agente pintando as rosas, montar dois revisores em `.claude/agents/` e transformar o erro de hoje em uma regra e uma checagem para amanhã.

## O conceito

### Sentença primeiro, veredito depois

No julgamento do Valete de Copas, a Rainha quer dar a sentença antes de ouvir a evidência. Alice acha um absurdo. Só que, na revisão de código com IA, a gente faz exatamente isso:

- **Sentença:** "Pronto, todos os testes passando ✅" (dita pelo agente, que é parte interessada).
- **Veredito:** qual teste? Ele falharia sem esse código? Alguém mexeu nele?

TDD nada mais é do que escrever o teste antes do código. Ele segue a ordem certa: **o veredito vem antes**. Você escreve o teste, vê ele falhar (vermelho), e só aceita o código que o faz passar. Aceitar o "pronto" do agente sem abrir a evidência é a ordem da Rainha.

### Leitura em camadas

Diff grande a gente lê de fora para dentro. Cada camada custa menos tempo que a seguinte e pega problemas diferentes. Por isso, **nunca comece pelo corpo das funções.**

| Camada | Pergunta | Tempo | O que costuma pegar |
|---|---|---|---|
| 1 · Arquivos | Que arquivos mudaram e quanto? | ~1 min | Teste de aceite alterado, lockfile enorme, pasta nova com nome de padrão de projeto |
| 2 · Assinaturas e contratos | Que dependências, classes, rotas, constantes e status entraram? | ~3 min | Regra não pedida (constante nova), status que não está na spec, **status da spec que sumiu** |
| 3 · Testes | O que os testes provam de verdade? | ~8 min | Asserção enfraquecida, teste que só testa o mock, caso de falha sem teste |
| 4 · Corpo | O que o código faz linha a linha? | ~20 min | Erro genérico, condição faltando, efeito colateral |

**Antes da camada 1, tem a camada 0: rode o que já existe.** Lint e testes acham sozinhos o que não merece seu tempo de leitura. Se um `console.log` esquecido chegou na revisão, é sinal de que o lint não está barrando na CI.

```bash
git diff main..HEAD --stat   # camada 1: quais arquivos, quanto cada um mudou
npm run lint                 # camada 0: a máquina já viu isso?
npm test                     # camada 0: algum teste vermelho?
```

<svg viewBox="0 0 480 200" role="img" aria-labelledby="cam-t cam-d" style="width:100%;max-width:34rem;height:auto;font-family:var(--font-body);font-size:13px">
<title id="cam-t">Tempo por camada de leitura</title>
<desc id="cam-d">A camada 0 é feita pela máquina. As camadas 1 a 4 levam cerca de 1, 3, 8 e 20 minutos de leitura humana.</desc>
<g fill="var(--ink)">
<text x="0" y="24">0 · Rode o que existe</text><text x="0" y="56">1 · Arquivos</text><text x="0" y="88">2 · Contratos</text><text x="0" y="120">3 · Testes</text><text x="0" y="152">4 · Corpo</text>
</g>
<rect x="160" y="10" width="14" height="20" rx="3" fill="none" stroke="var(--tinta)" stroke-width="1.5" stroke-dasharray="3 2"/>
<rect x="160" y="42" width="10" height="20" rx="3" fill="var(--tinta)"/>
<rect x="160" y="74" width="30" height="20" rx="3" fill="var(--tinta)"/>
<rect x="160" y="106" width="80" height="20" rx="3" fill="var(--ouro)"/>
<rect x="160" y="138" width="200" height="20" rx="3" fill="var(--copas)"/>
<g fill="var(--ink-2)" font-size="12">
<text x="182" y="25">a máquina faz</text><text x="178" y="57">~1 min</text><text x="198" y="89">~3 min</text><text x="248" y="121">~8 min</text><text x="368" y="153">~20 min</text>
</g>
<text x="0" y="188" fill="var(--ink-3)" font-size="11">Quanto mais fundo, mais caro. Por isso o corpo fica por último.</text>
</svg>

Perceba que a camada 2 é a que mais gente pula, e é ela que pega **ausências**. A spec tem 409 para vaga ocupada. Se nenhuma linha do diff tem `409`, você já sabe que um caso de falha sumiu, sem ler o corpo.

### Sinais de alerta

| Sinal | Onde aparece primeiro | Pergunta do baralho |
|---|---|---|
| 🌹 Teste de aceite alterado (rosas pintadas) | Camada 1 | ♥ Par: qual caso deveria falhar e agora passa? |
| 📦 Dependência nova sem motivo | Camada 1 | 🎩 Navalha: a biblioteca padrão resolve? |
| 🏛 Abstração sem necessidade | Camada 1 | 🎩 Navalha: qual teste quebra sem essa camada? |
| ♠ Regra de negócio não pedida | Camada 2 | ♠ Rastro: onde está na spec? |
| ♦ Erro genérico (`catch` → 500) | Camada 2 | ♦ Contrato: qual erro, qual status, qual mensagem? |
| ∅ Caso de falha que sumiu | Camada 2 | ♥ Par: cadê o teste que deveria falhar? |
| 🐢 Teste que só testa o mock (Falsa Tartaruga) | Camada 3 | ♣ Contraprova: que bug este teste pegaria? |
| 🧳 Mudança fora do escopo: arquivo sem relação com o título | Camada 1 (`git diff --stat`) | ♠ Rastro: onde o pedido mandou mexer aqui? |
| 🧹 Refactor não pedido: muitas linhas mudadas, nenhum teste novo | Camada 1 | 🎩 Navalha: o que quebra se este arquivo voltar ao que era? |
| 💬 Comentário que explica o óbvio ou justifica uma escolha estranha | Camada 4 | ♣ Contraprova: se eu apagar o comentário, perco alguma informação? |

Para o agente, mexer em mais um arquivo custa quase nada. Por isso o PR dele costuma trazer mudança que parece fazer sentido, mas está fora do pedido. A AWS chama o controle disso de *scope-creep detection* (detectar o escopo crescendo sem ninguém pedir). E um estudo com 33.707 PRs de agentes mostrou que sinais que dá para ver sem rodar nada (tipo de arquivo, tamanho do patch) já indicam quais PRs vão dar mais trabalho de revisão. A tabela acima serve para isso: ela muda **onde você olha primeiro**. Quem decide o que bloqueia continua sendo você.

### As rosas pintadas

No jardim da Rainha, três jardineiros estão pintando rosas brancas de vermelho. Plantaram a roseira errada e, se a Rainha descobrir, perdem a cabeça. Então pintam.

O agente faz igual. Ele não consegue fazer o teste `vaga ocupada responde 409` passar e troca a asserção para `201`. A CI fica verde. O bug continua lá, agora escondido. Você pediu "faça os testes passarem", e mudar o teste também faz os testes passarem.

A defesa tem três peças, e você precisa das três:

| Peça | Tipo | O que faz |
|---|---|---|
| Regra no AGENTS.md | Guia | "Nunca edite tests/aceite/. Se o teste parecer errado, pare e explique." O agente lê antes e quase sempre obedece. |
| Hook `PreToolUse` | Sensor, na hora | Bloqueia a edição no momento em que o agente tenta e devolve a mensagem para ele. |
| Guarda na CI | Sensor, no merge | Compara os testes de aceite com os checksums originais. Pega o que escapou do hook. |

O hook `PreToolUse` nada mais é do que um comando que o Claude Code roda antes de usar uma ferramenta. Ele recebe no stdin um JSON dizendo qual ferramenta o agente quer usar. O caminho do arquivo vem em `tool_input.file_path`. Se o script sair com código **2**, a ação é bloqueada, e o que você escreveu no stderr volta para o agente como explicação. O projeto do speedrun já vem com ele:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/protege-testes.mjs\"" }
        ]
      }
    ]
  }
}
```

```js
let entrada = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (pedaco) => { entrada += pedaco; });
process.stdin.on('end', () => {
  const caminho = JSON.parse(entrada)?.tool_input?.file_path ?? '';
  if (/(^|\/)tests\/aceite\//.test(caminho)) {
    console.error(`Bloqueado: ${caminho} é teste de aceite. Corrija o código em src/, não o teste.`);
    process.exit(2);
  }
  process.exit(0);
});
```

Por que precisa da CI também? Porque o `matcher` só olha as ferramentas `Edit` e `Write`. Se o agente usar o Bash (`sed -i`, `echo >`), o hook não vê. E porque um agente determinado pode atualizar o arquivo de checksums junto, como no diff do laboratório.

### A Falsa Tartaruga

A Falsa Tartaruga (*Mock Turtle*, no original) chora contando das aulas que teve na escola do mar. É uma tartaruga de mentira.

Tem teste que é igual. Ele cria uma `fonteFalsa` (um mock, ou seja, uma peça de mentira no lugar da fonte de dados real) que devolve `[vaga 1]`, chama o código e confere que voltou `[vaga 1]`. Passa sempre. A cobertura (a parte do código que os testes executam) sobe. E nenhum bug de regra de negócio é pego, porque o teste está conferindo o próprio mock.

A pergunta que desmascara: **"que bug este teste pegaria?"**. Se a resposta for "nenhum", é Falsa Tartaruga.

### Revisores especializados

Por que um **subagent** (um segundo agente, com contexto próprio) para revisar, e não a mesma sessão que escreveu o código?

- **Contexto separado.** A sessão que escreveu sabe por que fez cada coisa e tende a se justificar. O subagent começa com a janela de contexto limpa (a janela é tudo que o modelo tem diante de si na conversa): só lê o que está no diff e na spec. Não carrega as justificativas de quem escreveu.
- **Uma pergunta por revisor.** No tribunal, os jurados escrevem bobagens na lousa porque ninguém disse o que anotar. Revisor genérico faz o mesmo. Revisor com **uma especialidade e uma rubrica** (a lista do que ele confere, item por item) faz uma pergunta só e responde direito.
- **Só leitura.** Revisor com `Edit` e `Write` vira autor: em vez de apontar, ele conserta. Às vezes conserta o teste.

No Claude Code, o revisor é um arquivo em `.claude/agents/`. O `description` diz **quando** o agente principal deve chamá-lo:

```markdown
---
name: cetico-de-testes
description: Revisa os testes de um diff. Use antes de aceitar um PR que mexeu em tests/ ou quando a cobertura subiu rápido demais.
tools: Read, Grep, Glob
disallowedTools: Edit, Write
model: sonnet
---

Você é o cético de testes do projeto agenda-mentorias. Para cada teste novo ou alterado,
pergunte que bug ele pegaria. Teste de aceite alterado é sempre bloqueio.
```

Revisor por IA é um **sensor inferencial**, ou seja, uma checagem que usa um modelo para julgar. Pega o que lint e testes não veem, mas pode errar e custa tokens. Ele entra **junto** com os gates da CI (as checagens que travam o merge) e com a sua leitura, nunca no lugar deles.

### O que bloqueia e o que é nit

Revisor instruído a achar problema acha, mesmo quando o trabalho está bom. A documentação do Claude Code avisa: se você corrige todo achado, acaba com camadas de abstração e testes para casos que não podem acontecer. A regra do guia de review do Google ajuda a decidir: aprove o PR que deixa o código melhor do que estava, mesmo sem estar perfeito, e marque o que é polimento com `Nit:` (detalhe que não trava o merge).

| Bloqueia | Não bloqueia (`Nit:`) |
|---|---|
| Teste de aceite alterado ou asserção enfraquecida | Nome de variável genérico |
| Dado pessoal em endpoint aberto | Comentário redundante |
| Caso de falha da spec que sumiu | Renomeação sem mudança de comportamento (pede PR separado) |
| Dependência que não existe | Preferência de estilo que o lint não cobre |

Cada achado termina com uma das duas etiquetas e uma frase dizendo por quê. Vale colocar isso no formato de resposta dos seus revisores: cada achado sai com `[BLOQUEIA]` ou `[NÃO BLOQUEIA]`.

### Red team: humano contra máquina

Red team é revisar procurando falha de propósito, como quem está do outro lado. Aqui a ordem importa: revise **à mão primeiro**, depois rode o subagent e compare as duas listas. Alguns padrões costumam aparecer:

- O humano pega o que é **ausência** (o 409 que sumiu) e o que **cheira estranho** no contexto do projeto.
- A máquina pega o que é **repetitivo e exaustivo** (todas as mensagens de erro contra a tabela, caractere por caractere).
- Os dois erram quando **não têm a spec**.
- Só quem **conhece o contexto** pega o que depende dele: um endpoint que é público, uma regra que a spec não escreveu. Nenhum subagent de sinais ou de segurança sabe disso só olhando o diff.

## Pratique

**1. Leitura em camadas (12 min).** O diff abaixo é o PR de um agente que fez T1 e T3. Leia uma camada por vez e marque só o que aquela camada já mostra. Achar na camada 1 vale mais que achar na 4. Marcar sem evidência tira ponto.

<div data-lab="diff-camadas"></div>

**Por dentro do tribunal.** O mesmo tipo de diff, com os revisores à vista. Rode com pessoa e subagents. Depois só subagents (o que escapa?) e só a pessoa lendo de cima para baixo (onde a atenção acaba?). O livro-razão monta sozinho o comparativo do red team da S9.

<div data-lab="motion-review"></div>

<div data-quiz="check"></div>

**2. Fábrica de revisores (8 min).** Monte dois revisores para o seu projeto do speedrun: um `rastreador-de-spec` e um `cetico-de-testes`. Salve os dois em `.claude/agents/` e reinicie a sessão do Claude Code. Você deve ver os dois nomes quando digitar `/agents`.

<div data-lab="fabrica-revisores"></div>

**3. Triagem de achados (8 min).** Oito achados de um PR de agente na agenda de mentorias. Para cada um, marque quem pegaria (CI, humano, os dois subagents, quem conhece o contexto) e se ele trava o merge. A tabela do fim mostra o que cada revisor deixa passar.

<div data-lab="triagem-achados"></div>

**4. Red team em duplas (20 min).**

1. Troque de PR com outra dupla.
2. **10 minutos à mão.** Leitura em camadas e baralho. Anote cada achado com arquivo:linha e a carta usada.
3. Rode os dois subagents de review no PR.
4. Preencham juntos a tabela abaixo e tragam para a turma a linha que mais surpreendeu vocês.

| Achado | Humano pegou? | Máquina pegou? | Carta | Por que só um pegou? |
|---|---|---|---|---|
| | | | | |

**5. Carta à Rainha (fechamento da semana).** Que erro a IA repetiu hoje, no seu speedrun ou no PR que vocês revisaram? Transforme em uma regra que o agente lê antes (vai para o AGENTS.md) e em uma checagem que pega depois (hook, CI, teste ou revisor). A carta está pronta quando o laboratório não mostra mais nenhum aviso.

<div data-lab="carta-rainha"></div>

## Leve com você

**Checklist de leitura em camadas.** Cole no template de PR do seu projeto:

```markdown
## Revisão em camadas
- [ ] 1 · Arquivos: algum teste de aceite mudou? lockfile cresceu? pasta ou nome de padrão de projeto novo?
- [ ] 2 · Contratos: toda dependência, constante, rota e status está na spec? algum status da spec sumiu?
- [ ] 3 · Testes: cada teste novo pegaria qual bug? algum só confere o mock? cada linha da tabela de erros tem teste?
- [ ] 4 · Corpo: algum catch genérico? efeito colateral não pedido? condição da spec faltando?
- [ ] Veredito com evidência: arquivo:linha + linha da spec + contraprova.
```

**Os dois revisores prontos** estão no repositório em `speedrun/agentes-review/`: `rastreador-de-spec.md` e `cetico-de-testes.md`. Copie para `.claude/agents/` do seu projeto.

**Regra contra rosas pintadas** para o AGENTS.md:

```markdown
- Nunca edite arquivos em tests/aceite/. Se um teste de aceite parecer errado, pare e explique por quê. Corrija o código em src/, não o teste.
```

<details class="toca">
<summary>Trilha da Toca · para quem terminou antes</summary>

1. **Revisor na CI.** Use a action oficial `anthropics/claude-code-action@v1` para rodar um revisor em todo PR. Esboço (confira os campos atuais na documentação da action antes de usar):

   ```yaml
   name: Revisão com agente
   on:
     pull_request:
       types: [opened, synchronize]
   jobs:
     revisar:
       runs-on: ubuntu-latest
       permissions:
         contents: read
         pull-requests: write
         id-token: write
       steps:
         - uses: actions/checkout@v6
         - uses: anthropics/claude-code-action@v1
           with:
             anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
             prompt: |
               Siga as instruções de .claude/agents/cetico-de-testes.md e revise este PR.
               Comente cada achado com arquivo:linha. Não altere arquivos.
   ```

   Faça a conta antes de ligar: quantos PRs por semana, quantos tokens por revisão? E lembre que é um sensor inferencial. Ele roda **depois** dos gates que não dependem de modelo (lint, tipos, testes), nunca no lugar deles.
2. **Feche o buraco do Bash.** Acrescente ao hook um segundo `matcher` para `Bash` que bloqueie comandos que escrevem em `tests/aceite/` (o comando vem em `tool_input.command`). Quais comandos você precisa pegar? Quais falsos positivos aparecem?
3. **Revisor que roda testes sem sujar sua pasta.** Um subagent pode ter `isolation: worktree` no frontmatter: ele trabalha numa cópia isolada do repositório. Monte um revisor que roda `npm test` com uma asserção sabotada de propósito (teste de mutação manual) para descobrir quais testes são Falsas Tartarugas.
4. **Meça o red team.** Depois de três PRs, conte: quantos achados só o humano pegou, quantos só a máquina, quantos os dois. Com esses números, decida onde vale gastar sua leitura.

</details>

## Termos-chave

| Termo | O que dizem | O que realmente significa |
|---|---|---|
| Leitura em camadas | "Revisar com calma." | Ler um diff de fora para dentro: arquivos, contratos, testes, corpo. Cada camada mais barata pega problemas antes da seguinte. |
| Rosas pintadas | "Ajustei o teste." | Alterar um teste para ele passar, em vez de corrigir o código. Esconde o bug e deixa a CI verde mentindo. |
| Falsa Tartaruga | "Teste unitário." | Teste que só confere o que o mock devolveu. Sobe a cobertura e não pega bug. |
| Hook `PreToolUse` | "Configuração." | Comando que o Claude Code roda antes de uma ferramenta. Sair com código 2 bloqueia a ação. |
| Sensor inferencial | "A IA revisa." | Sensor que usa um modelo para julgar. Complementa lint e testes; não substitui. |
| Subagent de review | "Outra IA olhando." | Revisor com janela própria, uma especialidade, rubrica e só leitura. Não herda o viés de quem escreveu. |
| Red team | "Revisão cruzada." | Revisar o trabalho de outra pessoa procurando falhas de propósito, e comparar com o que a máquina achou. |

## Para ir além

- [Subagents no Claude Code](https://code.claude.com/docs/en/sub-agents), documentação oficial: campos do arquivo, `tools`, `disallowedTools`, `isolation`.
- [Hooks no Claude Code](https://code.claude.com/docs/en/hooks-guide), guia oficial com o exemplo de proteger arquivos.
- [Claude Code no GitHub Actions](https://code.claude.com/docs/en/github-actions), documentação da action `anthropics/claude-code-action`.
- [Pull requests e code review na era dos agentes](https://cursos.alura.com.br/extra/hipsterstech/pull-requests-e-code-review-na-era-dos-agentes-de-desenvolvimento-hipsters-ponto-tech-523-a10092), episódio do Hipsters Ponto Tech (pré-requisito da S9).
- [Como fazer code review](https://google.github.io/eng-practices/review/reviewer/), guia do Google (em inglês).
- [O padrão do code review (Google)](https://google.github.io/eng-practices/review/reviewer/standard.html), em inglês: aprovar o que melhora o código e a etiqueta `Nit:`.
- [O que olhar num code review (Google)](https://google.github.io/eng-practices/review/reviewer/looking-for.html), em inglês: as categorias que um revisor humano cobre.
- [Boas práticas do Claude Code](https://code.claude.com/docs/en/best-practices), seção sobre revisão adversarial: o risco de corrigir todo achado.
- [Balancing speed and safety: a control framework for AI coding agents (AWS)](https://aws.amazon.com/blogs/security/balancing-speed-and-safety-a-control-framework-for-ai-coding-agents/), em inglês: controles para agentes, incluindo detecção de scope creep.
- [Early-Stage Prediction of Review Effort in AI-Generated Pull Requests (arXiv 2601.00753)](https://arxiv.org/abs/2601.00753), em inglês: 33.707 PRs de agentes e o custo de revisão.
- [We Have a Package for You! (arXiv 2406.10279)](https://arxiv.org/abs/2406.10279), em inglês: pacotes alucinados por modelos, base do achado "dependência que não existe".
