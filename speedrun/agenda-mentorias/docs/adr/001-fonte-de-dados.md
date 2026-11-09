# ADR-001 · Fonte de dados em memória

**Status:** aceito · **Data:** 2026-11-09

## Contexto

O speedrun dura 40 minutos. Configurar banco de dados consumiria o tempo das tasks e criaria diferenças entre máquinas.

## Decisão

Os dados ficam em `src/repo.js`, em memória, com um seed fixo. O repositório **simula um banco**: toda função é assíncrona e espera `LATENCIA_MS` (1 ms) antes de ler ou escrever, e devolve cópias dos objetos.

## Consequências

- Os testes são rápidos e determinísticos (`reset()` antes de cada teste).
- Como cada chamada custa uma "ida ao banco", **chamar o repositório dentro de um loop é lento** (ver NFR-2).
- Como há um `await` entre ler e escrever, **duas requisições podem ler a mesma vaga como livre** (ver NFR-1). Isso é proposital: é o que aconteceria com um banco de verdade.
- Em produção, trocaríamos por PostgreSQL. Essa decisão terá outro ADR.
