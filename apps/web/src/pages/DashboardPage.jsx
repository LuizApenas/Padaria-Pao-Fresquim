import { AppShell } from "../components/AppShell";
import { StatusBadge, formatCurrency } from "../components/ui";
import { alerts, overview, weeklySales } from "../data/mockData";
import { getSales } from "../lib/storage";

export function DashboardPage() {
  const sales = getSales();

  return (
    <AppShell currentPage="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total vendido hoje</div>
          <div className="stat-value">{formatCurrency(overview.totalSoldToday)}</div>
          <div className="stat-sub"><span className="stat-up">+12%</span> vs. ontem</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Número de vendas</div>
          <div className="stat-value">{overview.salesCount}</div>
          <div className="stat-sub">Vendas confirmadas</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ticket médio</div>
          <div className="stat-value">{formatCurrency(overview.averageTicket)}</div>
          <div className="stat-sub">Por transação</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Clientes com fiado</div>
          <div className="stat-value">{overview.debtClients}</div>
          <div className="stat-sub stat-warn">Atenção necessária</div>
        </div>
      </div>

      <div className="row col-2">
        <div className="panel">
          <div className="panel-title">Performance semanal</div>
          <div className="panel-sub">Vendas dos últimos 7 dias</div>
          <div className="bar-chart">
            {weeklySales.map((item, index) => (
              <div className="bar-wrap" key={item.day}>
                <div className={`bar ${index >= 4 ? "active" : ""}`} style={{ height: `${Math.max(20, item.value / 16)}px` }} />
                <div className="bar-label">{item.day}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="alerts-panel">
          <div className="alerts-title">Painel de alertas</div>
          {alerts.map((alert, index) => (
            <div className="alert-item" key={alert.title}>
              <div className={`alert-dot ${index === 0 ? "orange" : index === 1 ? "red" : "yellow"}`} />
              <div>
                <div className="alert-text">{alert.title}</div>
                <div className="alert-sub">{alert.body}</div>
              </div>
            </div>
          ))}
          <button className="btn-resolve" type="button">Resolver tudo</button>
        </div>
      </div>

      <div className="panel">
        <div className="section-header">
          <div className="section-title">Últimas vendas</div>
          <a className="link-btn" href="/historico.html">Ver histórico completo</a>
        </div>
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Data</th>
              <th>Produto principal</th>
              <th>Status</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {sales.slice(0, 4).map((sale) => (
              <tr key={sale.id}>
                <td>{sale.client}</td>
                <td>{sale.datetime}</td>
                <td>{sale.mainProduct}</td>
                <td><StatusBadge>{sale.status}</StatusBadge></td>
                <td>{formatCurrency(sale.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
