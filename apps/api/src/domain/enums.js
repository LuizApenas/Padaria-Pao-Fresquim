// Enum com os perfis de acesso previstos para os funcionarios.
export const Role = Object.freeze({
  // Perfil do proprietario, com acesso administrativo completo.
  PROPRIETARIO: "PROPRIETARIO",
  // Perfil do atendente, usado para vendas e atendimento ao cliente.
  ATENDENTE: "ATENDENTE",
  // Perfil do padeiro, usado para operacoes ligadas aos produtos.
  PADEIRO: "PADEIRO",
});

// Enum com a situacao do cliente para regras de fiado.
export const StatusSerasa = Object.freeze({
  // Cliente sem restricao.
  REGULAR: "REGULAR",
  // Cliente com restricao, usado para bloquear fiado.
  NEGATIVADO: "NEGATIVADO",
});
