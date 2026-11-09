export function h(tag, attrs = {}, ...filhos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v === null || v === undefined) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const f of filhos.flat(Infinity)) {
    if (f === null || f === undefined || f === false) continue;
    el.append(f instanceof Node ? f : document.createTextNode(String(f)));
  }
  return el;
}

let timerToast = null;

export function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = h('div', { id: 'toast', class: 'toast', role: 'status', 'aria-live': 'polite' });
    document.body.append(el);
  }
  el.textContent = msg;
  el.dataset.visivel = '1';
  clearTimeout(timerToast);
  timerToast = setTimeout(() => {
    el.dataset.visivel = '0';
  }, 2200);
}

export async function copy(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    toast('Copiado.');
    return true;
  } catch {
    const area = h('textarea', { style: { position: 'fixed', opacity: '0' } });
    area.value = texto;
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    area.remove();
    toast(ok ? 'Copiado.' : 'Não consegui copiar. Selecione e copie à mão.');
    return ok;
  }
}

export function download(nome, texto, tipo = 'text/plain') {
  const blob = new Blob([texto], { type: `${tipo};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: nome });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(`Baixando ${nome}`);
}

export function slug(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
