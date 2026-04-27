export function formatCurrency(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function getStatusClass(status) {
  const normalized = status.toLowerCase();
  if (normalized.includes("concl") || normalized.includes("ativo") || normalized.includes("online") || normalized.includes("estável")) return "success";
  if (normalized.includes("pend") || normalized.includes("acompanhando")) return "warning";
  if (normalized.includes("crít") || normalized.includes("bloq") || normalized.includes("offline")) return "danger";
  return "info";
}

export function StatusBadge({ children, tone }) {
  const className = tone ?? getStatusClass(String(children));
  return <span className={`status ${className}`}>{children}</span>;
}

export function MetricCard({ label, value, className = "mini-stat" }) {
  return (
    <div className={className}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function SectionHead({ title, description, actions }) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {actions ? <div className="toolbar">{actions}</div> : null}
    </div>
  );
}
