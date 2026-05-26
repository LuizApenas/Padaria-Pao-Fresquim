import { prisma } from "../config/prisma.js";
import { FormaPagamento, StatusVenda } from "../domain/enums.js";
import { AppError } from "../utils/AppError.js";
import { spDayBounds } from "../utils/timezone.js";
import {
  ensureEnumValue,
  ensurePositiveInteger,
  parseId,
  requireFields,
  toMoney,
} from "../utils/validation.js";

const vendaInclude = {
  cliente: true,
  funcionario: {
    select: {
      id: true,
      nome: true,
      cpf: true,
      telefone: true,
      endereco: true,
      matricula: true,
      cargo: true,
      dataAdmissao: true,
      contatoEmergencia: true,
      role: true,
      email: true,
      ativo: true,
      criadoEm: true,
      atualizadoEm: true,
    },
  },
  itens: {
    include: {
      produto: true,
    },
  },
};

function validateVendaEnums(data) {
  ensureEnumValue(
    data.formaPagamento,
    Object.values(FormaPagamento),
    "formaPagamento",
  );
  ensureEnumValue(data.status, Object.values(StatusVenda), "status");
}

function validateItens(itens) {
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new AppError("A venda deve possuir ao menos um item.", 400);
  }

  const produtoIds = new Set();

  for (const [index, item] of itens.entries()) {
    requireFields(item, ["produtoId", "quantidade"]);

    const produtoId = parseId(item.produtoId, `itens[${index}].produtoId`);

    if (produtoIds.has(produtoId)) {
      throw new AppError("Nao informe o mesmo produto mais de uma vez na venda.", 400);
    }

    produtoIds.add(produtoId);
    ensurePositiveInteger(item.quantidade, `itens[${index}].quantidade`);
  }
}

async function validateFuncionario(funcionarioId, tx = prisma) {
  const funcionario = await tx.funcionario.findUnique({
    where: { id: parseId(funcionarioId, "funcionarioId") },
  });

  if (!funcionario) {
    throw new AppError("Funcionario informado nao existe.", 400);
  }

  if (!funcionario.ativo) {
    throw new AppError("Funcionario informado esta inativo.", 400);
  }

  return funcionario;
}

async function validateCliente(clienteId, formaPagamento, tx = prisma) {
  if (formaPagamento === FormaPagamento.FIADO && !clienteId) {
    throw new AppError("Vendas no fiado exigem clienteId.", 400);
  }

  if (!clienteId) {
    return null;
  }

  const cliente = await tx.cliente.findUnique({
    where: { id: parseId(clienteId, "clienteId") },
  });

  if (!cliente) {
    throw new AppError("Cliente informado nao existe.", 400);
  }

  if (!cliente.ativo) {
    throw new AppError("Cliente informado esta inativo.", 400);
  }

  if (formaPagamento === FormaPagamento.FIADO && cliente.statusSerasa === "NEGATIVADO") {
    throw new AppError("Cliente negativado nao pode comprar no fiado.", 400);
  }

  return cliente;
}

async function buildItensData(itens, tx = prisma) {
  validateItens(itens);

  const produtoIds = itens.map((item) => parseId(item.produtoId, "produtoId"));
  const produtos = await tx.produto.findMany({
    where: { id: { in: produtoIds } },
  });
  const produtosById = new Map(produtos.map((produto) => [produto.id, produto]));
  let valorTotal = 0;

  const itensData = itens.map((item) => {
    const produtoId = parseId(item.produtoId, "produtoId");
    const produto = produtosById.get(produtoId);

    if (!produto) {
      throw new AppError(`Produto ${produtoId} nao existe.`, 400);
    }

    if (!produto.ativo) {
      throw new AppError(`Produto ${produtoId} esta inativo.`, 400);
    }

    const quantidade = ensurePositiveInteger(item.quantidade, "quantidade");
    const subtotal = Number(produto.precoBase) * quantidade;

    valorTotal += subtotal;

    return {
      produtoId,
      quantidade,
      subtotal: toMoney(subtotal),
    };
  });

  return {
    itensData,
    valorTotal: toMoney(valorTotal),
  };
}

async function buildVendaData(data, tx = prisma) {
  requireFields(data, ["funcionarioId", "formaPagamento", "itens"]);
  validateVendaEnums(data);

  await validateFuncionario(data.funcionarioId, tx);
  await validateCliente(data.clienteId, data.formaPagamento, tx);

  const { itensData, valorTotal } = await buildItensData(data.itens, tx);

  return {
    vendaData: {
      dataHora: data.dataHora ? new Date(data.dataHora) : undefined,
      valorTotal,
      formaPagamento: data.formaPagamento,
      status: data.status ?? StatusVenda.PENDENTE,
      funcionarioId: parseId(data.funcionarioId, "funcionarioId"),
      clienteId: data.clienteId ? parseId(data.clienteId, "clienteId") : null,
      itens: {
        create: itensData,
      },
    },
  };
}

async function atualizarSaldoFiado(tx, clienteId, valor) {
  if (!clienteId || valor === 0) {
    return;
  }

  await tx.contaFiado.upsert({
    where: { clienteId },
    update: {
      saldoDevedor: {
        increment: toMoney(valor),
      },
    },
    create: {
      clienteId,
      saldoDevedor: toMoney(valor),
      statusNotificacao: "PENDENTE",
    },
  });
}

export async function createVenda(data) {
  return prisma.$transaction(async (tx) => {
    const { vendaData } = await buildVendaData(data, tx);

    if (vendaData.dataHora && Number.isNaN(vendaData.dataHora.getTime())) {
      throw new AppError("O campo dataHora deve conter uma data valida.", 400);
    }

    const venda = await tx.venda.create({
      data: vendaData,
      include: vendaInclude,
    });

    if (
      venda.formaPagamento === FormaPagamento.FIADO &&
      venda.status !== StatusVenda.CANCELADA
    ) {
      await atualizarSaldoFiado(tx, venda.clienteId, Number(venda.valorTotal));
    }

    return venda;
  });
}

export async function listVendas({ inicio, fim, funcionarioId, page = 1, limit = 10 } = {}) {
  const paginaAtual = Math.max(Number(page) || 1, 1);
  const limiteAtual = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const skip = (paginaAtual - 1) * limiteAtual;
  const where = {};

  if (funcionarioId) {
    where.funcionarioId = parseId(funcionarioId, "funcionarioId");
  }

  if (inicio || fim) {
    where.dataHora = {};

    const inicioIso = inicio || fim;
    const fimIso = fim || inicio;
    const { inicio: dataInicio, fim: dataFim } = spDayBounds(inicioIso, fimIso);

    if (!dataInicio || !dataFim) {
      throw new AppError("Os filtros inicio e fim devem conter datas validas no formato YYYY-MM-DD.", 400);
    }

    if (inicio) where.dataHora.gte = dataInicio;
    if (fim) where.dataHora.lte = dataFim;
  }

  const [vendas, total, agregados] = await prisma.$transaction([
    prisma.venda.findMany({
      where,
      orderBy: { dataHora: "desc" },
      skip,
      take: limiteAtual,
      include: vendaInclude,
    }),
    prisma.venda.count({ where }),
    prisma.venda.aggregate({
      where,
      _sum: { valorTotal: true },
      _avg: { valorTotal: true },
    }),
  ]);
  const canceladas = await prisma.venda.count({
    where: { ...where, status: StatusVenda.CANCELADA },
  });
  const operadoresAtivos = await prisma.funcionario.count({
    where: { ativo: true },
  });

  return {
    data: vendas,
    pagination: {
      page: paginaAtual,
      limit: limiteAtual,
      total,
      totalPages: Math.max(Math.ceil(total / limiteAtual), 1),
    },
    summary: {
      totalSold: Number(agregados._sum.valorTotal ?? 0),
      averageTicket: Number(agregados._avg.valorTotal ?? 0),
      canceledSales: canceladas,
      activeOperators: operadoresAtivos,
    },
  };
}

export async function getVendaById(idParam) {
  const id = parseId(idParam);
  const venda = await prisma.venda.findUnique({
    where: { id },
    include: vendaInclude,
  });

  if (!venda) {
    throw new AppError("Venda nao encontrada.", 404);
  }

  return venda;
}

export async function updateVenda(idParam, data) {
  const id = parseId(idParam);

  return prisma.$transaction(async (tx) => {
    const vendaAtual = await tx.venda.findUnique({
      where: { id },
      include: { itens: true },
    });

    if (!vendaAtual) {
      throw new AppError("Venda nao encontrada.", 404);
    }

    validateVendaEnums(data);

    const formaPagamento = data.formaPagamento ?? vendaAtual.formaPagamento;
    const funcionarioId = data.funcionarioId ?? vendaAtual.funcionarioId;
    const clienteId = Object.prototype.hasOwnProperty.call(data, "clienteId")
      ? data.clienteId
      : vendaAtual.clienteId;
    const updateData = {
      formaPagamento: data.formaPagamento,
      status: data.status,
      funcionarioId: parseId(funcionarioId, "funcionarioId"),
      clienteId: clienteId ? parseId(clienteId, "clienteId") : null,
    };
    let novoValorTotal = Number(vendaAtual.valorTotal);

    await validateFuncionario(funcionarioId, tx);
    await validateCliente(clienteId, formaPagamento, tx);

    if (data.dataHora !== undefined) {
      const dataHora = new Date(data.dataHora);

      if (Number.isNaN(dataHora.getTime())) {
        throw new AppError("O campo dataHora deve conter uma data valida.", 400);
      }

      updateData.dataHora = dataHora;
    }

    if (data.itens !== undefined) {
      const { itensData, valorTotal } = await buildItensData(data.itens, tx);

      updateData.valorTotal = valorTotal;
      novoValorTotal = Number(valorTotal);

      await tx.itemVenda.deleteMany({ where: { vendaId: id } });
      await tx.itemVenda.createMany({
        data: itensData.map((item) => ({ ...item, vendaId: id })),
      });
    }

    const fiadoAnteriorAtivo =
      vendaAtual.formaPagamento === FormaPagamento.FIADO &&
      vendaAtual.status !== StatusVenda.CANCELADA;
    const fiadoNovoAtivo =
      formaPagamento === FormaPagamento.FIADO &&
      (data.status ?? vendaAtual.status) !== StatusVenda.CANCELADA;

    if (fiadoAnteriorAtivo) {
      await atualizarSaldoFiado(tx, vendaAtual.clienteId, -Number(vendaAtual.valorTotal));
    }

    if (fiadoNovoAtivo) {
      await atualizarSaldoFiado(tx, clienteId, novoValorTotal);
    }

    return tx.venda.update({
      where: { id },
      data: updateData,
      include: vendaInclude,
    });
  });
}

export async function deleteVenda(idParam) {
  const id = parseId(idParam);

  await prisma.$transaction(async (tx) => {
    const venda = await tx.venda.findUnique({ where: { id } });

    if (!venda) {
      throw new AppError("Venda nao encontrada.", 404);
    }

    if (
      venda.formaPagamento === FormaPagamento.FIADO &&
      venda.status !== StatusVenda.CANCELADA
    ) {
      await atualizarSaldoFiado(tx, venda.clienteId, -Number(venda.valorTotal));
    }

    await tx.venda.delete({ where: { id } });
  });
}

export async function cancelarVenda(idParam) {
  const id = parseId(idParam);

  return prisma.$transaction(async (tx) => {
    const venda = await tx.venda.findUnique({
      where: { id },
      include: vendaInclude,
    });

    if (!venda) {
      throw new AppError("Venda nao encontrada.", 404);
    }

    if (venda.status === StatusVenda.CANCELADA) {
      return venda;
    }

    if (venda.formaPagamento === FormaPagamento.FIADO) {
      await atualizarSaldoFiado(tx, venda.clienteId, -Number(venda.valorTotal));
    }

    return tx.venda.update({
      where: { id },
      data: { status: StatusVenda.CANCELADA },
      include: vendaInclude,
    });
  });
}
