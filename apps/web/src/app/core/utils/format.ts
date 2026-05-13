export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function getStatusTone(status: string): "success" | "warning" | "danger" | "info" {
  const normalized = status.toLowerCase();
  if (normalized.includes("concl") || normalized.includes("ativo") || normalized.includes("online") || normalized.includes("estavel") || normalized.includes("vip")) {
    return "success";
  }
  if (normalized.includes("pend") || normalized.includes("acompanhando")) {
    return "warning";
  }
  if (normalized.includes("crit") || normalized.includes("bloq") || normalized.includes("offline")) {
    return "danger";
  }
  return "info";
}
