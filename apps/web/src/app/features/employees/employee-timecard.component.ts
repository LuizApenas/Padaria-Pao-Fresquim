// apps/web/src/app/features/employees/employee-timecard.component.ts
import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { Subscription } from "rxjs";
import { EmployeesApiService } from "../../core/services/employees-api.service";
import { EmployeesOperationsApiService, PointRecord } from "../../core/services/employees-operations-api.service";

type TimecardDayRow = {
  dateKey: string;
  dateLabel: string;
  weekday: string;
  markings: string[];
  workedHours: string;
  occurrences: string;
};

@Component({
  selector: "pf-employee-timecard",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./employee-timecard.component.html",
  styleUrls: ["./employee-ops.shared.css", "./employee-timecard.component.css"],
})
export class EmployeeTimecardComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly employeesApiService = inject(EmployeesApiService);
  private readonly operationsApiService = inject(EmployeesOperationsApiService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);

  private routeSubscription?: Subscription;

  employeeId = 0;
  employeeName = "";
  filterMonth = 5;
  filterYear = 2026;
  pointRecords: PointRecord[] = [];
  dayRows: TimecardDayRow[] = [];
  isLoading = true;
  errorMessage = "";
  successMessage = "";

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      const idParam = params.get("employeeId");
      const parsedId = Number(idParam);

      if (!Number.isInteger(parsedId) || parsedId <= 0) {
        void this.router.navigateByUrl("/funcionarios");
        return;
      }

      this.employeeId = parsedId;
      this.successMessage = "";
      this.errorMessage = "";
      this.loadEmployee();
      this.loadPointRecords();
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  goBack(): void {
    void this.router.navigateByUrl("/funcionarios");
  }

  applyFilter(): void {
    this.loadPointRecords();
  }

  registerPoint(tipoRegistro: "ENTRADA" | "SAIDA"): void {
    this.operationsApiService.registerPoint(this.employeeId, tipoRegistro).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.successMessage = `Ponto de ${tipoRegistro.toLowerCase()} registrado.`;
          this.errorMessage = "";
          this.loadPointRecords();
          this.changeDetectorRef.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.errorMessage = "Nao foi possivel registrar o ponto.";
          this.changeDetectorRef.detectChanges();
        });
      },
    });
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

  private loadPointRecords(): void {
    this.isLoading = true;
    this.errorMessage = "";
    this.changeDetectorRef.detectChanges();

    this.operationsApiService
      .listPointRecords(this.employeeId, { mes: this.filterMonth, ano: this.filterYear })
      .subscribe({
        next: (records) => {
          this.ngZone.run(() => {
            this.pointRecords = records;
            this.dayRows = this.buildDayRows(records);
            this.isLoading = false;
            this.changeDetectorRef.detectChanges();
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.pointRecords = [];
            this.dayRows = [];
            this.errorMessage = "Nao foi possivel carregar o cartao de ponto. Verifique login e permissao.";
            this.isLoading = false;
            this.changeDetectorRef.detectChanges();
          });
        },
      });
  }

  private buildDayRows(records: PointRecord[]): TimecardDayRow[] {
    const grouped = new Map<string, PointRecord[]>();

    for (const record of records) {
      const dateKey = this.toLocalDateKey(new Date(record.dataHoraBatida));
      const bucket = grouped.get(dateKey) ?? [];
      bucket.push(record);
      grouped.set(dateKey, bucket);
    }

    return [...grouped.entries()]
      .sort(([left], [right]) => right.localeCompare(left))
      .map(([dateKey, dayRecords]) => {
        const sorted = [...dayRecords].sort(
          (left, right) => new Date(left.dataHoraBatida).getTime() - new Date(right.dataHoraBatida).getTime(),
        );
        const markings = sorted.map((record) => this.formatTime(record.dataHoraBatida));
        const paddedMarkings = [...markings, "--:--", "--:--", "--:--", "--:--"].slice(0, 4);

        return {
          dateKey,
          dateLabel: this.formatDateLabel(dateKey),
          weekday: this.formatWeekday(dateKey),
          markings: paddedMarkings,
          workedHours: this.calculateWorkedHours(sorted),
          occurrences: sorted.length ? "Registros do periodo" : "Sem marcacoes",
        };
      });
  }

  private toLocalDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private formatTime(value: string): string {
    return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  private formatDateLabel(dateKey: string): string {
    const [year, month, day] = dateKey.split("-");
    return `${day}/${month}/${year}`;
  }

  private formatWeekday(dateKey: string): string {
    const labels = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
    return labels[new Date(`${dateKey}T12:00:00`).getDay()] ?? "---";
  }

  private calculateWorkedHours(records: PointRecord[]): string {
    let totalMinutes = 0;

    for (let index = 0; index < records.length; index += 2) {
      const entrada = records[index];
      const saida = records[index + 1];

      if (!entrada || !saida) {
        continue;
      }

      const diff = new Date(saida.dataHoraBatida).getTime() - new Date(entrada.dataHoraBatida).getTime();

      if (diff > 0) {
        totalMinutes += Math.floor(diff / 60000);
      }
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
}
