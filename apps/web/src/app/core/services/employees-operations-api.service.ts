// apps/web/src/app/core/services/employees-operations-api.service.ts
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";

const NO_CACHE_HEADERS = new HttpHeaders({
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
});

import { API_BASE_URL } from "../config/api-base-url";

export type PointRecord = {
  id: number;
  dataHoraBatida: string;
  tipoRegistro: "ENTRADA" | "SAIDA";
  funcionarioId: number;
};

export type EmployeeDocument = {
  id: number;
  arquivoUrl: string;
  dataEntrega: string;
  observacao?: string | null;
  funcionarioId: number;
};

export type UploadDocumentPayload = {
  fileName: string;
  contentBase64: string;
  dataEntrega: string;
  observacao?: string;
};

@Injectable({ providedIn: "root" })
export class EmployeesOperationsApiService {
  private readonly http = inject(HttpClient);

  listPointRecords(employeeId: number, filters?: { mes?: number; ano?: number }): Observable<PointRecord[]> {
    const params: Record<string, string> = {};

    if (filters?.mes) {
      params["mes"] = String(filters.mes);
    }

    if (filters?.ano) {
      params["ano"] = String(filters.ano);
    }

    return this.http.get<PointRecord[]>(`${API_BASE_URL}/api/funcionarios/${employeeId}/ponto`, {
      params,
      headers: NO_CACHE_HEADERS,
    });
  }

  registerPoint(employeeId: number, tipoRegistro: "ENTRADA" | "SAIDA"): Observable<PointRecord> {
    return this.http.post<PointRecord>(`${API_BASE_URL}/api/funcionarios/${employeeId}/ponto`, {
      tipoRegistro,
    });
  }

  listDocuments(employeeId: number): Observable<EmployeeDocument[]> {
    return this.http.get<EmployeeDocument[]>(`${API_BASE_URL}/api/funcionarios/${employeeId}/atestados`);
  }

  uploadDocument(employeeId: number, payload: UploadDocumentPayload): Observable<EmployeeDocument> {
    return this.http.post<EmployeeDocument>(`${API_BASE_URL}/api/funcionarios/${employeeId}/documentos`, payload);
  }

  generateFakeOperationalData(employeeId: number): Observable<unknown> {
    return this.http.post<unknown>(`${API_BASE_URL}/api/funcionarios/${employeeId}/dados-operacionais/fake`, {});
  }

  resolveDocumentUrl(arquivoUrl: string): string {
    if (arquivoUrl.startsWith("http://") || arquivoUrl.startsWith("https://")) {
      return arquivoUrl;
    }

    return `${API_BASE_URL}${arquivoUrl.startsWith("/") ? "" : "/"}${arquivoUrl}`;
  }
}
