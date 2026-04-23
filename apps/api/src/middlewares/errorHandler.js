import { Prisma } from "@prisma/client";

import { AppError } from "../utils/AppError.js";

// Monta o formato padrão de resposta de erro da API.
function buildErrorResponse(message, details) {
  const response = {
    error: message,
  };

  // Só adiciona detalhes quando existir algo útil para retornar ao cliente.
  if (details?.length) {
    response.details = details;
  }

  return response;
}

// Detecta erros de validação do Zod sem acoplar a aplicação a uma importação direta.
function isZodValidationError(error) {
  return error?.name === "ZodError" && Array.isArray(error?.issues);
}

// Converte os problemas do Zod para um formato simples e previsível na resposta.
function formatZodIssues(issues) {
  return issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

// Extrai os campos envolvidos em uma violação de unicidade do Prisma.
function getUniqueConstraintFields(error) {
  const target = error?.meta?.target;

  if (Array.isArray(target) && target.length > 0) {
    return target.join(", ");
  }

  return "informado";
}

// Extrai o campo de chave estrangeira para facilitar a leitura do erro retornado.
function getForeignKeyField(error) {
  const fieldName = error?.meta?.field_name;

  if (typeof fieldName === "string" && fieldName.trim()) {
    return fieldName;
  }

  return "relacionamento informado";
}

// Identifica erros conhecidos do Prisma mesmo quando eles chegam como objetos simples.
function getPrismaErrorCode(error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code;
  }

  if (typeof error?.code === "string" && error.code.startsWith("P")) {
    return error.code;
  }

  return null;
}

export function errorHandler(error, _request, response, _next) {
  // Trata erros gerados manualmente pela própria aplicação.
  if (error instanceof AppError) {
    return response
      .status(error.statusCode)
      .json(buildErrorResponse(error.message));
  }

  // Trata erros de validação do Zod retornando os campos problemáticos.
  if (isZodValidationError(error)) {
    return response.status(400).json(
      buildErrorResponse("Dados de entrada inválidos.", formatZodIssues(error.issues)),
    );
  }

  // Centraliza o mapeamento de erros conhecidos do Prisma para respostas legíveis.
  switch (getPrismaErrorCode(error)) {
    case "P2025":
      return response
        .status(404)
        .json(buildErrorResponse("Registro não encontrado."));

    case "P2002": {
      const fields = getUniqueConstraintFields(error);

      return response.status(409).json(
        buildErrorResponse(
          `Já existe um registro com o valor informado para o campo ${fields}.`,
        ),
      );
    }

    case "P2003": {
      const field = getForeignKeyField(error);

      return response.status(400).json(
        buildErrorResponse(
          `Operação inválida: a referência do campo ${field} não existe.`,
        ),
      );
    }

    default:
      break;
  }

  // Mantém o log dos erros inesperados no servidor para investigação posterior.
  console.error(error);

  return response
    .status(500)
    .json(buildErrorResponse("Erro interno do servidor."));
}
