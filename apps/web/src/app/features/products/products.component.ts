import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, NgZone, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FileUploader } from "@fundamental-ngx/ui5-webcomponents/file-uploader";
import { Product } from "../../core/models";
import { ProductsApiService } from "../../core/services/products-api.service";
import { formatCurrency } from "../../core/utils/format";

type ProductForm = {
  id: number | null;
  nome: string;
  categoria: string;
  codigoBarras: string;
  precoBase: number;
  imagemUrl: string;
};

@Component({
  selector: "pf-products",
  standalone: true,
  imports: [CommonModule, FormsModule, FileUploader],
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
  categories = ["Todos", "Paes", "Frios", "Bebidas", "Mercearia"];
  productCategories = ["Paes", "Frios", "Bebidas", "Mercearia"];
  readonly formatCurrency = formatCurrency;

  form: ProductForm = this.getEmptyForm();

  constructor(
    private readonly productsApiService: ProductsApiService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  get filteredProducts() {
    const filtered = this.products.filter((product) => this.category === "Todos" || product.categoria === this.category);

    if (this.sortBy === "preco") {
      return [...filtered].sort((a, b) => Number(a.precoBase) - Number(b.precoBase));
    }

    return [...filtered].sort((a, b) => b.id - a.id);
  }

  get averagePrice(): number {
    if (!this.products.length) {
      return 0;
    }

    const total = this.products.reduce((sum, product) => sum + Number(product.precoBase), 0);

    return Number((total / this.products.length).toFixed(2));
  }

  get activeProductsCount(): number {
    return this.products.length;
  }

  get categorizedProductsCount(): number {
    return this.products.filter((product) => product.categoria?.trim().length).length;
  }

  get categoriesCount(): number {
    if (!this.products.length) {
      return 0;
    }

    return new Set(this.products.map((product) => product.categoria)).size;
  }

  openCreateModal(): void {
    this.modalMode = "create";
    this.form = this.getEmptyForm();
    this.isModalOpen = true;
  }

  openEditModal(product: Product): void {
    this.modalMode = "edit";
    this.form = {
      id: product.id,
      nome: product.nome ?? product.name,
      categoria: product.categoria ?? product.category,
      codigoBarras: product.codigoBarras ?? product.sku,
      precoBase: product.precoBase ?? product.price,
      imagemUrl: product.imagemUrl ?? "",
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.form = this.getEmptyForm();
  }

  submitForm(): void {
    const normalizedProduct: Product = {
      id: this.form.id ?? this.generateNextId(),
      nome: this.form.nome.trim(),
      categoria: this.form.categoria,
      codigoBarras: this.form.codigoBarras.trim(),
      precoBase: Number(this.form.precoBase),
      imagemUrl: this.form.imagemUrl.trim() || null,
      name: this.form.nome.trim(),
      category: this.form.categoria,
      sku: this.form.codigoBarras.trim(),
      stock: 0,
      unit: "un",
      price: Number(this.form.precoBase)
    };

    if (!normalizedProduct.nome || !normalizedProduct.codigoBarras) {
      return;
    }

    if (this.modalMode === "edit" && this.form.id !== null) {
      this.productsApiService.updateProduct(normalizedProduct).subscribe({
        next: (updatedProduct) => {
          this.products = this.products.map((product) => (product.id === this.form.id ? updatedProduct : product));
          this.closeModal();
        },
        error: () => this.showPersistenceError("Nao foi possivel atualizar o produto na API."),
      });
    } else {
      this.productsApiService.createProduct(normalizedProduct).subscribe({
        next: (createdProduct) => {
          this.products = [createdProduct, ...this.products];
          this.closeModal();
        },
        error: () => this.showPersistenceError("Nao foi possivel cadastrar o produto na API."),
      });
    }
  }

  deleteProduct(productId: number): void {
    this.productsApiService.deleteProduct(productId).subscribe({
      next: () => this.removeProductLocally(productId),
      error: () => this.showPersistenceError("Nao foi possivel excluir o produto na API."),
    });
  }

  onImageSelect(event: Event): void {
    const uploader = event.target as EventTarget & { files?: FileList | null };
    const file = uploader.files?.item(0);

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.form.imagemUrl = String(reader.result ?? "");
    };
    reader.readAsDataURL(file);
  }

  retry(): void {
    this.loadProducts();
  }

  getProductVisual(productName: string | undefined): string {
    if (!productName) return "visual-default";
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
    this.changeDetectorRef.detectChanges();

    this.productsApiService.listProducts().subscribe({
      next: (products) => {
        this.ngZone.run(() => {
          this.products = products.map((product) => this.productsApiService.normalizeProduct(product));
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.products = [];
          this.errorMessage = "API de produtos indisponivel. Nao ha fallback mockado nesta tela.";
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
    });
  }

  private getEmptyForm(): ProductForm {
    return {
      id: null,
      nome: "",
      categoria: "Paes",
      codigoBarras: "",
      precoBase: 0,
      imagemUrl: "",
    };
  }

  private generateNextId(): number {
    return this.products.reduce((max, product) => Math.max(max, product.id), 100) + 1;
  }

  private loadCategories(): void {
    this.productsApiService.listCategories().subscribe({
      next: (categories) => {
        this.ngZone.run(() => {
          const validCategories = categories.filter((item) => item.trim().length > 0);
          this.productCategories = validCategories.length ? validCategories : this.productCategories;
          this.categories = ["Todos", ...this.productCategories];
          this.changeDetectorRef.detectChanges();
        });
      },
      error: () => undefined,
    });
  }

  private removeProductLocally(productId: number): void {
    this.products = this.products.filter((product) => product.id !== productId);
  }

  private showPersistenceError(message: string): void {
    this.errorMessage = message;
  }
}
