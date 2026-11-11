> A Rainha só tinha um jeito de resolver todas as dificuldades, grandes ou pequenas. "Cortem-lhe a cabeça!", dizia, sem nem olhar em volta.
>
> Lewis Carroll, *Alice no País das Maravilhas*, cap. 8 (tradução livre).

## O problema

O agente termina e escreve: *"Pronto! Implementei a feature e todos os testes estão passando ✅"*.

Perceba quem está dando a notícia: quem escreveu o código está dizendo que o código está certo. É a Rainha no julgamento do Valete, **sentença primeiro, veredito depois**. A IA é treinada para terminar a tarefa, e "os testes passam" é o jeito mais curto de dizer que terminou. Ninguém rodou nada na sua frente.

Um **gate** (portão) nada mais é do que uma checagem que roda sozinha e responde sim ou não. Ele mora na CI (integração contínua, a esteira que roda a cada push e a cada PR) e não negocia: se falhar, o botão de merge fica travado. Na análise de dúvidas da turma, quality gates e CI ficaram em primeiro lugar no índice de necessidade de revisão. Vocês montaram a CI na S8. A pergunta agora é outra: **ela bloqueia mesmo? E bloqueia o quê?**

## O conceito

### Agente = LLM + Harness

O LLM (o modelo de linguagem) é o cérebro. O harness nada mais é do que o corpo em volta dele: os arquivos que ele lê, as ferramentas que ele pode chamar, os comandos que conferem o que ele fez. O harness tem dois tipos de peça:

| | Guias (feedforward) | Sensores (feedback) |
|---|---|---|
| Quando agem | **Antes** de o agente agir | **Depois** que o agente agiu |
| O que fazem | Aumentam a chance de acertar de primeira | Detectam o erro e devolvem para correção |
| Exemplos | `AGENTS.md`, spec, critérios EARS, skills, exemplos de código, prompt | lint, type check, build, testes, `npm audit`, subagent de review, hook que bloqueia |
| Se faltar | O agente adivinha | O erro chega na `main` |

Só com guia, você fica torcendo para o agente ter acertado. Só com sensor, o agente erra, o gate barra, o agente erra de novo e você paga cada volta em minuto de CI.

Sensores também se dividem em dois tipos. Os **computacionais** são comandos comuns (lint, testes, type check): mesma entrada, mesma resposta, e rodam em segundos. Os **inferenciais** são um LLM revisando: pegam o que regra nenhuma pega, mas custam token e podem responder diferente a cada execução. Os computacionais vêm primeiro.

### Os cinco sensores

| Sensor | Pergunta | Pega | Não pega |
|---|---|---|---|
| **Lint** | O código obedece às regras do projeto? | Erro de sintaxe, variável não usada, padrão proibido | Regra de negócio errada |
| **Type check** | Os tipos combinam entre quem chama e quem é chamado? | Texto onde se espera número, campo que não existe | Valor do tipo certo mas errado |
| **Build + smoke** (sobe o servidor e faz uma chamada só, para ver se responde) | O sistema liga numa máquina limpa? | Arquivo que não foi versionado, variável de ambiente faltando, erro no boot | Comportamento das rotas |
| **Testes + cobertura** | O comportamento é o que a spec pede? | Status e mensagem errados, regra trocada | O que não está em nenhum teste. E teste alterado para passar. |
| **Dependências** | Alguma biblioteca tem vulnerabilidade conhecida? | Versão com falha de segurança já catalogada (uma CVE) de severidade alta | Dependência desnecessária. Pacote que o modelo inventou. |

Esta semana a gente soma dois extras:

- **Sensor de NFR.** NFR é requisito não funcional: não diz o que o sistema faz, diz como (rápido, seguro, aguentando carga). Requisito sem sensor é promessa (lição 2). O NFR-2 da agenda pede "p95 abaixo de 50 ms com 1.000 vagas", ou seja, 95 de cada 100 respostas chegam em menos de 50 ms. Ele vira um teste que mede e falha.
- **Guarda dos testes de aceite.** Um checksum (a impressão digital de um arquivo: mudou uma vírgula, muda o checksum) dos arquivos de `tests/aceite/`. Se o agente trocar o `409` esperado por `201` para a CI ficar verde (as **rosas pintadas** da lição 7), a guarda corta a cabeça.

### Fail fast: o barato primeiro

Fail fast quer dizer falhar cedo. Os passos de um job rodam em ordem e o job para no primeiro que falha. Se o lint leva 20 segundos e os testes levam um minuto, um erro de sintaxe pego no lint te devolve a resposta um minuto antes. Num dia de speedrun, com dezenas de pushes, é a diferença entre esperar segundos e esperar minutos a cada push.

### O pacote que a IA inventou

O `npm audit` compara o que você instalou com uma lista de falhas conhecidas. Pacote que o modelo inventou não está em lista nenhuma. Um estudo com 16 modelos gerou 576 mil amostras de código e achou 205.474 nomes de pacote que não existem. Pensa comigo: se alguém publicar um pacote com um desses nomes, o `npm install` baixa sem reclamar, e o código de quem publicou roda na sua máquina. O nome que circula para esse ataque é *slopsquatting*.

Toda dependência nova que aparece num PR de agente passa por duas perguntas antes do merge:

```bash
npm view vagas-data-utils      # existe no registro? quem publica? desde quando?
grep -r "vagas-data-utils" src # alguém usa?
```

Para automatizar no PR, a action `dependency-review-action` compara o que o PR adiciona com a `main` e falha acima de uma severidade que você escolhe.

### Quem espera quem

Jobs rodam em paralelo, a menos que um declare `needs` (preciso de). No workflow do curso, `build` e `test` esperam `lint` e `typecheck`: não vale gastar minuto de runner (a máquina que o GitHub empresta para rodar a CI) compilando código que a gente já sabe que tem erro. O `npm audit` não espera ninguém e roda ao lado. O merge só abre com tudo verde.

<svg viewBox="0 0 480 220" role="img" aria-labelledby="needs-t needs-d" style="width:100%;max-width:34rem;height:auto;font-family:var(--font-body);font-size:14px">
<title id="needs-t">Ordem dos jobs da CI</title>
<desc id="needs-d">Lint e type check rodam primeiro. Build e testes esperam os dois. O npm audit roda em paralelo. O merge só abre quando todos passam.</desc>
<g fill="none" stroke="var(--ink-3)" stroke-width="1.5">
<path d="M120 40 L190 60"/><path d="M120 40 L190 140"/><path d="M120 110 L190 60"/><path d="M120 110 L190 140"/>
<path d="M300 60 L360 100"/><path d="M300 140 L360 120"/><path d="M120 180 C 300 205 340 155 360 135"/>
</g>
<g stroke="var(--line)" stroke-width="1.5" fill="var(--paper)">
<rect x="10" y="20" width="110" height="40" rx="8"/><rect x="10" y="90" width="110" height="40" rx="8"/><rect x="10" y="160" width="110" height="40" rx="8"/>
<rect x="190" y="40" width="110" height="40" rx="8"/><rect x="190" y="120" width="110" height="40" rx="8"/>
</g>
<rect x="360" y="80" width="110" height="60" rx="8" fill="var(--folha-soft)" stroke="var(--folha)" stroke-width="2"/>
<g fill="var(--ink)" text-anchor="middle">
<text x="65" y="45">lint</text><text x="65" y="115">typecheck</text><text x="65" y="185">npm audit</text>
<text x="245" y="65">build</text><text x="245" y="145">test</text>
<text x="415" y="106">merge</text><text x="415" y="124" font-size="11">tudo verde</text>
</g>
<text x="245" y="22" text-anchor="middle" fill="var(--ink-3)" font-size="11">needs: [lint, typecheck]</text>
</svg>

O arquivo também declara `permissions: contents: read`. O gate só precisa ler o código. Se um job precisar de mais (comentar no PR, por exemplo), ele declara só aquilo, só nele.

### O teste verde que não prova nada

Cobertura mede quais linhas rodaram. Não mede se alguém conferiu o resultado. Dá para ter 100% de cobertura e zero prova. Três jeitos de chegar lá:

| Padrão | Como aparece | A pergunta que desmascara |
|---|---|---|
| Testa o mock | O teste cria um `agendarFalso`, chama e confere o que o falso devolveu. A função real nunca roda. | Se eu apagar a função, o teste cai? |
| Assert que sempre passa | `assert.ok(r.status === 201 \|\| r.status !== 201)`, ou assert dentro de um callback que ninguém espera terminar. | Existe algum valor que faça este assert falhar? |
| Cobertura alta sem valor | `assert.ok(resultado)`: toda linha executa, e `"batata"` também passaria. | Se eu trocar o retorno por um valor errado, a cobertura muda? |

O método é um só: **quebre o código de propósito e rode o teste**. Se continuar verde, ele não estava conferindo o que você achava. Ferramentas de *mutation testing* (teste de mutação, como o Stryker para JavaScript) fazem isso sozinhas: geram centenas de quebras pequenas e contam quantas o teste percebeu. No laboratório abaixo, você faz à mão.

### Red, green, refactor: a prova está no commit

TDD (desenvolvimento guiado por teste) nada mais é do que o veredito antes da sentença: primeiro o teste diz o que é certo, depois vem o código. O ciclo deixa três commits:

1. **Red.** Escreva o teste, rode, veja falhar. Commit só do teste.
2. **Green.** Escreva o mínimo de código para passar. Commit.
3. **Refactor.** Limpe sem mudar comportamento, rode de novo. Commit.

O agente pode escrever "segui TDD" no resumo do PR. Quem prova é o `git log`: o commit do teste vermelho tem que ser mais antigo que o do código. Teste e código no mesmo commit, código antes do teste ou teste que já nasceu verde são três jeitos de contar o ciclo sem ter feito.

A spec da agenda já traz o cenário. Cada linha da tabela de erros vira um teste, quase palavra por palavra:

```gherkin
# language: pt
Cenário: cancelar um agendamento já cancelado
  Dado que o agendamento 12 está com status "cancelado"
  Quando alguém envia DELETE /agendamentos/12
  Então a resposta é 409 com {"erro":"Agendamento já cancelado"}
```

```js
test('cancelar um agendamento já cancelado responde 409', async () => {
  // Dado
  const ag = await criarAgendamentoCancelado();
  // Quando
  const r = await fetch(`${base}/agendamentos/${ag.id}`, { method: 'DELETE' });
  // Então
  assert.equal(r.status, 409);
  assert.deepEqual(await r.json(), { erro: 'Agendamento já cancelado' });
});
```

### Task que o gate consegue julgar

O agente só sabe que terminou se existe um comando que responde sim ou não. Task vaga depende de alguém olhar e achar que "parece bom", e aí o agente declara vitória quando quiser.

| | Fraca | Forte |
|---|---|---|
| Pedido | "Melhorar a listagem de vagas." | "`GET /mentores/:id/vagas?data=2026-11-12` devolve só vagas livres daquele dia, por `inicio` crescente. Data inválida: 400 `{"erro":"data inválida"}`." |
| Pronto quando | Alguém olha e acha que sim. | `npm test -- vagas` passa com 4 casos fixos. |

A Anthropic descreveu o mesmo problema em agentes de execução longa: sem critério binário por tarefa, o agente declara vitória cedo. O prompt deles inclui uma frase proibindo remover ou editar testes (referência abaixo).

### Gate que não bloqueia é decoração

Dá para ter CI vermelha e merge feito mesmo assim. Três jeitos comuns:

1. O workflow (o arquivo que descreve a CI) só roda em `push` na `main`. O defeito é descoberto **depois** do merge.
2. Tem `continue-on-error: true` ou `|| true` num passo. A falha vira aviso.
3. A CI roda, mas o check não é **obrigatório** na proteção da `main`. CI vermelha vira só uma opinião.

Um quarto jeito: a `main` aceita `git push` direto, sem pull request. Aí o workflow nem entra na conversa.

O terceiro engana mais, porque o YAML (o formato desse arquivo) está perfeito e ninguém acha defeito lendo. A configuração fica no GitHub, fora do repositório: *Settings → Rules (ou Branches) → exigir status checks antes do merge*, marcando o job `gates`.

### Configurar CI com a IA, sem aceitar YAML às cegas

Pode pedir o workflow para a IA, vai sem medo. O que não dá é aceitar sem ler: aí é o Valete escrevendo a própria sentença. Este YAML foi gerado por um agente para a agenda de mentorias. Ele tem **cinco problemas**. Encontre os cinco antes de abrir o gabarito.

```yaml
name: CI
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 22
      - run: npm install
      - run: npm run lint
        continue-on-error: true
      - run: npm test || true
```

<details>
<summary>Gabarito</summary>

1. Só roda em `push` na `main`: falta `pull_request`. O gate chega depois do estrago.
2. `npm install` em vez de `npm ci`: ignora o lockfile e pode instalar versões diferentes das que você testou.
3. `continue-on-error: true` no lint: o lint pode falhar à vontade.
4. `npm test || true`: o `|| true` engole a falha dos testes. O job fica verde sempre.
5. Faltam três sensores: type check, build + smoke e `npm audit`. E nada exige cobertura mínima.

Bônus: nada no YAML garante que o check é obrigatório para o merge. Isso se confere no GitHub.

</details>

<div data-cartas="contraprova,carta-rainha"></div>

A carta ♣ Contraprova aplicada à CI pergunta: *"que mudança eu faço para provar que este gate bloqueia?"*. Se você nunca viu um gate ficar vermelho, não sabe se ele funciona. Quebre de propósito: tire uma vírgula, troque um tipo, mude o status esperado num teste. Abra o PR, veja o check vermelho e o botão de merge travado. Depois desfaça.

<div data-quiz="check"></div>

## Pratique

**Monte a esteira.** Dez PRs de agente: nove com defeito plantado e um limpo, de controle. Você liga, desliga e ordena os sensores. Três metas: (1) nenhum defeito evitável chega na `main`; (2) gastando o mínimo de minutos de CI na fila; (3) revisando o YAML gerado com as cinco perguntas. Quando cumprir as três, olhe os dois PRs que ainda passam: nenhuma combinação de sensores pega aqueles dois. É deles que a lição 7 trata.

<div data-lab="esteira"></div>

**Por dentro da máquina.** Um PR de cada vez, atravessando a esteira. Rode o PR #15. Depois quebre os testes com `continue-on-error` e rode de novo: o vermelho aparece no log e o defeito chega à `main`.

<div data-lab="motion-ci" data-montagem="pr=15,extras=nenhum"></div>

**Quebre de propósito.** Escolha um teste, quebre o código de cinco jeitos e veja quais quebras ele percebe. Compare a barra de cobertura de cada teste com o número de quebras que ele pega.

<div data-lab="teste-nao-prova"></div>

**Prove que o gate bloqueia.** Ligue as regras do workflow e do GitHub até os três defeitos serem barrados e o PR correto passar. Atenção: em repositório privado no plano gratuito do GitHub, essa regra não está disponível (veja a documentação de branches protegidas). Repositório público ou o Student Pack resolvem.

<div data-lab="protecao-main"></div>

**Julgue o histórico.** Quatro `git log` do cancelamento de agendamento. Só um prova que o teste veio antes. Qual, e o que está errado nos outros três?

<div data-lab="vermelho-verde"></div>

## Leve com você

Prompt para pedir a CI ao agente. As restrições são guias. A última linha obriga o agente a te dizer como ver cada gate ficar vermelho (a contraprova):

```markdown
Crie .github/workflows/ci.yml para este projeto Node 22.
Um job chamado "gates", rodando em pull_request e em push na main.
Passos, nesta ordem, cada um separado e falhando o job se falhar:
1. npm ci
2. npm run lint
3. npm run typecheck
4. npm run smoke          (sobe o servidor e chama GET /health)
5. npm test (mínimo de 80% de linhas)
6. npm audit --audit-level=high
Proibido: continue-on-error, "|| true", npm install, pular passo.
No fim, para cada passo, me diga que mudança no código faz ele ficar vermelho.
```

Hook do Claude Code que impede o agente de editar os testes de aceite. Em `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/protege-testes.sh" }
        ]
      }
    ]
  }
}
```

E em `.claude/hooks/protege-testes.sh` (rode `chmod +x`; precisa do `jq`):

```bash
#!/bin/bash
ARQUIVO=$(jq -r '.tool_input.file_path // empty')
if [[ "$ARQUIVO" == *tests/aceite/* ]]; then
  echo "Bloqueado: testes de aceite não podem ser alterados nesta task ($ARQUIVO). Se o teste parecer errado, pare e pergunte." >&2
  exit 2
fi
exit 0
```

O `exit 2` bloqueia a edição e devolve a mensagem para o agente. O hook só olha as ferramentas `Edit` e `Write`: um `sed -i` pelo terminal passa reto. Por isso a guarda de checksum na CI continua lá. O hook barra a edição na hora; a guarda pega o que escapou por outra porta.

Teste de NFR para a agenda (o sensor do NFR-2):

```js
test('NFR-2: p95 de GET /mentores/:id/vagas < 50 ms com 1.000 vagas', async () => {
  const tempos = [];
  for (let i = 0; i < 200; i++) {
    const inicio = performance.now();
    await fetch(`${base}/mentores/1/vagas`);
    tempos.push(performance.now() - inicio);
  }
  tempos.sort((a, b) => a - b);
  const p95 = tempos[Math.ceil(0.95 * tempos.length) - 1];
  assert.ok(p95 < 50, `p95 = ${p95.toFixed(1)} ms (meta: 50 ms)`);
});
```

<details class="toca">
<summary>Trilha da Toca · para quem terminou antes</summary>

1. **Sensor inferencial na CI.** Adicione `anthropics/claude-code-action@v1` ao workflow para revisar cada PR com um subagent de review. Onde ele entra na ordem: antes ou depois dos sensores computacionais? Por quê?
2. **Quem testa os testes?** No laboratório você quebrou o código à mão. Rode uma ferramenta de *mutation testing* (Stryker para JavaScript) no seu projeto: quantas mutações sobrevivem? Qual teste sobreviveu mais?
3. **Proteção de verdade.** Configure a regra da `main` no seu repositório para exigir o check `gates`. Abra um PR que quebra o lint e tire um print do botão de merge bloqueado.
4. **Hook mais forte.** O hook acima não pega `sed -i` pelo Bash. Escreva um segundo hook com `matcher: "Bash"` que recusa comandos que mencionem `tests/aceite/`.

</details>

## Termos-chave

| Termo | O que dizem | O que realmente significa |
|---|---|---|
| Gate | "A CI." | Um sensor que **bloqueia** o merge quando falha. Sem bloqueio, é só um relatório. |
| Guia (feedforward) | "Instrução para a IA." | Tudo que age antes do agente para ele acertar de primeira: `AGENTS.md`, spec, EARS, skill, exemplos. |
| Sensor (feedback) | "Os testes." | Tudo que confere depois e devolve o erro: lint, tipos, build, testes, auditoria, review. |
| Fail fast | "Parar cedo." | Ordenar os sensores do mais barato ao mais caro para o erro aparecer no menor tempo. |
| Check obrigatório | "Já tem CI." | Configuração da `main` que impede merge enquanto o job não estiver verde. |
| Rosa pintada | "O teste estava errado." | Alterar o teste para a CI passar, em vez de corrigir o código. |

## Para ir além

- [Harness: o que é, como funciona e por que virou a palavra de 2026 (Alura)](https://www.alura.com.br/artigos/o-que-e-harness): o artigo da semana 10 do cronograma.
- [Sobre branches protegidas (GitHub Docs)](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches): como exigir checks antes do merge.
- [Guia de hooks do Claude Code](https://code.claude.com/docs/en/hooks-guide): PreToolUse, `exit 2` e arquivos protegidos.
- [npm audit (documentação do npm)](https://docs.npmjs.com/cli/commands/npm-audit): níveis de severidade e `--audit-level`.
- [We Have a Package for You! (arXiv 2406.10279)](https://arxiv.org/abs/2406.10279): o estudo das alucinações de pacote em 16 modelos.
- [dependency-review-action](https://github.com/actions/dependency-review-action): README oficial, com `fail-on-severity`.
- [Sobre dependency review (GitHub Docs)](https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-dependency-review): o que a revisão de dependências faz e onde está disponível.
- [Autenticação automática com GITHUB_TOKEN (GitHub Docs)](https://docs.github.com/en/actions/security-for-github-actions/security-guides/automatic-token-authentication): permissões mínimas no bloco `permissions`.
- [Test Driven Development (Martin Fowler)](https://martinfowler.com/bliki/TestDrivenDevelopment.html): o ciclo red, green, refactor.
- [Referência do Gherkin (Cucumber)](https://cucumber.io/docs/gherkin/reference/): a sintaxe Dado, Quando, Então dos cenários.
- [Effective harnesses for long-running agents (Anthropic)](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents): critério binário por tarefa e a regra de não editar testes.
