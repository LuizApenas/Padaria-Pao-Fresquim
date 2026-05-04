import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Product } from "../../core/models";
import { StorageService } from "../../core/services/storage.service";
import { formatCurrency } from "../../core/utils/format";

type ProductForm = {
  id: number | null;
  name: string;
  category: string;
  sku: string;
  stock: number;
  unit: string;
  price: number;
};

@Component({
  selector: "pf-products",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./products.component.html",
  styleUrl: "./products.component.css"
})
export class ProductsComponent {
  category = "Todos";
  sortBy = "recentes";
  isModalOpen = false;
  modalMode: "create" | "edit" = "create";
  products: Product[] = [];
  readonly categories = ["Todos", "Paes", "Frios", "Bebidas", "Mercearia"];
  readonly productCategories = ["Paes", "Frios", "Bebidas", "Mercearia"];
  readonly formatCurrency = formatCurrency;

  form: ProductForm = this.getEmptyForm();

  constructor(private readonly storageService: StorageService) {
    this.loadProducts();
  }

  get filteredProducts() {
    const filtered = this.products.filter((product) => this.category === "Todos" || product.category === this.category);

    if (this.sortBy === "preco") {
      return [...filtered].sort((a, b) => a.price - b.price);
    }

    if (this.sortBy === "estoque") {
      return [...filtered].sort((a, b) => a.stock - b.stock);
    }

    return [...filtered].sort((a, b) => b.id - a.id);
  }

  get totalInventoryValue(): number {
    return this.products.reduce((sum, product) => sum + product.price * product.stock, 0);
  }

  get activeProductsCount(): number {
    return this.products.length;
  }

  get staleProductsCount(): number {
    return this.products.filter((product) => product.stock <= 12).length;
  }

  get inventoryTurnover(): number {
    if (!this.products.length) {
      return 0;
    }

    const inStock = this.products.filter((product) => product.stock > 0).length;
    return Math.round((inStock / this.products.length) * 100);
  }

  openCreateModal(): void {
    this.modalMode = "create";
    this.form = this.getEmptyForm();
    this.isModalOpen = true;
  }

  openEditModal(product: Product): void {
    this.modalMode = "edit";
    this.form = { ...product };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.form = this.getEmptyForm();
  }

  submitForm(): void {
    const normalizedProduct: Product = {
      id: this.form.id ?? this.generateNextId(),
      name: this.form.name.trim(),
      category: this.form.category,
      sku: this.form.sku.trim(),
      stock: Number(this.form.stock),
      unit: this.form.unit.trim(),
      price: Number(this.form.price)
    };

    if (!normalizedProduct.name || !normalizedProduct.sku || !normalizedProduct.unit) {
      return;
    }

    if (this.modalMode === "edit" && this.form.id !== null) {
      this.products = this.products.map((product) => (product.id === this.form.id ? normalizedProduct : product));
    } else {
      this.products = [normalizedProduct, ...this.products];
    }

    this.storageService.saveProducts(this.products);
    this.closeModal();
  }

  deleteProduct(productId: number): void {
    this.products = this.products.filter((product) => product.id !== productId);
    this.storageService.saveProducts(this.products);
  }

  getProductVisual(productName: string): string {
    if (productName.includes("Pao")) return "visual-bread";
    if (productName.includes("Presunto")) return "visual-coldcuts";
    if (productName.includes("Cafe")) return "visual-coffee";
    if (productName.includes("Geleia")) return "visual-jam";
    if (productName.includes("Azeite")) return "visual-oil";
    if (productName.includes("Cerveja")) return "visual-beer";
    return "visual-default";
  }

  private loadProducts(): void {
    this.products = this.storageService.getProducts();
  }

  private getEmptyForm(): ProductForm {
    return {
      id: null,
      name: "",
      category: "Paes",
      sku: "",
      stock: 0,
      unit: "un",
      price: 0
    };
  }

  private generateNextId(): number {
    return this.products.reduce((max, product) => Math.max(max, product.id), 100) + 1;
  }
}
