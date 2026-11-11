import { palavrasVagas, temNumero } from './construtor-nfr.js';

export const PADROES_EARS = {
  ubiquo: { nome: 'Ubíquo', gabarito: 'O <sistema> DEVE <resposta>.', quando: 'Vale sempre, sem gatilho.' },
  evento: { nome: 'QUANDO (evento)', gabarito: 'QUANDO <gatilho>, o <sistema> DEVE <resposta>.', quando: 'Reage a algo que acontece.' },
  estado: { nome: 'ENQUANTO (estado)', gabarito: 'ENQUANTO <condição>, o <sistema> DEVE <resposta>.', quando: 'Vale enquanto uma condição se mantém.' },
  opcional: { nome: 'ONDE (opcional)', gabarito: 'ONDE <recurso presente>, o <sistema> DEVE <resposta>.', quando: 'Só vale se o recurso existir.' },
  indesejado: { nome: 'SE…ENTÃO (indesejado)', gabarito: 'SE <problema>, ENTÃO o <sistema> DEVE <resposta>.', quando: 'Diz o que fazer quando algo dá errado.' },
};

const L = '(?<![\\p{L}])';
const R = '(?![\\p{L}])';
const kw = (p, flags = 'iu') => new RegExp(`${L}${p}${R}`, flags);

const limpar = (s = '') => s.trim().replace(/^[,\s]+|[.\s]+$/g, '').trim();
const semArtigo = (s = '') => limpar(s).replace(/^(o|a|os|as)\s+/i, '');

const GENERICOS = /^(sistema|app|aplicação|aplicacao|software|backend|api)$/i;

/**
 * Lê uma frase de requisito, descobre o padrão EARS e aponta o que falta.
 * opcoes.exigeNumero: para requisito não funcional, a resposta precisa de número.
 */
export function analisarEars(frase = '', { exigeNumero = false } = {}) {
  const t = frase.trim().replace(/\s+/g, ' ');
  const avisos = [];
  if (!t) return { padrao: null, partes: {}, avisos: [{ tipo: 'vazio', msg: 'Escreva uma frase para analisar.' }], ok: false };

  let padrao = 'ubiquo';
  let inicio = 0;
  if (/^SE(?![\p{L}])/iu.test(t)) { padrao = 'indesejado'; inicio = 2; }
  else if (/^QUANDO(?![\p{L}])/iu.test(t)) { padrao = 'evento'; inicio = 6; }
  else if (/^ENQUANTO(?![\p{L}])/iu.test(t)) { padrao = 'estado'; inicio = 8; }
  else if (/^ONDE(?![\p{L}])/iu.test(t)) { padrao = 'opcional'; inicio = 4; }

  const todosDeve = [...t.matchAll(new RegExp(`${L}DEVE${R}`, 'giu'))];
  const partes = { gatilho: '', sistema: '', resposta: '' };

  if (!todosDeve.length) {
    avisos.push({ tipo: 'faltando', campo: 'deve', msg: 'Falta o DEVE. É ele que separa quem responde do que responde.' });
    return { padrao, partes, avisos, ok: false };
  }
  if (todosDeve.length > 1) {
    avisos.push({ tipo: 'composto', campo: 'resposta', msg: 'Tem mais de um DEVE. Uma frase, uma resposta: separe em dois requisitos.' });
  }

  const posDeve = todosDeve[0].index;
  const antes = t.slice(0, posDeve);
  partes.resposta = limpar(t.slice(posDeve + 4));

  if (padrao === 'ubiquo') {
    partes.sistema = semArtigo(antes);
  } else if (padrao === 'indesejado') {
    const m = antes.slice(inicio).match(new RegExp(`^(.*?),?\\s*${L}ENTÃO${R}(.*)$`, 'isu'));
    if (!m) {
      avisos.push({ tipo: 'faltando', campo: 'entao', msg: 'O padrão SE precisa do ENTÃO antes do sistema: SE <problema>, ENTÃO o <sistema> DEVE ...' });
      partes.gatilho = limpar(antes.slice(inicio));
    } else {
      partes.gatilho = limpar(m[1]);
      partes.sistema = semArtigo(m[2]);
    }
  } else {
    const resto = antes.slice(inicio);
    const virgula = resto.lastIndexOf(',');
    if (virgula === -1) {
      avisos.push({ tipo: 'faltando', campo: 'virgula', msg: 'Falta a vírgula entre o gatilho e o sistema.' });
      partes.gatilho = limpar(resto);
    } else {
      partes.gatilho = limpar(resto.slice(0, virgula));
      partes.sistema = semArtigo(resto.slice(virgula + 1));
    }
  }

  if (padrao !== 'ubiquo' && !partes.gatilho) {
    avisos.push({ tipo: 'faltando', campo: 'gatilho', msg: `O padrão ${PADROES_EARS[padrao].nome} precisa de ${padrao === 'estado' || padrao === 'opcional' ? 'uma condição' : 'um gatilho'}.` });
  }
  if (!partes.sistema) {
    if (!avisos.some((a) => a.campo === 'virgula' || a.campo === 'entao')) avisos.push({ tipo: 'faltando', campo: 'sistema', msg: 'Falta dizer quem responde, por exemplo "o serviço de agenda".' });
  } else if (GENERICOS.test(partes.sistema)) {
    avisos.push({ tipo: 'vago', campo: 'sistema', msg: `"${partes.sistema}" é genérico. Nomeie quem responde, por exemplo "serviço de agenda".` });
  }
  if (!partes.resposta) {
    avisos.push({ tipo: 'faltando', campo: 'resposta', msg: 'Falta a resposta: o que o sistema DEVE fazer.' });
  } else {
    const vagas = palavrasVagas(partes.resposta);
    if (vagas.length && !temNumero(partes.resposta)) {
      avisos.push({ tipo: 'vago', campo: 'resposta', msg: `"${vagas[0]}" não dá para testar. Troque por um valor que um teste consiga conferir.` });
    } else if (exigeNumero && !temNumero(partes.resposta)) {
      avisos.push({ tipo: 'desejo', campo: 'resposta', msg: 'Requisito não funcional sem número é desejo. Coloque a meta: ms, %, quantidade.' });
    }
  }
  return { padrao, partes, avisos, ok: avisos.length === 0 };
}

export const EXERCICIOS = [
  {
    frase: 'O serviço de agenda DEVE responder os erros no formato {"erro": "<mensagem>"}.',
    padrao: 'ubiquo',
    dica: 'Não tem gatilho nem condição: vale para toda resposta de erro.',
  },
  {
    frase: 'QUANDO o jovem pedir uma vaga que não está livre, o serviço de agenda DEVE responder 409 com {"erro":"Vaga indisponível"}.',
    padrao: 'evento',
    dica: 'Algo acontece (um pedido chega) e o sistema reage.',
  },
  {
    frase: 'ENQUANTO o mentor tiver até 1.000 vagas, o serviço de agenda DEVE responder GET /mentores/:id/vagas com p95 abaixo de 50 ms.',
    padrao: 'estado',
    dica: 'A condição dura no tempo: não é um instante, é uma situação.',
  },
  {
    frase: 'ONDE a consulta trouxer o parâmetro data, o serviço de agenda DEVE listar só as vagas livres daquele dia.',
    padrao: 'opcional',
    dica: 'O parâmetro pode existir ou não. Se não existir, a regra não se aplica.',
  },
  {
    frase: 'SE o jovemEmail não tiver o formato a@b.c, ENTÃO o serviço de agenda DEVE responder 400 com {"erro":"jovemEmail inválido"}.',
    padrao: 'indesejado',
    dica: 'Descreve uma entrada ruim e o que fazer com ela.',
  },
  {
    frase: 'QUANDO duas requisições pedirem a mesma vaga livre ao mesmo tempo, o serviço de agenda DEVE confirmar exatamente uma (201) e recusar a outra (409).',
    padrao: 'evento',
    dica: 'É a NFR-1 do domínio. O gatilho é o par de pedidos simultâneos.',
  },
];

export const COM_DEFEITO = [
  { nome: 'Sem número', frase: 'O sistema DEVE ser rápido.', exigeNumero: true },
  { nome: 'Duas respostas', frase: 'QUANDO a agenda abrir às 9h de segunda, o serviço de agenda DEVE ser escalável e DEVE responder em até 300 ms.', exigeNumero: true },
  { nome: 'Sem vírgula', frase: 'QUANDO duas requisições pedirem a mesma vaga o serviço de agenda DEVE confirmar exatamente uma.', exigeNumero: false },
  { nome: 'Sem DEVE', frase: 'Se o e-mail for inválido, então a API retorna 400.', exigeNumero: false },
];
