// apps/web/src/app/features/employees/employee-documents.component.ts
import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { EmployeesApiService } from "../../core/services/employees-api.service";
import {
  EmployeeDocument,
  EmployeesOperationsApiService,
} from "../../core/services/employees-operations-api.service";

@Component({
  selector: "pf-employee-documents",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./employee-documents.component.html",
  styleUrls: ["./employee-ops.shared.css", "./employee-documents.component.css"],
})
export class EmployeeDocumentsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly employeesApiService = inject(EmployeesApiService);
  private readonly operationsApiService = inject(EmployeesOperationsApiService);

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
    const idParam = this.route.snapshot.paramMap.get("employeeId");
    this.employeeId = Number(idParam);

    if (!Number.isInteger(this.employeeId) || this.employeeId <= 0) {
      void this.router.navigateByUrl("/funcionarios");
      return;
    }

    this.loadEmployee();
    this.loadDocuments();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      this.selectedFile = null;
      return;
    }

    if (file.type !== "application/pdf") {
      this.errorMessage = "Envie apenas arquivos PDF.";
      this.selectedFile = null;
      input.value = "";
      return;
    }

    this.selectedFile = file;
    this.errorMessage = "";
  }

  uploadDocument(): void {
    if (!this.selectedFile) {
      this.errorMessage = "Selecione um PDF para enviar.";
      return;
    }

    this.isUploading = true;
    this.errorMessage = "";
    this.successMessage = "";

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
            this.isUploading = false;
            this.successMessage = "PDF enviado para o storage e vinculado ao funcionario.";
            this.selectedFile = null;
            this.observacao = "";
            this.loadDocuments();
          },
          error: () => {
            this.isUploading = false;
            this.errorMessage = "Nao foi possivel enviar o documento.";
          },
        });
    };

    reader.onerror = () => {
      this.isUploading = false;
      this.errorMessage = "Nao foi possivel ler o arquivo PDF.";
    };

    reader.readAsDataURL(this.selectedFile);
  }

  openDocument(document: EmployeeDocument): void {
    const url = this.operationsApiService.resolveDocumentUrl(document.arquivoUrl);

    if (url.startsWith("http://") || url.startsWith("https://")) {
      window.open(url, "_blank", "noopener");
      return;
    }

    this.http.get(url, { responseType: "blob" }).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, "_blank", "noopener");
      },
      error: () => {
        this.errorMessage = "Nao foi possivel abrir o documento.";
      },
    });
  }

  private loadEmployee(): void {
    this.employeesApiService.getEmployee(this.employeeId).subscribe({
      next: (employee) => {
        this.employeeName = employee.nome ?? employee.name;
      },
      error: () => {
        this.employeeName = `Funcionario #${this.employeeId}`;
      },
    });
  }

  private loadDocuments(): void {
    this.isLoading = true;
    this.errorMessage = "";

    this.operationsApiService.listDocuments(this.employeeId).subscribe({
      next: (documents) => {
        this.documents = documents;
        this.isLoading = false;
      },
      error: () => {
        this.documents = [];
        this.errorMessage = "Nao foi possivel carregar os documentos.";
        this.isLoading = false;
      },
    });
  }
}
