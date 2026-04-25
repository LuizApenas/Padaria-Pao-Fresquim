// Representa um item dentro de uma venda.
export class ItemVenda {
  constructor({
    vendaId = null,
    produtoId,
    quantidade,
    subtotal,
    produto = null,
    venda = null,
  }) {
    this.vendaId = vendaId;
    this.produtoId = produtoId;
    this.quantidade = quantidade;
    this.subtotal = subtotal;
    this.produto = produto;
    this.venda = venda;
  }
}
