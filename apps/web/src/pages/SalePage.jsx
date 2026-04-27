import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import { formatCurrency } from "../components/ui";
import { clients, products } from "../data/mockData";
import { appendSale, getSales } from "../lib/storage";

export function SalePage() {
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [payment, setPayment] = useState("PIX");
  const [discount, setDiscount] = useState(0);
  const [cart, setCart] = useState([]);
  const deferredSearch = useDeferredValue(search);

  const catalog = useMemo(
    () => products.filter((product) => product.name.toLowerCase().includes(deferredSearch.toLowerCase()) || product.sku.includes(deferredSearch)).slice(0, 6),
    [deferredSearch]
  );

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function addProduct(product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...current, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  }

  function finalizeSale() {
    if (!cart.length) return;
    const client = clients.find((item) => item.id === Number(selectedClientId));
    appendSale({
      id: `#VEN-${9403 + getSales().length}`,
      datetime: "Agora mesmo",
      client: client ? client.name : "Cliente balcão",
      mainProduct: cart[0].name,
      payment,
      value: Math.max(subtotal - discount, 0),
      status: payment === "Fiado" ? "Pendente" : "Concluída"
    });
    window.location.href = "/historico.html";
  }

  return (
    <AppShell currentPage="nova-venda">
      <div className="pdv-layout">
        <div className="pdv-left">
          <div className="pdv-scanner">
            <div className="scanner-label">Leitura de código de barras</div>
            <input
              className="scanner-input"
              placeholder="Escaneie o código ou digite o nome do produto..."
              value={search}
              onChange={(event) => startTransition(() => setSearch(event.target.value))}
            />
          </div>

          <div className="items-panel">
            <div className="items-header">
              <div className="items-title">Itens da venda</div>
              <div className="items-count">{cart.length} item(ns)</div>
            </div>
            <div className="items-body">
              {cart.length ? cart.map((item) => (
                <div className="sale-item" key={item.id}>
                  <div className="sale-item-icon">🧾</div>
                  <div>
                    <div className="sale-item-name">{item.name}</div>
                    <div className="sale-item-code">Qtd. {item.quantity}</div>
                  </div>
                  <div className="qty-control">
                    <button className="qty-btn" type="button" onClick={() => setCart((current) => current.map((entry) => entry.id === item.id ? { ...entry, quantity: Math.max(1, entry.quantity - 1) } : entry))}>-</button>
                    <div className="qty-val">{item.quantity}</div>
                    <button className="qty-btn" type="button" onClick={() => setCart((current) => current.map((entry) => entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry))}>+</button>
                  </div>
                  <div className="sale-item-price">{formatCurrency(item.price * item.quantity)}</div>
                  <button className="sale-item-remove" type="button" onClick={() => setCart((current) => current.filter((entry) => entry.id !== item.id))}>×</button>
                </div>
              )) : (
                <div className="empty-state">
                  <div className="empty-text">Carrinho vazio</div>
                  <div className="empty-sub">Adicione itens para simular uma venda.</div>
                </div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">Catálogo rápido</div>
            <div className="catalog-list">
              {catalog.map((product) => (
                <div className="catalog-item" key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    <div className="client-time">COD: {product.sku} • Estoque {product.stock} {product.unit}</div>
                  </div>
                  <div className="toolbar">
                    <strong>{formatCurrency(product.price)}</strong>
                    <button className="btn-primary" type="button" onClick={() => addProduct(product)}>Adicionar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pdv-right">
          <div className="total-card">
            <div className="total-label">Total da venda</div>
            <div className="total-value">{formatCurrency(Math.max(subtotal - discount, 0))}</div>
            <div className="total-breakdown">
              <span>Subtotal {formatCurrency(subtotal)}</span>
              <span>Desconto {formatCurrency(discount)}</span>
            </div>
          </div>

          <div className="payment-panel">
            <div className="payment-label">Identificar cliente</div>
            <select className="form-select" value={selectedClientId} onChange={(event) => setSelectedClientId(event.target.value)}>
              <option value="">Cliente balcão</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </div>

          <div className="payment-panel">
            <div className="payment-label">Forma de pagamento</div>
            <div className="payment-methods">
              {["Dinheiro", "Crédito", "Débito", "PIX"].map((item) => (
                <button key={item} className={`pay-method ${payment === item ? "selected" : ""}`} type="button" onClick={() => setPayment(item)}>
                  {item}
                </button>
              ))}
              <button className={`pay-fiado ${payment === "Fiado" ? "selected" : ""}`} type="button" onClick={() => setPayment("Fiado")}>
                Fiado
              </button>
            </div>
          </div>

          <div className="pdv-actions">
            <button className="btn-pdv-action" type="button" onClick={() => setDiscount((current) => current ? 0 : 5)}>Aplicar desconto</button>
            <button className="btn-pdv-action" type="button">Buscar produto</button>
          </div>

          <div className="pdv-finalize-area">
            <button className="btn-cancel" type="button" onClick={() => setCart([])}>Cancelar</button>
            <button className="btn-finalize" type="button" onClick={finalizeSale}>Finalizar</button>
          </div>

          <div className="pdv-status-bar">
            <div className="pdv-online"><span className="pdv-dot" />PDV online</div>
            <div className="pdv-info">Caixa 001 • Operador Admin</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
