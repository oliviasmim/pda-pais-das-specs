> "Ai, ai! Vou chegar atrasado!", disse o Coelho Branco, tirando um relógio do bolso do colete.
>
> Lewis Carroll, *Alice no País das Maravilhas*, cap. 1 (tradução livre).

## O problema

Alguém pede ao agente: *"Crie um endpoint que lista as vagas livres de um mentor."*

A IA entrega em dois minutos. Carrega todas as vagas, filtra as livres, ordena e devolve. Na demo, com 10 vagas, tudo funciona. Os testes passam.

Segunda-feira, 9h, a agenda abre. Cento e cinquenta jovens tentam agendar no primeiro minuto. A listagem fica lenta, duas pessoas conseguem a mesma vaga, e um mentor recebe dois jovens no mesmo horário. Faltou escrever **quão bem o sistema precisava funcionar.**

A IA erra, quase sempre, no que você **não** escreveu. E o que a gente menos escreve é o requisito não funcional. Sem ele, o agente escolhe o padrão mais simples: tudo em memória, nenhuma concorrência, nenhuma meta de tempo.

> No Encontro 1 da OIP, a orientação mais mal lida pela turma era justamente um requisito de escala. Metade leu como "privacidade" ou "só teste". Ninguém tinha dado nome a isso ainda. Hoje a gente dá.

## O conceito

### Funcional e não funcional

Requisito não funcional nada mais é do que a descrição de quão bem o sistema faz o que ele faz.

| | Funcional | Não funcional |
|---|---|---|
| Pergunta | **O que** o sistema faz? | **Quão bem** ele faz? |
| Exemplo | Agendar uma mentoria numa vaga livre. | Agendar com p95 abaixo de 300 ms, com 150 tentativas no primeiro minuto. |
| Quem esquece | Quase ninguém. | Quase todo mundo. |
| O que a IA faz se faltar | Pergunta ou inventa uma regra. | Escolhe em silêncio o padrão mais simples. |

### O que o *Designing Data-Intensive Applications* ensina

O capítulo 2 da 2ª edição do livro de Martin Kleppmann e Chris Riccomini (*Defining Nonfunctional Requirements*) é sobre isto: como transformar "rápido", "confiável" e "escalável" em algo que dá para medir. As ideias abaixo são uma paráfrase, adaptada para a agenda de mentorias.

**1. Tempo de resposta é uma distribuição, não um número.** Se você roda a mesma requisição mil vezes, recebe mil tempos diferentes. A média esconde quem esperou muito. Por isso se usa percentil: o **p50** (mediana) diz o tempo da requisição típica; o **p95** e o **p99** dizem quanto esperam as pessoas na cauda. O livro lembra que, muitas vezes, quem cai na cauda é justamente quem mais usa o sistema.

**2. A latência de cauda se amplifica.** Quando uma requisição chama vários serviços e só responde depois que todos terminam, ela espera o mais lento. Com uma chamada, 1% das requisições sente o p99 do backend. Com cinco chamadas, quase 5%. Com cem, a maioria. O laboratório abaixo mostra isso ao vivo.

**3. "Escalável" só vale com a carga descrita.** Primeiro se descreve a carga: 300 jovens, 40 mentores, cerca de 25 vagas por mentor por mês, pico de 150 tentativas no primeiro minuto de segunda. Depois se pergunta: **se essa carga dobrar, o que a gente faz?**

**4. Calcular na leitura ou na escrita é uma decisão, não um detalhe.** O livro usa a linha do tempo de uma rede social como estudo de caso: montar a timeline toda vez que alguém abre o app, ou deixá-la pronta a cada nova postagem. Na agenda é a mesma escolha: contar as vagas livres a cada `GET`, ou manter a lista atualizada a cada agendamento. Leitura barata custa escrita cara, e o contrário. Essa decisão vai num ADR (registro de decisão de arquitetura). **A IA não pode tomá-la sozinha.**

**5. Falha e pane são coisas diferentes.** Uma parte do sistema falhar (*fault*) é normal. O sistema inteiro parar de atender (*failure*) é o que se quer evitar. Tolerância a falhas é seguir funcionando quando uma parte cai. Muitas panes reais começam numa mudança feita por pessoas, como uma configuração errada, e o livro defende tratar isso como problema do sistema, não de culpa individual. Pergunta para a agenda: se o envio de e-mail cair, o agendamento cai junto?

**6. Manutenibilidade também é requisito.** Operabilidade (dá para rodar e observar), simplicidade (sem complexidade acidental, aquela que não vem do problema) e evolutividade (dá para mudar sem medo). Abstração desnecessária gerada pela IA é complexidade acidental.

**7. Metas explícitas.** Quando o requisito vira compromisso, ele tem nome: SLO (a meta interna, ex.: p95 < 300 ms em 99% dos dias) e SLA (o contrato com quem usa). A turma não precisa de SLA agora, mas precisa do hábito: **meta escrita, medida e com gate** (um bloqueio automático).

### Do requisito ao sensor

Um requisito não funcional só existe quando atravessa quatro etapas:

| Etapa | Pergunta | Exemplo (concorrência na última vaga) |
|---|---|---|
| 1. Número | Quanto? | Exatamente 1 confirmação para 2 pedidos simultâneos. |
| 2. EARS | Quando, quem, o quê? | QUANDO duas requisições pedirem a mesma vaga livre ao mesmo tempo, o serviço de agenda DEVE confirmar exatamente uma (201) e recusar a outra (409). |
| 3. Sensor | Que teste mede? | Teste que dispara 2 requisições com `Promise.all` e confere `[201, 409]`. |
| 4. Gate | Onde bloqueia? | Na CI, antes do merge. |

Faltou o número, é **desejo**. Faltou o sensor, é **promessa**. Só com os quatro é requisito.

| Categoria | Pergunta-guia | Sensor típico |
|---|---|---|
| Desempenho | Quão rápido, para quantos, em que percentil? | Teste de desempenho com meta de p95 |
| Confiabilidade | O que acontece quando uma parte falha? | Teste de concorrência, teste com dependência derrubada |
| Escalabilidade | Qual é a carga e o pico? E se dobrar? | Teste de carga (k6, autocannon) |
| Manutenibilidade | Dá para entender e mudar sem medo? | Lint de complexidade, revisão de dependência nova |
| Privacidade (LGPD) | Que dado pessoal aparece onde? | Teste que procura e-mail nos logs |

Duas cartas do baralho trabalham aqui:

<div data-cartas="contraprova,par"></div>

<div data-quiz="check"></div>

## Pratique

### 1. O relógio do Coelho

Projete este laboratório e responda em voz alta:

1. Com fan-out 1 e cauda 2%, quanto valem a média e o p99? Qual dos dois você colocaria num requisito?
2. Mude o fan-out para 5 e depois para 20. O que acontece com o p95? E com a média?
3. Em qual endpoint da agenda isso aconteceria? (Dica: um `GET` que consulta mentor, vagas, agendamentos e e-mail em sequência.)

<div data-lab="percentis"></div>

### 2. Construtor de requisitos

Em grupo. Cada grupo recebe uma categoria (desempenho, confiabilidade, escalabilidade, manutenibilidade ou privacidade) e escreve **um** requisito para a agenda de mentorias, com número e sensor. Depois cada grupo lê o seu, e a turma aplica a carta ♣ Contraprova: *"que entrada provaria que esse requisito foi quebrado?"*

<div data-lab="construtor-nfr"></div>

## Leve com você

**1. Bloco de NFR para a sua spec** (`docs/spec.md`):

```markdown
## Requisitos não funcionais

### Carga esperada
- Usuários: 300 jovens, 40 mentores
- Volume: ~25 vagas por mentor por mês
- Pico: 150 tentativas de agendamento no primeiro minuto de segunda, 9h

### NFR-1 · Concorrência
QUANDO duas requisições pedirem a mesma vaga livre ao mesmo tempo,
o serviço de agenda DEVE confirmar exatamente uma (201) e recusar a outra (409).
Sensor: tests/nfr/concorrencia.test.js (CI)

### NFR-2 · Desempenho
ENQUANTO o mentor tiver até 1.000 vagas,
o serviço DEVE responder GET /mentores/:id/vagas com p95 abaixo de 50 ms.
Sensor: tests/nfr/desempenho.test.js, 200 requisições locais (CI)
```

**2. Regra para o AGENTS.md** (guia que impede o padrão silencioso):

```markdown
## Requisitos não funcionais
- Antes de implementar, leia "Requisitos não funcionais" em docs/spec.md e diga quais se aplicam à task.
- Se a task envolve escrita concorrente, volume ou tempo de resposta e a spec não tem número, PARE e pergunte. Não escolha um padrão em silêncio.
- Todo NFR implementado precisa de um teste em tests/nfr/.
```

**3. Os dois sensores** (Node 20+, `node --test`):

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';

const URL_BASE = process.env.URL_BASE ?? 'http://localhost:3000';

function p95(tempos) {
  const ordenados = [...tempos].sort((a, b) => a - b);
  return ordenados[Math.ceil(0.95 * ordenados.length) - 1];
}

test('NFR-1: duas requisições para a mesma vaga confirmam exatamente uma', async () => {
  const pedir = (email) =>
    fetch(`${URL_BASE}/agendamentos`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ vagaId: 1, jovemEmail: email }),
    });
  const [a, b] = await Promise.all([pedir('ana@pda.org'), pedir('bia@pda.org')]);
  assert.deepEqual([a.status, b.status].sort(), [201, 409]);
});

test('NFR-2: GET /mentores/1/vagas responde com p95 < 50 ms', async () => {
  const tempos = [];
  for (let i = 0; i < 200; i++) {
    const inicio = performance.now();
    const res = await fetch(`${URL_BASE}/mentores/1/vagas`);
    await res.json();
    tempos.push(performance.now() - inicio);
  }
  assert.ok(p95(tempos) < 50, `p95 foi ${p95(tempos).toFixed(1)} ms`);
});
```

<details class="toca">
<summary>Trilha da Toca · para quem terminou antes</summary>

1. **ADR da leitura vs escrita.** Escreva o ADR-002 da agenda: "vagas livres calculadas na leitura ou mantidas na escrita?". Contexto (carga do pico de segunda), opções, decisão, consequências. Depois peça ao agente para implementar **a partir do ADR** e veja se ele respeita.
2. **Fitness function.** Transforme o requisito de manutenibilidade em regra do ESLint (`complexity`, `max-lines-per-function`) e faça a CI falhar quando a IA gerar uma função de 60 linhas.
3. **Caça ao padrão silencioso.** No seu projeto, encontre um lugar onde a IA escolheu um requisito não funcional sem você pedir (tudo em memória, sem paginação, sem timeout, log com dado pessoal). Escreva o NFR que faltava e o sensor.
4. **Fan-out de verdade.** Desenhe as chamadas que um `GET` do seu projeto faz. Quantas são em sequência? Qual seria o p99 de cada uma? Qual o p99 da requisição inteira?

</details>

## Termos-chave

| Termo | O que dizem | O que realmente significa |
|---|---|---|
| Requisito funcional | "O que o cliente pediu." | O que o sistema faz: entradas, saídas, regras. |
| Requisito não funcional | "Coisa de infra, depois a gente vê." | Quão bem o sistema faz: desempenho, confiabilidade, escala, manutenção, privacidade. Com número. |
| Percentil (p95, p99) | "Tempo médio." | O tempo abaixo do qual ficam 95% (ou 99%) das requisições. Mostra a cauda que a média esconde. |
| Latência de cauda | "Uns casos raros lentos." | As requisições mais lentas. Com fan-out, deixam de ser raras. |
| Fan-out | "Chamar vários serviços." | Uma requisição que depende de N chamadas e espera a mais lenta. |
| Carga | "Muito acesso." | Números que descrevem o uso: requisições por segundo, usuários simultâneos, volume de dados, pico. |
| Falha vs pane | "Deu erro." | Falha: uma parte quebra. Pane: o sistema para de atender. Tolerância a falhas impede que uma vire a outra. |
| SLO | "Meta de qualidade." | Meta interna e medida de um serviço, ex.: p95 < 300 ms em 99% dos dias. |
| Complexidade acidental | "Código bem arquitetado." | Complexidade que vem da solução, não do problema. A IA produz muita. |

## Para ir além

- [Designing Data-Intensive Applications](https://dataintensive.net/), de Martin Kleppmann e Chris Riccomini. Capítulo 2 da 2ª edição: *Defining Nonfunctional Requirements*.
- [The Tail at Scale](https://research.google/pubs/the-tail-at-scale/), de Jeffrey Dean e Luiz André Barroso (2013). O artigo clássico sobre amplificação da latência de cauda.
- [EARS: Easy Approach to Requirements Syntax](https://alistairmavin.com/ears/), de Alistair Mavin. Os cinco padrões de frase que a turma usa desde a S6.
- [Service Level Objectives](https://sre.google/sre-book/service-level-objectives/), capítulo do livro de SRE do Google.
