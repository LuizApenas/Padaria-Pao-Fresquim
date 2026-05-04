import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { filter, map, startWith } from "rxjs";
import { AuthService } from "../../core/services/auth.service";
import { ZoomService } from "../../core/services/zoom.service";
import { NAV_ITEMS, getPageMeta } from "../../core/navigation";

@Component({
  selector: "pf-shell",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: "./shell.component.html",
  styleUrl: "./shell.component.css"
})
export class ShellComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly zoomService = inject(ZoomService);

  readonly navItems = NAV_ITEMS;
  readonly zoom = this.zoomService.zoom;
  currentPage = getPageMeta("dashboard");
  zoomInput = String(this.zoom());

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        startWith(null),
        map(() => {
          let active = this.route.firstChild;
          while (active?.firstChild) {
            active = active.firstChild;
          }
          return getPageMeta(active?.snapshot.data["pageId"]);
        })
      )
      .subscribe((page) => {
        this.currentPage = page;
      });
  }

  setPresetZoom(value: number): void {
    this.zoomService.setZoom(value);
    this.zoomInput = String(this.zoom());
  }

  applyCustomZoom(): void {
    const parsed = Number(this.zoomInput);
    if (!Number.isFinite(parsed)) {
      this.zoomInput = String(this.zoom());
      return;
    }

    this.zoomService.setZoom(parsed);
    this.zoomInput = String(this.zoom());
  }

  get zoomScale(): string {
    return `${this.zoom()}%`;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl("/login");
  }
}
