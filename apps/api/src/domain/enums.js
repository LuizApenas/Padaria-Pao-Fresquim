// Enums de domínio usados pelas classes do backend.
export const Role = Object.freeze({
  PROPRIETARIO: "PROPRIETARIO",
  ATENDENTE: "ATENDENTE",
  PADEIRO: "PADEIRO",
});

export const FormaPagamento = Object.freeze({
  DINHEIRO: "DINHEIRO",
  DEBITO: "DEBITO",
  CREDITO: "CREDITO",
  PIX: "PIX",
  FIADO: "FIADO",
});

export const StatusSerasa = Object.freeze({
  REGULAR: "REGULAR",
  NEGATIVADO: "NEGATIVADO",
});

export const StatusNotificacao = Object.freeze({
  NENHUMA: "NENHUMA",
  PENDENTE: "PENDENTE",
  ENVIADA: "ENVIADA",
  FALHA: "FALHA",
});

export const TipoRegistroPonto = Object.freeze({
  ENTRADA: "ENTRADA",
  SAIDA: "SAIDA",
});

export const StatusVenda = Object.freeze({
  PENDENTE: "PENDENTE",
  CONCLUIDA: "CONCLUIDA",
  CANCELADA: "CANCELADA",
});
