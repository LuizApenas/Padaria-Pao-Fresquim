// Importa o enum usado para indicar a situacao financeira do cliente.
import { StatusSerasa } from "../enums.js";
import { Pessoa } from "./Pessoa.js";

// Classe inicial que representa um cliente no dominio do backend.
export class Cliente extends Pessoa {
  // Construtor da classe, recebendo os dados em formato de objeto.
  constructor({
    // Identificador do cliente no banco; antes de salvar pode ser nulo.
    id = null,
    // Nome completo do cliente.
    nome,
    // Telefone usado para contato e busca.
    telefone,
    // Endereco do cliente.
    endereco,
    // CPF do cliente.
    cpf,
    // Situacao do cliente no Serasa; por padrao comeca regular.
    statusSerasa = StatusSerasa.REGULAR,
    // Indica se o cliente esta ativo no sistema.
    ativo = true,
    // Conta de fiado vinculada ao cliente, quando existir.
    contaFiado = null,
    // Vendas vinculadas ao cliente, quando forem carregadas.
    vendas = [],
    // Data de criacao do registro, preenchida pela camada de persistencia.
    criadoEm = null,
    // Data da ultima atualizacao, preenchida pela camada de persistencia.
    atualizadoEm = null,
  }) {
    // Inicializa os dados basicos herdados da classe Pessoa.
    super({ id, nome, telefone, endereco });
    // Armazena o CPF do cliente.
    this.cpf = cpf;
    // Armazena a situacao do cliente no Serasa.
    this.statusSerasa = statusSerasa;
    // Armazena se o cliente esta ativo.
    this.ativo = ativo;
    // Armazena a conta de fiado associada.
    this.contaFiado = contaFiado;
    // Armazena as vendas associadas.
    this.vendas = vendas;
    // Armazena a data de criacao.
    this.criadoEm = criadoEm;
    // Armazena a data da ultima atualizacao.
    this.atualizadoEm = atualizadoEm;
  }

  // Verifica se o cliente esta negativado.
  estaNegativado() {
    // Retorna verdadeiro quando o status for NEGATIVADO.
    return this.statusSerasa === StatusSerasa.NEGATIVADO;
  }

  // Informa se a consulta ao Serasa permite liberar operacoes de fiado.
  consultarStatusSerasa() {
    // Retorna verdadeiro quando o cliente estiver regular.
    return this.statusSerasa === StatusSerasa.REGULAR;
  }
}
