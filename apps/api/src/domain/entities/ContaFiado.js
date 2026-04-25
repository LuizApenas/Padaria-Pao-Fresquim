import { StatusNotificacao } from "../enums.js";

// Representa a conta de fiado vinculada a um cliente.
export class ContaFiado {
  constructor({
    id = null,
    saldoDevedor = 0,
    dataUltimaCobranca = null,
    statusNotificacao = StatusNotificacao.NENHUMA,
    clienteId,
    cliente = null,
    criadoEm = null,
    atualizadoEm = null,
  }) {
    this.id = id;
    this.saldoDevedor = saldoDevedor;
    this.dataUltimaCobranca = dataUltimaCobranca;
    this.statusNotificacao = statusNotificacao;
    this.clienteId = clienteId;
    this.cliente = cliente;
    this.criadoEm = criadoEm;
    this.atualizadoEm = atualizadoEm;
  }

  possuiSaldoEmAberto() {
    return Number(this.saldoDevedor) > 0;
  }
}
