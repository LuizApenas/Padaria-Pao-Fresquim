import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Product } from "../../core/models";
import { products as mockProducts } from "../../core/mock-data";
import { ProductsApiService } from "../../core/services/products-api.service";
import { StorageService } from "../../core/services/storage.service";
import { formatCurrency } from "../../core/utils/format";

type ProductForm = {
  id: number | null;
  name: string;
  category: string;
  sku: string;
  price: number;
};

@Component({
  selector: "pf-products",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./products.component.html",
  styleUrl: "./products.component.css"
})
export class ProductsComponent implements OnInit {
  category = "Todos";
  sortBy = "recentes";
  isModalOpen = false;
  modalMode: "create" | "edit" = "create";
  products: Product[] = [];
  isLoading = true;
  errorMessage = "";
  isUsingFallbackData = false;
  fallbackMessage = "";
  readonly categories = ["Todos", "Paes", "Frios", "Bebidas", "Mercearia"];
  readonly productCategories = ["Paes", "Frios", "Bebidas", "Mercearia"];
  readonly formatCurrency = formatCurrency;

  form: ProductForm = this.getEmptyForm();

  constructor(
    private readonly storageService: StorageService,
    private readonly productsApiService: ProductsApiService,
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  get filteredProducts() {
    const filtered = this.products.filter((product) => this.category === "Todos" || product.category === this.category);

    if (this.sortBy === "preco") {
      return [...filtered].sort((a, b) => a.price - b.price);
    }

    return [...filtered].sort((a, b) => b.id - a.id);
  }

  get averagePrice(): number {
    if (!this.products.length) {
      return 0;
    }

    const total = this.products.reduce((sum, product) => sum + product.price, 0);

    return Number((total / this.products.length).toFixed(2));
  }

  get activeProductsCount(): number {
    return this.products.length;
  }

  get categorizedProductsCount(): number {
    return this.products.filter((product) => product.category.trim().length > 0).length;
  }

  get categoriesCount(): number {
    if (!this.products.length) {
      return 0;
    }

    return new Set(this.products.map((product) => product.category)).size;
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
      stock: 0,
      unit: "un",
      price: Number(this.form.price)
    };

    if (!normalizedProduct.name || !normalizedProduct.sku) {
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

  retry(): void {
    this.loadProducts();
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
    this.isLoading = true;
    this.errorMessage = "";
    this.isUsingFallbackData = false;
    this.fallbackMessage = "";

    this.productsApiService.listProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.isLoading = false;
      },
      error: () => {
        this.products = this.storageService.getProducts();

        if (!this.products.length) {
          this.products = mockProducts;
        }

        this.isUsingFallbackData = true;
        this.fallbackMessage =
          "API de produtos indisponivel no momento. Exibindo dados locais para continuarmos a validacao da tela.";
        this.isLoading = false;
      },
    });
  }

  private getEmptyForm(): ProductForm {
    return {
      id: null,
      name: "",
      category: "Paes",
      sku: "",
      price: 0
    };
  }

  private generateNextId(): number {
    return this.products.reduce((max, product) => Math.max(max, product.id), 100) + 1;
  }
}
