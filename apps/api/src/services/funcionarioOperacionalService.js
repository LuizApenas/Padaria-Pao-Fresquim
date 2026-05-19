import { prisma } from "../config/prisma.js";
import { uploadFuncionarioPdf } from "./funcionarioDocumentosStorageService.js";
import { AppError } from "../utils/AppError.js";
import { ensureEnumValue, parseId, requireFields } from "../utils/validation.js";

async function ensureFuncionario(idParam) {
  const id = parseId(idParam);
  const funcionario = await prisma.funcionario.findFirst({
    where: { id, ativo: true },
  });

  if (!funcionario) {
    throw new AppError("Funcionario nao encontrado ou inativo.", 404);
  }

  return funcionario;
}

function parseDate(value, fieldName) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(`O campo ${fieldName} deve conter uma data valida.`, 400);
  }

  return date;
}

export async function registrarPonto(funcionarioId, data) {
  await ensureFuncionario(funcionarioId);
  requireFields(data, ["tipoRegistro"]);
  ensureEnumValue(data.tipoRegistro, ["ENTRADA", "SAIDA"], "tipoRegistro");

  return prisma.registroPonto.create({
    data: {
      funcionarioId: parseId(funcionarioId),
      tipoRegistro: data.tipoRegistro,
      dataHoraBatida: data.dataHoraBatida ? parseDate(data.dataHoraBatida, "dataHoraBatida") : undefined,
    },
  });
}

export async function listarPonto(funcionarioId, { mes, ano } = {}) {
  const id = parseId(funcionarioId);
  await ensureFuncionario(id);
  const where = { funcionarioId: id };

  if (mes && ano) {
    const month = Number(mes) - 1;
    const year = Number(ano);

    if (month < 0 || month > 11 || !Number.isInteger(year)) {
      throw new AppError("Filtros mes e ano invalidos.", 400);
    }

    where.dataHoraBatida = {
      gte: new Date(year, month, 1),
      lt: new Date(year, month + 1, 1),
    };
  }

  return prisma.registroPonto.findMany({
    where,
    orderBy: { dataHoraBatida: "desc" },
  });
}

export async function registrarFerias(funcionarioId, data) {
  const funcionario = await ensureFuncionario(funcionarioId);
  requireFields(data, ["dataInicio", "dataFim"]);
  const dataInicio = parseDate(data.dataInicio, "dataInicio");
  const direitoEm = new Date(funcionario.dataAdmissao);

  direitoEm.setFullYear(direitoEm.getFullYear() + 1);

  if (dataInicio < direitoEm) {
    throw new AppError(`Funcionario so adquire direito a ferias em ${direitoEm.toISOString().slice(0, 10)}.`, 400);
  }

  return prisma.ferias.create({
    data: {
      funcionarioId: funcionario.id,
      dataInicio,
      dataFim: parseDate(data.dataFim, "dataFim"),
      observacao: data.observacao,
    },
  });
}

export async function registrarLicenca(funcionarioId, data) {
  await ensureFuncionario(funcionarioId);
  requireFields(data, ["tipo", "dataInicio"]);

  return prisma.licenca.create({
    data: {
      funcionarioId: parseId(funcionarioId),
      tipo: data.tipo,
      dataInicio: parseDate(data.dataInicio, "dataInicio"),
      retornoPrevistoEm: data.retornoPrevistoEm ? parseDate(data.retornoPrevistoEm, "retornoPrevistoEm") : null,
      observacao: data.observacao,
    },
  });
}

export async function listarAtestados(funcionarioId) {
  const id = parseId(funcionarioId);
  await ensureFuncionario(id);

  return prisma.atestado.findMany({
    where: { funcionarioId: id },
    orderBy: { dataEntrega: "desc" },
  });
}

export async function uploadDocumento(funcionarioId, data) {
  requireFields(data, ["fileName", "contentBase64", "dataEntrega"]);

  const buffer = Buffer.from(data.contentBase64, "base64");

  if (!buffer.length) {
    throw new AppError("Conteudo do PDF invalido.", 400);
  }

  const arquivoUrl = await uploadFuncionarioPdf(funcionarioId, data.fileName, buffer);

  return registrarAtestado(funcionarioId, {
    arquivoUrl,
    dataEntrega: data.dataEntrega,
    observacao: data.observacao,
  });
}

export async function registrarAtestado(funcionarioId, data) {
  await ensureFuncionario(funcionarioId);
  requireFields(data, ["arquivoUrl", "dataEntrega"]);

  return prisma.atestado.create({
    data: {
      funcionarioId: parseId(funcionarioId),
      arquivoUrl: data.arquivoUrl,
      dataEntrega: parseDate(data.dataEntrega, "dataEntrega"),
      observacao: data.observacao,
    },
  });
}

export async function gerarDadosOperacionaisFake(funcionarioId) {
  const funcionario = await ensureFuncionario(funcionarioId);
  const now = new Date();
  const todayStart = new Date(now);

  todayStart.setHours(8, 0, 0, 0);

  const todayEnd = new Date(now);
  todayEnd.setHours(17, 30, 0, 0);

  const nextVacationStart = new Date(now);
  nextVacationStart.setMonth(nextVacationStart.getMonth() + 2);

  const nextVacationEnd = new Date(nextVacationStart);
  nextVacationEnd.setDate(nextVacationEnd.getDate() + 14);

  const [entrada, saida, ferias, licenca, atestado] = await prisma.$transaction([
    prisma.registroPonto.create({
      data: { funcionarioId: funcionario.id, tipoRegistro: "ENTRADA", dataHoraBatida: todayStart },
    }),
    prisma.registroPonto.create({
      data: { funcionarioId: funcionario.id, tipoRegistro: "SAIDA", dataHoraBatida: todayEnd },
    }),
    prisma.ferias.create({
      data: {
        funcionarioId: funcionario.id,
        dataInicio: nextVacationStart,
        dataFim: nextVacationEnd,
        observacao: "Registro fake gerado para prototipo.",
      },
    }),
    prisma.licenca.create({
      data: {
        funcionarioId: funcionario.id,
        tipo: "Treinamento",
        dataInicio: now,
        retornoPrevistoEm: now,
        observacao: "Licenca fake de demonstracao.",
      },
    }),
    prisma.atestado.create({
      data: {
        funcionarioId: funcionario.id,
        arquivoUrl: "https://example.com/atestados/fake.pdf",
        dataEntrega: now,
        observacao: "Atestado fake de demonstracao.",
      },
    }),
  ]);

  return { entrada, saida, ferias, licenca, atestado };
}
