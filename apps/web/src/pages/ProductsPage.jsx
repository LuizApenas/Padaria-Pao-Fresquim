import { useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import { formatCurrency } from "../components/ui";
import { products } from "../data/mockData";

export function ProductsPage() {
  const [category, setCategory] = useState("Todos");
  const filteredProducts = useMemo(
    () => products.filter((product) => category === "Todos" || product.category === category),
    [category]
  );

  const categoryClass = {
    Pães: "cat-paes",
    Frios: "cat-frios",
    Bebidas: "cat-bebidas",
    Mercearia: "cat-mercearia"
  };

  return (
    <AppShell currentPage="produtos">
      <div className="page-header">
        <div>
          <div className="page-title">Gestão de produtos</div>
          <div className="page-subtitle">Gerencie seu catálogo, estoque e precificação em tempo real.</div>
        </div>
        <button className="btn-primary" type="button">Novo produto</button>
      </div>

      <div className="toolbar">
        <div className="filter-tabs">
          {["Todos", "Pães", "Frios", "Bebidas", "Mercearia"].map((item) => (
            <button
              key={item}
              className={`filter-tab ${category === item ? "active" : ""}`}
              type="button"
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="products-grid model-products-grid">
        {filteredProducts.map((product) => (
          <article className="product-card model-card" key={product.id}>
            <div className="product-img">
              <span className={`product-category-badge ${categoryClass[product.category]}`}>{product.category}</span>
              <span>{product.category === "Pães" ? "🥖" : product.category === "Frios" ? "🧀" : product.category === "Bebidas" ? "🥤" : "🫙"}</span>
            </div>
            <div className="product-info">
              <div>
                <span className="product-name">{product.name}</span>
                <span className="product-price">{formatCurrency(product.price)}</span>
              </div>
              <div className="product-sku">SKU: {product.sku}</div>
              <div className={`product-stock ${product.stock < 10 ? "low" : ""}`}>Estoque: {product.stock} {product.unit}</div>
              <div className="product-actions">
                <a className="btn-secondary compact" href="/nova-venda.html">Adicionar na venda</a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
