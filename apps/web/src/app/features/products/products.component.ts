import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, NgZone, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Product } from "../../core/models";
import { ProductsApiService } from "../../core/services/products-api.service";
import { StorageService } from "../../core/services/storage.service";
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
  persistenceMessage = "";
  formErrorMessage = "";
  categories = ["Todos", "Paes", "Frios", "Bebidas", "Mercearia"];
  productCategories = ["Paes", "Frios", "Bebidas", "Mercearia"];
  readonly formatCurrency = formatCurrency;

  form: ProductForm = this.getEmptyForm();

  constructor(
    private readonly productsApiService: ProductsApiService,
    private readonly storageService: StorageService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  get filteredProducts() {
    const filtered = this.products.filter(
      (product) => this.category === "Todos" || (product.categoria ?? product.category) === this.category
    );

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
    this.formErrorMessage = "";
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
    this.formErrorMessage = "";
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.form = this.getEmptyForm();
    this.formErrorMessage = "";
  }

  submitForm(): void {
    this.formErrorMessage = "";

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
      this.formErrorMessage = "Preencha nome e codigo de barras antes de salvar.";
      return;
    }

    const duplicateSku = this.products.some(
      (product) => product.id !== normalizedProduct.id && (product.codigoBarras ?? product.sku) === normalizedProduct.codigoBarras
    );

    if (duplicateSku) {
      this.formErrorMessage = "Ja existe um produto cadastrado com esse codigo de barras.";
      return;
    }

    if (this.modalMode === "edit" && this.form.id !== null) {
      this.productsApiService.updateProduct(normalizedProduct).subscribe({
        next: (updatedProduct) => {
          this.products = this.mergeProducts(this.products, this.storageService.upsertProduct(updatedProduct));
          this.persistCategoriesFromProducts();
          this.closeModal();
          this.persistenceMessage = "Produto atualizado com sucesso.";
        },
        error: () => {
          this.products = this.storageService.upsertProduct(normalizedProduct);
          this.persistCategoriesFromProducts();
          this.closeModal();
          this.persistenceMessage = "Produto atualizado no armazenamento local.";
        },
      });
    } else {
      this.productsApiService.createProduct(normalizedProduct).subscribe({
        next: (createdProduct) => {
          this.products = this.mergeProducts(this.products, this.storageService.upsertProduct(createdProduct));
          this.persistCategoriesFromProducts();
          this.closeModal();
          this.persistenceMessage = "Produto cadastrado com sucesso.";
        },
        error: () => {
          this.products = this.storageService.upsertProduct(normalizedProduct);
          this.persistCategoriesFromProducts();
          this.closeModal();
          this.persistenceMessage = "Produto cadastrado no armazenamento local.";
        },
      });
    }
  }

  deleteProduct(productId: number): void {
    this.productsApiService.deleteProduct(productId).subscribe({
      next: () => {
        this.storageService.deleteProduct(productId);
        this.removeProductLocally(productId);
        this.persistenceMessage = "Produto removido com sucesso.";
      },
      error: () => {
        this.products = this.storageService.deleteProduct(productId);
        this.persistCategoriesFromProducts();
        this.persistenceMessage = "Produto removido do armazenamento local.";
      },
    });
  }

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.item(0);

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
    this.persistenceMessage = "";
    this.changeDetectorRef.detectChanges();

    const localProducts = this.storageService.getProducts();

    this.productsApiService.listProducts().subscribe({
      next: (products) => {
        this.ngZone.run(() => {
          this.products = this.mergeProducts(products, localProducts);
          this.persistCategoriesFromProducts();
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.products = localProducts;
          this.persistCategoriesFromProducts();
          this.errorMessage = "API de produtos indisponivel no momento. Exibindo o catalogo salvo localmente.";
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
      error: () => {
        this.persistCategoriesFromProducts();
      },
    });
  }

  private removeProductLocally(productId: number): void {
    this.products = this.products.filter((product) => product.id !== productId);
    this.persistCategoriesFromProducts();
  }

  private showPersistenceError(message: string): void {
    this.formErrorMessage = message;
  }

  private mergeProducts(primaryProducts: Product[], secondaryProducts: Product[]): Product[] {
    const productMap = new Map<number, Product>();

    [...secondaryProducts, ...primaryProducts]
      .map((product) => this.productsApiService.normalizeProduct(product))
      .forEach((product) => {
        productMap.set(product.id, product);
      });

    return Array.from(productMap.values()).sort((a, b) => b.id - a.id);
  }

  private persistCategoriesFromProducts(): void {
    const dynamicCategories = Array.from(
      new Set(
        this.products
          .map((product) => product.categoria ?? product.category)
          .filter((category): category is string => Boolean(category?.trim()))
      )
    );

    this.productCategories = dynamicCategories.length ? dynamicCategories : ["Paes", "Frios", "Bebidas", "Mercearia"];
    this.categories = ["Todos", ...this.productCategories];
  }
}
