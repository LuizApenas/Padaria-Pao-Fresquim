export interface PageMeta {
  id: string;
  label: string;
  path: string;
  icon: string;
  placeholder: string;
}

export interface Client {
  id: number;
  initials: string;
  nome?: string;
  cpf?: string;
  telefone?: string;
  endereco?: string;
  statusSerasa?: string;
  contaFiado?: {
    saldoDevedor: number;
    limiteCredito?: number | null;
    dataUltimaCobranca?: string | null;
    statusNotificacao?: string | null;
  } | null;
  name: string;
  email?: string | null;
  phone: string;
  address: string;
  status: string;
  debtStatus: string;
  ticket: number;
}

export interface Product {
  id: number;
  codigoBarras?: string;
  nome?: string;
  precoBase?: number;
  categoria?: string;
  imagemUrl?: string | null;
  name: string;
  category: string;
  sku: string;
  stock: number;
  unit: string;
  price: number;
}

export interface Employee {
  id: number;
  nome?: string;
  cpf?: string;
  telefone?: string;
  endereco?: string;
  matricula?: string;
  cargo?: string;
  dataAdmissao?: string;
  contatoEmergencia?: string;
  accessRole?: "PROPRIETARIO" | "ATENDENTE" | "PADEIRO";
  email?: string;
  ativo?: boolean;
  vendas?: unknown[];
  registrosPonto?: unknown[];
  ferias?: unknown[];
  licencas?: unknown[];
  atestados?: unknown[];
  name: string;
  role: string;
  status: string;
  monthlyHours: string;
  overtime: string;
  vacationBalance: string;
  attendance: string;
  admission: string;
  shift: string;
}

export interface Sale {
  id: string;
  dataHora?: string;
  valorTotal?: number | string;
  formaPagamento?: string;
  cliente?: Client | null;
  funcionario?: Employee | null;
  itens?: Array<{
    quantidade: number;
    subtotal: number | string;
    produto?: Product | null;
  }>;
  datetime: string;
  client: string;
  mainProduct: string;
  payment: string;
  value: number;
  status: string;
}

export interface CreateSaleItemPayload {
  produtoId: number;
  quantidade: number;
}

export interface CreateSalePayload {
  funcionarioId: number;
  clienteId?: number | null;
  formaPagamento: string;
  status?: string;
  itens: CreateSaleItemPayload[];
}

export interface Debtor {
  clientId: number;
  clientName?: string;
  phone?: string;
  amount: number;
  overdue: string;
  status: string;
  lastPurchase: string;
  lastInstallment: number;
  statusNotificacao?: string;
}

export interface ReportProduct {
  name: string;
  sales: number;
}

export interface Camera {
  name: string;
  code: string;
  status: string;
  ai: string;
  storage: number;
}

export interface LogItem {
  time: string;
  message: string;
  tone: "info" | "success" | "danger";
}

export interface SettingItem {
  title: string;
  description: string;
  enabled: boolean;
}

export interface ChatMessage {
  role: "assistant" | "user";
  title: string;
  message: string;
  meta: string;
}
