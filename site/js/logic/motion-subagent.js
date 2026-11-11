// Máquina FIG_SUB · Por dentro de um subagent.
// A janela do agente principal é o frasco: até 40% é smart zone. Subagents leem muito numa janela
// própria e devolvem pouco. O preço é coordenação: mais tokens no total e mais pontos de integração.

const CAPACIDADE = 200000;
const BASE_PRINCIPAL = 12000;
const BASE_SUB = 4000;
const LIMITE = 0.4;

const TAREFAS = {
  grande: [
    { id: 'T1', nome: 'agendar', rota: 'POST /agendamentos', leitura: 18000, impl: 6000, log: 4000, min: 10 },
    { id: 'T2', nome: 'cancelar', rota: 'DELETE /agendamentos/:id', leitura: 18000, impl: 6000, log: 4000, min: 10 },
    { id: 'T3', nome: 'vagas', rota: 'GET /mentores/:id/vagas', leitura: 18000, impl: 6000, log: 4000, min: 10, defeito: 'ordena a lista dentro do loop: NFR-2 (p95 < 50 ms) reprova com 1.000 vagas' },
  ],
  pequena: [{ id: 'T3', nome: 'mensagem', rota: 'GET /mentores/:id/vagas', leitura: 2000, impl: 1000, log: 0, min: 2, pequena: true }],
};

const RESUMO = 1500;
const RESUMO_GORDO = 24000;
const PROMPT_SUB = 500;

export const motion = {
  id: 'motion-subagent',
  fig: 'FIG_SUB',
  titulo: 'Por dentro de um subagent',
  lead: 'Subagent nada mais é do que o Claude escrevendo um prompt e passando para outro Claude, numa janela limpa. Veja o frasco da janela principal encher (ou não).',
  dica: 'Troque o padrão. Encolha a tarefa. Quebre o prompt que vai para o subagent.',
  ideia:
    'O subagent lê muito numa janela própria e devolve pouco. A janela principal fica na smart zone. Em troca, você paga mais tokens no total e ganha pontos de integração. Só vale quando a leitura é grande e a resposta é curta.',
  pronto: 'Aperte Rodar. O frasco na frente do agente principal é a janela de contexto. A linha tracejada marca 40%.',
  razaoIntro: 'O que voltou para a janela principal, o que ficou no subagent e quanto custou a coordenação.',
  nota:
    'Isto é uma simulação. Os tokens e minutos são ordem de grandeza de sessões reais do Claude Code no projeto do speedrun, arredondados para a conta ficar visível. A smart zone de 40% é a régua usada na S2, não um limite exato do modelo.',
  estacoes: [
    {
      id: 'voce',
      rotulo: 'Você',
      tipo: 'humano',
      x: 0,
      y: 0,
      w: 1.8,
      d: 1.8,
      h: 0.8,
      camadas: ['pedido'],
      oQueE: 'Quem decide o destino e o padrão. Nenhum padrão de orquestração escolhe por você se a tarefa precisa dele.',
    },
    {
      id: 'principal',
      rotulo: 'Agente principal',
      tipo: 'modelo',
      x: 3.4,
      y: 0,
      w: 2.4,
      d: 2.4,
      h: 2.2,
      medidor: { limite: LIMITE },
      camadas: ['conversa com você', 'plano'],
      oQueE: 'A sessão em que você está conversando. A face da frente é o frasco: a altura do líquido é a fração da janela de contexto ocupada. Acima da linha tracejada (40%), o agente começa a esquecer o começo da conversa.',
      nomeComercial: 'main agent, orquestrador',
    },
    {
      id: 'sub1',
      etiqueta: 1.4,
      rotulo: 'Sub T1',
      tipo: 'sub',
      x: 8.4,
      y: -3.8,
      w: 2,
      d: 2,
      h: 1.2,
      camadas: ['prompt recebido', 'janela própria'],
      oQueE: 'Uma janela de contexto nova, com prompt de sistema próprio. Não vê a sua conversa: recebe só o prompt que o principal escreveu.',
      nomeComercial: 'subagent, Task tool',
      arquivo: {
        nome: '.claude/agents/implementador.md',
        texto: '---\nname: implementador\ndescription: Implementa UMA task de docs/tasks/ e devolve um resumo curto. Use para tasks independentes.\ntools: Read, Edit, Bash\nisolation: worktree\n---\nImplemente só a task recebida. Rode npm run gates.\nDevolva: arquivos alterados, testes rodados, dúvidas.\nMáximo de 200 palavras.',
      },
    },
    { id: 'sub2', etiqueta: 1.4, rotulo: 'Sub T2', tipo: 'sub', x: 8.4, y: 0, w: 2, d: 2, h: 1.2, camadas: ['prompt recebido', 'janela própria'], oQueE: 'Outro subagent, com outra janela limpa. Ele também não vê o que o Sub T1 está fazendo.' },
    { id: 'sub3', etiqueta: 1.4, rotulo: 'Sub T3', tipo: 'sub', x: 8.4, y: 3.8, w: 2, d: 2, h: 1.2, camadas: ['prompt recebido', 'janela própria'], oQueE: 'Terceiro subagent. Em paralelo, os três rodam ao mesmo tempo, cada um na sua xícara (worktree).' },
    {
      id: 'integra',
      rotulo: 'Integração',
      tipo: 'ferramenta',
      x: 13.2,
      y: 0,
      w: 2,
      d: 2,
      h: 0.9,
      camadas: ['git merge'],
      oQueE: 'Onde os pedaços viram um só. Todo padrão com mais de um agente paga aqui: conflitos, ordem de merge, testes de novo.',
      nomeComercial: 'merge, integração',
    },
    {
      id: 'gates',
      rotulo: 'Gates',
      tipo: 'sensor',
      x: 16.6,
      y: 0,
      w: 2,
      d: 2,
      h: 1.1,
      camadas: ['testes', 'NFR-2'],
      oQueE: 'npm run gates: lint, tipos, smoke, testes e o teste do NFR-2. O supervisor usa estes mesmos gates para conferir cada entrega antes de integrar.',
    },
    { id: 'pr', rotulo: 'PR', tipo: 'saida', x: 20, y: 0, w: 2, d: 2, h: 0.8, camadas: ['diff'], oQueE: 'O que chega para você revisar.' },
  ],
  trilhos: [
    ['voce', 'principal'],
    ['principal', 'sub1'],
    ['principal', 'sub2'],
    ['principal', 'sub3'],
    ['sub1', 'integra'],
    ['sub2', 'integra'],
    ['sub3', 'integra'],
    ['integra', 'gates'],
    ['gates', 'pr'],
    ['principal', 'gates', { desvio: 3.4 }],
  ],
  montagem: [
    {
      id: 'padrao',
      rotulo: 'Padrão',
      padrao: 'unico',
      opcoes: [
        { valor: 'unico', rotulo: 'agente único' },
        { valor: 'sequencial', rotulo: 'sequencial' },
        { valor: 'paralelo', rotulo: 'paralelo' },
        { valor: 'supervisor', rotulo: 'supervisor' },
      ],
    },
    {
      id: 'tarefa',
      rotulo: 'Tarefa',
      opcoes: [
        { valor: 'grande', rotulo: 'T1 + T2 + T3' },
        { valor: 'pequena', rotulo: 'trocar uma mensagem' },
      ],
    },
    {
      id: 'dependencia',
      rotulo: 'Dependência',
      opcoes: [
        { valor: 'independentes', rotulo: 'independentes' },
        { valor: 'dependentes', rotulo: 'T2 depende da T1' },
      ],
    },
  ],
  avarias: [
    { id: 'prompt-vago', estacao: 'principal', rotulo: 'Prompt vago para o sub', descricao: 'O principal escreve só "Faça a T2." O subagent não sabe da spec nem do formato do resumo.' },
    { id: 'resumo-gordo', estacao: 'sub2', rotulo: 'Resumo gordo', descricao: 'Os subagents devolvem o log inteiro em vez de um resumo curto. O isolamento some.' },
    { id: 'sem-gates', estacao: 'gates', rotulo: 'Sem gates', descricao: 'Ninguém roda npm run gates. O supervisor passa a conferir no olho.' },
  ],
  quebraPadrao: 'prompt-vago',
  legenda: [
    { tipo: 'volta', rotulo: 'Voltou para o principal', cor: 'tinta', descricao: 'entrou na janela principal' },
    { tipo: 'fica', rotulo: 'Ficou no subagent', cor: 'folha', descricao: 'foi lido e sumiu com a janela do sub' },
    { tipo: 'custo', rotulo: 'Custo de coordenação', cor: 'ouro', descricao: 'tokens e minutos que só existem porque há mais de um agente' },
    { tipo: 'risco', rotulo: 'Retrabalho ou defeito', cor: 'copas', descricao: 'o que deu errado e quanto custou' },
  ],
  metricas: [
    { id: 'pico', rotulo: 'Janela principal (pico)' },
    { id: 'tokens', rotulo: 'Tokens gastos' },
    { id: 'tempo', rotulo: 'Tempo de parede' },
    { id: 'conflitos', rotulo: 'Conflitos' },
    { id: 'retrabalho', rotulo: 'Retrabalho' },
    { id: 'defeitos', rotulo: 'Defeitos no PR' },
  ],
  licoes: [
    { titulo: 'O problema é a janela, não a inteligência.', texto: 'No agente único, a T3 começa com a janela em 34% e termina acima de 40%. O mesmo modelo, com a janela limpa, faz a T3 sem repetir o erro.' },
    { titulo: 'Isolamento só vale se o que volta é curto.', texto: 'Quebre o resumo: o subagent devolve o log inteiro e a janela principal enche quase como no agente único. O formato da resposta é parte do prompt.' },
    { titulo: 'Paralelo sem independência é retrabalho.', texto: 'Com a T2 dependendo da T1, o paralelo entrega uma T2 escrita sem a função da T1. O supervisor resolve porque olha a dependência antes de despachar.' },
    { titulo: 'Tarefa pequena não precisa de orquestra.', texto: 'Para trocar uma mensagem, qualquer padrão com subagent gasta mais tokens e mais minutos que o agente único. Recusar o padrão avançado aqui é julgamento.' },
  ],
  desafios: [
    {
      pergunta: 'Agente único com T1 + T2 + T3. Em qual tarefa a janela principal passa de 40%?',
      opcoes: ['T1', 'T2', 'T3', 'Nunca passa'],
      correta: 2,
      explicacao: 'Começa em 6% (sistema, ferramentas, AGENTS.md). Cada task soma uns 28 mil tokens de leitura, código e log. Depois da T2 está em 34%; a T3 empurra para 48%.',
      montagem: { padrao: 'unico', tarefa: 'grande', dependencia: 'independentes' },
    },
    {
      pergunta: 'Tarefa pequena (trocar uma mensagem). Qual padrão gasta menos tokens e termina antes?',
      opcoes: ['Agente único', 'Sequencial', 'Paralelo', 'Supervisor'],
      correta: 0,
      explicacao: 'O subagent precisa da própria base (prompt de sistema e ferramentas) e de um prompt escrito pelo principal. Para 3 mil tokens de trabalho, isso é mais caro que o trabalho.',
      montagem: { padrao: 'paralelo', tarefa: 'pequena', dependencia: 'independentes' },
    },
    {
      pergunta: 'A T2 depende da T1. Qual padrão quebra?',
      opcoes: ['Agente único', 'Sequencial', 'Paralelo', 'Supervisor'],
      correta: 2,
      explicacao: 'No paralelo, o Sub T2 começa sem o código da T1. Ele adivinha a forma do agendamento e a integração reprova. O supervisor ordena: T1 primeiro, depois T2 e T3.',
      montagem: { padrao: 'paralelo', tarefa: 'grande', dependencia: 'dependentes' },
    },
    {
      pergunta: 'Sequencial, mas os subagents devolvem o log inteiro. O que acontece com a janela principal?',
      opcoes: ['Nada, o subagent isola tudo', 'Enche e passa de 40%, como no agente único', 'Esvazia', 'O subagent recusa'],
      correta: 1,
      explicacao: 'O isolamento é só sobre o que fica lá dentro. O que o subagent devolve entra inteiro na janela principal. Peça no prompt: "máximo de 200 palavras".',
      montagem: { padrao: 'sequencial', tarefa: 'grande', dependencia: 'independentes' },
      avarias: ['resumo-gordo'],
    },
  ],
  simular,
};

const kt = (n) => `${Math.round(n / 100) / 10}k`.replace('.0k', 'k');
const pct = (n) => `${Math.round((n / CAPACIDADE) * 100)}%`;

export function simular(montagem, avarias = new Set()) {
  const padrao = montagem.padrao;
  const tarefas = TAREFAS[montagem.tarefa] || TAREFAS.grande;
  const dependentes = montagem.dependencia === 'dependentes' && tarefas.length > 1;
  const usaSub = padrao !== 'unico';
  const promptVago = usaSub && avarias.has('prompt-vago');
  const gordo = usaSub && avarias.has('resumo-gordo');
  const temGates = !avarias.has('sem-gates');
  const subs = ['sub1', 'sub2', 'sub3'].slice(0, tarefas.length);

  let janela = BASE_PRINCIPAL;
  let pico = janela;
  let tokens = BASE_PRINCIPAL;
  let tempo = 0;
  let conflitos = 0;
  let retrabalho = 0;
  let defeitos = 0;
  const passos = [];
  const nivel = () => ({ principal: janela / CAPACIDADE });
  const metr = () => ({
    pico: pct(pico),
    'pico:tom': pico / CAPACIDADE >= LIMITE ? 'falha' : pico / CAPACIDADE >= LIMITE * 0.75 ? 'alerta' : 'ok',
    tokens: kt(tokens),
    tempo: `${tempo} min`,
    conflitos,
    retrabalho,
    'retrabalho:tom': retrabalho ? 'alerta' : 'ok',
    defeitos,
    'defeitos:tom': defeitos ? 'falha' : 'ok',
  });
  const somarJanela = (n) => {
    janela += n;
    tokens += n;
    pico = Math.max(pico, janela);
  };

  const desligadas = [];
  if (!usaSub) desligadas.push('sub1', 'sub2', 'sub3', 'integra');
  else for (const s of ['sub1', 'sub2', 'sub3']) if (!subs.includes(s)) desligadas.push(s);
  if (usaSub && padrao === 'sequencial') desligadas.push('integra');
  if (!temGates) desligadas.push('gates');

  const pedido = tarefas.length > 1 ? 'Implemente T1, T2 e T3 de docs/tasks/.' : 'Troque a mensagem de 404 de GET /mentores/:id/vagas para a da spec.';
  passos.push({
    estacao: 'voce',
    titulo: 'Você pede',
    narracao: tarefas.length > 1 ? 'Você pede três tasks da agenda de mentorias. Cada uma exige ler a spec, o código e os testes.' : 'Você pede uma troca pequena: uma mensagem de erro numa rota.',
    dentro: { titulo: 'pedido', linhas: [`"${pedido}"`] },
    niveis: nivel(),
    metricas: metr(),
    rastro: `pedido: "${pedido}" · padrão: ${padrao}`,
  });

  const plano =
    padrao === 'supervisor' && dependentes
      ? 'Plano: T1 primeiro. Depois T2 e T3 em paralelo. Conferir cada entrega com npm run gates.'
      : padrao === 'supervisor'
        ? 'Plano: T1, T2 e T3 em paralelo. Conferir cada entrega com npm run gates antes de integrar.'
        : padrao === 'paralelo'
          ? `Plano: ${tarefas.length > 1 ? 'três subagents ao mesmo tempo, um worktree para cada' : 'um subagent num worktree'}.`
          : padrao === 'sequencial'
            ? `Plano: ${tarefas.length > 1 ? 'um subagent por task, uma depois da outra' : 'um subagent para a task'}.`
            : 'Plano: fazer tudo nesta mesma sessão.';
  somarJanela(800);
  if (padrao === 'supervisor') tokens += 6000;
  passos.push({
    estacao: 'principal',
    titulo: 'Planeja',
    narracao: `O agente principal começa com ${pct(BASE_PRINCIPAL)} da janela ocupada por sistema, ferramentas e AGENTS.md. ${plano}`,
    dentro: { titulo: 'plano', linhas: [plano] },
    niveis: nivel(),
    metricas: metr(),
    razao: padrao === 'supervisor' ? [{ tipo: 'custo', texto: 'Supervisor: +6k tokens para planejar e acompanhar as entregas.' }] : [],
    rastro: plano,
  });

  const promptDe = (t) =>
    promptVago
      ? [`"Faça a ${t.id}."`]
      : [`"Implemente ${t.id} (${t.rota}) conforme docs/spec.md.`, 'Siga a tabela de erros exata. Rode npm run gates.', 'Devolva: arquivos, testes, dúvidas. Máx. 200 palavras."'];
  const resumoDe = (t) => (gordo ? RESUMO_GORDO : t.pequena ? 300 : RESUMO);

  /* ----- agente único ----- */
  if (!usaSub) {
    tarefas.forEach((t, k) => {
      const antes = janela;
      somarJanela(t.leitura + t.impl + t.log);
      tempo += t.min;
      const passou = antes / CAPACIDADE < LIMITE && janela / CAPACIDADE >= LIMITE;
      const dentroBurra = janela / CAPACIDADE >= LIMITE;
      const repetiu = dentroBurra && k > 0;
      if (repetiu) {
        retrabalho += 1;
        tempo += 6;
      }
      passos.push({
        estacao: 'principal',
        titulo: `Faz ${t.id}${repetiu ? ' (dumb zone)' : ''}`,
        marca: repetiu ? 'falha' : dentroBurra ? 'alerta' : 'visto',
        narracao: repetiu
          ? `A ${t.id} empurra a janela para ${pct(janela)}. ${passou ? 'Passou da linha de 40%.' : ''} O agente volta a responder "Vaga ocupada", erro que ele mesmo tinha corrigido na T1. Mais 6 minutos para perceber e consertar.`
          : `O agente lê ${kt(t.leitura)} de código e spec, escreve, roda os testes. Tudo fica na mesma janela: ${pct(antes)} → ${pct(janela)}.`,
        dentro: { titulo: `janela depois da ${t.id}`, linhas: [`leitura ${kt(t.leitura)} · código ${kt(t.impl)} · log ${kt(t.log)}`, `janela: ${pct(janela)} de 200k`], tom: repetiu ? 'falha' : '' },
        niveis: nivel(),
        metricas: metr(),
        razao: [{ tipo: 'volta', texto: `${t.id}: ${kt(t.leitura + t.impl + t.log)} entraram na janela principal e ficaram.` }, ...(repetiu ? [{ tipo: 'risco', texto: `${t.id}: dumb zone. Repetiu um erro já corrigido (+6 min).` }] : [])],
        rastro: `${t.id} na sessão principal: janela ${pct(janela)}${repetiu ? ' · repetiu erro corrigido' : ''}`,
      });
    });
  }

  /* ----- com subagents ----- */
  const executarSub = (t, k, { semBase = false } = {}) => {
    const custoSub = BASE_SUB + t.leitura + t.impl + t.log;
    tokens += custoSub;
    const assumiu = promptVago;
    return {
      custoSub,
      razao: [
        { tipo: 'fica', texto: `${t.id}: ${kt(t.leitura + t.log)} de leitura e log ficaram na janela do ${motion.estacoes.find((e) => e.id === subs[k]).rotulo}.` },
        ...(semBase ? [] : [{ tipo: 'custo', texto: `${t.id}: +${kt(BASE_SUB)} de base do subagent e +${kt(PROMPT_SUB)} de prompt.` }]),
        ...(assumiu ? [{ tipo: 'risco', texto: `${t.id}: prompt vago, o sub assumiu mensagens de erro que não estão na spec.` }] : []),
      ],
    };
  };

  const devolver = (t, k) => {
    const r = resumoDe(t);
    somarJanela(r);
    return { tipo: 'volta', texto: `${t.id}: resumo de ${kt(r)} voltou para o principal${gordo ? ' (log inteiro)' : ''}.` };
  };

  const corrigirDefeito = (t, k, onde) => {
    // a T3 grande tem um defeito de desempenho; prompt vago gera mensagens assumidas
    const problemas = [];
    if (t.defeito) problemas.push(t.defeito);
    if (promptVago) problemas.push('mensagens de erro fora da spec');
    return problemas;
  };

  if (padrao === 'sequencial') {
    tarefas.forEach((t, k) => {
      somarJanela(PROMPT_SUB);
      passos.push({
        estacao: 'principal',
        titulo: `Prompt para ${t.id}`,
        marca: promptVago ? 'alerta' : 'visto',
        narracao: promptVago
          ? `Perceba o que o principal escreveu para o subagent: quatro palavras. É tudo o que o Sub ${t.id} vai saber.`
          : `Perceba: o subagent não vê a conversa. O principal escreve um prompt novo, com a spec, o comando de verificação e o formato do resumo.`,
        dentro: { titulo: `prompt para o Sub ${t.id}`, linhas: promptDe(t), tom: promptVago ? 'alerta' : '' },
        niveis: nivel(),
        metricas: metr(),
        rastro: `principal → Sub ${t.id}: ${promptDe(t).join(' ')}`,
      });
      const ex = executarSub(t, k);
      tempo += t.min + 1;
      passos.push({
        estacao: subs[k],
        titulo: `Sub ${t.id} trabalha`,
        narracao: `O Sub ${t.id} abre uma janela própria e lê ${kt(t.leitura)}. Nada disso entra na janela principal.`,
        dentro: { titulo: `janela do Sub ${t.id}`, linhas: [`base ${kt(BASE_SUB)} · leitura ${kt(t.leitura)} · código ${kt(t.impl)} · log ${kt(t.log)}`] },
        niveis: nivel(),
        metricas: metr(),
        razao: ex.razao,
        rastro: `Sub ${t.id}: ${kt(ex.custoSub)} na janela própria`,
      });
      const rz = devolver(t, k);
      passos.push({
        estacao: 'principal',
        titulo: `Resumo ${t.id} volta`,
        marca: janela / CAPACIDADE >= LIMITE ? 'falha' : gordo ? 'alerta' : 'visto',
        trilhos: [['principal', subs[k]]],
        narracao: gordo
          ? `O Sub ${t.id} devolve ${kt(RESUMO_GORDO)} de log. Tudo entra na janela principal: ${pct(janela)}.`
          : `Só o resumo volta: ${kt(resumoDe(t))}. A janela principal fica em ${pct(janela)}.`,
        dentro: { titulo: 'o que voltou', linhas: gordo ? ['(log completo dos testes e arquivos lidos)'] : [`${t.id}: src/rotas/${t.nome}.js alterado, 6 testes verdes, 0 dúvidas.`] },
        niveis: nivel(),
        metricas: metr(),
        razao: [rz],
        rastro: `Sub ${t.id} → principal: ${kt(resumoDe(t))}`,
      });
    });
    if (janela / CAPACIDADE >= LIMITE) {
      retrabalho += 1;
      tempo += 6;
      passos.push({
        estacao: 'principal',
        titulo: 'Dumb zone',
        marca: 'falha',
        narracao: `Com a janela em ${pct(janela)}, o principal perde o fio e manda o Sub T3 refazer o que já estava pronto. O isolamento existia, mas o que voltou era grande demais.`,
        niveis: nivel(),
        metricas: metr(),
        razao: [{ tipo: 'risco', texto: 'Janela principal acima de 40%: retrabalho de 6 min.' }],
        rastro: 'principal em dumb zone: retrabalho',
      });
    }
  }

  if (padrao === 'paralelo' || padrao === 'supervisor') {
    const ordemSup = padrao === 'supervisor' && dependentes;
    const lotes = ordemSup ? [[0], tarefas.slice(1).map((_, i) => i + 1)] : [tarefas.map((_, i) => i)];
    lotes.forEach((lote, li) => {
      somarJanela(PROMPT_SUB * lote.length);
      passos.push({
        estacao: 'principal',
        titulo: lotes.length > 1 ? `Despacha lote ${li + 1}` : 'Despacha',
        marca: promptVago ? 'alerta' : 'visto',
        narracao:
          lotes.length > 1 && li === 0
            ? 'O supervisor olha a dependência antes de despachar: a T2 precisa da função criar() da T1. Então a T1 vai sozinha primeiro.'
            : `O principal escreve ${lote.length === 1 ? 'um prompt' : `${lote.length} prompts`} e ${lote.length === 1 ? 'despacha' : 'despacha todos de uma vez'}. ${padrao === 'paralelo' || padrao === 'supervisor' ? 'Cada subagent num worktree próprio.' : ''}`,
        dentro: { titulo: 'prompts', linhas: lote.flatMap((k) => [`Sub ${tarefas[k].id}: ${promptDe(tarefas[k]).join(' ')}`]), tom: promptVago ? 'alerta' : '' },
        niveis: nivel(),
        metricas: metr(),
        rastro: `despacha: ${lote.map((k) => tarefas[k].id).join(', ')}`,
      });
      const razoes = [];
      lote.forEach((k) => razoes.push(...executarSub(tarefas[k], k).razao));
      tempo += Math.max(...lote.map((k) => tarefas[k].min)) + 1;
      const ativos = lote.map((k) => subs[k]);
      passos.push({
        estacao: ativos[0],
        ativos,
        pacotes: ativos,
        trilhos: ativos.map((s) => ['principal', s]),
        titulo: lote.length > 1 ? 'Subs ao mesmo tempo' : `Sub ${tarefas[lote[0]].id} trabalha`,
        narracao:
          lote.length > 1
            ? `${lote.length} subagents trabalham ao mesmo tempo, cada um na sua janela e na sua pasta. O tempo de parede é o da tarefa mais lenta.${dependentes && !ordemSup && padrao === 'paralelo' ? ' O Sub T2 não tem o código da T1. Ele adivinha a forma do agendamento.' : ''}`
            : `O Sub ${tarefas[lote[0]].id} trabalha sozinho, numa janela limpa.`,
        dentro: { titulo: 'janelas dos subs', linhas: lote.map((k) => `Sub ${tarefas[k].id}: ${kt(BASE_SUB + tarefas[k].leitura + tarefas[k].impl + tarefas[k].log)}`) },
        niveis: nivel(),
        metricas: metr(),
        razao: [...razoes, ...(lote.length > 1 ? [{ tipo: 'custo', texto: `${lote.length} worktrees: +1 min de preparação.` }] : [])],
        rastro: `subs: ${lote.map((k) => tarefas[k].id).join(' ∥ ')}`,
      });
      const voltas = lote.map((k) => devolver(tarefas[k], k));
      passos.push({
        estacao: 'principal',
        titulo: 'Resumos voltam',
        trilhos: ativos.map((s) => ['principal', s]),
        marca: janela / CAPACIDADE >= LIMITE ? 'falha' : gordo ? 'alerta' : 'visto',
        narracao: gordo ? `Voltam ${lote.length} logs inteiros. A janela principal vai a ${pct(janela)}.` : `Voltam ${lote.length === 1 ? 'um resumo' : `${lote.length} resumos`} curtos. A janela principal está em ${pct(janela)}.`,
        dentro: { titulo: 'o que voltou', linhas: lote.map((k) => (gordo ? `${tarefas[k].id}: log completo (${kt(RESUMO_GORDO)})` : `${tarefas[k].id}: arquivos, testes, dúvidas (${kt(resumoDe(tarefas[k]))})`)) },
        niveis: nivel(),
        metricas: metr(),
        razao: voltas,
        rastro: `resumos: ${lote.map((k) => tarefas[k].id).join(', ')} · janela ${pct(janela)}`,
      });

      if (padrao === 'supervisor') {
        const reprovadas = lote.filter((k) => corrigirDefeito(tarefas[k], k).length);
        tempo += 1;
        if (temGates && reprovadas.length) {
          retrabalho += reprovadas.length;
          tempo += 6;
          reprovadas.forEach((k) => (tokens += 8000));
          passos.push({
            estacao: 'gates',
            ativos: ['principal'],
            titulo: 'Supervisor confere',
            marca: 'alerta',
            narracao: `O supervisor roda npm run gates em cada entrega antes de integrar. ${reprovadas.map((k) => `${tarefas[k].id} reprova (${corrigirDefeito(tarefas[k], k).join('; ')})`).join('. ')}. Ele devolve a saída do teste para o sub refazer.`,
            dentro: { titulo: 'npm run gates (por entrega)', linhas: lote.map((k) => (reprovadas.includes(k) ? `✗ ${tarefas[k].id}: ${corrigirDefeito(tarefas[k], k)[0]}` : `✓ ${tarefas[k].id}`)), tom: 'alerta' },
            niveis: nivel(),
            metricas: metr(),
            razao: reprovadas.map((k) => ({ tipo: 'risco', texto: `${tarefas[k].id} reprovou no gate antes da integração. Refeita no sub (+8k, +6 min).` })),
            rastro: `supervisor: gates por entrega, ${reprovadas.length} refeita(s)`,
          });
        } else if (!temGates) {
          passos.push({
            estacao: 'principal',
            titulo: 'Supervisor no olho',
            marca: 'alerta',
            narracao: 'Sem gates, o supervisor lê os resumos e aprova. Supervisor sem sensor é palpite: ele confia no que o sub disse sobre o próprio trabalho.',
            niveis: nivel(),
            metricas: metr(),
            rastro: 'supervisor sem gates: aprovou pelos resumos',
          });
        } else {
          passos.push({
            estacao: 'gates',
            ativos: ['principal'],
            titulo: 'Supervisor confere',
            marca: 'ok',
            narracao: 'O supervisor roda npm run gates em cada entrega. Todas passam.',
            dentro: { titulo: 'npm run gates (por entrega)', linhas: lote.map((k) => `✓ ${tarefas[k].id}`), tom: 'ok' },
            niveis: nivel(),
            metricas: metr(),
            rastro: 'supervisor: gates por entrega, todas verdes',
          });
        }
      }
    });

    // integração
    if (tarefas.length > 1) {
      conflitos = 1;
      tempo += 4;
      const quebrouDep = dependentes && padrao === 'paralelo';
      if (quebrouDep) {
        retrabalho += 1;
        tempo += 14;
        tokens += BASE_SUB + 28000;
      }
      passos.push({
        estacao: 'integra',
        pacotes: ['integra'],
        trilhos: subs.map((s) => [s, 'integra']),
        titulo: quebrouDep ? 'Integração quebra' : 'Integra',
        marca: quebrouDep ? 'falha' : 'alerta',
        narracao: quebrouDep
          ? 'Os três ramos chegam juntos. A T2 foi escrita sem a função criar() da T1 e inventou outra forma de agendamento. Os testes da T2 reprovam. O Sub T2 refaz tudo e a integração roda de novo: mais 14 minutos.'
          : 'Os ramos chegam. Um conflito em src/app.js: as três tasks registram rota no mesmo lugar. A resposta certa é manter as linhas de todas.',
        dentro: { titulo: 'git merge', linhas: quebrouDep ? ['✗ T2: criar is not a function', 'Sub T2 refaz com o código da T1'] : ['<<<<<<< HEAD', "app.post('/agendamentos', agendar)", '=======', "app.delete('/agendamentos/:id', cancelar)", '>>>>>>> t2-cancelar'], tom: quebrouDep ? 'falha' : 'alerta' },
        niveis: nivel(),
        metricas: metr(),
        razao: [{ tipo: 'custo', texto: 'Integração: 1 conflito em src/app.js (+4 min).' }, ...(quebrouDep ? [{ tipo: 'risco', texto: 'Paralelo com dependência: T2 refeita do zero e integrada de novo (+14 min, +32k).' }] : [])],
        rastro: `integração: 1 conflito${quebrouDep ? ' · T2 refeita' : ''}`,
      });
    }
  }

  // gates finais
  const pendentes = [];
  for (const t of tarefas) {
    if (t.defeito && !(padrao === 'supervisor' && temGates)) pendentes.push(t.defeito);
    if (promptVago && !(padrao === 'supervisor' && temGates)) pendentes.push(`${t.id}: mensagens de erro fora da spec`);
  }
  if (temGates) {
    if (pendentes.length) {
      retrabalho += 1;
      tempo += 6;
      tokens += 8000 * Math.min(pendentes.length, 3);
    }
    passos.push({
      estacao: 'gates',
      pacotes: ['gates'],
      trilhos: usaSub ? (padrao === 'sequencial' ? [['principal', 'gates']] : [['integra', 'gates']]) : [['principal', 'gates']],
      titulo: pendentes.length ? 'Gates reprovam' : 'Gates',
      marca: pendentes.length ? 'falha' : 'ok',
      narracao: pendentes.length
        ? `npm run gates no fim reprova: ${pendentes.join('; ')}. Achar depois da integração custa mais uma rodada inteira.`
        : 'npm run gates passa: lint, tipos, smoke, testes e NFR-2.',
      dentro: { titulo: 'npm run gates', linhas: pendentes.length ? pendentes.map((p) => `✗ ${p}`) : ['✓ lint · tipos · smoke · testes · NFR-2'], tom: pendentes.length ? 'falha' : 'ok' },
      niveis: nivel(),
      metricas: metr(),
      razao: pendentes.length ? [{ tipo: 'risco', texto: `Gates do fim reprovaram ${pendentes.length} item(ns). Uma rodada de correção (+6 min).` }] : [],
      rastro: `gates: ${pendentes.length ? `${pendentes.length} falhas, corrigidas` : 'verde'}`,
    });
  } else {
    defeitos = pendentes.length;
  }

  passos.push({
    estacao: 'pr',
    pacotes: ['pr'],
    trilhos: temGates ? [['gates', 'pr']] : [],
    titulo: 'PR',
    marca: defeitos ? 'falha' : 'ok',
    narracao: defeitos
      ? `O PR chega com ${defeitos} ${defeitos === 1 ? 'defeito' : 'defeitos'} que nenhum sensor viu.`
      : `PR pronto. Janela principal no pico: ${pct(pico)}. ${kt(tokens)} tokens e ${tempo} minutos.`,
    niveis: nivel(),
    metricas: metr(),
    rastro: `PR: pico ${pct(pico)}, ${kt(tokens)} tokens, ${tempo} min, ${defeitos} defeito(s)`,
  });

  const rotPadrao = motion.montagem[0].opcoes.find((o) => o.valor === padrao).rotulo;
  return {
    entrada: { titulo: `Padrão: ${rotPadrao}`, linhas: [`"${pedido}"`, `tarefas: ${tarefas.map((t) => t.id).join(', ')}${dependentes ? ' (T2 depende da T1)' : ''}`] },
    desligadas,
    passos,
    saida: {
      titulo: `${rotPadrao}: ${tempo} min, ${kt(tokens)} tokens, pico de ${pct(pico)}`,
      status: defeitos ? 'falha' : pico / CAPACIDADE >= LIMITE || retrabalho ? 'alerta' : 'ok',
      linhas: [
        `Janela principal no pico: ${pct(pico)} ${pico / CAPACIDADE >= LIMITE ? '(dumb zone)' : '(smart zone)'}`,
        `Tokens gastos no total: ${kt(tokens)}`,
        `Tempo de parede: ${tempo} min`,
        `Conflitos: ${conflitos} · retrabalho: ${retrabalho} · defeitos no PR: ${defeitos}`,
      ],
    },
    numeros: { pico: pico / CAPACIDADE, tokens, tempo, conflitos, retrabalho, defeitos },
  };
}
