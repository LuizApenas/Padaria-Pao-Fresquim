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
  name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  debtStatus: string;
  ticket: number;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  sku: string;
  stock: number;
  unit: string;
  price: number;
}

export interface Employee {
  id: string;
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
  datetime: string;
  client: string;
  mainProduct: string;
  payment: string;
  value: number;
  status: string;
}

export interface Debtor {
  clientId: number;
  amount: number;
  overdue: string;
  status: string;
  lastPurchase: string;
  lastInstallment: number;
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
