// Importa os enums usados no fluxo da venda.
import { FormaPagamento, StatusVenda } from "../enums.js";

// Classe que representa a cabecalho de uma venda.
export class Venda {
  // Construtor da classe, recebendo os dados em formato de objeto.
  constructor({
    // Identificador da venda no banco; antes de salvar pode ser nulo.
    id = null,
    // Data e hora em que a venda ocorreu.
    dataHora = new Date(),
    // Valor total da venda; se omitido, pode ser recalculado pelos itens.
    valorTotal = null,
    // Forma de pagamento escolhida pelo cliente.
    formaPagamento = FormaPagamento.DINHEIRO,
    // Estado atual da venda no sistema.
    status = StatusVenda.PENDENTE,
    // Cliente vinculado a venda, quando identificado.
    cliente = null,
    // Funcionario responsavel pela venda.
    funcionario = null,
    // Identificador do cliente, quando a venda estiver vinculada.
    clienteId = null,
    // Identificador do funcionario responsavel.
    funcionarioId = null,
    // Itens vinculados a venda.
    itens = [],
    // Data de criacao do registro, preenchida pela camada de persistencia.
    criadoEm = null,
    // Data da ultima atualizacao, preenchida pela camada de persistencia.
    atualizadoEm = null,
  }) {
    // Armazena o identificador da venda.
    this.id = id;
    // Armazena a data e hora da venda.
    this.dataHora = dataHora;
    // Armazena a forma de pagamento.
    this.formaPagamento = formaPagamento;
    // Armazena o status atual da venda.
    this.status = status;
    // Armazena o cliente associado, quando existir.
    this.cliente = cliente;
    // Armazena o funcionario associado.
    this.funcionario = funcionario;
    // Armazena o identificador do cliente.
    this.clienteId = clienteId;
    // Armazena o identificador do funcionario.
    this.funcionarioId = funcionarioId;
    // Armazena os itens associados.
    this.itens = itens;
    // Armazena o valor total ou recalcula com base nos itens.
    this.valorTotal = valorTotal ?? this.calcularTotal();
    // Armazena a data de criacao.
    this.criadoEm = criadoEm;
    // Armazena a data da ultima atualizacao.
    this.atualizadoEm = atualizadoEm;
  }

  // Soma os subtotais dos itens para obter o valor total da venda.
  calcularTotal() {
    // Recalcula e devolve o total atual da venda.
    this.valorTotal = this.itens.reduce((total, item) => total + Number(item.subtotal ?? 0), 0);

    return this.valorTotal;
  }

  // Adiciona um novo item e recalcula o total em memoria.
  adicionarItem(itemVenda) {
    // Inclui o item na colecao atual.
    this.itens.push(itemVenda);
    // Mantem o total sincronizado com a lista de itens.
    return this.calcularTotal();
  }

  // Gera uma representacao XML simples da nota fiscal da venda.
  emitirNotaFiscal() {
    // Retorna uma estrutura XML basica para futuras integracoes.
    return [
      "<notaFiscal>",
      `  <vendaId>${this.id ?? ""}</vendaId>`,
      `  <dataHora>${new Date(this.dataHora).toISOString()}</dataHora>`,
      `  <formaPagamento>${this.formaPagamento}</formaPagamento>`,
      `  <valorTotal>${this.valorTotal}</valorTotal>`,
      `  <quantidadeItens>${this.itens.length}</quantidadeItens>`,
      "</notaFiscal>",
    ].join("\n");
  }
}
