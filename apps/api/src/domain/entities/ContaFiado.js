// Importa os enums usados no controle financeiro do fiado.
import { StatusNotificacao, StatusSerasa } from "../enums.js";

// Classe que representa a conta de fiado de um cliente.
export class ContaFiado {
  // Construtor da classe, recebendo os dados em formato de objeto.
  constructor({
    // Identificador da conta no banco; antes de salvar pode ser nulo.
    id = null,
    // Saldo devedor acumulado do cliente.
    saldoDevedor = 0,
    // Data da ultima cobranca realizada.
    dataUltimaCobranca = null,
    // Estado atual da notificacao de cobranca.
    statusNotificacao = StatusNotificacao.NENHUMA,
    // Identificador do cliente vinculado a conta.
    clienteId = null,
    // Cliente vinculado a conta, quando carregado.
    cliente = null,
    // Data de criacao do registro, preenchida pela camada de persistencia.
    criadoEm = null,
    // Data da ultima atualizacao, preenchida pela camada de persistencia.
    atualizadoEm = null,
  }) {
    // Armazena o identificador da conta.
    this.id = id;
    // Armazena o saldo devedor atual.
    this.saldoDevedor = Number(saldoDevedor);
    // Armazena a data da ultima cobranca.
    this.dataUltimaCobranca = dataUltimaCobranca;
    // Armazena o status da notificacao.
    this.statusNotificacao = statusNotificacao;
    // Armazena o identificador do cliente.
    this.clienteId = clienteId;
    // Armazena o cliente associado.
    this.cliente = cliente;
    // Armazena a data de criacao.
    this.criadoEm = criadoEm;
    // Armazena a data da ultima atualizacao.
    this.atualizadoEm = atualizadoEm;
  }

  // Soma um novo debito ao saldo devedor atual.
  adicionarDebito(valor) {
    // Incrementa o saldo usando o valor recebido.
    this.saldoDevedor += Number(valor);
  }

  // Registra uma cobranca automatica para o cliente.
  acionarCobrancaAutomatica(dataCobranca = new Date()) {
    // Atualiza a data da ultima cobranca disparada.
    this.dataUltimaCobranca = dataCobranca;
    // Marca a notificacao como enviada para refletir a acao.
    this.statusNotificacao = StatusNotificacao.ENVIADA;
  }

  // Marca o cliente como negativado em um fluxo futuro de integracao com o Serasa.
  enviarParaSerasa() {
    // Atualiza o status do cliente apenas quando ele estiver carregado em memoria.
    if (this.cliente) {
      this.cliente.statusSerasa = StatusSerasa.NEGATIVADO;
    }
  }
}
