// Representa uma licença ou afastamento de um funcionário.
export class Licenca {
  constructor({
    id = null,
    funcionarioId,
    tipo,
    dataInicio,
    retornoPrevistoEm = null,
    observacao = null,
    funcionario = null,
    criadoEm = null,
    atualizadoEm = null,
  }) {
    this.id = id;
    this.funcionarioId = funcionarioId;
    this.tipo = tipo;
    this.dataInicio = dataInicio;
    this.retornoPrevistoEm = retornoPrevistoEm;
    this.observacao = observacao;
    this.funcionario = funcionario;
    this.criadoEm = criadoEm;
    this.atualizadoEm = atualizadoEm;
  }
}
