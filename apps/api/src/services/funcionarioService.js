import bcrypt from "bcryptjs";

import { prisma } from "../config/prisma.js";
import { Role } from "../domain/enums.js";
import { createSupabaseUser } from "./supabaseAuthService.js";
import { AppError } from "../utils/AppError.js";
import { validateStrongPassword } from "../utils/password.js";
import { ensureEnumValue, parseId, requireFields } from "../utils/validation.js";

const funcionarioInclude = {
  vendas: true,
  registrosPonto: true,
  ferias: true,
  licencas: true,
  atestados: true,
};

function serializeFuncionario(funcionario) {
  if (!funcionario) {
    return funcionario;
  }

  const { senhaHash: _senhaHash, ...safeFuncionario } = funcionario;

  return safeFuncionario;
}

async function buildFuncionarioData(data, { partial = false } = {}) {
  if (!partial) {
    requireFields(data, [
      "nome",
      "cpf",
      "telefone",
      "endereco",
      "matricula",
      "cargo",
      "dataAdmissao",
      "contatoEmergencia",
      "role",
      "email",
    ]);

    if (!data.senha) {
      throw new AppError("O campo senha e obrigatorio.", 400);
    }
  }

  ensureEnumValue(data.role, Object.values(Role), "role");

  const funcionarioData = {
    nome: data.nome,
    cpf: data.cpf,
    telefone: data.telefone,
    endereco: data.endereco,
    matricula: data.matricula,
    cargo: data.cargo,
    contatoEmergencia: data.contatoEmergencia,
    role: data.role,
    email: data.email,
    ativo: data.ativo,
  };

  if (data.dataAdmissao !== undefined) {
    const dataAdmissao = new Date(data.dataAdmissao);

    if (Number.isNaN(dataAdmissao.getTime())) {
      throw new AppError("O campo dataAdmissao deve conter uma data valida.", 400);
    }

    funcionarioData.dataAdmissao = dataAdmissao;
  }

  if (data.senha) {
    validateStrongPassword(data.senha);
    funcionarioData.senhaHash = await bcrypt.hash(data.senha, 10);
  }

  return funcionarioData;
}

export async function createFuncionario(data) {
  validateStrongPassword(data.senha);

  await createSupabaseUser({
    email: data.email,
    password: data.senha,
    metadata: {
      nome: data.nome,
      role: data.role,
      cargo: data.cargo,
    },
  });

  const funcionario = await prisma.funcionario.create({
    data: await buildFuncionarioData(data),
    include: funcionarioInclude,
  });

  return serializeFuncionario(funcionario);
}

export async function listFuncionarios({ busca = "", page = 1, limit = 10 } = {}) {
  const paginaAtual = Math.max(Number(page) || 1, 1);
  const limiteAtual = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const skip = (paginaAtual - 1) * limiteAtual;
  const termoBusca = String(busca).trim();
  const where = {
    ativo: true,
    ...(termoBusca
      ? {
          OR: [
            { nome: { contains: termoBusca, mode: "insensitive" } },
            { cpf: { contains: termoBusca, mode: "insensitive" } },
            { email: { contains: termoBusca, mode: "insensitive" } },
            { matricula: { contains: termoBusca, mode: "insensitive" } },
            { cargo: { contains: termoBusca, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [funcionarios, total] = await prisma.$transaction([
    prisma.funcionario.findMany({
      where,
      orderBy: { id: "asc" },
      skip,
      take: limiteAtual,
      include: funcionarioInclude,
    }),
    prisma.funcionario.count({ where }),
  ]);

  return {
    data: funcionarios.map(serializeFuncionario),
    pagination: {
      page: paginaAtual,
      limit: limiteAtual,
      total,
      totalPages: Math.max(Math.ceil(total / limiteAtual), 1),
    },
  };
}

export async function listFuncionariosLegacy() {
  const funcionarios = await prisma.funcionario.findMany({
    where: { ativo: true },
    orderBy: { id: "asc" },
    include: funcionarioInclude,
  });

  return funcionarios.map(serializeFuncionario);
}

export async function getFuncionarioById(idParam) {
  const id = parseId(idParam);
  const funcionario = await prisma.funcionario.findFirst({
    where: { id, ativo: true },
    include: funcionarioInclude,
  });

  if (!funcionario) {
    throw new AppError("Funcionario nao encontrado.", 404);
  }

  return serializeFuncionario(funcionario);
}

export async function updateFuncionario(idParam, data) {
  const id = parseId(idParam);

  await getFuncionarioById(id);

  const funcionario = await prisma.funcionario.update({
    where: { id },
    data: await buildFuncionarioData(data, { partial: true }),
    include: funcionarioInclude,
  });

  return serializeFuncionario(funcionario);
}

export async function deleteFuncionario(idParam) {
  const id = parseId(idParam);

  await getFuncionarioById(id);
  await prisma.funcionario.update({
    where: { id },
    data: { ativo: false },
  });
}
