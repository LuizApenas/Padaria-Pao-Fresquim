import "dotenv/config";

import bcrypt from "bcryptjs";

import { prisma } from "../src/config/prisma.js";
import { SEED_PROPRIETARIO_EMAIL, SEED_PROPRIETARIO_TELEFONE_LOCAL } from "../src/constants/seedDefaults.js";

const defaultFuncionarioPassword = process.env.SUPABASE_AUTH_SEED_PASSWORD;

const image = (photoId) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=900&q=80`;

const produtosSeed = [
  {
    codigoBarras: "7891000001001",
    nome: "Pao Frances",
    precoBase: "1.20",
    categoria: "Paes",
    imagemUrl: image("photo-1509440159596-0249088772ff"),
  },
  {
    codigoBarras: "7891000001002",
    nome: "Pao de Queijo",
    precoBase: "3.50",
    categoria: "Paes",
    imagemUrl: image("photo-1608198093002-ad4e005484ec"),
  },
  {
    codigoBarras: "7891000001003",
    nome: "Baguete Artesanal",
    precoBase: "8.90",
    categoria: "Paes",
    imagemUrl: image("photo-1589367920969-ab8e050bbb04"),
  },
  {
    codigoBarras: "7891000001004",
    nome: "Pao Integral",
    precoBase: "12.90",
    categoria: "Paes",
    imagemUrl: image("photo-1549931319-a545dcf3bc73"),
  },
  {
    codigoBarras: "7891000001005",
    nome: "Croissant Manteiga",
    precoBase: "7.90",
    categoria: "Viennoiserie",
    imagemUrl: image("photo-1555507036-ab1f4038808a"),
  },
  {
    codigoBarras: "7891000001006",
    nome: "Sonho Creme",
    precoBase: "6.50",
    categoria: "Doces",
    imagemUrl: image("photo-1514517220033-8ce97a34a7b6"),
  },
  {
    codigoBarras: "7891000001007",
    nome: "Bolo de Fuba",
    precoBase: "18.90",
    categoria: "Bolos",
    imagemUrl: image("photo-1578985545062-69928b1d9587"),
  },
  {
    codigoBarras: "7891000001008",
    nome: "Bolo de Cenoura",
    precoBase: "24.90",
    categoria: "Bolos",
    imagemUrl: image("photo-1602351447937-745cb720612f"),
  },
  {
    codigoBarras: "7891000001009",
    nome: "Bolo de Chocolate",
    precoBase: "29.90",
    categoria: "Bolos",
    imagemUrl: image("photo-1578985545062-69928b1d9587"),
  },
  {
    codigoBarras: "7891000001010",
    nome: "Torta de Frango",
    precoBase: "12.90",
    categoria: "Salgados",
    imagemUrl: image("photo-1604909052743-94e838986d24"),
  },
  {
    codigoBarras: "7891000001011",
    nome: "Coxinha de Frango",
    precoBase: "7.50",
    categoria: "Salgados",
    imagemUrl: image("photo-1625938144755-652e08e359b7"),
  },
  {
    codigoBarras: "7891000001012",
    nome: "Empada de Palmito",
    precoBase: "8.50",
    categoria: "Salgados",
    imagemUrl: image("photo-1601050690597-df0568f70950"),
  },
  {
    codigoBarras: "7891000001013",
    nome: "Misto Quente",
    precoBase: "13.90",
    categoria: "Lanches",
    imagemUrl: image("photo-1528735602780-2552fd46c7af"),
  },
  {
    codigoBarras: "7891000001014",
    nome: "Sanduiche Natural",
    precoBase: "15.90",
    categoria: "Lanches",
    imagemUrl: image("photo-1553909489-cd47e0907980"),
  },
  {
    codigoBarras: "7891000001015",
    nome: "Cafe Coado",
    precoBase: "4.00",
    categoria: "Bebidas",
    imagemUrl: image("photo-1509042239860-f550ce710b93"),
  },
  {
    codigoBarras: "7891000001016",
    nome: "Cappuccino",
    precoBase: "8.90",
    categoria: "Bebidas",
    imagemUrl: image("photo-1572442388796-11668a67e53d"),
  },
  {
    codigoBarras: "7891000001017",
    nome: "Suco de Laranja",
    precoBase: "9.90",
    categoria: "Bebidas",
    imagemUrl: image("photo-1621506289937-a8e4df240d0b"),
  },
  {
    codigoBarras: "7891000001018",
    nome: "Refrigerante Lata",
    precoBase: "6.50",
    categoria: "Bebidas",
    imagemUrl: image("photo-1622483767028-3f66f32aef97"),
  },
  {
    codigoBarras: "7891000001019",
    nome: "Leite Integral 1L",
    precoBase: "6.90",
    categoria: "Mercearia",
    imagemUrl: image("photo-1563636619-e9143da7973b"),
  },
  {
    codigoBarras: "7891000001020",
    nome: "Manteiga 200g",
    precoBase: "14.90",
    categoria: "Mercearia",
    imagemUrl: image("photo-1589985270826-4b7bb135bc9d"),
  },
  {
    codigoBarras: "7891000001021",
    nome: "Queijo Minas",
    precoBase: "22.90",
    categoria: "Frios",
    imagemUrl: image("photo-1452195100486-9cc805987862"),
  },
  {
    codigoBarras: "7891000001022",
    nome: "Presunto Fatiado",
    precoBase: "18.90",
    categoria: "Frios",
    imagemUrl: image("photo-1524438418049-ab2acb7aa48f"),
  },
  {
    codigoBarras: "7891000001023",
    nome: "Rosca Doce",
    precoBase: "16.90",
    categoria: "Doces",
    imagemUrl: image("photo-1509365465985-25d11c17e812"),
  },
  {
    codigoBarras: "7891000001024",
    nome: "Pudim Individual",
    precoBase: "9.90",
    categoria: "Doces",
    imagemUrl: image("photo-1551024506-0bccd828d307"),
  },
];

const clientesSeed = [
  {
    nome: "Joao Batista",
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
    endereco: "Rua da Praca, 18 - Centro",
    cpf: "22222222224",
    statusSerasa: "REGULAR",
  },
  {
    nome: "Mariana Lima",
    telefone: "11988880005",
    endereco: "Rua do Cafe, 40 - Centro",
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
  {
    nome: "Claudia Nunes",
    telefone: "11988880007",
    endereco: "Rua dos Cravos, 64 - Centro",
    cpf: "22222222227",
    statusSerasa: "REGULAR",
  },
  {
    nome: "Pedro Henrique",
    telefone: "11988880008",
    endereco: "Rua do Forno, 202 - Centro",
    cpf: "22222222228",
    statusSerasa: "REGULAR",
  },
];

async function ensureFuncionariosBase() {
  const totalFuncionarios = await prisma.funcionario.count();

  if (totalFuncionarios > 0) {
    return { preservados: totalFuncionarios, criados: 0 };
  }

  if (!defaultFuncionarioPassword) {
    throw new Error("SUPABASE_AUTH_SEED_PASSWORD precisa estar definido para criar funcionarios base.");
  }

  const senhaHash = await bcrypt.hash(defaultFuncionarioPassword, 10);
  const funcionarios = [
    {
      nome: "Sr. Joaquim",
      cpf: "11111111111",
      telefone: SEED_PROPRIETARIO_TELEFONE_LOCAL,
      endereco: "Rua do Pao, 100 - Centro",
      matricula: "FUNC-001",
      cargo: "Proprietario",
      dataAdmissao: new Date("2021-01-12"),
      contatoEmergencia: "Maria Joaquim - 11999990002",
      role: "PROPRIETARIO",
      email: SEED_PROPRIETARIO_EMAIL,
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
      nome: "Joao Jose da Silva",
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

  await prisma.funcionario.createMany({ data: funcionarios });

  return { preservados: 0, criados: funcionarios.length };
}

async function limparDadosComerciais() {
  const [itensVenda, vendas, contasFiado, clientes, produtos] = await prisma.$transaction([
    prisma.itemVenda.deleteMany(),
    prisma.venda.deleteMany(),
    prisma.contaFiado.deleteMany(),
    prisma.cliente.deleteMany(),
    prisma.produto.deleteMany(),
  ]);

  return {
    itensVenda: itensVenda.count,
    vendas: vendas.count,
    contasFiado: contasFiado.count,
    clientes: clientes.count,
    produtos: produtos.count,
  };
}

async function seedProdutos() {
  await prisma.produto.createMany({ data: produtosSeed });
  return produtosSeed.length;
}

async function seedClientes() {
  await prisma.cliente.createMany({ data: clientesSeed });
  return clientesSeed.length;
}

async function seedContasFiado() {
  const clientes = await prisma.cliente.findMany({
    where: { cpf: { in: ["22222222221", "22222222223", "22222222225", "22222222227"] } },
    select: { id: true, cpf: true },
  });

  const saldoPorCpf = new Map([
    ["22222222221", { saldoDevedor: "24.30", statusNotificacao: "PENDENTE" }],
    ["22222222223", { saldoDevedor: "42.80", statusNotificacao: "PENDENTE" }],
    ["22222222225", { saldoDevedor: "11.90", statusNotificacao: "ENVIADA" }],
    ["22222222227", { saldoDevedor: "18.40", statusNotificacao: "NENHUMA" }],
  ]);

  const data = clientes.map((cliente) => ({
    clienteId: cliente.id,
    ...saldoPorCpf.get(cliente.cpf),
  }));

  if (data.length > 0) {
    await prisma.contaFiado.createMany({ data });
  }

  return data.length;
}

function toMoney(value) {
  return Number(value).toFixed(2);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function seedVendasDemo() {
  const [funcionarios, clientes, produtos] = await Promise.all([
    prisma.funcionario.findMany({
      where: { ativo: true, role: { in: ["PROPRIETARIO", "ATENDENTE"] } },
      orderBy: { id: "asc" },
    }),
    prisma.cliente.findMany({ where: { ativo: true }, orderBy: { id: "asc" } }),
    prisma.produto.findMany({ where: { ativo: true }, orderBy: { id: "asc" } }),
  ]);

  if (funcionarios.length === 0 || produtos.length < 6) {
    return 0;
  }

  const produtoPorNome = new Map(produtos.map((produto) => [produto.nome, produto]));
  const today = new Date();
  today.setHours(8, 15, 0, 0);

  const vendas = [
    {
      dataHora: today,
      formaPagamento: "PIX",
      status: "CONCLUIDA",
      cliente: clientes[1],
      itens: [
        ["Pao Frances", 12],
        ["Cafe Coado", 2],
      ],
    },
    {
      dataHora: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 40),
      formaPagamento: "DINHEIRO",
      status: "CONCLUIDA",
      cliente: clientes[3],
      itens: [
        ["Bolo de Cenoura", 1],
        ["Suco de Laranja", 2],
      ],
    },
    {
      dataHora: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 20),
      formaPagamento: "FIADO",
      status: "PENDENTE",
      cliente: clientes[0],
      itens: [
        ["Misto Quente", 2],
        ["Cappuccino", 2],
      ],
    },
    {
      dataHora: addDays(today, -1),
      formaPagamento: "CREDITO",
      status: "CONCLUIDA",
      cliente: clientes[4],
      itens: [
        ["Croissant Manteiga", 3],
        ["Cafe Coado", 3],
      ],
    },
    {
      dataHora: addDays(today, -2),
      formaPagamento: "DEBITO",
      status: "CONCLUIDA",
      cliente: null,
      itens: [
        ["Torta de Frango", 2],
        ["Refrigerante Lata", 2],
      ],
    },
  ];

  let created = 0;

  for (let index = 0; index < vendas.length; index += 1) {
    const venda = vendas[index];
    const itens = venda.itens
      .map(([nome, quantidade]) => {
        const produto = produtoPorNome.get(nome);

        if (!produto) {
          return null;
        }

        const subtotal = Number(produto.precoBase) * quantidade;

        return {
          produtoId: produto.id,
          quantidade,
          subtotal: toMoney(subtotal),
        };
      })
      .filter(Boolean);

    const valorTotal = itens.reduce((sum, item) => sum + Number(item.subtotal), 0);

    await prisma.venda.create({
      data: {
        dataHora: venda.dataHora,
        valorTotal: toMoney(valorTotal),
        formaPagamento: venda.formaPagamento,
        status: venda.status,
        funcionarioId: funcionarios[index % funcionarios.length].id,
        clienteId: venda.cliente?.id ?? null,
        itens: { create: itens },
      },
    });

    created += 1;
  }

  return created;
}

async function main() {
  const funcionarios = await ensureFuncionariosBase();
  const removidos = await limparDadosComerciais();
  const produtos = await seedProdutos();
  const clientes = await seedClientes();
  const contasFiado = await seedContasFiado();
  const vendas = await seedVendasDemo();

  console.log(
    JSON.stringify(
      {
        ok: true,
        preservado: "funcionarios, registros_ponto, atestados, ferias e licencas nao foram apagados",
        funcionarios,
        removidos,
        criados: {
          produtos,
          clientes,
          contasFiado,
          vendas,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Erro ao executar seed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
