import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { clients, products } from "../../core/mock-data";
import { StorageService } from "../../core/services/storage.service";
import { Product } from "../../core/models";
import { formatCurrency } from "../../core/utils/format";

@Component({
  selector: "pf-sale",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./sale.component.html",
  styleUrl: "./sale.component.css"
})
export class SaleComponent {
  search = "";
  selectedClientId = "";
  payment = "PIX";
  discount = 0;
  cart: Array<{ id: number; name: string; price: number; quantity: number }> = [];

  readonly clients = clients;
  readonly products = products;
  readonly formatCurrency = formatCurrency;

  constructor(
    private readonly storageService: StorageService,
    private readonly router: Router
  ) {}

  get catalog() {
    const normalized = this.search.toLowerCase();
    return this.products
      .filter((product) => product.name.toLowerCase().includes(normalized) || product.sku.includes(this.search))
      .slice(0, 6);
  }

  get subtotal(): number {
    return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  addProduct(product: Product): void {
    const existing = this.cart.find((item) => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
      return;
    }
    this.cart = [...this.cart, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
  }

  updateQuantity(id: number, delta: number): void {
    this.cart = this.cart.map((item) =>
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    );
  }

  removeItem(id: number): void {
    this.cart = this.cart.filter((item) => item.id !== id);
  }

  finalizeSale(): void {
    if (!this.cart.length) {
      return;
    }

    const client = this.clients.find((item) => item.id === Number(this.selectedClientId));
    const currentSales = this.storageService.getSales();
    this.storageService.appendSale({
      id: `#VEN-${9403 + currentSales.length}`,
      datetime: "Agora mesmo",
      client: client ? client.name : "Cliente balcao",
      mainProduct: this.cart[0].name,
      payment: this.payment,
      value: Math.max(this.subtotal - this.discount, 0),
      status: this.payment === "Fiado" ? "Pendente" : "Concluida"
    });

    this.router.navigateByUrl("/historico");
  }
}
