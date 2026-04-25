import { StatusSerasa } from "../enums.js";

// Classe que representa um cliente cadastrado na padaria.
export class Cliente {
  // O construtor recebe um objeto para deixar claro o nome de cada campo.
  constructor({
    // Identificador gerado pelo banco; começa nulo antes de persistir.
    id = null,
    // Nome completo do cliente.
    nome,
    // Telefone usado para contato e busca no cadastro.
    telefone,
    // Endereço residencial ou comercial do cliente.
    endereco,
    // CPF do cliente, tratado como dado único no banco.
    cpf,
    // Situação do cliente em relação ao Serasa.
    statusSerasa = StatusSerasa.REGULAR,
    // Flag de controle para soft delete ou bloqueio lógico.
    ativo = true,
    // Conta de fiado vinculada ao cliente, quando existir.
    contaFiado = null,
    // Lista de vendas ligadas ao cliente.
    vendas = [],
    // Data de criação do registro, preenchida pela persistência.
    criadoEm = null,
    // Data da última atualização do registro, preenchida pela persistência.
    atualizadoEm = null,
  }) {
    // Guarda o identificador do cliente.
    this.id = id;
    // Guarda o nome do cliente.
    this.nome = nome;
    // Guarda o telefone do cliente.
    this.telefone = telefone;
    // Guarda o endereço do cliente.
    this.endereco = endereco;
    // Guarda o CPF do cliente.
    this.cpf = cpf;
    // Guarda a situação do cliente no Serasa.
    this.statusSerasa = statusSerasa;
    // Guarda se o cliente está ativo no sistema.
    this.ativo = ativo;
    // Guarda a conta de fiado associada, se houver.
    this.contaFiado = contaFiado;
    // Guarda o histórico de vendas associado, quando carregado.
    this.vendas = vendas;
    // Guarda a data de criação.
    this.criadoEm = criadoEm;
    // Guarda a data da última atualização.
    this.atualizadoEm = atualizadoEm;
  }

  // Método de domínio para saber se o cliente deve ser bloqueado no fiado.
  estaNegativado() {
    // Retorna verdadeiro quando o status do cliente for NEGATIVADO.
    return this.statusSerasa === StatusSerasa.NEGATIVADO;
  }
}
