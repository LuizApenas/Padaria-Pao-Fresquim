import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { map, timeout } from "rxjs/operators";
import { Employee } from "../models";

const API_BASE_URL = "http://localhost:3333";
const NO_CACHE_HEADERS = new HttpHeaders({
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
});

export type EmployeePayload = {
  nome: string;
  cpf: string;
  telefone: string;
  endereco: string;
  matricula: string;
  cargo: string;
  dataAdmissao: string;
  contatoEmergencia: string;
  role: "PROPRIETARIO" | "ATENDENTE" | "PADEIRO";
  email: string;
  senha?: string;
  ativo?: boolean;
};

export type EmployeesListResponse = {
  data: Employee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

@Injectable({ providedIn: "root" })
export class EmployeesApiService {
  private readonly http = inject(HttpClient);

  listEmployees(params: { busca?: string; page?: number; limit?: number } = {}): Observable<EmployeesListResponse> {
    return this.http
      .get<EmployeesListResponse>(`${API_BASE_URL}/api/funcionarios`, {
        headers: NO_CACHE_HEADERS,
        params: {
          busca: params.busca ?? "",
          page: String(params.page ?? 1),
          limit: String(params.limit ?? 10),
        },
      })
      .pipe(
        timeout(8000),
        map((response) => ({
          ...response,
          data: response.data.map((employee) => this.normalizeEmployee(employee)),
        })),
      );
  }

  createEmployee(employee: EmployeePayload): Observable<Employee> {
    return this.http
      .post<Employee>(`${API_BASE_URL}/api/funcionarios`, employee)
      .pipe(map((createdEmployee) => this.normalizeEmployee(createdEmployee)));
  }

  updateEmployee(employeeId: number, employee: Partial<EmployeePayload>): Observable<Employee> {
    return this.http
      .put<Employee>(`${API_BASE_URL}/api/funcionarios/${employeeId}`, employee)
      .pipe(map((updatedEmployee) => this.normalizeEmployee(updatedEmployee)));
  }

  deleteEmployee(employeeId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/api/funcionarios/${employeeId}`);
  }

  getEmployee(employeeId: number): Observable<Employee> {
    return this.http
      .get<Employee>(`${API_BASE_URL}/api/funcionarios/${employeeId}`, { headers: NO_CACHE_HEADERS })
      .pipe(map((employee) => this.normalizeEmployee(employee)));
  }

  normalizeEmployee(employee: Employee): Employee {
    const nome = employee.nome ?? employee.name;
    const cargo = employee.cargo ?? employee.role;
    const accessRole = (employee.accessRole ?? employee.role ?? "ATENDENTE") as EmployeePayload["role"];
    const ativo = employee.ativo ?? employee.status !== "Inativo";

    return {
      ...employee,
      id: Number(employee.id),
      nome,
      cargo,
      accessRole,
      name: nome,
      role: cargo,
      status: ativo ? "Ativo" : "Inativo",
      monthlyHours: employee.monthlyHours ?? this.calculateMonthlyHours(employee.registrosPonto?.length ?? 0),
      overtime: employee.overtime ?? "0h",
      vacationBalance: employee.vacationBalance ?? this.formatVacationBalance(employee.ferias?.length ?? 0),
      attendance: employee.attendance ?? this.formatAttendance(employee.registrosPonto?.length ?? 0),
      admission: employee.admission ?? this.formatDate(employee.dataAdmissao),
      shift: employee.shift ?? this.mapRoleToShift(accessRole),
    };
  }

  private calculateMonthlyHours(registrosPonto: number): string {
    return `${Math.min(registrosPonto * 4, 220)}h`;
  }

  private formatVacationBalance(feriasCount: number): string {
    return feriasCount > 0 ? `${feriasCount} registro(s)` : "Pendente";
  }

  private formatAttendance(registrosPonto: number): string {
    return registrosPonto > 0 ? "Com ponto" : "Sem ponto";
  }

  private formatDate(date?: string): string {
    if (!date) {
      return "Nao informado";
    }

    return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(date));
  }

  private mapRoleToShift(role?: EmployeePayload["role"]): string {
    if (role === "PADEIRO") {
      return "Producao";
    }

    if (role === "PROPRIETARIO") {
      return "Administrativo";
    }

    return "Atendimento";
  }
}
