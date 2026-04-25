// Representa um atestado apresentado por um funcionário.
export class Atestado {
  constructor({
    id = null,
    funcionarioId,
    arquivoUrl,
    dataEntrega,
    observacao = null,
    funcionario = null,
    criadoEm = null,
    atualizadoEm = null,
  }) {
    this.id = id;
    this.funcionarioId = funcionarioId;
    this.arquivoUrl = arquivoUrl;
    this.dataEntrega = dataEntrega;
    this.observacao = observacao;
    this.funcionario = funcionario;
    this.criadoEm = criadoEm;
    this.atualizadoEm = atualizadoEm;
  }
}
