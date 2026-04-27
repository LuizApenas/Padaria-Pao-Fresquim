import { AppShell } from "../components/AppShell";
import { StatusBadge } from "../components/ui";
import { employees } from "../data/mockData";

export function EmployeesPage() {
  return (
    <AppShell currentPage="funcionarios">
      <div className="page-header">
        <div>
          <div className="page-title">Funcionários</div>
          <div className="page-subtitle">Dados pessoais, presença, férias e visão rápida do quadro operacional.</div>
        </div>
        <button className="btn-primary" type="button">Novo funcionário</button>
      </div>

      {employees.map((employee) => (
        <article className="employee-card model-card" key={employee.id}>
          <div className="employee-header">
            <div className="employee-avatar">
              {employee.name.slice(0, 1)}
              <div className="employee-online" />
            </div>
            <div className="flex-1">
              <div className="employee-name">{employee.name}</div>
              <div className="employee-role">{employee.role}</div>
              <div className="employee-id">ID {employee.id}</div>
            </div>
            <StatusBadge>{employee.status}</StatusBadge>
          </div>
          <div className="employee-stats">
            <div className="emp-stat"><div className="emp-stat-label">Horas mensais</div><div className="emp-stat-value">{employee.monthlyHours}</div></div>
            <div className="emp-stat"><div className="emp-stat-label">Horas extras</div><div className="emp-stat-value">{employee.overtime}</div></div>
            <div className="emp-stat"><div className="emp-stat-label">Saldo de férias</div><div className="emp-stat-value">{employee.vacationBalance}</div></div>
            <div className="emp-stat"><div className="emp-stat-label">Assiduidade</div><div className="emp-stat-value">{employee.attendance}</div></div>
          </div>
        </article>
      ))}

      <div className="panel">
        <div className="panel-title">Novo funcionário</div>
        <div className="panel-sub">Formulário inspirado na tela de cadastro do modelo.</div>
        <div className="form-grid">
          <div className="form-group"><label className="form-label">Nome completo</label><input className="form-input" placeholder="Ex: João da Silva" /></div>
          <div className="form-group"><label className="form-label">CPF</label><input className="form-input" placeholder="000.000.000-00" /></div>
          <div className="form-group"><label className="form-label">Telefone</label><input className="form-input" placeholder="(00) 00000-0000" /></div>
          <div className="form-group"><label className="form-label">Cargo</label><select className="form-select"><option>Padeiro</option><option>Caixa</option><option>Supervisor</option></select></div>
        </div>
      </div>
    </AppShell>
  );
}
