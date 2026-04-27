import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { getSettings, saveSettings } from "../lib/storage";

export function SettingsPage() {
  const [settings, setSettings] = useState(() => getSettings());

  function toggleSetting(index) {
    const next = settings.map((setting, currentIndex) => currentIndex === index ? { ...setting, enabled: !setting.enabled } : setting);
    setSettings(next);
    saveSettings(next);
  }

  return (
    <AppShell currentPage="configuracoes">
      <div className="page-header">
        <div>
          <div className="page-title">Configurações</div>
          <div className="page-subtitle">Ajustes operacionais, segurança e automações do ambiente administrativo.</div>
        </div>
        <button className="btn-primary" type="button">Salvar preferências</button>
      </div>

      <div className="row col-2">
        <div className="panel">
          <div className="panel-title">Preferências do sistema</div>
          <div className="catalog-list">
            {settings.map((setting, index) => (
              <div className="settings-item" key={setting.title}>
                <div>
                  <strong>{setting.title}</strong>
                  <div className="client-time">{setting.description}</div>
                </div>
                <button className={`toggle ${setting.enabled ? "on" : ""}`} type="button" onClick={() => toggleSetting(index)} aria-label={setting.title} />
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">Dados da unidade</div>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Nome da unidade</label><input className="form-input" value="Matriz" readOnly /></div>
            <div className="form-group"><label className="form-label">E-mail corporativo</label><input className="form-input" value="arthur@email.com" readOnly /></div>
            <div className="form-group"><label className="form-label">Perfil atual</label><input className="form-input" value="Administrador" readOnly /></div>
            <div className="form-group"><label className="form-label">Modo</label><input className="form-input" value="Protótipo React multipágina" readOnly /></div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
