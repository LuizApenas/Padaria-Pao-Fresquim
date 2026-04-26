// Classe base para representar dados em comum entre clientes e funcionarios.
export class Pessoa {
  // Construtor da classe, recebendo os dados em formato de objeto.
  constructor({
    // Identificador da pessoa no banco; antes de salvar pode ser nulo.
    id = null,
    // Nome completo da pessoa.
    nome,
    // Telefone principal para contato.
    telefone,
    // Endereco cadastrado.
    endereco,
  }) {
    // Armazena o identificador da pessoa.
    this.id = id;
    // Armazena o nome da pessoa.
    this.nome = nome;
    // Armazena o telefone da pessoa.
    this.telefone = telefone;
    // Armazena o endereco da pessoa.
    this.endereco = endereco;
  }
}
