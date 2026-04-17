import "dotenv/config";

import bcrypt from "bcryptjs";

import { prisma } from "../src/config/prisma.js";

// Cria os usuários base do sistema com senha hash para não gravar senha pura no banco.
async function seedFuncionarios() {
  const senhaHash = await bcrypt.hash("123456", 10);

  // Conjunto mínimo de perfis para validar autenticação e permissões futuramente.
  const funcionarios = [
    {
      nome: "Sr. Joaquim",
      cpf: "11111111111",
      telefone: "11999990001",
      endereco: "Rua do Pão, 100 - Centro",
      matricula: "FUNC-001",
      cargo: "Proprietário",
      dataAdmissao: new Date("2021-01-12"),
      contatoEmergencia: "Maria Joaquim - 11999990002",
      role: "PROPRIETARIO",
      email: "joaquim@paofresquim.com",
      senhaHash,
    },
    {
      nome: "Ana Clara Souza",
      cpf: "11111111112",
      telefone: "11999990003",
      endereco: "Rua da Padaria, 45 - Centro",
      matricula: "FUNC-002",
      cargo: "Atendente",
      dataAdmissao: new Date("2023-04-03"),
      contatoEmergencia: "Carlos Souza - 11999990004",
      role: "ATENDENTE",
      email: "ana.souza@paofresquim.com",
      senhaHash,
    },
    {
      nome: "Bruno Lima",
      cpf: "11111111113",
      telefone: "11999990005",
      endereco: "Rua do Trigo, 20 - Centro",
      matricula: "FUNC-003",
      cargo: "Atendente",
      dataAdmissao: new Date("2023-08-15"),
      contatoEmergencia: "Paula Lima - 11999990006",
      role: "ATENDENTE",
      email: "bruno.lima@paofresquim.com",
      senhaHash,
    },
    {
      nome: "João José da Silva",
      cpf: "11111111114",
      telefone: "11999990007",
      endereco: "Rua do Forno, 8 - Centro",
      matricula: "FUNC-004",
      cargo: "Padeiro",
      dataAdmissao: new Date("2022-09-10"),
      contatoEmergencia: "Sandra Silva - 11999990008",
      role: "PADEIRO",
      email: "joao.silva@paofresquim.com",
      senhaHash,
    },
  ];

  // Upsert evita duplicar registros quando o seed for executado mais de uma vez.
  for (const funcionario of funcionarios) {
    await prisma.funcionario.upsert({
      where: { email: funcionario.email },
      update: funcionario,
      create: funcionario,
    });
  }
}

// Cadastra um catálogo inicial enxuto, suficiente para testar vendas e relatórios.
async function seedProdutos() {
  const produtos = [
    { codigoBarras: "7891000000011", nome: "Pão Francês", precoBase: "1.20", categoria: "Pães" },
    { codigoBarras: "7891000000012", nome: "Pão de Queijo", precoBase: "3.50", categoria: "Pães" },
    { codigoBarras: "7891000000013", nome: "Bolo de Fubá", precoBase: "18.90", categoria: "Bolos" },
    { codigoBarras: "7891000000014", nome: "Broa de Milho", precoBase: "7.50", categoria: "Pães" },
    { codigoBarras: "7891000000015", nome: "Café Coado", precoBase: "4.00", categoria: "Bebidas" },
    { codigoBarras: "7891000000016", nome: "Coca-Cola 2L", precoBase: "11.90", categoria: "Bebidas" },
  ];

  for (const produto of produtos) {
    await prisma.produto.upsert({
      where: { codigoBarras: produto.codigoBarras },
      update: produto,
      create: produto,
    });
  }
}

// Cria clientes de exemplo, incluindo um negativado para testar regras de fiado.
async function seedClientes() {
  const clientes = [
    {
      nome: "João Batista",
      telefone: "11988880001",
      endereco: "Rua das Flores, 123 - Centro",
      cpf: "22222222221",
      statusSerasa: "REGULAR",
    },
    {
      nome: "Maria Cavalcanti",
      telefone: "11988880002",
      endereco: "Avenida Principal, 55 - Centro",
      cpf: "22222222222",
      statusSerasa: "REGULAR",
    },
    {
      nome: "Ricardo Lemos",
      telefone: "11988880003",
      endereco: "Rua do Mercado, 77 - Centro",
      cpf: "22222222223",
      statusSerasa: "NEGATIVADO",
    },
    {
      nome: "Ana Beatriz Mendes",
      telefone: "11988880004",
      endereco: "Rua da Praça, 18 - Centro",
      cpf: "22222222224",
      statusSerasa: "REGULAR",
    },
    {
      nome: "Mariana Lima",
      telefone: "11988880005",
      endereco: "Rua do Café, 40 - Centro",
      cpf: "22222222225",
      statusSerasa: "REGULAR",
    },
    {
      nome: "Jorge Camargo",
      telefone: "11988880006",
      endereco: "Rua da Feira, 91 - Centro",
      cpf: "22222222226",
      statusSerasa: "REGULAR",
    },
  ];

  for (const cliente of clientes) {
    await prisma.cliente.upsert({
      where: { cpf: cliente.cpf },
      update: cliente,
      create: cliente,
    });
  }
}

// Cria contas de fiado para clientes selecionados e simula estados diferentes de cobrança.
async function seedContaFiado() {
  const joao = await prisma.cliente.findUnique({ where: { cpf: "22222222221" } });
  const mariana = await prisma.cliente.findUnique({ where: { cpf: "22222222225" } });

  // Só cria a conta se o cliente existir, preservando a execução segura do seed.
  if (joao) {
    await prisma.contaFiado.upsert({
      where: { clienteId: joao.id },
      update: {
        saldoDevedor: "24.30",
        statusNotificacao: "PENDENTE",
      },
      create: {
        clienteId: joao.id,
        saldoDevedor: "24.30",
        statusNotificacao: "PENDENTE",
      },
    });
  }

  if (mariana) {
    await prisma.contaFiado.upsert({
      where: { clienteId: mariana.id },
      update: {
        saldoDevedor: "11.90",
        statusNotificacao: "ENVIADA",
      },
      create: {
        clienteId: mariana.id,
        saldoDevedor: "11.90",
        statusNotificacao: "ENVIADA",
      },
    });
  }
}

// Gera vendas iniciais para validar histórico, fiado e status cancelado.
async function seedVendas() {
  const totalVendas = await prisma.venda.count();

  // Se já houver vendas, não recria tudo de novo para manter o seed idempotente.
  if (totalVendas > 0) {
    return;
  }

  // Busca os registros necessários para montar as relações da venda.
  const atendente = await prisma.funcionario.findUnique({
    where: { email: "ana.souza@paofresquim.com" },
  });
  const proprietario = await prisma.funcionario.findUnique({
    where: { email: "joaquim@paofresquim.com" },
  });
  const clienteJoao = await prisma.cliente.findUnique({ where: { cpf: "22222222221" } });
  const clienteMaria = await prisma.cliente.findUnique({ where: { cpf: "22222222222" } });

  const pao = await prisma.produto.findUnique({ where: { codigoBarras: "7891000000011" } });
  const bolo = await prisma.produto.findUnique({ where: { codigoBarras: "7891000000013" } });
  const coca = await prisma.produto.findUnique({ where: { codigoBarras: "7891000000016" } });

  // Se algum vínculo obrigatório não existir, interrompe essa parte do seed.
  if (!atendente || !proprietario || !clienteJoao || !clienteMaria || !pao || !bolo || !coca) {
    return;
  }

  // Venda concluída em dinheiro para um cliente identificado.
  await prisma.venda.create({
    data: {
      dataHora: new Date(),
      valorTotal: "21.30",
      formaPagamento: "DINHEIRO",
      status: "CONCLUIDA",
      funcionarioId: atendente.id,
      clienteId: clienteMaria.id,
      itens: {
        create: [
          {
            produtoId: pao.id,
            quantidade: 5,
            subtotal: "6.00",
          },
          {
            produtoId: bolo.id,
            quantidade: 1,
            subtotal: "18.90",
          },
        ],
      },
    },
  });

  // Venda em fiado para popular a carteira de devedores.
  await prisma.venda.create({
    data: {
      dataHora: new Date(),
      valorTotal: "11.90",
      formaPagamento: "FIADO",
      status: "CONCLUIDA",
      funcionarioId: atendente.id,
      clienteId: clienteJoao.id,
      itens: {
        create: [
          {
            produtoId: coca.id,
            quantidade: 1,
            subtotal: "11.90",
          },
        ],
      },
    },
  });

  // Venda cancelada para validar futuros relatórios e regras de negócio.
  await prisma.venda.create({
    data: {
      dataHora: new Date(),
      valorTotal: "6.00",
      formaPagamento: "PIX",
      status: "CANCELADA",
      funcionarioId: proprietario.id,
      clienteId: clienteMaria.id,
      itens: {
        create: [
          {
            produtoId: pao.id,
            quantidade: 5,
            subtotal: "6.00",
          },
        ],
      },
    },
  });
}

// Orquestra a ordem do seed para respeitar dependências entre tabelas.
async function main() {
  await seedFuncionarios();
  await seedProdutos();
  await seedClientes();
  await seedContaFiado();
  await seedVendas();
}

// Finaliza a conexão com o banco em caso de sucesso.
main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed executado com sucesso.");
  })
  // Em caso de erro, registra a falha, fecha a conexão e encerra o processo.
  .catch(async (error) => {
    console.error("Erro ao executar seed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
