import { AppShell } from "../components/AppShell";
import { formatCurrency } from "../components/ui";
import { reports, weeklySales } from "../data/mockData";

export function ReportsPage() {
  return (
    <AppShell currentPage="relatorios">
      <div className="page-header">
        <div>
          <div className="page-title">Relatórios</div>
          <div className="page-subtitle">KPIs consolidados, top produtos e visão do desempenho acumulado.</div>
        </div>
        <div className="reports-top">
          <select className="report-filter"><option>Últimos 30 dias</option></select>
          <button className="btn-primary" type="button">Gerar ranking completo</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Total vendido</div><div className="stat-value">{formatCurrency(reports.totalSold)}</div></div>
        <div className="stat-card"><div className="stat-label">Número de vendas</div><div className="stat-value">{reports.totalOrders}</div></div>
        <div className="stat-card"><div className="stat-label">Ticket médio</div><div className="stat-value">{formatCurrency(reports.averageTicket)}</div></div>
        <div className="stat-card"><div className="stat-label">Crescimento</div><div className="stat-value">+12%</div></div>
      </div>

      <div className="row col-2">
        <div className="panel">
          <div className="panel-title">Volume de vendas diário</div>
          <div className="panel-sub">Desempenho acumulado no período selecionado</div>
          <div className="bar-chart">
            {weeklySales.map((item, index) => (
              <div className="bar-wrap" key={item.day}>
                <div className={`bar ${index >= 4 ? "active" : ""}`} style={{ height: `${Math.max(20, item.value / 14)}px` }} />
                <div className="bar-label">{item.day}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">Top produtos</div>
          <div className="panel-sub">Itens com melhor saída no período</div>
          {reports.topProducts.map((product, index) => (
            <div className="top-product-item" key={product.name}>
              <div className="top-rank">{index + 1}</div>
              <div className="top-product-name">{product.name}</div>
              <div className="top-product-sales">{product.sales} vendas</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
