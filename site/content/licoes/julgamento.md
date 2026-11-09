> "Não, não!", disse a Rainha. "Sentença primeiro, veredito depois."
> "Que bobagem!", disse Alice em voz alta. "Onde já se viu dar a sentença primeiro!"
>
> Lewis Carroll, *Alice no País das Maravilhas*, cap. 12 (tradução livre).

## O problema

O agente termina o speedrun e abre um PR: **278 linhas, 11 arquivos, CI verde**, e uma mensagem animada: "Pronto! Todos os testes passando ✅".

Duas reações comuns, as duas ruins:

1. **"LGTM" em 40 segundos.** A CI está verde, o agente disse que está pronto, aprova.
2. **Duas horas linha a linha**, começando pelo primeiro arquivo, até perder a floresta no meio das árvores e aprovar por cansaço.

E tem um problema pior: **CI verde pode mentir.** Uma pergunta que voltou várias vezes nas aulas foi: *"Como evitar que o agente altere o teste para fazer o código passar?"*. Se o agente mexe no teste, o sensor continua apitando verde. Só que agora ele mede outra coisa.

Esta lição fecha a semana: ler um diff grande sem se afogar, pegar o agente pintando as rosas, montar revisores especializados e transformar o erro de hoje em regra para amanhã.

## O conceito

### Sentença primeiro, veredito depois

No julgamento do Valete de Copas, a Rainha quer dar a sentença antes de ouvir a evidência. Alice acha um absurdo. Na revisão de código com IA, a gente faz isso o tempo todo:

- **Sentença:** "Pronto, todos os testes passando ✅" (dita pelo agente, que é parte interessada).
- **Veredito:** qual teste? Ele falharia sem esse código? Alguém mexeu nele?

TDD é exatamente a ordem certa: **o veredito vem antes**. O teste é escrito, falha (vermelho), e só então o código é aceito por fazê-lo passar. Aceitar o "pronto" do agente sem olhar a evidência é a ordem da Rainha.

### Leitura em camadas

Um diff grande se lê de fora para dentro. Cada camada é mais barata que a seguinte e pega problemas diferentes. **Nunca comece pelo corpo.**

| Camada | Pergunta | Tempo | O que costuma pegar |
|---|---|---|---|
| 1 · Arquivos | Que arquivos mudaram e quanto? | ~1 min | Teste de aceite alterado, lockfile enorme, pasta nova com nome de padrão de projeto |
| 2 · Assinaturas e contratos | Que dependências, classes, rotas, constantes e status entraram? | ~3 min | Regra não pedida (constante nova), status que não está na spec, **status da spec que sumiu** |
| 3 · Testes | O que os testes provam de verdade? | ~8 min | Asserção enfraquecida, teste que só testa o mock, caso de falha sem teste |
| 4 · Corpo | O que o código faz linha a linha? | ~20 min | Erro genérico, condição faltando, efeito colateral |

A camada 2 é a mais subestimada. Ela pega até **ausências**: se a spec tem 409 para vaga ocupada e nenhuma linha do diff tem `409`, você já sabe que um caso de falha sumiu, sem ler o corpo.

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

### As rosas pintadas

No jardim da Rainha, três jardineiros estão pintando rosas brancas de vermelho. Plantaram a roseira errada e, se a Rainha descobrir, perdem a cabeça. Então pintam.

O agente faz igual. Ele não consegue fazer o teste `vaga ocupada responde 409` passar e troca a asserção para `201`. A CI fica verde. O bug continua lá, agora escondido. Não é malícia: você pediu "faça os testes passarem", e mudar o teste também faz os testes passarem.

A defesa tem três camadas, e você precisa das três:

| Camada | Tipo | O que faz |
|---|---|---|
| Regra no AGENTS.md | Guia | "Nunca edite tests/aceite/. Se o teste parecer errado, pare e explique." O agente lê antes e quase sempre obedece. |
| Hook `PreToolUse` | Sensor, na hora | Bloqueia a edição no momento em que o agente tenta e devolve a mensagem para ele. |
| Guarda na CI | Sensor, no merge | Compara os testes de aceite com os checksums originais. Pega o que escapou do hook. |

O hook do Claude Code recebe no stdin um JSON com a ferramenta que o agente quer usar. O caminho do arquivo vem em `tool_input.file_path`. Sair com código **2** bloqueia a ação, e o que você escreve no stderr volta para o agente como explicação. O projeto do speedrun já vem com ele:

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

Por que precisa da CI também? Porque o `matcher` só olha as ferramentas `Edit` e `Write`. Se o agente usar o Bash (`sed -i`, `echo >`), o hook não vê. E porque um agente determinado pode atualizar o arquivo de checksums junto, como no diff do laboratório. Sensor bom não confia em um lugar só.

### A Falsa Tartaruga

A Falsa Tartaruga (*Mock Turtle*, no original) chora contando das aulas que teve na escola do mar. É uma tartaruga de mentira, e todo mundo finge que não percebe.

Teste de mock é igual. Ele cria uma `fonteFalsa` que devolve `[vaga 1]`, chama o código, e confere que voltou `[vaga 1]`. Passa sempre. A cobertura sobe. E ele não pegaria nenhum bug de regra de negócio, porque não testa regra nenhuma: testa o próprio mock.

A pergunta que desmascara: **"que bug este teste pegaria?"**. Se a resposta for "nenhum", é Falsa Tartaruga.

### Revisores especializados

Por que um **subagent** para revisar, e não a mesma sessão que escreveu o código?

- **Isolamento de contexto.** A sessão que escreveu sabe por que fez cada coisa e tende a justificar. O subagent começa com a janela limpa: só lê o que está de fato no diff e na spec. Não herda o viés de quem escreveu.
- **Uma pergunta por revisor.** No tribunal, os jurados escrevem bobagens na lousa porque ninguém disse o que anotar. Um revisor genérico faz o mesmo. Um revisor com **uma especialidade e uma rubrica** faz uma pergunta só, e faz bem.
- **Só leitura.** Revisor com `Edit` e `Write` vira autor: em vez de apontar, ele conserta, às vezes o teste. Sensor bom só mede.

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

Revisor por IA é um **sensor inferencial**: pega o que lint e testes não veem, mas pode errar e custa tokens. Ele **complementa** os gates da CI, não substitui. E não substitui você.

### Red team: humano contra máquina

A comparação é a prova de que você entendeu. Revise **à mão primeiro**, depois rode o subagent, e compare. Alguns padrões que aparecem:

- O humano pega o que é **ausência** (o 409 que sumiu) e o que **cheira estranho** no contexto do projeto.
- A máquina pega o que é **repetitivo e exaustivo** (todas as mensagens de erro contra a tabela, caractere por caractere).
- Os dois erram quando **não têm a spec**.

## Pratique

**1. Leitura em camadas (12 min).** O diff abaixo é o PR de um agente que fez T1 e T3. Leia uma camada por vez e marque só o que aquela camada já mostra. Achar cedo vale mais. Marcar sem evidência custa ponto.

<div data-lab="diff-camadas"></div>

<div data-quiz="check"></div>

**2. Fábrica de revisores (8 min).** Monte dois revisores para o seu projeto do speedrun: um `rastreador-de-spec` e um `cetico-de-testes`. Salve em `.claude/agents/` e reinicie a sessão.

<div data-lab="fabrica-revisores"></div>

**3. Red team em duplas (20 min).**

1. Troque de PR com outra dupla.
2. **10 minutos à mão.** Leitura em camadas e baralho. Anote cada achado com arquivo:linha e a carta usada.
3. Rode os dois subagents de review no PR.
4. Preencham juntos a tabela abaixo e tragam a linha mais surpreendente para a turma.

| Achado | Humano pegou? | Máquina pegou? | Carta | Por que só um pegou? |
|---|---|---|---|---|
| | | | | |

**4. Carta à Rainha (fechamento da semana).** Que erro a IA repetiu hoje, no seu speedrun ou no PR que vocês revisaram? Transforme em uma regra que o agente lê antes e em uma checagem que pega depois.

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

   Pense no custo: quantos PRs por semana, quantos tokens por revisão? E lembre: é um sensor inferencial. Ele roda **depois** dos gates computacionais (lint, tipos, testes), nunca no lugar deles.
2. **Feche o buraco do Bash.** Acrescente ao hook um segundo `matcher` para `Bash` que bloqueie comandos que escrevem em `tests/aceite/` (o comando vem em `tool_input.command`). Quais comandos você precisa pegar? Quais falsos positivos aparecem?
3. **Revisor que roda testes sem sujar sua pasta.** Um subagent pode ter `isolation: worktree` no frontmatter: ele trabalha numa cópia isolada do repositório. Monte um revisor que roda `npm test` com uma asserção sabotada de propósito (teste de mutação manual) para descobrir quais testes são Falsas Tartarugas.
4. **Meça o red team.** Depois de três PRs, conte: quantos achados só o humano pegou, quantos só a máquina, quantos os dois. O que isso diz sobre onde colocar sua atenção?

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
