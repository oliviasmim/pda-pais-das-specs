// Laboratório "ciclo do harness": um passo a passo do agente implementando a T1 (POST /agendamentos).
// Cada passo acende partes do desenho. Dá para ligar e desligar guias e sensores.
export const NOS = ['guias', 'llm', 'ferramentas', 'sensores'];

export const NOME_NO = {
  guias: 'Guias',
  llm: 'LLM',
  ferramentas: 'Ferramentas',
  sensores: 'Sensores',
};

export function passos({ guias = true, sensores = true } = {}) {
  const lista = [];
  if (guias) {
    lista.push({ id: 'guias', ativos: ['guias', 'llm'], papel: 'guia', titulo: 'Os guias entram na janela', texto: 'AGENTS.md, a spec da T1 e a skill criar-endpoint chegam antes da primeira linha. O agente sabe que o status de sucesso é 201 e que vaga ocupada é 409.' });
  } else {
    lista.push({ id: 'sem-guias', ativos: ['llm'], papel: 'llm', titulo: 'Sem guias, só o pedido', texto: 'O agente recebe "faça o POST /agendamentos". Ninguém disse quais são os status nem as mensagens. Ele preenche com o que parece razoável.' });
  }
  lista.push({ id: 'gerar', ativos: ['llm'], papel: 'llm', titulo: guias ? 'O LLM gera o código' : 'O LLM gera o código (com suposições)', texto: guias ? 'O modelo prevê, token a token, o handler do POST. Sozinho ele só produz texto.' : 'O modelo escreve um handler que devolve 200 em vez de 201 e inventa a mensagem "Vaga já reservada".' });
  lista.push({ id: 'editar', ativos: ['llm', 'ferramentas'], papel: 'ferramenta', titulo: 'O harness executa a ferramenta', texto: 'O modelo pede Edit em src/routes/agendamentos.js. Quem escreve no disco é o harness, dentro das permissões que você definiu.' });
  if (sensores) {
    lista.push({ id: 'lint', ativos: ['ferramentas', 'sensores'], papel: 'sensor', titulo: 'Sensor: lint e tipos', texto: 'Passam. O código está bem formado, mas lint e tipos não sabem o que a T1 pede.' });
    lista.push({ id: 'teste', ativos: ['ferramentas', 'sensores'], papel: 'sensor', falha: true, titulo: 'Sensor: testes', texto: guias ? 'Falha: a segunda requisição para a mesma vaga devolveu 201, e a spec manda 409 com {"erro":"Vaga indisponível"}.' : 'Falha: o teste esperava 201 no sucesso e 409 {"erro":"Vaga indisponível"} na vaga ocupada. Recebeu 200 e "Vaga já reservada", que ninguém pediu.' });
    lista.push({ id: 'volta', ativos: ['sensores', 'llm'], papel: 'sensor', titulo: 'O sinal volta para o agente', texto: 'A saída do teste entra na janela como resultado da ferramenta. É feedback: o modelo agora vê o erro.' });
    lista.push({ id: 'corrigir', ativos: ['llm', 'ferramentas'], papel: 'llm', titulo: 'O LLM corrige', texto: 'Ele reescreve a checagem de vaga livre e o status. O loop continua até o sensor ficar verde ou até você interromper.' });
    lista.push({ id: 'verde', ativos: ['ferramentas', 'sensores'], papel: 'sensor', ok: true, titulo: 'Sensores verdes', texto: 'Lint, tipos e testes passam. O CI repete a checagem no PR. Quem lê o diff e decide é você.' });
  } else {
    lista.push({ id: 'pronto', ativos: ['llm'], papel: 'llm', falha: true, titulo: 'Sem sensores: "pronto!"', texto: 'O agente diz que terminou. Ninguém rodou nada. O 200 no lugar do 201 vai para o PR e só aparece quando alguém usar a API.' });
  }
  return lista;
}

export function resumo({ guias, sensores }) {
  if (guias && sensores) return 'Harness completo: o guia aumenta a chance de acertar de primeira e o sensor pega o que escapou.';
  if (guias && !sensores) return 'Só guias: a spec diz o certo, mas ninguém confere. É esperança.';
  if (!guias && sensores) return 'Só sensores: o teste reprova, o agente corrige, e cada volta gasta tokens com um erro que a spec teria evitado.';
  return 'Só o modelo: ninguém disse o que é certo e ninguém conferiu. O 200 no lugar do 201 chega no PR e você descobre em produção.';
}

export function proximo(i, total) {
  return Math.min(total - 1, i + 1);
}
export function anterior(i) {
  return Math.max(0, i - 1);
}
