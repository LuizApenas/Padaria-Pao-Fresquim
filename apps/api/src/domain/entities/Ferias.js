// Representa um período de férias de um funcionário.
export class Ferias {
  constructor({
    id = null,
    funcionarioId,
    dataInicio,
    dataFim,
    observacao = null,
    funcionario = null,
    criadoEm = null,
    atualizadoEm = null,
  }) {
    this.id = id;
    this.funcionarioId = funcionarioId;
    this.dataInicio = dataInicio;
    this.dataFim = dataFim;
    this.observacao = observacao;
    this.funcionario = funcionario;
    this.criadoEm = criadoEm;
    this.atualizadoEm = atualizadoEm;
  }
}
