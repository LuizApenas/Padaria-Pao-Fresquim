// Enum que representa os perfis de acesso dos funcionários no sistema.
export const Role = Object.freeze({
  // Proprietário: perfil com acesso administrativo completo.
  PROPRIETARIO: "PROPRIETARIO",
  // Atendente: perfil voltado para vendas e cadastro de clientes.
  ATENDENTE: "ATENDENTE",
  // Padeiro: perfil voltado principalmente para produtos.
  PADEIRO: "PADEIRO",
});

// Enum que representa a situação do cliente para operações de fiado.
export const StatusSerasa = Object.freeze({
  // Cliente regular: pode seguir o fluxo normal de compra.
  REGULAR: "REGULAR",
  // Cliente negativado: deve ser bloqueado em operações de fiado.
  NEGATIVADO: "NEGATIVADO",
});
