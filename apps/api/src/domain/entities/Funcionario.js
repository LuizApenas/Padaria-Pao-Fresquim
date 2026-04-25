import { Role } from "../enums.js";

// Classe que representa um funcionário da padaria.
export class Funcionario {
  // O construtor recebe um objeto para facilitar a leitura dos campos.
  constructor({
    // Identificador gerado pelo banco; começa nulo antes de persistir.
    id = null,
    // Nome completo do funcionário.
    nome,
    // CPF do funcionário, tratado como dado único.
    cpf,
    // Telefone de contato do funcionário.
    telefone,
    // Endereço do funcionário.
    endereco,
    // Matrícula interna usada para identificação operacional.
    matricula,
    // Cargo exercido pelo funcionário na padaria.
    cargo,
    // Data de admissão do funcionário.
    dataAdmissao,
    // Contato de emergência informado no cadastro.
    contatoEmergencia,
    // Perfil de acesso do funcionário dentro do sistema.
    role = Role.ATENDENTE,
    // E-mail usado futuramente para login.
    email,
    // Hash da senha; a senha pura não deve ser armazenada.
    senhaHash,
    // Flag de controle para funcionário ativo ou inativo.
    ativo = true,
    // Lista de vendas realizadas pelo funcionário, quando carregada.
    vendas = [],
    // Lista de batidas de ponto, quando carregada.
    registrosPonto = [],
    // Lista de períodos de férias, quando carregada.
    ferias = [],
    // Lista de licenças, quando carregada.
    licencas = [],
    // Lista de atestados, quando carregada.
    atestados = [],
    // Data de criação do registro, preenchida pela persistência.
    criadoEm = null,
    // Data da última atualização do registro, preenchida pela persistência.
    atualizadoEm = null,
  }) {
    // Guarda o identificador do funcionário.
    this.id = id;
    // Guarda o nome do funcionário.
    this.nome = nome;
    // Guarda o CPF do funcionário.
    this.cpf = cpf;
    // Guarda o telefone do funcionário.
    this.telefone = telefone;
    // Guarda o endereço do funcionário.
    this.endereco = endereco;
    // Guarda a matrícula interna do funcionário.
    this.matricula = matricula;
    // Guarda o cargo do funcionário.
    this.cargo = cargo;
    // Guarda a data de admissão.
    this.dataAdmissao = dataAdmissao;
    // Guarda o contato de emergência.
    this.contatoEmergencia = contatoEmergencia;
    // Guarda o perfil de acesso.
    this.role = role;
    // Guarda o e-mail usado para autenticação.
    this.email = email;
    // Guarda o hash da senha.
    this.senhaHash = senhaHash;
    // Guarda se o funcionário está ativo.
    this.ativo = ativo;
    // Guarda as vendas associadas ao funcionário.
    this.vendas = vendas;
    // Guarda os registros de ponto associados.
    this.registrosPonto = registrosPonto;
    // Guarda os períodos de férias associados.
    this.ferias = ferias;
    // Guarda as licenças associadas.
    this.licencas = licencas;
    // Guarda os atestados associados.
    this.atestados = atestados;
    // Guarda a data de criação.
    this.criadoEm = criadoEm;
    // Guarda a data da última atualização.
    this.atualizadoEm = atualizadoEm;
  }

  // Método de domínio para verificar se o funcionário tem acesso de proprietário.
  ehProprietario() {
    // Retorna verdadeiro quando o perfil do funcionário for PROPRIETARIO.
    return this.role === Role.PROPRIETARIO;
  }
}
