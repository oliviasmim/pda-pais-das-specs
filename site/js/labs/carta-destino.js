import { h } from '../ui.js';
import { VAZIA, validarCarta, paraMarkdown } from '../logic/carta-destino.js';

const EXEMPLO = {
  feature: 'O jovem cancela um agendamento confirmado e a vaga volta a ficar livre.',
  ok: { entrada: 'DELETE /agendamentos/7 (agendamento confirmado)', resposta: '200 {"id":7,"status":"cancelado"}' },
  falha: { entrada: 'DELETE /agendamentos/7 de novo', status: '409', mensagem: 'Agendamento já cancelado' },
  nfr: { texto: 'QUANDO o agendamento for cancelado, a vaga DEVE aparecer em GET /mentores/:id/vagas em até 1 s', sensor: 'teste de integração na CI: cancela e lista as vagas em seguida' },
  foraEscopo: 'avisar o mentor por e-mail\nmulta por cancelamento\nprazo mínimo para cancelar',
};

const clonar = (c) => JSON.parse(JSON.stringify(c));

export function mount(el, ctx) {
  const salvo = ctx.state.load(null);
  let carta = salvo && salvo.carta ? { ...clonar(VAZIA), ...salvo.carta } : clonar(VAZIA);
  let tentou = !!(salvo && salvo.tentou);
  const uid = `cd-${ctx.licaoId}`;
  const inputs = {};
  const erroEls = {};

  const ler = (caminho) => caminho.split('.').reduce((o, k) => (o ? o[k] : ''), carta) || '';
  const escrever = (caminho, valor) => {
    const partes = caminho.split('.');
    if (partes.length === 1) carta[partes[0]] = valor;
    else carta[partes[0]] = { ...carta[partes[0]], [partes[1]]: valor };
  };

  function campo(caminho, rotulo, { placeholder = '', linhas = 0, classe = '' } = {}) {
    const id = `${uid}-${caminho.replace('.', '-')}`;
    const erroId = `${id}-erro`;
    const input = linhas
      ? h('textarea', { id, rows: String(linhas), placeholder, 'aria-describedby': erroId })
      : h('input', { id, type: 'text', placeholder, autocomplete: 'off', 'aria-describedby': erroId });
    input.value = ler(caminho);
    input.addEventListener('input', () => {
      escrever(caminho, input.value);
      salvar();
      if (tentou) render();
    });
    inputs[caminho] = input;
    erroEls[caminho] = h('p', { class: 'cd-erro', id: erroId });
    return h('div', { class: `cd-campo ${classe}` }, h('label', { for: id }, rotulo), input, erroEls[caminho]);
  }

  const resultado = h('div', { class: 'cd-resultado', 'aria-live': 'polite' });
  const selo = h('div', { class: 'cd-selo', 'aria-hidden': 'true' }, h('span', {}, 'Aprovada'), h('small', {}, 'pelo Gato'));

  const papel = h('div', { class: 'cd-papel' },
    selo,
    h('p', { class: 'cd-sobrescrito' }, 'Carta de Destino'),
    h('p', { class: 'cd-epigrafe' }, '“Depende bastante de para onde você quer ir.”'),

    h('section', { class: 'cd-bloco' },
      h('h4', {}, h('span', { class: 'cd-naipe' }, '♠'), 'Destino'),
      campo('feature', 'A feature em uma frase', { placeholder: 'O jovem agenda uma mentoria numa vaga livre.' }),
    ),
    h('section', { class: 'cd-bloco' },
      h('h4', {}, h('span', { class: 'cd-naipe cd-naipe--copas' }, '♥'), 'Um caso que deve funcionar'),
      h('div', { class: 'cd-duas' },
        campo('ok.entrada', 'Entrada exata', { placeholder: 'POST /agendamentos {"vagaId":3,"jovemEmail":"bia@pda.org"}' }),
        campo('ok.resposta', 'Resposta exata (status + corpo)', { placeholder: '201 {"id":1,"status":"confirmado"}' }),
      ),
    ),
    h('section', { class: 'cd-bloco' },
      h('h4', {}, h('span', { class: 'cd-naipe' }, '♣'), 'Um caso que deve falhar'),
      h('div', { class: 'cd-tres' },
        campo('falha.entrada', 'Entrada exata', { placeholder: 'a mesma vaga, de novo' }),
        campo('falha.status', 'Status', { placeholder: '409', classe: 'cd-campo--status' }),
        campo('falha.mensagem', 'Mensagem exata', { placeholder: 'Vaga indisponível' }),
      ),
    ),
    h('section', { class: 'cd-bloco' },
      h('h4', {}, h('span', { class: 'cd-naipe cd-naipe--copas' }, '♦'), 'Um requisito não funcional'),
      campo('nfr.texto', 'Requisito, com número', { placeholder: 'QUANDO duas pessoas pedirem a mesma vaga, confirmar exatamente 1', linhas: 2 }),
      campo('nfr.sensor', 'Sensor: que teste mede isso, rodando onde?', { placeholder: 'teste de concorrência com Promise.all na CI' }),
    ),
    h('section', { class: 'cd-bloco' },
      h('h4', {}, h('span', { class: 'cd-naipe' }, '🎩'), 'Fora do escopo'),
      campo('foraEscopo', 'O que a IA não deve criar (uma coisa por linha)', { placeholder: 'envio de e-mail\nlimite de agendamentos por jovem', linhas: 3 }),
    ),
  );

  el.append(
    h('header', { class: 'lab__head' },
      h('span', { class: 'lab__tag' }, 'Laboratório'),
      h('h3', {}, 'Carta de Destino'),
      h('p', {}, 'Escreva o destino da sua próxima feature. O Gato só aprova o que dá para virar teste.'),
    ),
    h('div', { class: 'lab__body' },
      papel,
      h('div', { class: 'row cd-acoes' },
        h('button', { type: 'button', class: 'btn btn--primary', onclick: () => { tentou = true; salvar(); render(true); } }, 'Aplicar o Teste do Gato'),
        h('button', { type: 'button', class: 'btn btn--sm btn--ghost', onclick: carregarExemplo }, 'Carregar um exemplo'),
        h('button', { type: 'button', class: 'btn btn--sm btn--ghost', onclick: limpar }, 'Limpar'),
      ),
      resultado,
    ),
  );

  function salvar() {
    ctx.state.save({ carta, tentou });
  }

  function sincronizar() {
    for (const [caminho, input] of Object.entries(inputs)) input.value = ler(caminho);
  }

  function carregarExemplo() {
    carta = clonar(EXEMPLO);
    sincronizar();
    salvar();
    if (tentou) render();
    ctx.toast('Exemplo da T2 (cancelar) carregado. Leia, clique em Limpar e escreva a sua.');
  }

  function limpar() {
    carta = clonar(VAZIA);
    tentou = false;
    sincronizar();
    salvar();
    render();
  }

  function render(focar = false) {
    for (const p of Object.values(erroEls)) p.textContent = '';
    for (const i of Object.values(inputs)) i.removeAttribute('aria-invalid');
    resultado.replaceChildren();
    papel.classList.remove('is-aprovada');
    if (!tentou) return;

    const v = validarCarta(carta);
    for (const e of v.erros) {
      if (erroEls[e.campo] && !erroEls[e.campo].textContent) {
        erroEls[e.campo].textContent = e.msg;
        inputs[e.campo].setAttribute('aria-invalid', 'true');
      }
    }
    if (v.aprovada) {
      papel.classList.add('is-aprovada');
      const md = paraMarkdown(carta);
      resultado.append(
        h('p', { class: 'cd-ok' }, h('span', { class: 'chip chip--ok' }, 'aprovada'), ' Dá para escrever um teste que falha a partir desta carta. Leve para a spec.'),
        ...v.dicas.map((d) => h('p', { class: 'cd-dica' }, d.msg)),
        h('pre', { class: 'cd-md' }, h('code', {}, md)),
        h('div', { class: 'row' },
          h('button', { type: 'button', class: 'btn btn--sm', onclick: () => ctx.copy(md) }, 'Copiar para docs/spec.md'),
          h('button', { type: 'button', class: 'btn btn--sm', onclick: () => ctx.download('carta-de-destino.md', md) }, 'Baixar .md'),
        ),
      );
    } else {
      resultado.append(
        h('p', { class: 'cd-reprovada' }, h('span', { class: 'chip chip--bad' }, `${v.erros.length} ${v.erros.length === 1 ? 'problema' : 'problemas'}`), ' O Gato ainda não sabe para onde você quer ir. O aviso embaixo de cada campo diz o que falta para virar teste.'),
      );
      if (focar) {
        const primeiro = v.erros.find((e) => inputs[e.campo]);
        if (primeiro) inputs[primeiro.campo].focus();
      }
    }
  }

  render();
}
