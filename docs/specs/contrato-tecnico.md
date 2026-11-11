# Contrato técnico do site

Site estático, sem build, HTML + CSS + JavaScript (ES modules), publicado no GitHub Pages a partir de `site/`.
Para rodar local: `npm run serve` (abre em http://localhost:4173).

## Princípios

- Sem framework e sem dependência de runtime, exceto `marked` (renderizar Markdown), carregado de CDN com versão fixa.
- Lógica pura separada da interface: `site/js/logic/*.js` não toca no DOM e tem teste em `tests/*.test.js` (`node --test`).
- Tudo em português do Brasil. Frases curtas e diretas.
- Sem nomes de alunos e sem dados individuais. Sem o domínio da carteira digital (Encontro 2 da OIP).
- Funciona em 360 px de largura, com teclado, no tema claro e escuro, e no modo projetor.

## Estrutura

```
site/
  index.html                 casca única (SPA com rotas por hash)
  css/style.css              tokens e componentes base
  css/labs/<labId>.css       estilos de cada laboratório (carregado sob demanda)
  js/app.js                  roteador e views
  js/ui.js                   helpers de DOM (h, copy, download, toast)
  js/store.js                progresso e estado em localStorage (com try/catch)
  js/quiz.js                 componente de quiz
  js/labs/<labId>.js         interface de cada laboratório
  js/logic/<labId>.js        lógica pura de cada laboratório
  content/curriculo.js       semanas do curso (usadas no chip "Revisa Sx" da lição), aulas, lições, cartas do baralho
  content/maquinas.js        lista das máquinas (motions)
  content/glossario.js       termos
  content/licoes/<id>.md     texto de cada lição
  content/quiz/<id>.json     quiz de cada lição
```

## Rotas

| Rota | View |
|---|---|
| `#/` | Início: citação, placa do harness, lições e ferramentas |
| `#/licao/<id>` | Lição |
| `#/baralho` | Baralho do Gato (6 cartas) |
| `#/glossario` | Glossário |
| `#/maquinas` | Galeria das máquinas (motions) |
| `#/maquina/<id>?m=<montagem>` | Uma máquina em tela cheia, já montada (link copiável de dentro da máquina) |

## Lição

Metadados em `content/curriculo.js` (`licoes`). Corpo em `content/licoes/<id>.md`. O Markdown aceita HTML.

Marcadores especiais no Markdown:

| Marcador | Efeito |
|---|---|
| `<div data-lab="<labId>"></div>` | Monta o laboratório `<labId>` |
| `<div data-cartas="rastro,par"></div>` | Mostra as cartas do baralho indicadas |
| `<div data-quiz="check"></div>` | Posição do quiz de checagem (se ausente, vai para o fim) |

Estrutura do texto de cada lição:

```
> lema em uma linha
## O problema
## O conceito
## Pratique            (laboratórios)
## Leve com você       (artefato copiável: regra de AGENTS.md, subagent, workflow, prompt, template)
<details class="toca"><summary>Trilha da Toca · ...</summary> desafio avançado </details>
## Termos-chave        (tabela: Termo | O que dizem | O que realmente significa)
## Para ir além        (links)
```

Blocos de código ganham botão "copiar" automaticamente.

## Quiz

`content/quiz/<id>.json`:

```json
{
  "licao": "<id>",
  "perguntas": [
    { "etapa": "pre", "pergunta": "...", "opcoes": ["a", "b", "c", "d"], "correta": 0, "explicacao": "..." }
  ]
}
```

6 perguntas: 2 `pre` (topo da lição), 2 `check` (meio), 2 `pos` (fim). A explicação aparece depois da resposta.

## Laboratório

`site/js/labs/<labId>.js`:

```js
export function mount(el, ctx) {
  // el: <div class="lab lab-<labId>"> já no DOM
  // devolve opcionalmente uma função de limpeza
}
```

`ctx`:

| Campo | Tipo | Uso |
|---|---|---|
| `labId`, `licaoId` | string | identificação |
| `state.load(fallback)` / `state.save(valor)` / `state.clear()` | função | estado do laboratório em localStorage, já com try/catch |
| `toast(msg)` | função | aviso curto |
| `copy(texto)` | função | copia para a área de transferência e avisa |
| `download(nome, texto)` | função | baixa um arquivo de texto |

Regras:

- Comece com `<header class="lab__head">` contendo `<span class="lab__tag">Laboratório</span>`, um `<h3>` e uma instrução de uma frase. Depois, `<div class="lab__body">`.
- Estilos em `site/css/labs/<labId>.css`, todos sob `.lab-<labId>`. Use só os tokens de `style.css`. Fontes em `rem`/`em`.
- Componentes base disponíveis: `.btn`, `.btn--primary`, `.btn--ghost`, `.btn--sm`, `.chip`, `.chip--ok`, `.chip--warn`, `.chip--bad`, `.card`, `.callout`, `.kbd`, `.mono`, `.muted`, `.stack`, `.row`, `.grid-2`, `.sr-only`.
- Resultado e feedback em região `aria-live="polite"`.
- Tudo operável por teclado (botões de verdade, não `div` clicável).

## Máquina (motion)

Uma máquina é um laboratório especial: uma simulação passo a passo, no estilo das figuras interativas do AI Engineering from Scratch. Ela tem estações numa mesa isométrica, um pacote que anda entre elas, peças que você quebra e conserta, a opção de abrir a caixa (camadas de cada estação), um livro-razão e um rastro baixável.

| Peça | Onde |
|---|---|
| Motor puro (geometria, montagem, estado acumulado, validação) | `site/js/logic/motion.js` |
| Interface do motor (palco SVG, controles, abas) | `site/js/motion.js` |
| Estilos compartilhados | `site/css/motion.css` (cada `css/labs/motion-<id>.css` só importa este) |
| Definição de cada máquina | `site/js/logic/motion-<id>.js`, exporta `motion` |
| Laboratório | `site/js/labs/motion-<id>.js` chama `montarMotion(el, ctx, motion)` |
| Catálogo da galeria | `site/content/maquinas.js` |
| Testes | `tests/motion.test.js` |

A definição (`motion`) tem: `id`, `fig`, `titulo`, `lead`, `dica`, `ideia`, `pronto`, `nota` (o que é simulado e de onde vêm os dados), `estacoes` (com `x`, `y`, `w`, `d`, `h`, `tipo`, `rotulo`, `oQueE` e, opcionais, `camadas`, `arquivo`, `nomeComercial`, `medidor`, `etiqueta`), `trilhos`, `montagem` (selects), `avarias` (peças quebráveis), `legenda` do livro-razão, `metricas`, 4 `licoes` e pelo menos 3 `desafios`. A função `simular(montagem, avarias)` é pura e devolve `{ entrada, desligadas, passos, saida }`. Cada passo diz a `estacao`, o `titulo`, a `narracao` e, se quiser, `dentro`, `marca`, `pacotes`, `trilhos`, `niveis`, `metricas`, `razao` e `rastro`.

Para começar a máquina já montada numa lição: `<div data-lab="motion-subagent" data-montagem="padrao=paralelo,tarefa=grande"></div>`.

`npm run verificar` roda `validarMotion` em todas as montagens e avarias de cada máquina do catálogo. Se um passo citar estação que não existe, a verificação falha.

## Tokens de design (`style.css`)

| Token | Uso |
|---|---|
| `--bg`, `--paper`, `--paper-2` | fundo da página, cartões, superfícies internas |
| `--ink`, `--ink-2`, `--ink-3` | texto principal, secundário, apagado |
| `--line` | bordas |
| `--copas` | vermelho de copas: destaque, erro, gate que bloqueia |
| `--tinta` | azul de tinta: links, foco, guias (feedforward) |
| `--folha` | verde: ok, sensor verde |
| `--ouro` | âmbar: atenção, "assumido" |
| `--uva` | roxo: subagents, orquestração |
| `--font-display`, `--font-body`, `--font-mono` | Fraunces, IBM Plex Sans, IBM Plex Mono |
| `--r-sm`, `--r`, `--r-lg` | raios |
| `--shadow` | sombra de cartão |

## Testes e CI

- `npm test` roda `node --test tests/`.
- `npm run check` roda testes + verificação de que todo lab referenciado em lição existe, todo quiz tem 6 perguntas válidas e todo link interno resolve (`scripts/verificar-site.js`).
- `.github/workflows/ci.yml` roda `npm run check` em todo push e PR.
- `.github/workflows/pages.yml` publica `site/` no GitHub Pages a partir da `main`.
