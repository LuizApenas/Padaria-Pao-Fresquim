// Representa um produto do catálogo da padaria.
export class Produto {
  constructor({
    id = null,
    codigoBarras,
    nome,
    precoBase,
    categoria,
    imagemUrl = null,
    ativo = true,
    itensVenda = [],
    criadoEm = null,
    atualizadoEm = null,
  }) {
    this.id = id;
    this.codigoBarras = codigoBarras;
    this.nome = nome;
    this.precoBase = precoBase;
    this.categoria = categoria;
    this.imagemUrl = imagemUrl;
    this.ativo = ativo;
    this.itensVenda = itensVenda;
    this.criadoEm = criadoEm;
    this.atualizadoEm = atualizadoEm;
  }

  desativar() {
    this.ativo = false;
  }
}
