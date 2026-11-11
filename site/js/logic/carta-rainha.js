export const TIPOS_SENSOR = {
  review: { nome: 'Agente de review', descricao: 'Uma linha na rubrica do subagent de review.' },
  hook: { nome: 'Hook do Claude Code', descricao: 'Bloqueia a ação no momento em que o agente tenta.' },
  ci: { nome: 'Passo de CI', descricao: 'Falha o pipeline e bloqueia o merge.' },
  teste: { nome: 'Teste automatizado', descricao: 'Um teste que falha quando o erro volta.' },
};

export const ERROS = [
  {
    id: 'inventou-regra',
    nome: 'Inventou regra de negócio',
    exemplo: 'Limite de 3 mentorias por mês. Antecedência mínima de 2h.',
    regra: 'Não crie regra de negócio, limite ou validação que não esteja em docs/spec.md. Se achar que falta uma regra, pare e pergunte antes de implementar.',
    sensor: {
      tipo: 'review',
      onde: '.claude/agents/rastreador-de-spec.md',
      texto: '- Para cada if que implementa regra de negócio, cite a linha de docs/spec.md que o justifica. Sem linha na spec: VEREDITO: BLOQUEAR.',
    },
  },
  {
    id: 'mudou-teste',
    nome: 'Alterou teste para passar',
    exemplo: 'Asserção de 409 trocada por 201 em tests/aceite/.',
    regra: 'Nunca edite arquivos em tests/aceite/. Se um teste de aceite parecer errado, pare e explique por quê em vez de mudar o teste.',
    sensor: {
      tipo: 'hook',
      onde: '.claude/settings.json + .claude/hooks/protege-testes.mjs',
      texto: 'Hook PreToolUse com matcher "Edit|Write": se tool_input.file_path estiver em tests/aceite/, sair com código 2 e explicar no stderr. Na CI, npm run guarda compara os testes com tests/aceite/CHECKSUMS.',
    },
  },
  {
    id: 'erro-generico',
    nome: 'Erro genérico',
    exemplo: 'catch que devolve 500 "Erro interno" para qualquer coisa.',
    regra: 'Todo erro segue a tabela da spec, com status e mensagem exatos. Não use catch que transforma erro de quem chamou (400, 404, 409) em 500.',
    sensor: {
      tipo: 'teste',
      onde: 'tests/',
      texto: "Um teste por linha da tabela de erros da spec, com status e corpo exatos. Ex.: vaga 999 → assert.equal(r.status, 404) e assert.deepEqual(r.corpo, { erro: 'Vaga não encontrada' }).",
    },
  },
  {
    id: 'dependencia',
    nome: 'Dependência sem motivo',
    exemplo: 'lodash para um sortBy. moment para uma regra inventada.',
    regra: 'Não adicione dependência sem registrar o motivo em docs/adr/. Prefira a biblioteca padrão do Node e do JavaScript.',
    sensor: {
      tipo: 'ci',
      onde: '.github/workflows/ci.yml',
      texto: "Passo que falha se package.json mudou sem ADR novo: git diff --name-only origin/main...HEAD | grep -q '^package.json$' && ! git diff --name-only origin/main...HEAD | grep -q '^docs/adr/' && exit 1. Mais npm audit --audit-level=high.",
    },
  },
  {
    id: 'abstracao',
    nome: 'Abstração demais',
    exemplo: 'AbstractRepositoryAdapter, AgendamentoServiceFactory.',
    regra: 'Escreva o código mais simples que passa nos testes. Não crie classe, factory, adapter ou interface que nenhum teste exija. Siga o padrão de src/rotas/mentores.js.',
    sensor: {
      tipo: 'review',
      onde: '.claude/agents/navalha-de-complexidade.md',
      texto: '- Para cada classe ou arquivo novo fora de src/rotas/, diga qual teste quebraria sem ele. Se nenhum quebraria: VEREDITO: BLOQUEAR e mostre a versão sem a camada.',
    },
  },
  {
    id: 'ignorou-nfr',
    nome: 'Ignorou requisito não funcional',
    exemplo: 'Duas pessoas conseguem reservar a mesma vaga ao mesmo tempo.',
    regra: 'Antes de implementar, leia os requisitos não funcionais da spec (NFR-1 concorrência, NFR-2 desempenho) e escreva no PR como o código atende cada um.',
    sensor: {
      tipo: 'teste',
      onde: 'tests/nfr.test.js',
      texto: 'Teste de concorrência: Promise.all com duas reservas da mesma vaga livre, esperando exatamente um 201 e um 409. Teste de desempenho: 200 requisições em GET /mentores/1/vagas com p95 abaixo de 50 ms.',
    },
  },
  {
    id: 'fonte-dados',
    nome: 'Assumiu a fonte de dados',
    exemplo: 'Criou uma lista de mentores dentro do arquivo de rotas.',
    regra: 'A fonte de dados é src/repo.js (ADR-001). Não crie listas, arquivos JSON ou bancos novos para dados do domínio.',
    sensor: {
      tipo: 'review',
      onde: '.claude/agents/rastreador-de-spec.md',
      texto: '- Sinalize qualquer array ou objeto literal com dados do domínio (mentores, vagas, agendamentos) fora de src/repo.js e de tests/.',
    },
  },
  {
    id: 'esqueceu-falha',
    nome: 'Esqueceu caso de falha',
    exemplo: 'Sem 404 para vaga inexistente. Sem 409 para vaga ocupada.',
    regra: 'Para cada task, escreva primeiro os testes dos casos de falha da tabela da spec e veja-os falhar. Só depois implemente o caminho feliz.',
    sensor: {
      tipo: 'ci',
      onde: 'package.json (script test)',
      texto: 'Cobertura mínima de linhas e de ramos no npm test: --test-coverage-lines=80 --test-coverage-branches=80. Um if de erro sem teste derruba a CI.',
    },
  },
];

const VAGAS = [
  'boas práticas',
  'boa prática',
  'adequad',
  'corretamente',
  'de forma correta',
  'tratar o erro',
  'tratar erros',
  'tratar os erros',
  'cuidado',
  'sempre que possível',
  'quando necessário',
  'se necessário',
  'código limpo',
  'clean code',
  'robust',
  'atenção',
  'melhorar',
  'qualidade',
];

export function erroPorId(id) {
  return ERROS.find((e) => e.id === id) || null;
}

export function sugestao(id) {
  const e = erroPorId(id);
  if (!e) return null;
  return { regra: e.regra, sensor: e.sensor.texto, tipo: e.sensor.tipo, onde: e.sensor.onde };
}

export function termosVagos(texto) {
  const t = String(texto || '').toLowerCase();
  return VAGAS.filter((v) => t.includes(v));
}

export function avaliarCarta({ erroId, evidencia = '', regra = '', sensor = '' }) {
  const avisos = [];
  if (!erroPorId(erroId)) avisos.push({ campo: 'erro', msg: 'Escolha no passo 1 o erro que a IA repetiu.' });
  if (!evidencia.trim()) {
    avisos.push({ campo: 'evidencia', msg: 'Sem evidência (arquivo:linha ou entrada → resposta), a carta vira opinião.' });
  }
  if (!regra.trim()) avisos.push({ campo: 'regra', msg: 'Falta a regra que vai para o AGENTS.md (o guia que o agente lê antes).' });
  if (!sensor.trim()) avisos.push({ campo: 'sensor', msg: 'Falta o sensor. Regra sem sensor é promessa.' });
  const vagosRegra = termosVagos(regra);
  if (vagosRegra.length) {
    avisos.push({ campo: 'regra', msg: `A regra tem termo vago (${vagosRegra.join(', ')}). O agente não sabe o que é "adequado" para você. Diga o arquivo, o status e a mensagem.` });
  }
  const vagosSensor = termosVagos(sensor);
  if (vagosSensor.length) {
    avisos.push({ campo: 'sensor', msg: `O sensor tem termo vago (${vagosSensor.join(', ')}). Sensor precisa responder sim ou não, sem depender de opinião.` });
  }
  if (regra.length > 300) {
    avisos.push({ campo: 'regra', msg: 'Regra longa. O AGENTS.md é lido em toda sessão: cada linha custa contexto. Corte para uma ou duas frases.' });
  }
  return avisos;
}

export function montarCarta({ erroId, evidencia = '', regra = '', sensor = '', tipo, onde }) {
  const e = erroPorId(erroId);
  const t = TIPOS_SENSOR[tipo] ? tipo : e ? e.sensor.tipo : 'review';
  const local = onde || (e ? e.sensor.onde : '');
  return [
    '## Erro vira regra',
    '',
    `**Erro que a IA repetiu:** ${e ? e.nome : '(escolha um erro)'}`,
    `**Evidência de hoje:** ${evidencia.trim() || '(faltando)'}`,
    '',
    '### Guia (feedforward) · AGENTS.md',
    '',
    `- ${regra.trim() || '(faltando)'}`,
    '',
    `### Sensor (feedback) · ${TIPOS_SENSOR[t].nome} · ${local}`,
    '',
    sensor.trim() || '(faltando)',
    '',
  ].join('\n');
}
