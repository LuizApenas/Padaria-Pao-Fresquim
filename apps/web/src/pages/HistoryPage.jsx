import { AppShell } from "../components/AppShell";
import { StatusBadge, formatCurrency } from "../components/ui";
import { getSales } from "../lib/storage";

export function HistoryPage() {
  const sales = getSales();

  return (
    <AppShell currentPage="historico">
      <div className="page-header">
        <div>
          <div className="page-title">Histórico de vendas</div>
          <div className="page-subtitle">Consulta de transações, operadores e formas de pagamento.</div>
        </div>
        <a className="btn-primary" href="/nova-venda.html">Nova venda</a>
      </div>

      <div className="historic-filters">
        <div className="filter-group flex-1">
          <label className="filter-label">Início do período</label>
          <input className="form-input" type="date" />
        </div>
        <div className="filter-group flex-1">
          <label className="filter-label">Fim do período</label>
          <input className="form-input" type="date" />
        </div>
        <div className="filter-group flex-1">
          <label className="filter-label">Funcionário</label>
          <select className="form-select"><option>Todos os funcionários</option></select>
        </div>
        <button className="btn-secondary" type="button">Filtrar resultados</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Vendas totais</div><div className="stat-value">{formatCurrency(12450)}</div></div>
        <div className="stat-card"><div className="stat-label">Ticket médio</div><div className="stat-value">{formatCurrency(185.5)}</div></div>
        <div className="stat-card"><div className="stat-label">Vendas canceladas</div><div className="stat-value">03</div></div>
        <div className="stat-card"><div className="stat-label">Operadores ativos</div><div className="stat-value">08</div></div>
      </div>

      <div className="table-panel">
        <table>
          <thead>
            <tr>
              <th>ID venda</th>
              <th>Data e hora</th>
              <th>Cliente</th>
              <th>Pagamento</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td>{sale.id}</td>
                <td>{sale.datetime}</td>
                <td>{sale.client}</td>
                <td>{sale.payment}</td>
                <td>{formatCurrency(sale.value)}</td>
                <td><StatusBadge>{sale.status}</StatusBadge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
