import { FormaPagamento, StatusVenda } from "../enums.js";

// Representa uma venda realizada no sistema.
export class Venda {
  constructor({
    id = null,
    dataHora = new Date(),
    valorTotal = 0,
    formaPagamento = FormaPagamento.DINHEIRO,
    status = StatusVenda.PENDENTE,
    funcionarioId,
    clienteId = null,
    funcionario = null,
    cliente = null,
    itens = [],
    criadoEm = null,
    atualizadoEm = null,
  }) {
    this.id = id;
    this.dataHora = dataHora;
    this.valorTotal = valorTotal;
    this.formaPagamento = formaPagamento;
    this.status = status;
    this.funcionarioId = funcionarioId;
    this.clienteId = clienteId;
    this.funcionario = funcionario;
    this.cliente = cliente;
    this.itens = itens;
    this.criadoEm = criadoEm;
    this.atualizadoEm = atualizadoEm;
  }

  ehFiado() {
    return this.formaPagamento === FormaPagamento.FIADO;
  }

  cancelar() {
    this.status = StatusVenda.CANCELADA;
  }
}
