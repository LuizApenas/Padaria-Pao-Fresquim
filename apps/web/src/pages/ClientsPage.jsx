import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import { StatusBadge, formatCurrency } from "../components/ui";
import { clients } from "../data/mockData";

export function ClientsPage() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const filteredClients = useMemo(() => {
    const normalized = deferredQuery.toLowerCase();
    return clients.filter((client) => [client.name, client.email, client.phone].some((value) => value.toLowerCase().includes(normalized)));
  }, [deferredQuery]);

  return (
    <AppShell currentPage="clientes">
      <div className="page-header">
        <div>
          <div className="page-title">Gestão de clientes</div>
          <div className="page-subtitle">Gerencie sua base de clientes e controle de crédito.</div>
        </div>
        <div className="toolbar">
          <button className="btn-secondary" type="button">Exportar PDF</button>
          <button className="btn-secondary" type="button">Exportar Excel</button>
          <button className="btn-primary" type="button">Novo cliente</button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-row-item"><div className="stat-row-label">Total de clientes</div><div className="stat-row-value">1.284</div></div>
        <div className="stat-row-item"><div className="stat-row-label">Clientes ativos</div><div className="stat-row-value green">1.120</div></div>
        <div className="stat-row-item"><div className="stat-row-label">Bloqueados (fiado)</div><div className="stat-row-value red">164</div></div>
        <div className="stat-row-item"><div className="stat-row-label">Ticket médio</div><div className="stat-row-value">{formatCurrency(452)}</div></div>
      </div>

      <input
        className="search-bar"
        type="text"
        placeholder="Buscar clientes por nome ou telefone..."
        value={query}
        onChange={(event) => startTransition(() => setQuery(event.target.value))}
      />

      <div className="table-panel">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Telefone</th>
              <th>Endereço</th>
              <th>Status</th>
              <th>Fiado</th>
              <th>Ticket médio</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => (
              <tr key={client.id}>
                <td>
                  <div className="client-name">{client.name}</div>
                  <div className="client-time">{client.email}</div>
                </td>
                <td>{client.phone}</td>
                <td>{client.address}</td>
                <td><StatusBadge>{client.status}</StatusBadge></td>
                <td><StatusBadge>{client.debtStatus}</StatusBadge></td>
                <td>{formatCurrency(client.ticket)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">
          <span>Exibindo {filteredClients.length} de {clients.length} clientes mocados</span>
          <div className="pagination">
            <button className="page-btn active" type="button">1</button>
            <button className="page-btn" type="button">2</button>
            <button className="page-btn" type="button">3</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
