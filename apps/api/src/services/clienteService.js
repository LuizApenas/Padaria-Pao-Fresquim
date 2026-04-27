// apps/api/src/services/clienteService.js
import { StatusSerasa } from "../domain/enums.js";
import { clienteRepository } from "../repositories/clienteRepository.js";
import { AppError } from "../utils/AppError.js";

// Estes sao os campos que a API permite receber do cliente da requisicao.
// Manter esta lista explicita evita que campos indesejados cheguem ao banco.
const ALLOWED_FIELDS = ["nome", "telefone", "endereco", "cpf", "statusSerasa", "ativo"];

// Estes campos sao obrigatorios apenas na criacao de um novo cliente.
const REQUIRED_CREATE_FIELDS = ["nome", "telefone", "endereco", "cpf"];

// Converte parametros de rota para numero e rejeita ids invalidos logo no inicio.
function parseClienteId(id) {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new AppError("Id do cliente invalido.", 400);
  }

  return parsedId;
}

// Limpa textos para evitar salvar espacos acidentais no banco.
function normalizeText(value) {
  return typeof value === "string" ? value.trim() : value;
}

// Monta um objeto limpo apenas com os campos usados pelo model Cliente.
function pickClienteData(body) {
  const data = {};

  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) {
      data[field] = normalizeText(body[field]);
    }
  }

  return data;
}

// Valida regras comuns de Cliente para criacao e atualizacao.
function validateClienteData(data, requiredFields = []) {
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new AppError(`O campo ${field} e obrigatorio.`, 400);
    }
  }

  if (data.statusSerasa && !Object.values(StatusSerasa).includes(data.statusSerasa)) {
    throw new AppError("Status do Serasa invalido.", 400);
  }

  if (data.ativo !== undefined && typeof data.ativo !== "boolean") {
    throw new AppError("O campo ativo deve ser booleano.", 400);
  }
}

export const clienteService = {
  // Lista todos os clientes. Adicione filtros aqui depois se a tela precisar de busca.
  listClientes() {
    return clienteRepository.findAll();
  },

  // Retorna um cliente ou um erro 404 claro.
  async getClienteById(id) {
    const clienteId = parseClienteId(id);
    const cliente = await clienteRepository.findById(clienteId);

    if (!cliente) {
      throw new AppError("Cliente nao encontrado.", 404);
    }

    return cliente;
  },

  // Cria um cliente depois de limpar e validar o corpo da requisicao.
  createCliente(body) {
    const data = pickClienteData(body);

    validateClienteData(data, REQUIRED_CREATE_FIELDS);

    return clienteRepository.create(data);
  },

  // Atualiza apenas os campos enviados pelo cliente da requisicao.
  updateCliente(id, body) {
    const clienteId = parseClienteId(id);
    const data = pickClienteData(body);

    if (Object.keys(data).length === 0) {
      throw new AppError("Envie pelo menos um campo para atualizar.", 400);
    }

    validateClienteData(data);

    return clienteRepository.update(clienteId, data);
  },

  // Remove o cliente pelo id.
  deleteCliente(id) {
    const clienteId = parseClienteId(id);

    return clienteRepository.delete(clienteId);
  },
};
