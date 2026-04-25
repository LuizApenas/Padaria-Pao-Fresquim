import { Role } from "../enums.js";

// Representa o funcionário e seu perfil de acesso no sistema.
export class Funcionario {
  constructor({
    id = null,
    nome,
    cpf,
    telefone,
    endereco,
    matricula,
    cargo,
    dataAdmissao,
    contatoEmergencia,
    role = Role.ATENDENTE,
    email,
    senhaHash,
    ativo = true,
    vendas = [],
    registrosPonto = [],
    ferias = [],
    licencas = [],
    atestados = [],
    criadoEm = null,
    atualizadoEm = null,
  }) {
    this.id = id;
    this.nome = nome;
    this.cpf = cpf;
    this.telefone = telefone;
    this.endereco = endereco;
    this.matricula = matricula;
    this.cargo = cargo;
    this.dataAdmissao = dataAdmissao;
    this.contatoEmergencia = contatoEmergencia;
    this.role = role;
    this.email = email;
    this.senhaHash = senhaHash;
    this.ativo = ativo;
    this.vendas = vendas;
    this.registrosPonto = registrosPonto;
    this.ferias = ferias;
    this.licencas = licencas;
    this.atestados = atestados;
    this.criadoEm = criadoEm;
    this.atualizadoEm = atualizadoEm;
  }

  ehProprietario() {
    return this.role === Role.PROPRIETARIO;
  }
}
