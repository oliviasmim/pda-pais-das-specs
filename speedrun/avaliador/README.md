# Avaliador oficial do Speedrun

Confere o projeto `agenda-mentorias` de um time e imprime um cartão de pontuação.
**Facilitadora: libere este avaliador só depois dos 40 minutos.**

## Uso

```bash
npx degit oliviasmim/pda-pais-das-specs/speedrun/avaliador avaliador
node avaliador/avaliar.mjs ./agenda-mentorias
```

A última linha da saída começa com `PLACAR {...}`. Copie a linha inteira e cole no placar do site (`#/speedrun`, campo "Colar do avaliador").

## O que ele confere

| Item | Como | Pontos |
|---|---|---|
| 26 casos oficiais | T1 (12), T2 (5), T3 (7) e NFR (2), com status e corpo exatos | 2 por caso |
| NFR-1 · concorrência | 10 pedidos simultâneos para a mesma vaga: exatamente um 201 e nove 409 | (é um dos casos) |
| NFR-2 · desempenho | 1.000 vagas, 200 requisições medidas, p95 < 50 ms; falha na hora se uma requisição passar de 500 ms | (é um dos casos) |
| TDD visível | no `git log`, um commit `test(Tn)` antes do primeiro `feat(Tn)` | 10 por task |
| Rosas pintadas | sha256 dos arquivos de `tests/aceite/` contra os originais embutidos no avaliador | −30 por arquivo |

O avaliador usa o próprio seed (não o do projeto) e chama `reset(seed)`, `repo.buscarVaga` e `repo.buscarAgendamento` de `src/repo.js`. Por isso o `AGENTS.md` do projeto proíbe mudar essas assinaturas.

O avaliador confere a **ordem** dos commits. Conferir se o teste estava mesmo vermelho fica com a clínica: peça ao time para mostrar a saída do `npm test` no commit `test(Tn)`.

Os pontos manuais (sensores verdes na CI, integração, carta respondida na clínica, minutos restantes) ficam no checklist do site.

## Testar o próprio avaliador

```bash
cd speedrun/agenda-mentorias && npm install && cd ../avaliador
node testar-referencia.mjs           # projeto inicial = 0 casos; referência = nota máxima; rosa detectada
node testar-referencia.mjs --gates   # também roda npm run gates na referência
```

`referencia/` contém só os arquivos que mudam em relação ao projeto inicial (rotas das três tasks, `reservarVaga` atômica no repositório e os testes do time). O script copia o projeto inicial para uma pasta temporária, aplica a referência em commits `test(Tn)` → `feat(Tn)` e avalia.

## Spoiler para a facilitadora

- **NFR-1:** ler a vaga e depois ocupá-la com dois `await` deixa duas requisições lerem `livre: true`. A referência resolve com `repo.reservarVaga(id)`, que confere e ocupa na mesma ida ao banco.
- **NFR-2:** chamar `repo.buscarVaga` dentro de um loop custa 1 ms por vaga. Com 1.000 vagas, mais de 1 s por requisição. A referência usa `repo.listarVagasDoMentor` uma vez só.
