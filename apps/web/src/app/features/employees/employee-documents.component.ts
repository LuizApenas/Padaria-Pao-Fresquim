// apps/web/src/app/features/employees/employee-documents.component.ts
import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { Subscription } from "rxjs";
import { EmployeesApiService } from "../../core/services/employees-api.service";
import {
  EmployeeDocument,
  EmployeesOperationsApiService,
} from "../../core/services/employees-operations-api.service";

const API_BASE_URL = "http://localhost:3333";

@Component({
  selector: "pf-employee-documents",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./employee-documents.component.html",
  styleUrls: ["./employee-ops.shared.css", "./employee-documents.component.css"],
})
export class EmployeeDocumentsComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly employeesApiService = inject(EmployeesApiService);
  private readonly operationsApiService = inject(EmployeesOperationsApiService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);

  private routeSubscription?: Subscription;

  @ViewChild("fileInput") fileInput?: ElementRef<HTMLInputElement>;

  employeeId = 0;
  employeeName = "";
  documents: EmployeeDocument[] = [];
  selectedFile: File | null = null;
  dataEntrega = new Date().toISOString().slice(0, 10);
  observacao = "";
  isLoading = true;
  isUploading = false;
  errorMessage = "";
  successMessage = "";

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      const parsedId = Number(params.get("employeeId"));

      if (!Number.isInteger(parsedId) || parsedId <= 0) {
        void this.router.navigateByUrl("/funcionarios");
        return;
      }

      this.employeeId = parsedId;
      this.successMessage = "";
      this.errorMessage = "";
      this.loadEmployee();
      this.loadDocuments();
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      this.selectedFile = null;
      return;
    }

    if (file.type !== "application/pdf") {
      this.ngZone.run(() => {
        this.errorMessage = "Envie apenas arquivos PDF.";
        this.selectedFile = null;
        input.value = "";
        this.changeDetectorRef.detectChanges();
      });
      return;
    }

    this.ngZone.run(() => {
      this.selectedFile = file;
      this.errorMessage = "";
      this.changeDetectorRef.detectChanges();
    });
  }

  uploadDocument(): void {
    if (!this.selectedFile) {
      this.errorMessage = "Selecione um PDF para enviar.";
      this.changeDetectorRef.detectChanges();
      return;
    }

    this.isUploading = true;
    this.errorMessage = "";
    this.successMessage = "";
    this.changeDetectorRef.detectChanges();

    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result ?? "");
      const contentBase64 = result.includes(",") ? result.split(",")[1] : result;

      this.operationsApiService
        .uploadDocument(this.employeeId, {
          fileName: this.selectedFile?.name ?? "documento.pdf",
          contentBase64,
          dataEntrega: this.dataEntrega,
          observacao: this.observacao.trim() || undefined,
        })
        .subscribe({
          next: () => {
            this.ngZone.run(() => {
              this.isUploading = false;
              this.successMessage = "PDF enviado e vinculado ao funcionario.";
              this.selectedFile = null;
              this.observacao = "";

              if (this.fileInput?.nativeElement) {
                this.fileInput.nativeElement.value = "";
              }

              this.loadDocuments();
              this.changeDetectorRef.detectChanges();
            });
          },
          error: () => {
            this.ngZone.run(() => {
              this.isUploading = false;
              this.errorMessage = "Nao foi possivel enviar o documento.";
              this.changeDetectorRef.detectChanges();
            });
          },
        });
    };

    reader.onerror = () => {
      this.ngZone.run(() => {
        this.isUploading = false;
        this.errorMessage = "Nao foi possivel ler o arquivo PDF.";
        this.changeDetectorRef.detectChanges();
      });
    };

    reader.readAsDataURL(this.selectedFile);
  }

  openDocument(document: EmployeeDocument): void {
    const url = this.operationsApiService.resolveDocumentUrl(document.arquivoUrl);

    if (!this.requiresAuthenticatedDownload(url)) {
      window.open(url, "_blank", "noopener");
      return;
    }

    this.http.get(url, { responseType: "blob" }).subscribe({
      next: (blob) => {
        this.ngZone.run(() => {
          const objectUrl = URL.createObjectURL(blob);
          window.open(objectUrl, "_blank", "noopener");
          setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
          this.changeDetectorRef.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.errorMessage = "Nao foi possivel abrir o documento.";
          this.changeDetectorRef.detectChanges();
        });
      },
    });
  }

  private requiresAuthenticatedDownload(url: string): boolean {
    if (url.startsWith("/api/")) {
      return true;
    }

    return url.startsWith(API_BASE_URL) || url.includes("/api/funcionarios/documentos-arquivo/");
  }

  private loadEmployee(): void {
    this.employeesApiService.getEmployee(this.employeeId).subscribe({
      next: (employee) => {
        this.ngZone.run(() => {
          this.employeeName = employee.nome ?? employee.name;
          this.changeDetectorRef.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.employeeName = `Funcionario #${this.employeeId}`;
          this.changeDetectorRef.detectChanges();
        });
      },
    });
  }

  private loadDocuments(): void {
    this.isLoading = true;
    this.errorMessage = "";
    this.changeDetectorRef.detectChanges();

    this.operationsApiService.listDocuments(this.employeeId).subscribe({
      next: (documents) => {
        this.ngZone.run(() => {
          this.documents = documents;
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.documents = [];
          this.errorMessage = "Nao foi possivel carregar os documentos.";
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
    });
  }
}
