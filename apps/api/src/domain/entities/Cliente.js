import { StatusSerasa } from "../enums.js";

// Representa o cliente cadastrado na padaria.
export class Cliente {
  constructor({
    id = null,
    nome,
    telefone,
    endereco,
    cpf,
    statusSerasa = StatusSerasa.REGULAR,
    ativo = true,
    contaFiado = null,
    vendas = [],
    criadoEm = null,
    atualizadoEm = null,
  }) {
    this.id = id;
    this.nome = nome;
    this.telefone = telefone;
    this.endereco = endereco;
    this.cpf = cpf;
    this.statusSerasa = statusSerasa;
    this.ativo = ativo;
    this.contaFiado = contaFiado;
    this.vendas = vendas;
    this.criadoEm = criadoEm;
    this.atualizadoEm = atualizadoEm;
  }

  estaNegativado() {
    return this.statusSerasa === StatusSerasa.NEGATIVADO;
  }
}
