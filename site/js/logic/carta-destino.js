const VAGAS_RESPOSTA = ['funcionar', 'funciona', 'funcione', 'corretamente', 'normalmente', 'dar certo', 'dá certo', 'como esperado', 'ok'];
const VAGAS_ERRO = ['erro', 'tratar o erro', 'trata o erro', 'tratar erro', 'mensagem de erro', 'erro genérico', 'erro generico', 'dá erro', 'da erro', 'falha'];
const VAGAS_NFR = ['rápido', 'rapido', 'rápida', 'escalável', 'escalavel', 'seguro', 'segura', 'eficiente', 'robusto', 'performático', 'leve'];
const SENSORES_VAGOS = ['testar', 'teste', 'testes', 'vou testar', 'testaria', 'perguntar à ia', 'perguntar a ia', 'mandar para outra ia', 'olhar', 'conferir'];

export const VAZIA = {
  feature: '',
  ok: { entrada: '', resposta: '' },
  falha: { entrada: '', status: '', mensagem: '' },
  nfr: { texto: '', sensor: '' },
  foraEscopo: '',
};

const norm = (s = '') => s.trim().toLowerCase();
const temStatus = (s = '') => /\b[1-5]\d\d\b/.test(s);
const contemPalavra = (texto, lista) => {
  const t = norm(texto);
  return lista.find((p) => new RegExp(`(^|[^\\p{L}])${p}([^\\p{L}]|$)`, 'u').test(t));
};

export function validarCarta(carta = VAZIA) {
  const erros = [];
  const dicas = [];
  const c = { ...VAZIA, ...carta, ok: { ...VAZIA.ok, ...carta.ok }, falha: { ...VAZIA.falha, ...carta.falha }, nfr: { ...VAZIA.nfr, ...carta.nfr } };

  if (!norm(c.feature)) erros.push({ campo: 'feature', msg: 'Diga a feature em uma frase. Sem destino, qualquer caminho serve.' });
  else if (c.feature.trim().length > 220) erros.push({ campo: 'feature', msg: 'Mais de uma frase. Corte até caber em uma.' });

  if (!norm(c.ok.entrada)) erros.push({ campo: 'ok.entrada', msg: 'Qual é a entrada exata do caso que funciona?' });
  if (!norm(c.ok.resposta)) erros.push({ campo: 'ok.resposta', msg: 'Qual é a resposta exata do caso que funciona?' });
  else {
    const vaga = contemPalavra(c.ok.resposta, VAGAS_RESPOSTA);
    if (!temStatus(c.ok.resposta)) {
      erros.push({ campo: 'ok.resposta', msg: vaga ? `Teste do Gato: "${vaga}" não é resposta. Escreva o status e o corpo.` : 'Inclua o status HTTP (ex.: 201) e o corpo esperado.' });
    }
  }

  if (!norm(c.falha.entrada)) erros.push({ campo: 'falha.entrada', msg: 'Qual entrada deve falhar?' });
  if (!/^[45]\d\d$/.test(c.falha.status.trim())) erros.push({ campo: 'falha.status', msg: 'Status de falha é um número 4xx ou 5xx.' });
  const msg = norm(c.falha.mensagem);
  if (!msg) erros.push({ campo: 'falha.mensagem', msg: 'Qual mensagem exata a pessoa recebe?' });
  else if (VAGAS_ERRO.includes(msg) || msg.startsWith('tratar')) {
    erros.push({ campo: 'falha.mensagem', msg: 'Teste do Gato: "tratar o erro" não é contrato. Qual erro, qual mensagem?' });
  }

  if (!norm(c.nfr.texto)) erros.push({ campo: 'nfr.texto', msg: 'Escreva um requisito não funcional.' });
  else if (!/\d/.test(c.nfr.texto)) {
    const vaga = contemPalavra(c.nfr.texto, VAGAS_NFR);
    erros.push({ campo: 'nfr.texto', msg: vaga ? `"${vaga}" sem número é desejo. Quanto? Em que percentil?` : 'Requisito sem número é desejo. Coloque uma meta medível.' });
  }
  const sensor = norm(c.nfr.sensor);
  if (!sensor) erros.push({ campo: 'nfr.sensor', msg: 'Requisito sem sensor é promessa. Qual teste ou ferramenta mede isso?' });
  else if (SENSORES_VAGOS.includes(sensor)) erros.push({ campo: 'nfr.sensor', msg: `"${c.nfr.sensor.trim()}" não é sensor. Que teste, com que limite, rodando onde?` });

  if (!norm(c.foraEscopo)) dicas.push({ campo: 'foraEscopo', msg: 'Dica: dizer o que está fora do escopo impede a IA de inventar (e-mail, login, limites...).' });

  return { erros, dicas, aprovada: erros.length === 0 };
}

export function paraMarkdown(carta = VAZIA) {
  const c = { ...VAZIA, ...carta, ok: { ...VAZIA.ok, ...carta.ok }, falha: { ...VAZIA.falha, ...carta.falha }, nfr: { ...VAZIA.nfr, ...carta.nfr } };
  const linhas = [
    `## Feature: ${c.feature.trim() || 'A DEFINIR'}`,
    '',
    '### Critérios de aceite',
    '',
    '| Caso | Entrada | Resposta esperada |',
    '|---|---|---|',
    `| Deve funcionar | ${c.ok.entrada.trim() || '?'} | ${c.ok.resposta.trim() || '?'} |`,
    `| Deve falhar | ${c.falha.entrada.trim() || '?'} | ${c.falha.status.trim() || '?'} {"erro":"${c.falha.mensagem.trim() || '?'}"} |`,
    '',
    '### Requisito não funcional',
    '',
    `- **Requisito:** ${c.nfr.texto.trim() || '?'}`,
    `- **Sensor:** ${c.nfr.sensor.trim() || '?'}`,
    '',
  ];
  if (c.foraEscopo.trim()) {
    linhas.push('### Fora do escopo (a IA não deve criar)', '');
    for (const item of c.foraEscopo.split(/\n|;/).map((s) => s.trim()).filter(Boolean)) {
      linhas.push(`- ${item}`);
    }
    linhas.push('');
  }
  linhas.push('> Se algo necessário não estiver nesta carta, pergunte antes de inventar.', '');
  return linhas.join('\n');
}
