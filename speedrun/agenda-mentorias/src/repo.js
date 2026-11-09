/**
 * Repositório em memória (ADR-001).
 *
 * Simula um banco de dados: toda função é assíncrona e espera LATENCIA_MS
 * antes de ler ou escrever, como uma ida e volta ao banco.
 * Devolve cópias: alterar o objeto devolvido não altera o "banco".
 *
 * Não mude a assinatura das funções exportadas: o avaliador usa `reset`,
 * `repo.buscarVaga` e `repo.buscarAgendamento`.
 */

/** @typedef {{ id: number, nome: string, area: string }} Mentor */
/** @typedef {{ id: number, mentorId: number, inicio: string, livre: boolean }} Vaga */
/** @typedef {'confirmado' | 'cancelado'} StatusAgendamento */
/** @typedef {{ id: number, vagaId: number, mentorId: number, jovemEmail: string, status: StatusAgendamento }} Agendamento */
/** @typedef {{ mentores: Mentor[], vagas: Vaga[], agendamentos: Agendamento[] }} Seed */

export const LATENCIA_MS = 1;

/** @type {Seed} */
export const SEED = {
  mentores: [
    { id: 1, nome: 'Carla Souza', area: 'Back-end' },
    { id: 2, nome: 'Diego Lima', area: 'Dados' },
    { id: 3, nome: 'Aline Ferreira', area: 'Front-end' },
    { id: 4, nome: 'Bruno Tavares', area: 'DevOps' },
  ],
  vagas: [
    { id: 1, mentorId: 1, inicio: '2026-11-16T09:00', livre: true },
    { id: 2, mentorId: 1, inicio: '2026-11-16T10:00', livre: true },
    { id: 3, mentorId: 1, inicio: '2026-11-17T09:00', livre: false },
    { id: 4, mentorId: 1, inicio: '2026-11-18T14:00', livre: true },
    { id: 5, mentorId: 2, inicio: '2026-11-16T09:00', livre: true },
    { id: 6, mentorId: 2, inicio: '2026-11-19T15:00', livre: true },
    { id: 7, mentorId: 3, inicio: '2026-11-17T10:00', livre: false },
    { id: 8, mentorId: 3, inicio: '2026-11-20T11:00', livre: true },
    { id: 9, mentorId: 1, inicio: '2026-11-16T08:00', livre: true },
    { id: 10, mentorId: 2, inicio: '2026-11-21T09:00', livre: true },
  ],
  agendamentos: [
    { id: 1, vagaId: 3, mentorId: 1, jovemEmail: 'jovem1@pda.org', status: 'confirmado' },
    { id: 2, vagaId: 7, mentorId: 3, jovemEmail: 'jovem2@pda.org', status: 'confirmado' },
    { id: 3, vagaId: 10, mentorId: 2, jovemEmail: 'jovem3@pda.org', status: 'cancelado' },
  ],
};

/** @type {Seed} */
let banco = structuredClone(SEED);
let proximoAgendamentoId = 4;

/**
 * Volta o banco ao estado inicial (ou ao seed informado). Use nos testes.
 * @param {Seed} [seed]
 */
export function reset(seed = SEED) {
  banco = structuredClone(seed);
  proximoAgendamentoId = Math.max(0, ...banco.agendamentos.map((a) => a.id)) + 1;
}

function idaAoBanco() {
  return new Promise((resolve) => setTimeout(resolve, LATENCIA_MS));
}

/**
 * @template T
 * @param {T} valor
 * @returns {T}
 */
function copia(valor) {
  return valor === undefined ? valor : structuredClone(valor);
}

export const repo = {
  /** @returns {Promise<Mentor[]>} */
  async listarMentores() {
    await idaAoBanco();
    return copia(banco.mentores);
  },

  /**
   * @param {number} id
   * @returns {Promise<Mentor | undefined>}
   */
  async buscarMentor(id) {
    await idaAoBanco();
    return copia(banco.mentores.find((m) => m.id === id));
  },

  /**
   * Todas as vagas de um mentor (livres e ocupadas), numa única ida ao banco.
   * @param {number} mentorId
   * @returns {Promise<Vaga[]>}
   */
  async listarVagasDoMentor(mentorId) {
    await idaAoBanco();
    return copia(banco.vagas.filter((v) => v.mentorId === mentorId));
  },

  /**
   * @param {number} id
   * @returns {Promise<Vaga | undefined>}
   */
  async buscarVaga(id) {
    await idaAoBanco();
    return copia(banco.vagas.find((v) => v.id === id));
  },

  /**
   * @param {number} id
   * @param {Partial<Omit<Vaga, 'id'>>} campos
   * @returns {Promise<Vaga | undefined>}
   */
  async atualizarVaga(id, campos) {
    await idaAoBanco();
    const vaga = banco.vagas.find((v) => v.id === id);
    if (!vaga) return undefined;
    Object.assign(vaga, campos);
    return copia(vaga);
  },

  /**
   * @param {Omit<Agendamento, 'id'>} dados
   * @returns {Promise<Agendamento>}
   */
  async criarAgendamento(dados) {
    await idaAoBanco();
    const agendamento = { id: proximoAgendamentoId++, ...dados };
    banco.agendamentos.push(agendamento);
    return copia(agendamento);
  },

  /**
   * @param {number} id
   * @returns {Promise<Agendamento | undefined>}
   */
  async buscarAgendamento(id) {
    await idaAoBanco();
    return copia(banco.agendamentos.find((a) => a.id === id));
  },

  /**
   * @param {number} id
   * @param {Partial<Omit<Agendamento, 'id'>>} campos
   * @returns {Promise<Agendamento | undefined>}
   */
  async atualizarAgendamento(id, campos) {
    await idaAoBanco();
    const agendamento = banco.agendamentos.find((a) => a.id === id);
    if (!agendamento) return undefined;
    Object.assign(agendamento, campos);
    return copia(agendamento);
  },
};
