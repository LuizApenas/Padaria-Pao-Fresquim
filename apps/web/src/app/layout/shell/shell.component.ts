import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { MenuItem } from "primeng/api";
import { Breadcrumb } from "primeng/breadcrumb";
import { filter, map, startWith } from "rxjs";
import { BREADCRUMB_HOME, buildBreadcrumbTrail } from "../../core/breadcrumb.builder";
import { AuthService, AuthUser } from "../../core/services/auth.service";
import { ZoomService } from "../../core/services/zoom.service";
import { NAV_ITEMS, getPageMeta, resolvePageIdFromUrl } from "../../core/navigation";

const SIDEBAR_STORAGE_KEY = "pf_sidebar_collapsed";

@Component({
  selector: "pf-shell",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive, Breadcrumb],
  templateUrl: "./shell.component.html",
  styleUrl: "./shell.component.css"
})
export class ShellComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly zoomService = inject(ZoomService);

  readonly navItems = NAV_ITEMS;
  readonly zoom = this.zoomService.zoom;
  readonly breadcrumbHome = BREADCRUMB_HOME;
  currentPage = getPageMeta("dashboard");
  breadcrumbItems: MenuItem[] = buildBreadcrumbTrail("/dashboard", "dashboard");
  zoomInput = String(this.zoom());
  sidebarCollapsed = localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        startWith(null),
        map(() => {
          // Walk router state snapshot for reliable data access (works with lazy routes)
          let node = this.router.routerState.snapshot.root;
          let pageId: string | undefined;
          while (node) {
            if (node.data["pageId"]) pageId = node.data["pageId"] as string;
            if (!node.firstChild) break;
            node = node.firstChild;
          }

          const url = this.router.url;
          const resolvedPageId = pageId ?? resolvePageIdFromUrl(url);

          return {
            page: getPageMeta(resolvedPageId),
            trail: buildBreadcrumbTrail(url, resolvedPageId),
          };
        })
      )
      .subscribe(({ page, trail }) => {
        this.currentPage = page;
        this.breadcrumbItems = trail;
      });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem(SIDEBAR_STORAGE_KEY, this.sidebarCollapsed ? "1" : "0");
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

  get currentUser(): AuthUser | null {
    return this.authService.getUser();
  }

  get userDisplayName(): string {
    return this.currentUser?.nome?.trim() || "Usuario";
  }

  get userSubtitle(): string {
    const user = this.currentUser;
    if (!user) {
      return "Sessao ativa";
    }

    const roleLabel = this.formatRole(user.role);
    return user.cargo ? `${user.cargo} · ${roleLabel}` : roleLabel;
  }

  get userEmail(): string {
    return this.currentUser?.email ?? "";
  }

  get userInitials(): string {
    const parts = this.userDisplayName.split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return "?";
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }

  private formatRole(role: AuthUser["role"]): string {
    const labels: Record<AuthUser["role"], string> = {
      PROPRIETARIO: "Proprietario",
      ATENDENTE: "Atendente",
      PADEIRO: "Padeiro",
    };

    return labels[role] ?? role;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl("/login");
  }
}
