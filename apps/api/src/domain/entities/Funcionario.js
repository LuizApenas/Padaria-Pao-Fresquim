// Importa o enum usado para definir o perfil de acesso do funcionario.
import { Role } from "../enums.js";

// Classe inicial que representa um funcionario no dominio do backend.
export class Funcionario {
  // Construtor da classe, recebendo os dados em formato de objeto.
  constructor({
    // Identificador do funcionario no banco; antes de salvar pode ser nulo.
    id = null,
    // Nome completo do funcionario.
    nome,
    // CPF do funcionario.
    cpf,
    // Telefone de contato do funcionario.
    telefone,
    // Endereco do funcionario.
    endereco,
    // Matricula interna do funcionario.
    matricula,
    // Cargo exercido pelo funcionario.
    cargo,
    // Data em que o funcionario foi admitido.
    dataAdmissao,
    // Contato de emergencia informado no cadastro.
    contatoEmergencia,
    // Perfil de acesso do funcionario; por padrao comeca como atendente.
    role = Role.ATENDENTE,
    // E-mail usado futuramente no login.
    email,
    // Hash da senha; a senha pura nao deve ser armazenada.
    senhaHash,
    // Indica se o funcionario esta ativo no sistema.
    ativo = true,
    // Vendas vinculadas ao funcionario, quando forem carregadas.
    vendas = [],
    // Registros de ponto vinculados ao funcionario.
    registrosPonto = [],
    // Periodos de ferias vinculados ao funcionario.
    ferias = [],
    // Licencas vinculadas ao funcionario.
    licencas = [],
    // Atestados vinculados ao funcionario.
    atestados = [],
    // Data de criacao do registro, preenchida pela camada de persistencia.
    criadoEm = null,
    // Data da ultima atualizacao, preenchida pela camada de persistencia.
    atualizadoEm = null,
  }) {
    // Armazena o identificador do funcionario.
    this.id = id;
    // Armazena o nome do funcionario.
    this.nome = nome;
    // Armazena o CPF do funcionario.
    this.cpf = cpf;
    // Armazena o telefone do funcionario.
    this.telefone = telefone;
    // Armazena o endereco do funcionario.
    this.endereco = endereco;
    // Armazena a matricula do funcionario.
    this.matricula = matricula;
    // Armazena o cargo do funcionario.
    this.cargo = cargo;
    // Armazena a data de admissao.
    this.dataAdmissao = dataAdmissao;
    // Armazena o contato de emergencia.
    this.contatoEmergencia = contatoEmergencia;
    // Armazena o perfil de acesso.
    this.role = role;
    // Armazena o e-mail.
    this.email = email;
    // Armazena o hash da senha.
    this.senhaHash = senhaHash;
    // Armazena se o funcionario esta ativo.
    this.ativo = ativo;
    // Armazena as vendas associadas.
    this.vendas = vendas;
    // Armazena os registros de ponto associados.
    this.registrosPonto = registrosPonto;
    // Armazena os periodos de ferias associados.
    this.ferias = ferias;
    // Armazena as licencas associadas.
    this.licencas = licencas;
    // Armazena os atestados associados.
    this.atestados = atestados;
    // Armazena a data de criacao.
    this.criadoEm = criadoEm;
    // Armazena a data da ultima atualizacao.
    this.atualizadoEm = atualizadoEm;
  }

  // Verifica se o funcionario possui perfil de proprietario.
  ehProprietario() {
    // Retorna verdadeiro quando o perfil for PROPRIETARIO.
    return this.role === Role.PROPRIETARIO;
  }
}
