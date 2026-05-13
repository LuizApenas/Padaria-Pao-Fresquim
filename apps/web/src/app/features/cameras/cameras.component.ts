import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { cameras, logs } from "../../core/mock-data";

@Component({
  selector: "pf-cameras",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./cameras.component.html",
  styleUrl: "./cameras.component.css"
})
export class CamerasComponent {
  readonly cameras = cameras;
  readonly logs = logs;
}
