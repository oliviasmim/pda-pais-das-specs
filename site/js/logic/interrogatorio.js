export const PEDIDO = 'Crie um endpoint para o jovem agendar uma mentoria.';

export const ARQUIVO = 'src/rotas/agendamentos.js';

export const LINHAS = [
  "const express = require('express');",
  "const moment = require('moment');",
  "const { enviarEmail } = require('../services/email');",
  "const repo = require('../repo');",
  '',
  'const router = express.Router();',
  '',
  'class AgendamentoService {',
  '  constructor(repositorio, notificador) {',
  '    Object.assign(this, { repositorio, notificador });',
  '  }',
  '  async agendar({ vagaId, jovemEmail }) {',
  '    const agendamentosNoMes = await this.repositorio.contarDoMes(jovemEmail);',
  '    if (agendamentosNoMes >= 3) {',
  "      throw new Error('Limite de 3 mentorias por mês');",
  '    }',
  '    const vaga = await this.repositorio.buscarVaga(vagaId);',
  '    if (moment(vaga.inicio).isoWeekday() > 5) {',
  "      throw new Error('Mentorias só em dias úteis');",
  '    }',
  '    const agendamento = await this.repositorio.salvarAgendamento({',
  '      vagaId,',
  '      mentorId: vaga.mentorId,',
  '      jovemEmail,',
  "      status: 'confirmado',",
  '    });',
  "    await this.notificador(jovemEmail, 'Sua mentoria está confirmada!');",
  '    return agendamento;',
  '  }',
  '}',
  '',
  'class AgendamentoServiceFactory {',
  '  static criar() {',
  '    return new AgendamentoService(repo, enviarEmail);',
  '  }',
  '}',
  '',
  "router.post('/agendamentos', async (req, res) => {",
  '  try {',
  '    const { vagaId, jovemEmail } = req.body;',
  "    console.log('Novo agendamento:', jovemEmail);",
  '    const service = AgendamentoServiceFactory.criar();',
  '    const agendamento = await service.agendar({ vagaId, jovemEmail });',
  '    res.status(200).json(agendamento);',
  '  } catch (erro) {',
  "    res.status(500).json({ erro: 'Erro interno' });",
  '  }',
  '});',
  '',
  'module.exports = router;',
];

export const CLASSES = {
  pedido: { nome: 'Pedido', descricao: 'Está no pedido. Alguém pediu isso.' },
  assumido: { nome: 'Assumido', descricao: 'O pedido deixou em aberto e a IA escolheu sozinha.' },
  inventado: { nome: 'Inventado', descricao: 'Ninguém pediu e não era necessário. A IA criou.' },
};

export const ACHADOS = [
  {
    id: 'rota',
    linhas: [38],
    classe: 'pedido',
    aceita: [],
    titulo: 'A rota POST /agendamentos',
    explicacao: 'O pedido diz "um endpoint para agendar". A rota é exatamente isso. O caminho e o método foram escolhidos pela IA, mas são o único ponto em que pedido e código concordam sem esforço.',
    spec: 'T1: POST /agendamentos.',
    carta: 'rastro',
    contraprova: {
      entrada: 'POST /agendamentos com {"vagaId": 1, "jovemEmail": "jovem@exemplo.com"} e a vaga 1 livre',
      esperado: '201 com {"id","vagaId":1,"mentorId","jovemEmail","status":"confirmado"}',
      obtido: '200 com o agendamento. A rota existe; o status está errado (ver linha 44).',
    },
  },
  {
    id: 'salvar',
    linhas: [21, 22, 23, 24, 25, 26],
    classe: 'pedido',
    aceita: [],
    titulo: 'Salvar o agendamento como confirmado',
    explicacao: 'Agendar é registrar a reserva. Isso foi pedido. Mas repare no que falta: a vaga nunca é marcada como ocupada. Uma linha pedida pode estar incompleta.',
    spec: 'T1: sucesso → agendamento com status "confirmado" e a vaga passa a livre: false.',
    carta: 'par',
    contraprova: {
      entrada: 'Agendar a vaga 1 e depois chamar GET /mentores/1/vagas',
      esperado: 'A vaga 1 não aparece mais na lista de vagas livres',
      obtido: 'A vaga 1 continua aparecendo como livre',
    },
  },
  {
    id: 'repo',
    linhas: [4],
    classe: 'assumido',
    aceita: [],
    titulo: 'De onde vêm as vagas',
    explicacao: 'O pedido não diz onde estão os dados. A IA escolheu um módulo repo. Com a spec ao lado, essa linha deixa de ser suposição: o ADR-001 define a fonte. É o efeito que você quer da spec.',
    spec: 'ADR-001: repositório em memória em src/repo.js.',
    carta: 'rastro',
    contraprova: {
      entrada: 'Perguntar: "em que linha do pedido está a fonte de dados?"',
      esperado: 'Uma linha da spec ou do ADR que diga a fonte',
      obtido: 'Nenhuma no pedido. Só existe resposta porque a spec existe.',
    },
  },
  {
    id: 'vaga',
    linhas: [17],
    classe: 'assumido',
    aceita: [],
    titulo: 'Buscar a vaga e seguir em frente',
    explicacao: 'A IA assumiu que toda vaga buscada existe e está livre. Não há nenhum "e se não existir?" nem "e se já tiver dono?". Resultado: duas pessoas agendam a mesma vaga.',
    spec: 'T1: vaga não existe → 404; vaga não está livre → 409. NFR-1: duas requisições para a mesma vaga, exatamente uma vence.',
    carta: 'par',
    contraprova: {
      entrada: 'Agendar a vaga 1 duas vezes, com dois e-mails diferentes',
      esperado: 'Primeiro 201. Segundo 409 {"erro":"Vaga indisponível"}',
      obtido: '200 nas duas. O mentor recebe dois jovens no mesmo horário.',
    },
  },
  {
    id: 'corpo',
    linhas: [40],
    classe: 'assumido',
    aceita: [],
    titulo: 'Ler o corpo sem validar',
    explicacao: 'A IA assumiu que o corpo sempre chega certo. Não há um único if sobre vagaId ou jovemEmail. "Tratar a entrada" não foi pedido porque o pedido não falou de entrada nenhuma.',
    spec: 'T1: 400 na ordem: vagaId ausente, jovemEmail ausente, jovemEmail sem formato a@b.c.',
    carta: 'contrato',
    contraprova: {
      entrada: 'POST /agendamentos com {"vagaId": 1, "jovemEmail": "ana"}',
      esperado: '400 {"erro":"jovemEmail inválido"}',
      obtido: '200 e um agendamento salvo com o e-mail "ana"',
    },
  },
  {
    id: 'status',
    linhas: [44],
    classe: 'assumido',
    aceita: [],
    titulo: 'Status 200 no sucesso',
    explicacao: 'O pedido não disse o status. A IA escolheu o mais comum. Para criação de recurso, o contrato combinado é outro.',
    spec: 'T1: sucesso → 201.',
    carta: 'contrato',
    contraprova: {
      entrada: 'POST /agendamentos válido, vaga livre',
      esperado: '201',
      obtido: '200',
    },
  },
  {
    id: 'catch',
    linhas: [45, 46],
    classe: 'assumido',
    aceita: [],
    titulo: 'Todo erro vira 500 "Erro interno"',
    explicacao: 'A IA assumiu que "tratar o erro" é capturar tudo. Erro de quem chamou (400, 404, 409) vira erro do servidor (500). Quem usa a API não sabe o que corrigir.',
    spec: 'Erros sempre {"erro": "..."} com o status da tabela: 400, 404 ou 409.',
    carta: 'contrato',
    contraprova: {
      entrada: 'POST /agendamentos com {"vagaId": 999, "jovemEmail": "jovem@exemplo.com"}',
      esperado: '404 {"erro":"Vaga não encontrada"}',
      obtido: '500 {"erro":"Erro interno"}',
    },
  },
  {
    id: 'limite',
    linhas: [13, 14, 15],
    classe: 'inventado',
    aceita: [],
    titulo: 'Limite de 3 mentorias por mês',
    explicacao: 'Regra de negócio que ninguém pediu. Parece razoável, e é por isso que passa batido. Sistemas de agenda costumam ter limite, então a IA colocou um.',
    spec: 'Fora do escopo: limite de agendamentos por jovem.',
    carta: 'rastro',
    contraprova: {
      entrada: 'Jovem com 3 agendamentos no mês pede a 4ª vaga, que está livre',
      esperado: '201',
      obtido: '500 {"erro":"Erro interno"} (o throw cai no catch genérico)',
    },
  },
  {
    id: 'dia',
    linhas: [18, 19],
    classe: 'inventado',
    aceita: [],
    titulo: 'Mentoria só em dia útil',
    explicacao: 'Outra regra inventada. Mentores voluntários muitas vezes só podem no sábado. A IA decidiu por eles.',
    spec: 'Fora do escopo: regra de dia da semana.',
    carta: 'contraprova',
    contraprova: {
      entrada: 'Agendar uma vaga livre com inicio "2026-11-14T10:00" (sábado)',
      esperado: '201',
      obtido: '500 {"erro":"Erro interno"}',
    },
  },
  {
    id: 'email',
    linhas: [3, 27],
    classe: 'inventado',
    aceita: [],
    titulo: 'Enviar e-mail de confirmação',
    explicacao: 'Efeito colateral inventado. E pior: o e-mail é enviado depois de salvar. Se o serviço de e-mail cair, a reserva fica salva e a resposta é 500. A pessoa tenta de novo e encontra a própria vaga ocupada.',
    spec: 'Fora do escopo: envio de e-mail. Se parecer necessário, pergunte.',
    carta: 'rastro',
    contraprova: {
      entrada: 'Agendar uma vaga livre com o serviço de e-mail fora do ar',
      esperado: '201 (e-mail não faz parte da task)',
      obtido: '500, com a reserva salva mesmo assim',
    },
  },
  {
    id: 'moment',
    linhas: [2],
    classe: 'inventado',
    aceita: ['assumido'],
    titulo: 'Dependência nova: moment',
    explicacao: 'Uma biblioteca inteira, em modo manutenção, para servir uma regra que ninguém pediu. Se a regra sai, a dependência sai junto. Escolher biblioteca seria "assumido"; trazer uma só para a regra inventada é invenção.',
    spec: 'Nenhuma dependência prevista. Datas no formato YYYY-MM-DDTHH:mm.',
    carta: 'navalha',
    contraprova: {
      entrada: 'npm ls moment e git diff package.json',
      esperado: 'Nenhuma dependência nova sem motivo escrito',
      obtido: 'moment entrou no package.json sem ADR nem explicação',
    },
  },
  {
    id: 'factory',
    linhas: [8, 9, 10, 32, 33, 34],
    classe: 'inventado',
    aceita: ['assumido'],
    titulo: 'AgendamentoService + AgendamentoServiceFactory',
    explicacao: 'Uma classe e uma factory para criar uma única instância. Nenhum teste exige isso. O padrão a seguir (GET /mentores) é uma função. Abstraction bloat: complexidade acidental.',
    spec: 'Padrão a seguir: GET /mentores, uma função simples.',
    carta: 'navalha',
    contraprova: {
      entrada: 'Apagar a classe e a factory e escrever uma função direta na rota',
      esperado: 'Os mesmos testes passam com cerca de 15 linhas a menos',
      obtido: 'Passam. A factory não protegia nada.',
    },
  },
  {
    id: 'log',
    linhas: [41],
    classe: 'inventado',
    aceita: [],
    titulo: 'console.log com o e-mail do jovem',
    explicacao: 'Log com dado pessoal. Ninguém pediu log, e e-mail é dado pessoal pela LGPD. Logs costumam ir para ferramentas de terceiros e ficar lá por meses.',
    spec: 'Nada sobre log. E-mail é dado pessoal.',
    carta: 'carta-rainha',
    contraprova: {
      entrada: 'Agendar e olhar a saída do servidor',
      esperado: 'Nenhum dado pessoal no log',
      obtido: 'Novo agendamento: jovem@exemplo.com',
    },
  },
];

export const SPEC_T1 = {
  titulo: 'T1 · Agendar mentoria: POST /agendamentos',
  corpo: '{"vagaId": number, "jovemEmail": string}',
  tabela: [
    ['vagaId ausente ou não inteiro', '400', '{"erro":"vagaId é obrigatório"}'],
    ['jovemEmail ausente ou vazio', '400', '{"erro":"jovemEmail é obrigatório"}'],
    ['jovemEmail sem formato a@b.c', '400', '{"erro":"jovemEmail inválido"}'],
    ['vaga não existe', '404', '{"erro":"Vaga não encontrada"}'],
    ['vaga não está livre', '409', '{"erro":"Vaga indisponível"}'],
    ['sucesso', '201', 'agendamento com status "confirmado"; vaga passa a livre: false'],
  ],
  extras: [
    'Fonte de dados: ADR-001, repositório em memória em src/repo.js.',
    'NFR-1: duas requisições para a mesma vaga livre ao mesmo tempo → exatamente uma 201, a outra 409.',
    'Fora do escopo: e-mail, autenticação, limite por jovem, regra de dia da semana, notificações.',
  ],
};

export const PADRAO = 'A IA não errou ao acaso. Ela preencheu cada lacuna do pedido com a suposição mais plausível que conhecia: um limite comum em agendas, um e-mail de confirmação, um padrão de projeto popular, o status mais usado. Plausível não é pedido. A defesa é dupla: escrever o destino antes (spec) e, na revisão, perguntar a cada linha "onde está escrito isso?".';

export function achadoDaLinha(numero) {
  return ACHADOS.find((a) => a.linhas.includes(numero)) || null;
}

export function achadoPorId(id) {
  return ACHADOS.find((a) => a.id === id) || null;
}

export function avaliarResposta(id, classe) {
  const achado = achadoPorId(id);
  if (!achado || !CLASSES[classe]) return { nota: 0, correta: null };
  if (achado.classe === classe) return { nota: 1, correta: achado.classe };
  if (achado.aceita.includes(classe)) return { nota: 0.5, correta: achado.classe };
  return { nota: 0, correta: achado.classe };
}

export function responder(respostas, id, classe) {
  if (!achadoPorId(id) || !CLASSES[classe]) return { ...respostas };
  return { ...respostas, [id]: classe };
}

export function placar(respostas) {
  const porClasse = {};
  for (const chave of Object.keys(CLASSES)) porClasse[chave] = { acertos: 0, total: 0 };
  let pontos = 0;
  let respondidas = 0;
  for (const achado of ACHADOS) {
    porClasse[achado.classe].total += 1;
    const escolha = respostas[achado.id];
    if (!escolha) continue;
    respondidas += 1;
    const { nota } = avaliarResposta(achado.id, escolha);
    pontos += nota;
    if (nota === 1) porClasse[achado.classe].acertos += 1;
  }
  return {
    pontos,
    total: ACHADOS.length,
    respondidas,
    completo: respondidas === ACHADOS.length,
    porClasse,
  };
}

export function relatorio(respostas) {
  const p = placar(respostas);
  const linhas = [
    '# Interrogatório do Gato · relatório da dupla',
    '',
    `Pedido: "${PEDIDO}"`,
    `Placar: ${p.pontos}/${p.total} (${p.respondidas} trechos analisados)`,
    '',
    '| Linhas | Trecho | Nossa resposta | Resposta esperada | Contraprova |',
    '|---|---|---|---|---|',
  ];
  for (const a of ACHADOS) {
    const escolha = respostas[a.id] ? CLASSES[respostas[a.id]].nome : '—';
    const faixa = a.linhas.length > 1 ? `${a.linhas[0]}–${a.linhas[a.linhas.length - 1]}` : `${a.linhas[0]}`;
    linhas.push(`| ${faixa} | ${a.titulo} | ${escolha} | ${CLASSES[a.classe].nome} | ${a.contraprova.entrada} → ${a.contraprova.esperado} |`);
  }
  linhas.push('', `Padrão de erro da IA: ${PADRAO}`);
  return linhas.join('\n');
}
