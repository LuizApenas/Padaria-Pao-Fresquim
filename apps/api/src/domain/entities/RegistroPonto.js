import { TipoRegistroPonto } from "../enums.js";

// Representa uma batida de ponto de um funcionário.
export class RegistroPonto {
  constructor({
    id = null,
    dataHoraBatida = new Date(),
    tipoRegistro = TipoRegistroPonto.ENTRADA,
    funcionarioId,
    funcionario = null,
    criadoEm = null,
  }) {
    this.id = id;
    this.dataHoraBatida = dataHoraBatida;
    this.tipoRegistro = tipoRegistro;
    this.funcionarioId = funcionarioId;
    this.funcionario = funcionario;
    this.criadoEm = criadoEm;
  }
}
