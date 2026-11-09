> A Rainha só tinha um jeito de resolver todas as dificuldades, grandes ou pequenas. "Cortem-lhe a cabeça!", dizia, sem nem olhar em volta.
>
> Lewis Carroll, *Alice no País das Maravilhas*, cap. 8 (tradução livre).

## O problema

O agente termina e escreve: *"Pronto! Implementei a feature e todos os testes estão passando ✅"*.

Isso é a Rainha no julgamento do Valete: **sentença primeiro, veredito depois**. Quem escreveu o código está dizendo que o código está certo. Existe conflito de interesse aí, e não porque a IA é "desonesta": ela é otimizada para terminar a tarefa, e "os testes passam" é a forma mais curta de dizer que terminou.

Um **gate** é o que transforma "confia em mim" em "prove". Ele roda na CI, em toda mudança, e não negocia: se falhar, o merge não acontece. Na análise de dúvidas da turma, quality gates e CI ficaram em primeiro lugar no índice de necessidade de revisão. A turma montou a CI na S8. A pergunta desta lição é outra: **ela bloqueia mesmo? E bloqueia o quê?**

## O conceito

### Agente = LLM + Harness

O harness é tudo em volta do modelo que faz ele trabalhar bem. Ele tem dois tipos de peça:

| | Guias (feedforward) | Sensores (feedback) |
|---|---|---|
| Quando agem | **Antes** de o agente agir | **Depois** que o agente agiu |
| O que fazem | Aumentam a chance de acertar de primeira | Detectam o erro e devolvem para correção |
| Exemplos | `AGENTS.md`, spec, critérios EARS, skills, exemplos de código, prompt | lint, type check, build, testes, `npm audit`, subagent de review, hook que bloqueia |
| Se faltar | O agente adivinha | O erro chega na `main` |

Os dois se completam. Guia sem sensor é esperança. Sensor sem guia é retrabalho infinito: o agente erra, o gate barra, o agente erra de novo.

Sensores também se dividem em dois tipos: **computacionais** (lint, testes, type check: determinísticos, baratos, rápidos) e **inferenciais** (um LLM revisando: pega o que regra nenhuma pega, mas custa mais e varia de uma execução para outra). Os computacionais vêm primeiro.

### Os cinco sensores

| Sensor | Pergunta | Pega | Não pega |
|---|---|---|---|
| **Lint** | O código obedece às regras do projeto? | Erro de sintaxe, variável não usada, padrão proibido | Regra de negócio errada |
| **Type check** | Os tipos combinam entre quem chama e quem é chamado? | Texto onde se espera número, campo que não existe | Valor do tipo certo mas errado |
| **Build + smoke** | O sistema liga numa máquina limpa? | Arquivo que não foi versionado, variável de ambiente faltando, erro no boot | Comportamento das rotas |
| **Testes + cobertura** | O comportamento é o que a spec pede? | Status e mensagem errados, regra trocada | O que não está em nenhum teste. E teste alterado para passar. |
| **Dependências** | Alguma biblioteca tem vulnerabilidade conhecida? | Versão com CVE de severidade alta | Dependência desnecessária |

Dois extras que esta semana adiciona:

- **Sensor de NFR.** Requisito sem sensor é promessa (lição 2). O NFR-2 da agenda ("p95 abaixo de 50 ms com 1.000 vagas") vira um teste que mede e falha.
- **Guarda dos testes de aceite.** Um checksum dos arquivos de `tests/aceite/`. Se o agente trocar o `409` esperado por `201` para a CI ficar verde (as **rosas pintadas** da lição 7), a guarda corta a cabeça.

### Fail fast: o barato primeiro

Os passos de um job rodam em ordem e o job para no primeiro que falha. Se o lint leva 20 segundos e os testes levam um minuto, um erro de sintaxe pego no lint economiza um minuto inteiro de quem está esperando. Em um dia de speedrun, com dezenas de pushes, isso é a diferença entre feedback em segundos e em minutos.

### Gate que não bloqueia é decoração

Três jeitos comuns de ter CI vermelha e merge feito mesmo assim:

1. O workflow só roda em `push` na `main`. O defeito é descoberto **depois** do merge.
2. Tem `continue-on-error: true` ou `|| true` num passo. A falha vira aviso.
3. A CI roda, mas o check não é **obrigatório** na proteção da `main`. CI vermelha vira só uma opinião.

O terceiro é o mais traiçoeiro, porque o YAML está perfeito. A configuração fica no GitHub: *Settings → Rules (ou Branches) → exigir status checks antes do merge*, marcando o job `gates`.

### Configurar CI com a IA, sem aceitar YAML às cegas

Pedir o workflow para a IA é ótimo. Aceitar sem ler é como deixar o Valete escrever a própria sentença. Este YAML foi gerado por um agente para a agenda de mentorias. Ele tem **cinco problemas**. Encontre-os antes de abrir o gabarito.

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

A carta ♣ Contraprova aplicada à CI: *"que mudança eu faço para provar que este gate bloqueia?"*. Se você nunca viu um gate ficar vermelho, não sabe se ele funciona. Quebre de propósito: tire uma vírgula, troque um tipo, mude o status esperado num teste. Veja vermelho. Desfaça.

<div data-quiz="check"></div>

## Pratique

<div data-lab="esteira"></div>

**Desafio em três metas.** (1) Nenhum defeito evitável chega na `main`. (2) Gastando o mínimo de minutos de CI na fila. (3) Revisando o YAML gerado com as cinco perguntas. Quando as três estiverem cumpridas, olhe para os PRs que ainda passam: nenhuma combinação de sensores pega aqueles dois. É deles que trata a lição 7.

## Leve com você

Prompt para pedir a CI ao agente. As restrições são guias; a última linha transforma o pedido em contraprova:

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

O `exit 2` bloqueia a edição e devolve a mensagem para o agente. O hook só olha as ferramentas `Edit` e `Write`: um `sed -i` pelo terminal passa. Por isso a guarda na CI continua necessária. **Guia e sensor, nunca só um.**

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
2. **Quem testa os testes?** Cobertura de 100% não diz se os testes conferem alguma coisa. Pesquise *mutation testing* (Stryker para JavaScript): ele altera o código de propósito e vê se algum teste falha.
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
