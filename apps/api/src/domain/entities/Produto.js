// Classe que representa um produto vendido pela padaria.
export class Produto {
  // Construtor da classe, recebendo os dados em formato de objeto.
  constructor({
    // Identificador do produto no banco; antes de salvar pode ser nulo.
    id = null,
    // Codigo de barras usado no PDV e em buscas.
    codigoBarras,
    // Nome comercial do produto.
    nome,
    // Preco base usado nas vendas.
    precoBase,
    // Categoria do produto no catalogo.
    categoria,
    // URL da imagem do produto, quando existir.
    imagemUrl = null,
    // Indica se o produto ainda esta ativo no catalogo.
    ativo = true,
    // Itens de venda vinculados ao produto, quando carregados.
    itensVenda = [],
    // Data de criacao do registro, preenchida pela camada de persistencia.
    criadoEm = null,
    // Data da ultima atualizacao, preenchida pela camada de persistencia.
    atualizadoEm = null,
  }) {
    // Armazena o identificador do produto.
    this.id = id;
    // Armazena o codigo de barras.
    this.codigoBarras = codigoBarras;
    // Armazena o nome do produto.
    this.nome = nome;
    // Armazena o preco base do produto.
    this.precoBase = precoBase;
    // Armazena a categoria do produto.
    this.categoria = categoria;
    // Armazena a URL da imagem, quando existir.
    this.imagemUrl = imagemUrl;
    // Armazena se o produto esta ativo.
    this.ativo = ativo;
    // Armazena os itens de venda associados.
    this.itensVenda = itensVenda;
    // Armazena a data de criacao.
    this.criadoEm = criadoEm;
    // Armazena a data da ultima atualizacao.
    this.atualizadoEm = atualizadoEm;
  }

  // Verifica se o produto esta disponivel para venda.
  estaAtivo() {
    // Retorna verdadeiro quando o produto estiver ativo.
    return this.ativo;
  }
}
