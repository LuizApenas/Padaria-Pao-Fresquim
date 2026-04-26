// Importa o enum usado para diferenciar entrada e saida.
import { TipoRegistroPonto } from "../enums.js";

// Classe que representa uma batida individual de ponto.
export class RegistroPonto {
  // Construtor da classe, recebendo os dados em formato de objeto.
  constructor({
    // Identificador do registro no banco; antes de salvar pode ser nulo.
    id = null,
    // Data e hora da batida de ponto.
    dataHoraBatida = new Date(),
    // Tipo da batida de ponto.
    tipoRegistro = TipoRegistroPonto.ENTRADA,
    // Identificador do funcionario vinculado ao registro.
    funcionarioId = null,
    // Funcionario vinculado ao registro, quando carregado.
    funcionario = null,
    // Data de criacao do registro, preenchida pela camada de persistencia.
    criadoEm = null,
  }) {
    // Armazena o identificador do registro.
    this.id = id;
    // Armazena a data e hora da batida.
    this.dataHoraBatida = dataHoraBatida;
    // Armazena o tipo do registro.
    this.tipoRegistro = tipoRegistro;
    // Armazena o identificador do funcionario.
    this.funcionarioId = funcionarioId;
    // Armazena o funcionario associado.
    this.funcionario = funcionario;
    // Armazena a data de criacao.
    this.criadoEm = criadoEm;
  }

  // Verifica se o registro representa uma entrada.
  ehEntrada() {
    // Retorna verdadeiro quando o tipo for ENTRADA.
    return this.tipoRegistro === TipoRegistroPonto.ENTRADA;
  }
}
