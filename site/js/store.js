const PREFIXO = 'pda-specs:';

function ler(chave, fallback) {
  try {
    const bruto = localStorage.getItem(PREFIXO + chave);
    return bruto === null ? fallback : JSON.parse(bruto);
  } catch {
    return fallback;
  }
}

function gravar(chave, valor) {
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

function apagar(chave) {
  try {
    localStorage.removeItem(PREFIXO + chave);
  } catch {
    /* sem armazenamento: nada a fazer */
  }
}

export const store = { ler, gravar, apagar };

export function estadoDoLab(licaoId, labId) {
  const chave = `lab:${licaoId}:${labId}`;
  return {
    load: (fallback) => ler(chave, fallback),
    save: (valor) => gravar(chave, valor),
    clear: () => apagar(chave),
  };
}

export function progresso() {
  return ler('progresso', { licoes: {} });
}

export function marcarLicao(id, feito = true) {
  const p = progresso();
  p.licoes[id] = { ...(p.licoes[id] || {}), feito, quando: feito ? new Date().toISOString() : null };
  gravar('progresso', p);
}

export function licaoFeita(id) {
  return Boolean(progresso().licoes[id]?.feito);
}

export function registrarQuiz(id, etapa, acertos, total) {
  const p = progresso();
  const atual = p.licoes[id] || {};
  p.licoes[id] = { ...atual, quiz: { ...(atual.quiz || {}), [etapa]: { acertos, total } } };
  gravar('progresso', p);
}

export function preferencia(chave, fallback) {
  return ler(`pref:${chave}`, fallback);
}

export function definirPreferencia(chave, valor) {
  gravar(`pref:${chave}`, valor);
}
