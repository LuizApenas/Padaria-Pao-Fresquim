// Enum com os perfis de acesso previstos para os funcionarios.
export const Role = Object.freeze({
  // Perfil do proprietario, com acesso administrativo completo.
  PROPRIETARIO: "PROPRIETARIO",
  // Perfil do atendente, usado para vendas e atendimento ao cliente.
  ATENDENTE: "ATENDENTE",
  // Perfil do padeiro, usado para operacoes ligadas aos produtos.
  PADEIRO: "PADEIRO",
});

// Enum com as formas de pagamento aceitas nas vendas.
export const FormaPagamento = Object.freeze({
  // Pagamento em especie no caixa.
  DINHEIRO: "DINHEIRO",
  // Pagamento com cartao de debito.
  DEBITO: "DEBITO",
  // Pagamento com cartao de credito.
  CREDITO: "CREDITO",
  // Pagamento via PIX.
  PIX: "PIX",
  // Pagamento registrado no fiado.
  FIADO: "FIADO",
});

// Enum com a situacao do cliente para regras de fiado.
export const StatusSerasa = Object.freeze({
  // Cliente sem restricao.
  REGULAR: "REGULAR",
  // Cliente com restricao, usado para bloquear fiado.
  NEGATIVADO: "NEGATIVADO",
});

// Enum com o estado do envio de cobrancas do fiado.
export const StatusNotificacao = Object.freeze({
  // Nenhuma cobranca foi disparada ainda.
  NENHUMA: "NENHUMA",
  // A cobranca foi colocada na fila de envio.
  PENDENTE: "PENDENTE",
  // A cobranca foi enviada ao cliente.
  ENVIADA: "ENVIADA",
  // Houve falha no envio da cobranca.
  FALHA: "FALHA",
});

// Enum com os tipos possiveis de registro no ponto.
export const TipoRegistroPonto = Object.freeze({
  // Marca o inicio da jornada.
  ENTRADA: "ENTRADA",
  // Marca o encerramento da jornada.
  SAIDA: "SAIDA",
});

// Enum com o estado atual da venda no sistema.
export const StatusVenda = Object.freeze({
  // Venda aberta ou em processamento.
  PENDENTE: "PENDENTE",
  // Venda finalizada com sucesso.
  CONCLUIDA: "CONCLUIDA",
  // Venda revertida ou cancelada.
  CANCELADA: "CANCELADA",
});
