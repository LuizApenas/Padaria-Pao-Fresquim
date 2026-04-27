// apps/api/src/repositories/clienteRepository.js
import { prisma } from "../config/prisma.js";

// Este repository e o unico arquivo que conversa diretamente com o Prisma para Cliente.
// Mantenha os detalhes de banco aqui para controllers e services ficarem faceis de ler.
export const clienteRepository = {
  // Retorna todos os clientes ordenados do mais novo para o mais antigo.
  findAll() {
    return prisma.cliente.findMany({
      orderBy: {
        criadoEm: "desc",
      },
    });
  },

  // Busca um cliente pelo id numerico.
  findById(id) {
    return prisma.cliente.findUnique({
      where: { id },
    });
  },

  // Cria um cliente usando apenas os campos aceitos pela API.
  create(data) {
    return prisma.cliente.create({
      data,
    });
  },

  // Atualiza um cliente. O Prisma dispara P2025 quando o id nao existe.
  update(id, data) {
    return prisma.cliente.update({
      where: { id },
      data,
    });
  },

  // Remove um cliente. O Prisma dispara P2025 quando o id nao existe.
  delete(id) {
    return prisma.cliente.delete({
      where: { id },
    });
  },
};
