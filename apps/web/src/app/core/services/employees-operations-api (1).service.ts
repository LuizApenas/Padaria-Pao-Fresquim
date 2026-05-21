import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";

const API_BASE_URL = "http://localhost:3333";

export type PointRecord = {
  id: number;
  dataHoraBatida: string;
  tipoRegistro: "ENTRADA" | "SAIDA";
  funcionarioId: number;
};

@Injectable({ providedIn: "root" })
export class EmployeesOperationsApiService {
  private readonly http = inject(HttpClient);

  listPointRecords(employeeId: number): Observable<PointRecord[]> {
    return this.http.get<PointRecord[]>(`${API_BASE_URL}/api/funcionarios/${employeeId}/ponto`);
  }

  registerPoint(employeeId: number, tipoRegistro: "ENTRADA" | "SAIDA"): Observable<PointRecord> {
    return this.http.post<PointRecord>(`${API_BASE_URL}/api/funcionarios/${employeeId}/ponto`, {
      tipoRegistro,
    });
  }

  generateFakeOperationalData(employeeId: number): Observable<unknown> {
    return this.http.post<unknown>(`${API_BASE_URL}/api/funcionarios/${employeeId}/dados-operacionais/fake`, {});
  }
}
