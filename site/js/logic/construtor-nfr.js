export const PADROES = {
  ubiquo: { nome: 'Ubíquo', molde: 'O {sistema} DEVE {resposta}.', usa: [] },
  evento: { nome: 'QUANDO (evento)', molde: 'QUANDO {gatilho}, o {sistema} DEVE {resposta}.', usa: ['gatilho'] },
  estado: { nome: 'ENQUANTO (estado)', molde: 'ENQUANTO {condicao}, o {sistema} DEVE {resposta}.', usa: ['condicao'] },
  indesejado: { nome: 'SE…ENTÃO (indesejado)', molde: 'SE {gatilho}, ENTÃO o {sistema} DEVE {resposta}.', usa: ['gatilho'] },
  opcional: { nome: 'ONDE (opcional)', molde: 'ONDE {condicao}, o {sistema} DEVE {resposta}.', usa: ['condicao'] },
};

export const CATEGORIAS = {
  desempenho: {
    nome: 'Desempenho',
    pergunta: 'Quão rápido, para quantas pessoas, medido em que percentil?',
    padrao: 'estado',
    exemplo: {
      condicao: 'o mentor tiver até 1.000 vagas',
      gatilho: '',
      sistema: 'serviço de agenda',
      resposta: 'responder GET /mentores/:id/vagas com p95 abaixo de 50 ms',
    },
    sensor: 'Teste de desempenho: 200 requisições locais, calcula o p95 e falha se passar de 50 ms.',
    onde: ['spec', 'ci'],
  },
  confiabilidade: {
    nome: 'Confiabilidade',
    pergunta: 'O que acontece quando uma parte falha? O que não pode falhar junto?',
    padrao: 'evento',
    exemplo: {
      condicao: '',
      gatilho: 'duas requisições pedirem a mesma vaga livre ao mesmo tempo',
      sistema: 'serviço de agenda',
      resposta: 'confirmar exatamente 1 agendamento (201) e recusar o outro com 409',
    },
    sensor: 'Teste de concorrência: dispara 2 requisições com Promise.all e confere 1 resposta 201 e 1 resposta 409.',
    onde: ['spec', 'ci'],
  },
  escalabilidade: {
    nome: 'Escalabilidade',
    pergunta: 'Qual é a carga hoje, qual é o pico e o que fazemos se ela dobrar?',
    padrao: 'estado',
    exemplo: {
      condicao: 'a agenda abrir às 9h de segunda, com até 150 tentativas de agendamento no primeiro minuto',
      gatilho: '',
      sistema: 'serviço de agenda',
      resposta: 'manter taxa de erro 5xx abaixo de 1% e p95 abaixo de 300 ms',
    },
    sensor: 'Teste de carga (k6 ou autocannon) com 150 requisições em 60 s; falha se 5xx ≥ 1% ou p95 ≥ 300 ms.',
    onde: ['spec', 'ci'],
  },
  manutenibilidade: {
    nome: 'Manutenibilidade',
    pergunta: 'Quem vai mexer nisso depois consegue entender e mudar sem medo?',
    padrao: 'ubiquo',
    exemplo: {
      condicao: '',
      gatilho: '',
      sistema: 'código de src/',
      resposta: 'ter funções com no máximo 30 linhas e complexidade ciclomática até 8, sem dependência nova sem ADR',
    },
    sensor: 'Lint de complexidade (ESLint: complexity 8, max-lines-per-function 30) e checagem de package.json no review.',
    onde: ['agents', 'ci'],
  },
  privacidade: {
    nome: 'Privacidade (LGPD)',
    pergunta: 'Que dado pessoal entra, onde ele aparece e quem consegue ver?',
    padrao: 'ubiquo',
    exemplo: {
      condicao: '',
      gatilho: '',
      sistema: 'serviço de agenda',
      resposta: 'registrar logs sem o e-mail do jovem (0 ocorrências de e-mail nos logs)',
    },
    sensor: 'Teste que captura os logs de um agendamento e falha se encontrar um e-mail (regex) na saída.',
    onde: ['agents', 'ci'],
  },
};

export const ONDE_VIVE = {
  spec: 'docs/spec.md (o requisito, com número)',
  agents: 'AGENTS.md (regra que guia o agente antes de gerar código)',
  ci: 'CI (o sensor que bloqueia o merge)',
};

const VAGAS = ['rápido', 'rapido', 'rápida', 'escalável', 'escalavel', 'seguro', 'segura', 'robusto', 'eficiente', 'confiável', 'confiavel', 'adequado', 'bom desempenho', 'performático', 'performatico', 'leve', 'otimizado'];

export function temNumero(texto = '') {
  return /\d/.test(texto);
}

export function palavrasVagas(texto = '') {
  const t = texto.toLowerCase();
  return VAGAS.filter((p) => new RegExp(`(^|[^\\p{L}])${p}([^\\p{L}]|$)`, 'u').test(t));
}

export function montarEars({ padrao = 'ubiquo', gatilho = '', condicao = '', sistema = '', resposta = '' } = {}) {
  const molde = (PADROES[padrao] || PADROES.ubiquo).molde;
  const limpar = (s) => s.trim().replace(/[.\s]+$/, '');
  return molde
    .replace('{gatilho}', limpar(gatilho) || '…')
    .replace('{condicao}', limpar(condicao) || '…')
    .replace('{sistema}', limpar(sistema) || 'sistema')
    .replace('{resposta}', limpar(resposta) || '…');
}

export function avaliar(nfr = {}) {
  const avisos = [];
  const padrao = PADROES[nfr.padrao] || PADROES.ubiquo;
  for (const campo of padrao.usa) {
    if (!(nfr[campo] || '').trim()) {
      avisos.push({ tipo: 'faltando', campo, msg: `O padrão ${padrao.nome} precisa de ${campo === 'gatilho' ? 'um gatilho' : 'uma condição'}.` });
    }
  }
  if (!(nfr.resposta || '').trim()) {
    avisos.push({ tipo: 'faltando', campo: 'resposta', msg: 'Falta a resposta do sistema: o que ele DEVE fazer.' });
  }
  const textoTodo = [nfr.gatilho, nfr.condicao, nfr.resposta].join(' ');
  if (!temNumero(nfr.resposta || '')) {
    avisos.push({ tipo: 'desejo', campo: 'resposta', msg: 'Requisito sem número é desejo. Coloque uma meta medível (ms, %, quantidade).' });
  }
  const vagas = palavrasVagas(textoTodo);
  if (vagas.length && !temNumero(nfr.resposta || '')) {
    avisos.push({ tipo: 'vago', campo: 'resposta', msg: `"${vagas[0]}" não é critério. Troque por um número.` });
  }
  if (!(nfr.sensor || '').trim()) {
    avisos.push({ tipo: 'promessa', campo: 'sensor', msg: 'Requisito sem sensor é promessa. Diga qual teste ou ferramenta vai medir isso.' });
  }
  return avisos;
}

export function pronto(nfr) {
  return avaliar(nfr).length === 0;
}

export function paraMarkdown(nfr = {}) {
  const cat = CATEGORIAS[nfr.categoria];
  const ears = montarEars(nfr);
  const onde = (nfr.onde || []).map((o) => `- ${ONDE_VIVE[o] || o}`).join('\n');
  return [
    `### NFR · ${cat ? cat.nome : 'Requisito não funcional'}`,
    '',
    `**Requisito (EARS):** ${ears}`,
    '',
    `**Sensor:** ${(nfr.sensor || '').trim() || 'A DEFINIR'}`,
    '',
    '**Onde vive:**',
    onde || '- A DEFINIR',
    '',
  ].join('\n');
}
