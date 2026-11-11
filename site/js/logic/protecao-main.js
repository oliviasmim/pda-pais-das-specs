// Proteção da main simulada: o workflow pode estar perfeito e o merge sair mesmo assim.
// Sem DOM. O job se chama "gates" (ver a lição Cortem-lhe a cabeça).

export const OPCOES = [
  {
    id: 'rodaEmPR',
    grupo: 'workflow',
    titulo: 'O workflow roda em pull_request',
    ajuda: 'No YAML: on: [pull_request, push]. Sem isso, o job só roda depois que a mudança já entrou na main.',
  },
  {
    id: 'semEngolirFalha',
    grupo: 'workflow',
    titulo: 'Nenhum passo engole a falha',
    ajuda: 'Sem continue-on-error: true e sem "|| true" nos passos.',
  },
  {
    id: 'exigirPR',
    grupo: 'github',
    titulo: 'Exigir pull request antes do merge',
    ajuda: 'Settings, Rules. Sem isso, git push direto na main pula o workflow inteiro.',
  },
  {
    id: 'checkObrigatorio',
    grupo: 'github',
    titulo: 'Exigir que o check "gates" passe',
    ajuda: 'Settings, Rules, "Require status checks to pass". O check só aparece na busca depois de rodar uma vez.',
  },
];

export const PRESETS = {
  comoGerado: {
    nome: 'Como o agente gerou',
    config: { rodaEmPR: false, semEngolirFalha: false, exigirPR: false, checkObrigatorio: false },
  },
  soYaml: {
    nome: 'YAML perfeito, GitHub sem regra',
    config: { rodaEmPR: true, semEngolirFalha: true, exigirPR: false, checkObrigatorio: false },
  },
  completo: {
    nome: 'Tudo ligado',
    config: { rodaEmPR: true, semEngolirFalha: true, exigirPR: true, checkObrigatorio: true },
  },
};

export const CENARIOS = [
  {
    id: 'pr-teste',
    titulo: 'PR com teste de status quebrado',
    via: 'pr',
    defeito: true,
    detalhe: 'O agente trocou o 409 por 201 na regra de vaga ocupada. O teste de aceite fica vermelho.',
  },
  {
    id: 'pr-lint',
    titulo: 'PR com erro de lint',
    via: 'pr',
    defeito: true,
    detalhe: 'Uma vírgula faltando num objeto de resposta.',
  },
  {
    id: 'push-direto',
    titulo: 'Push direto na main, com teste quebrado',
    via: 'push',
    defeito: true,
    detalhe: 'Sem pull request. O agente tinha a credencial e usou.',
  },
  {
    id: 'pr-limpo',
    titulo: 'PR correto',
    via: 'pr',
    defeito: false,
    detalhe: 'Tudo verde de verdade. Um bom gate deixa passar.',
  },
];

export function cenario(id) {
  return CENARIOS.find((c) => c.id === id);
}

export function configDe(chaves = []) {
  return Object.fromEntries(OPCOES.map((o) => [o.id, chaves.includes(o.id)]));
}

// Resultado do check "gates" para este cenário: 'verde', 'vermelho' ou 'nao-rodou'.
function resultadoDoCheck(cfg, c) {
  if (c.via === 'pr' && !cfg.rodaEmPR) return 'nao-rodou';
  if (!c.defeito) return 'verde';
  return cfg.semEngolirFalha ? 'vermelho' : 'verde';
}

export function avaliar(cfg, c) {
  const check = resultadoDoCheck(cfg, c);

  if (c.via === 'push') {
    if (cfg.exigirPR) {
      return { check: 'nao-rodou', merge: 'bloqueado', entrou: false, motivo: 'A regra exige pull request. O push direto foi recusado.' };
    }
    return { check: 'verde', merge: 'liberado', entrou: c.defeito, motivo: 'Push direto não passa por check nenhum. O workflow até roda na main, mas depois que o defeito já entrou.' };
  }

  let merge = 'liberado';
  let motivo;
  if (cfg.checkObrigatorio && check === 'vermelho') {
    merge = 'bloqueado';
    motivo = 'O check "gates" está vermelho e é obrigatório. O botão de merge fica desabilitado.';
  } else if (cfg.checkObrigatorio && check === 'nao-rodou') {
    merge = 'bloqueado';
    motivo = 'O check é obrigatório, mas o workflow não roda em pull_request, então ele nunca aparece. O merge fica esperando para sempre, até o do PR correto.';
  } else if (check === 'vermelho') {
    motivo = 'O check ficou vermelho, mas nada o torna obrigatório. Vermelho virou opinião e o botão continua verde.';
  } else if (check === 'nao-rodou') {
    motivo = 'O workflow não roda em pull_request. Não existe check para olhar, e o merge sai às cegas.';
  } else if (c.defeito) {
    motivo = 'O check ficou verde porque um passo engole a falha (continue-on-error ou || true). O defeito entra com carimbo de aprovado.';
  } else {
    motivo = 'Check verde de verdade. O merge sai, e é certo que saia.';
  }
  return { check, merge, entrou: merge === 'liberado' && c.defeito, motivo };
}

export function placar(cfg) {
  const linhas = CENARIOS.map((c) => ({ cenario: c, ...avaliar(cfg, c) }));
  const defeitosQueEntraram = linhas.filter((l) => l.entrou).length;
  const bloqueioIndevido = linhas.filter((l) => !l.cenario.defeito && l.merge === 'bloqueado').length;
  return { linhas, defeitosQueEntraram, bloqueioIndevido, ok: defeitosQueEntraram === 0 && bloqueioIndevido === 0 };
}

// As três formas de "CI vermelha e merge feito" da lição, mais o push direto.
export function diagnostico(cfg) {
  const d = [];
  if (!cfg.rodaEmPR) d.push('O workflow só roda em push na main: o defeito é descoberto depois do merge.');
  if (!cfg.semEngolirFalha) d.push('Algum passo engole a falha (continue-on-error ou || true): o job fica verde sempre.');
  if (!cfg.checkObrigatorio) d.push('O check não é obrigatório: CI vermelha é só opinião.');
  if (!cfg.exigirPR) d.push('Não exige pull request: git push direto na main pula tudo.');
  return d;
}
