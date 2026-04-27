import { AppShell } from "../components/AppShell";
import { cameras, logs } from "../data/mockData";

export function CamerasPage() {
  return (
    <AppShell currentPage="cameras">
      <div className="page-header">
        <div>
          <div className="page-title">Monitoramento</div>
          <div className="page-subtitle">Centro de operações de segurança em tempo real.</div>
        </div>
        <div className="toolbar">
          <button className="btn-secondary" type="button">Parar todos</button>
          <button className="btn-primary" type="button">Tentar reconectar</button>
        </div>
      </div>

      <div className="cameras-grid">
        <div className="camera-main">
          <div className="camera-feed">📹</div>
          <div className="camera-badge"><span className="cam-live-dot" /> Câmera loja • online</div>
        </div>

        <div>
          <div className="camera-second">
            <div className="camera-feed-sm">🍞</div>
            <div className="cam-info">
              <div className="cam-title">Câmera cozinha</div>
            </div>
          </div>

          <div className="cam-stats-row">
            <div className="cam-stat"><div className="cam-stat-label">Câmeras ativas</div><div className="cam-stat-value">12/12</div></div>
            <div className="cam-stat"><div className="cam-stat-label">Uptime</div><div className="cam-stat-value">99.98%</div></div>
            <div className="cam-stat"><div className="cam-stat-label">Nuvem</div><div className="cam-stat-value">68%</div></div>
          </div>
        </div>
      </div>

      <div className="row col-2">
        <div className="panel">
          <div className="panel-title">Detecção de IA</div>
          <div className="catalog-list">
            {cameras.map((camera) => (
              <div className="catalog-item" key={camera.code}>
                <div>
                  <strong>{camera.name}</strong>
                  <div className="client-time">{camera.code}</div>
                </div>
                <div className="client-time">{camera.ai}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="log-panel">
          <div className="log-header">Log de eventos</div>
          {logs.map((log) => (
            <div className="log-item" key={log.time}>
              <div className="log-time">{log.time}</div>
              <div className="log-msg">{log.message}</div>
              <div className={`log-tag ${log.tone === "danger" ? "log-critical" : log.tone === "success" ? "log-system" : "log-info"}`}>
                {log.tone.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
