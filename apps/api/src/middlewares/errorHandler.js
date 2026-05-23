import { Prisma } from "@prisma/client";

import { AppError } from "../utils/AppError.js";

function buildErrorResponse(message, details, suggestion) {
  const response = {
    error: message,
    message,
  };

  if (details?.length) {
    response.details = details;
  }

  if (suggestion) {
    response.suggestion = suggestion;
  }

  return response;
}

function getSuggestionForStatus(statusCode) {
  const suggestions = {
    400: "Revise os campos informados e tente novamente.",
    401: "Faca login novamente para continuar.",
    403: "Use um usuario com permissao para esta operacao.",
    404: "Atualize a lista e tente selecionar o registro de novo.",
    409: "Verifique se ja existe outro cadastro com esses dados.",
    413: "Reduza o tamanho do arquivo ou envie uma URL valida.",
    500: "Tente novamente em instantes. Se persistir, acione o suporte.",
  };

  return suggestions[statusCode] ?? "Revise a acao e tente novamente.";
}

function isZodValidationError(error) {
  return error?.name === "ZodError" && Array.isArray(error?.issues);
}

function formatZodIssues(issues) {
  return issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

function getUniqueConstraintFields(error) {
  const target = error?.meta?.target;

  if (Array.isArray(target) && target.length > 0) {
    return target.join(", ");
  }

  return "informado";
}

function getForeignKeyField(error) {
  const fieldName = error?.meta?.field_name;

  if (typeof fieldName === "string" && fieldName.trim()) {
    return fieldName;
  }

  return "relacionamento informado";
}

function getPrismaErrorCode(error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code;
  }

  if (typeof error?.code === "string" && error.code.startsWith("P")) {
    return error.code;
  }

  return null;
}

function isPayloadTooLargeError(error) {
  return (
    error?.type === "entity.too.large" ||
    error?.status === 413 ||
    error?.statusCode === 413 ||
    error?.name === "PayloadTooLargeError"
  );
}

export function errorHandler(error, _request, response, _next) {
  if (isPayloadTooLargeError(error)) {
    return response.status(413).json(
      buildErrorResponse(
        "Corpo da requisicao muito grande. Nao envie imagens em base64; use uma URL http(s) ou cadastre sem imagem.",
        undefined,
        getSuggestionForStatus(413),
      ),
    );
  }

  if (error instanceof AppError) {
    return response
      .status(error.statusCode)
      .json(buildErrorResponse(error.message, undefined, getSuggestionForStatus(error.statusCode)));
  }

  if (isZodValidationError(error)) {
    return response.status(400).json(
      buildErrorResponse(
        "Dados de entrada invalidos.",
        formatZodIssues(error.issues),
        getSuggestionForStatus(400),
      ),
    );
  }

  switch (getPrismaErrorCode(error)) {
    case "P2025":
      return response
        .status(404)
        .json(buildErrorResponse("Registro nao encontrado.", undefined, getSuggestionForStatus(404)));

    case "P2002": {
      const fields = getUniqueConstraintFields(error);

      return response.status(409).json(
        buildErrorResponse(
          `Ja existe um registro com o valor informado para o campo ${fields}.`,
          undefined,
          getSuggestionForStatus(409),
        ),
      );
    }

    case "P2003": {
      const field = getForeignKeyField(error);

      return response.status(400).json(
        buildErrorResponse(
          `Operacao invalida: a referencia do campo ${field} nao existe.`,
          undefined,
          getSuggestionForStatus(400),
        ),
      );
    }

    default:
      break;
  }

  console.error(error);

  return response
    .status(500)
    .json(buildErrorResponse("Erro interno do servidor.", undefined, getSuggestionForStatus(500)));
}
