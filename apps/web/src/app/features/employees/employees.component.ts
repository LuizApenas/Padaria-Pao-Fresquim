import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { employees } from "../../core/mock-data";
import { StatusBadgeComponent } from "../../shared/status-badge/status-badge.component";

@Component({
  selector: "pf-employees",
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  templateUrl: "./employees.component.html",
  styleUrl: "./employees.component.css"
})
export class EmployeesComponent {
  readonly employees = employees;
}
