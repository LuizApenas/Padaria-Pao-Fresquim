import { AppShell } from "../components/AppShell";
import { StatusBadge, formatCurrency } from "../components/ui";
import { clients, debtors } from "../data/mockData";

export function DebtsPage() {
  const totalDebt = debtors.reduce((sum, debtor) => sum + debtor.amount, 0);

  return (
    <AppShell currentPage="fiado">
      <div className="page-header">
        <div>
          <div className="page-title">Carteira de devedores</div>
          <div className="page-subtitle">Monitoramento de recebíveis e cobranças ativas.</div>
        </div>
        <button className="btn-primary" type="button">Enviar cobranças</button>
      </div>

      <div className="fiado-stats">
        <div className="stat-card"><div className="stat-label">Total em aberto</div><div className="stat-value">{formatCurrency(totalDebt)}</div></div>
        <div className="stat-card"><div className="stat-label">Recuperado no mês</div><div className="stat-value">{formatCurrency(5120)}</div></div>
        <div className="stat-card"><div className="stat-label">Clientes inadimplentes</div><div className="stat-value">42</div></div>
        <div className="stat-card"><div className="stat-label">Status da carteira</div><div className="stat-value">Atenção</div></div>
      </div>

      <div className="row col-2">
        <div className="table-panel">
          {debtors.map((debtor) => {
            const client = clients.find((item) => item.id === debtor.clientId);
            return (
              <div className="debtor-row" key={debtor.clientId}>
                <div>
                  <div className="client-name">{client?.name}</div>
                  <div className="client-time">{debtor.overdue}</div>
                </div>
                <div className={debtor.status === "Crítico" ? "debtor-value-critical" : "debtor-value-normal"}>
                  {formatCurrency(debtor.amount)}
                </div>
                <div className="debtor-meta-ok">Última compra {debtor.lastPurchase}</div>
                <div><StatusBadge>{debtor.status}</StatusBadge></div>
                <button className="btn-cobrar" type="button">Cobrar</button>
              </div>
            );
          })}
        </div>

        <div className="tip-card">
          <div className="tip-label">Ações sugeridas</div>
          <div className="tip-text">Automatize cobranças para títulos vencidos há mais de 10 dias e priorize os clientes críticos.</div>
          <button className="btn-activate" type="button">Ativar rotina</button>
        </div>
      </div>
    </AppShell>
  );
}
