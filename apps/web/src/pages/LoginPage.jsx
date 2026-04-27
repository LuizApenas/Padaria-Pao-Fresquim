import { useEffect, useState } from "react";
import { LOGIN_EMAIL, LOGIN_PASSWORD, overview } from "../data/mockData";
import { formatCurrency } from "../components/ui";
import { isAuthenticated, login } from "../lib/session";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated()) {
      window.location.replace("/dashboard.html");
    }
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    if (login(email, password)) {
      window.location.replace("/dashboard.html");
      return;
    }
    setError("Credenciais inválidas. Use arthur@email.com e 1234.");
  }

  return (
    <div id="login-screen">
      <form className="login-card login-card-model" onSubmit={handleSubmit}>
        <div className="login-logo">
          <div className="login-logo-icon">PF</div>
          <div className="login-brand">Padaria Pão fresQUIM</div>
          <div className="login-subtitle">Acesso corporativo</div>
        </div>

        <div className="login-credentials compact">
          <strong>{LOGIN_EMAIL}</strong>
          <strong>{LOGIN_PASSWORD}</strong>
        </div>

        <div className="login-field">
          <label className="login-label" htmlFor="email">Usuário</label>
          <input
            className="login-input"
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="arthur@email.com"
          />
        </div>

        <div className="login-field">
          <label className="login-label" htmlFor="password">Senha</label>
          <input
            className="login-input"
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="1234"
          />
        </div>

        <div className="login-row">
          <label className="login-keep">
            <input type="checkbox" defaultChecked />
            <span>Manter conectado</span>
          </label>
          <span className="login-forgot">Esqueceu a senha?</span>
        </div>

        <button className="btn-login" type="submit">Entrar no sistema</button>
        {error ? <div className="error-box">{error}</div> : null}

        <div className="login-support">
          Total vendido hoje: <strong>{formatCurrency(overview.totalSoldToday)}</strong>
        </div>
        <div className="login-security">
          <span>Problemas com o acesso?</span>
          <span>AES-256</span>
        </div>
      </form>
    </div>
  );
}
