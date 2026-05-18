import { Camera, ChatMessage, Client, Debtor, Employee, LogItem, Product, Sale, SettingItem } from "./models";

export const LOGIN_EMAIL = "arthur@email.com";
export const LOGIN_PASSWORD = "1234";

export const overview = {
  totalSoldToday: 1250,
  salesCount: 45,
  averageTicket: 27.78,
  lowStock: 12,
  debtClients: 12
};

export const weeklySales = [
  { day: "Seg", value: 860 },
  { day: "Ter", value: 1090 },
  { day: "Qua", value: 980 },
  { day: "Qui", value: 1320 },
  { day: "Sex", value: 1450 },
  { day: "Sab", value: 1725 },
  { day: "Dom", value: 1200 }
];

export const alerts = [
  { title: "Estoque baixo", body: "12 itens abaixo do minimo recomendado.", tone: "warning" },
  { title: "Clientes inadimplentes", body: "3 cobrancas venceram esta semana.", tone: "danger" },
  { title: "API logistica instavel", body: "Sincronizacao externa com atraso de 7 minutos.", tone: "info" }
];

export const clients: Client[] = [
  { id: 1, initials: "JS", name: "Joao da Silva", email: "joao.silva@email.com", phone: "(11) 98765-4321", address: "Rua das Flores, 123 - Centro", status: "Ativo", debtStatus: "Fiado ativo", ticket: 452.0 },
  { id: 2, initials: "MC", name: "Maria Cavalcanti", email: "maria.c@email.com", phone: "(21) 99988-7766", address: "Av. Paulista, 1500 - Ap 42", status: "Bloqueado", debtStatus: "Bloqueado", ticket: 388.0 },
  { id: 3, initials: "RL", name: "Ricardo Lemos", email: "ricardo.lemos@email.com", phone: "(31) 98877-6655", address: "Rua Treze de Maio, 45 - Bairro Novo", status: "Ativo", debtStatus: "Critico", ticket: 690.5 },
  { id: 4, initials: "AN", name: "Alice Nogueira", email: "alice.nog@email.com", phone: "(41) 97766-5544", address: "Alameda Santos, 800 - Jardim America", status: "Ativo", debtStatus: "Em dia", ticket: 271.3 },
  { id: 5, initials: "AM", name: "Andre Mendonca", email: "andre.m@email.com", phone: "(19) 99122-1199", address: "Rua Harmonia, 88 - Vila Madalena", status: "VIP", debtStatus: "Em dia", ticket: 815.0 }
];

export const products: Product[] = [
  { id: 101, name: "Pao Frances Artesanal", category: "Paes", sku: "789123456789", stock: 150, unit: "un", price: 1.2 },
  { id: 102, name: "Presunto Iberico", category: "Frios", sku: "789987654321", stock: 5, unit: "kg", price: 12.9 },
  { id: 103, name: "Cafe Cold 500ml", category: "Bebidas", sku: "789456123789", stock: 42, unit: "un", price: 18.0 },
  { id: 104, name: "Geleia de Morango", category: "Mercearia", sku: "789789789789", stock: 12, unit: "un", price: 24.5 },
  { id: 105, name: "Azeite de Oliva Extra", category: "Mercearia", sku: "789555444333", stock: 28, unit: "un", price: 45.9 },
  { id: 106, name: "Cerveja Artesanal", category: "Bebidas", sku: "789222333444", stock: 60, unit: "un", price: 14.0 },
  { id: 107, name: "Bolo Integral de Nozes", category: "Paes", sku: "789852147963", stock: 16, unit: "un", price: 24.9 },
  { id: 108, name: "Broa de Milho Doce", category: "Paes", sku: "789654852741", stock: 18, unit: "un", price: 12.3 },
  { id: 109, name: "Coca-Cola Zero 2L", category: "Bebidas", sku: "789111222333", stock: 54, unit: "un", price: 8.5 }
];

export const employees: Employee[] = [
  { id: 942, name: "Joao Jose da Silva", role: "Padeiro chefe", status: "Ativo", monthlyHours: "168h", overtime: "+4h", vacationBalance: "22 dias", attendance: "98.5%", admission: "12 de janeiro de 2021", shift: "05:00 - 14:00" },
  { id: 1021, name: "Ana Beatriz Moreira", role: "Caixa", status: "Ativo", monthlyHours: "160h", overtime: "+2h", vacationBalance: "18 dias", attendance: "97.2%", admission: "04 de agosto de 2022", shift: "12:00 - 20:20" },
  { id: 1115, name: "Carlos Oliveira", role: "Supervisor", status: "Plantao", monthlyHours: "176h", overtime: "+8h", vacationBalance: "30 dias", attendance: "99.1%", admission: "19 de marco de 2020", shift: "08:00 - 17:00" }
];

export const initialSales: Sale[] = [
  { id: "#VEN-9402", datetime: "Hoje, 14:32", client: "Andre Mendonca", mainProduct: "Kit cafe da manha", payment: "PIX", value: 450.0, status: "Concluida" },
  { id: "#VEN-9401", datetime: "Hoje, 13:15", client: "Juliana Silva", mainProduct: "Consultoria Premium", payment: "Credito", value: 182.4, status: "Concluida" },
  { id: "#VEN-9400", datetime: "Hoje, 12:47", client: "Mariana Lima", mainProduct: "Bolo de Fuba", payment: "Fiado", value: 56.2, status: "Pendente" },
  { id: "#VEN-9399", datetime: "Ontem, 18:03", client: "Carlos Albuquerque", mainProduct: "Pao de Queijo", payment: "Debito", value: 98.5, status: "Concluida" }
];

export const debtors: Debtor[] = [
  { clientId: 3, amount: 3890.2, overdue: "Vencido ha 45 dias", status: "Critico", lastPurchase: "14 mai, 2024", lastInstallment: 89.9 },
  { clientId: 2, amount: 1240.5, overdue: "Vencido ha 12 dias", status: "Pendente", lastPurchase: "28 mai, 2024", lastInstallment: 140.0 },
  { clientId: 1, amount: 450.0, overdue: "Vence em 3 dias", status: "Acompanhando", lastPurchase: "02 jun, 2024", lastInstallment: 55.0 }
];

export const reports = {
  totalSold: 142580,
  totalOrders: 1248,
  averageTicket: 114.24,
  topProducts: [
    { name: "Pao de queijo", sales: 1280 },
    { name: "Bolo de fuba", sales: 3420 },
    { name: "Broa de milho doce", sales: 890 }
  ]
};

export const cameras: Camera[] = [
  { name: "Loja", code: "CAM_02_CHECKOUT", status: "Online", ai: "Presenca detectada", storage: 68 },
  { name: "Cozinha", code: "CAM_04_KITCHEN", status: "Online", ai: "Operacao estavel", storage: 68 },
  { name: "Estacionamento", code: "CAM_08_PARKING", status: "Offline", ai: "Perda de sinal", storage: 68 },
  { name: "Recepcao", code: "CAM_01_LOBBY", status: "Online", ai: "Movimento intenso", storage: 68 }
];

export const logs: LogItem[] = [
  { time: "14:52:10", message: "Movimento detectado no corredor", tone: "info" },
  { time: "14:48:05", message: "Login efetuado: gerente comercial", tone: "success" },
  { time: "14:30:22", message: "Perda de sinal: CAM_08_PARKING", tone: "danger" },
  { time: "14:15:00", message: "Backup automatico concluido", tone: "success" }
];

export const initialSettings: SettingItem[] = [
  { title: "Notificacoes de estoque", description: "Avisar quando itens chegarem abaixo do minimo.", enabled: true },
  { title: "Cobranca automatica do fiado", description: "Disparar lembretes por WhatsApp as 09:00.", enabled: true },
  { title: "Login em dois fatores", description: "Exigir codigo para administradores e supervisores.", enabled: false },
  { title: "Modo caixa rapido", description: "Manter tela de venda aberta apos finalizar pedido.", enabled: true }
];

export const initialChat: ChatMessage[] = [
  { role: "assistant", title: "Valor AI", message: "Ola! Analisei seus dados. Suas vendas cresceram 12% em relacao a semana passada. Posso resumir vendas, inadimplencia e produtos com maior saida.", meta: "Agora mesmo" },
  { role: "user", title: "Arthur", message: "Como foram minhas vendas nesta semana e quem sao os clientes que mais devem hoje?", meta: "Agora mesmo" },
  { role: "assistant", title: "Valor AI", message: "Voce vendeu R$ 8.625 nesta semana. Hoje os maiores devedores sao Ricardo Lemos (R$ 3.890,20), Maria Cavalcanti (R$ 1.240,50) e Joao da Silva (R$ 450,00).", meta: "Agora mesmo" }
];
