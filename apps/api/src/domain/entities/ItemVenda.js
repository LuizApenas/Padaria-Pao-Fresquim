// Classe que representa um item individual dentro de uma venda.
export class ItemVenda {
  // Construtor da classe, recebendo os dados em formato de objeto.
  constructor({
    // Identificador da venda dona do item.
    vendaId = null,
    // Identificador do produto vinculado ao item.
    produtoId = null,
    // Quantidade comprada do produto.
    quantidade,
    // Subtotal do item; se omitido, pode ser calculado pelo preco do produto.
    subtotal = null,
    // Venda vinculada ao item, quando carregada.
    venda = null,
    // Produto vinculado ao item, quando carregado.
    produto = null,
  }) {
    // Armazena o identificador da venda.
    this.vendaId = vendaId;
    // Armazena o identificador do produto.
    this.produtoId = produtoId;
    // Armazena a quantidade comprada.
    this.quantidade = quantidade;
    // Armazena a venda associada.
    this.venda = venda;
    // Armazena o produto associado.
    this.produto = produto;
    // Armazena ou calcula o subtotal do item.
    this.subtotal = subtotal ?? this.calcularSubtotal();
  }

  // Calcula o subtotal com base no preco atual do produto e na quantidade.
  calcularSubtotal(precoUnitario = this.produto?.precoBase ?? 0) {
    // Converte o preco para numero antes de multiplicar pela quantidade.
    return Number(precoUnitario) * this.quantidade;
  }
}
