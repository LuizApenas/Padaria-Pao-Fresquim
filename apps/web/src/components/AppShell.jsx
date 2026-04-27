import { useEffect } from "react";
import { getPageConfig, pages } from "../lib/navigation";
import { isAuthenticated, logout } from "../lib/session";

export function AppShell({ currentPage, children }) {
  const page = getPageConfig(currentPage);

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.replace("/index.html");
    }
  }, []);

  return (
    <div className="erp-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">PF</div>
          <div>
            <div className="logo-text">PÃO FRESQUIM</div>
            <div className="logo-sub">Portal administrativo</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {pages.map((item) => (
            <a
              key={item.id}
              className={`nav-item ${item.id === currentPage ? "active" : ""}`}
              href={item.href}
            >
              <span className="nav-glyph">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <a className="nav-new-sale" href="/nova-venda.html">
          <span>+</span>
          <span>Nova venda</span>
        </a>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-title">{page.label}</div>
          <input className="topbar-search" type="text" placeholder={page.placeholder} />
          <div className="topbar-right">
            <div className="topbar-zoom">
              <button className="zoom-btn" type="button">100%</button>
              <button className="zoom-btn active" type="button">125%</button>
              <button className="zoom-btn" type="button">150%</button>
            </div>
            <div className="topbar-icon">⌕</div>
            <div className="admin-chip">
              <div className="admin-avatar">A</div>
              <div className="admin-info">
                <div className="admin-name">Arthur</div>
                <div className="admin-unit">Unidade Matriz</div>
              </div>
            </div>
            <button
              className="btn-secondary compact"
              type="button"
              onClick={() => {
                logout();
                window.location.replace("/index.html");
              }}
            >
              Sair
            </button>
          </div>
        </header>

        <div className="page active">{children}</div>
      </main>
    </div>
  );
}
