import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { formatCurrency } from "../components/ui";
import { clients, debtors, reports, weeklySales } from "../data/mockData";
import { getChatMessages, saveChatMessages } from "../lib/storage";

export function ChatbotPage() {
  const [messages, setMessages] = useState(() => getChatMessages());
  const [prompt, setPrompt] = useState("");

  function generateChatResponse(input) {
    const normalized = input.toLowerCase();
    if (normalized.includes("inadimpl") || normalized.includes("deve")) {
      const topDebtors = debtors
        .map((debtor) => ({ ...debtor, client: clients.find((item) => item.id === debtor.clientId)?.name ?? "Cliente" }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3)
        .map((item) => `${item.client} (${formatCurrency(item.amount)})`)
        .join(", ");
      return `Hoje os principais devedores são ${topDebtors}.`;
    }
    if (normalized.includes("venda") || normalized.includes("semana")) {
      const total = weeklySales.reduce((sum, item) => sum + item.value, 0);
      return `Na semana simulada você acumulou ${formatCurrency(total)} em vendas.`;
    }
    if (normalized.includes("produto")) {
      return `Os produtos com maior destaque no período são ${reports.topProducts.map((item) => item.name).join(", ")}.`;
    }
    return "Consigo responder sobre vendas, produtos, inadimplência, câmeras e indicadores com base nos dados mocados.";
  }

  function sendMessage(content) {
    const nextMessages = [
      ...messages,
      { role: "user", title: "Arthur", message: content, meta: "Agora" },
      { role: "assistant", title: "Valor AI", message: generateChatResponse(content), meta: "Agora" }
    ];
    setMessages(nextMessages);
    saveChatMessages(nextMessages);
    setPrompt("");
  }

  return (
    <AppShell currentPage="chatbot">
      <div className="chat-layout">
        <div className="chat-main">
          <div className="chat-messages">
            {messages.map((message, index) => (
              message.role === "user" ? (
                <div className="chat-msg-user" key={`${message.meta}-${index}`}>{message.message}</div>
              ) : (
                <div className="chat-msg-bot" key={`${message.meta}-${index}`}>
                  <div className="chat-bot-row">
                    <div className="chat-bot-avatar">AI</div>
                    <div>
                      <div className="chat-bot-bubble">{message.message}</div>
                      <div className="chat-meta">{message.meta}</div>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
          <div className="chat-input-area">
            <span className="chat-tag">Valor AI</span>
            <input className="chat-input" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Como foram minhas vendas nesta semana?" />
            <button className="chat-send" type="button" onClick={() => prompt.trim() && sendMessage(prompt.trim())}>➜</button>
          </div>
          <div className="chat-disclaimer">As respostas são simuladas localmente para este protótipo.</div>
        </div>

        <div className="chat-sidebar">
          <div className="suggestions-panel">
            <div className="suggestions-title">Sugestões rápidas</div>
            {["Vendas de hoje", "Clientes inadimplentes", "Resumo do dia", "Produtos mais vendidos"].map((item) => (
              <div className="suggestion-item" key={item} onClick={() => sendMessage(item)}>
                <div className="sugg-icon">•</div>
                <div>
                  <div className="sugg-title">{item}</div>
                  <div className="sugg-sub">Executar análise com dados mocados.</div>
                </div>
              </div>
            ))}
          </div>
          <div className="docs-panel">
            <div className="docs-title">Documentação</div>
            <div className="docs-card">
              <div className="docs-card-title">Como usar a IA</div>
              <div className="docs-card-sub">Aprenda a fazer perguntas mais precisas.</div>
              <a className="docs-link" href="/relatorios.html">Ver guia</a>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
