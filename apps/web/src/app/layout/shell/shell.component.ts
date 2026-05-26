import { CommonModule } from "@angular/common";
import { Component, HostListener, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { MenuItem } from "primeng/api";
import { Breadcrumb } from "primeng/breadcrumb";
import { filter, map, startWith } from "rxjs";
import { BREADCRUMB_HOME, buildBreadcrumbTrail } from "../../core/breadcrumb.builder";
import { AuthService, AuthUser } from "../../core/services/auth.service";
import { ThemeMode, ThemeService } from "../../core/services/theme.service";
import { ZoomService } from "../../core/services/zoom.service";
import { NAV_ITEMS, getPageMeta, resolvePageIdFromUrl } from "../../core/navigation";
import { HelpDrawerComponent } from "../../shared/help-drawer/help-drawer.component";

const SIDEBAR_STORAGE_KEY = "pf_sidebar_collapsed";
const BASE_APP_SCALE = 1;
const ZOOM_STEP = 10;

type ShortcutItem = {
  key: string;
  label: string;
  path: string;
};

@Component({
  selector: "pf-shell",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive, Breadcrumb, HelpDrawerComponent],
  templateUrl: "./shell.component.html",
  styleUrl: "./shell.component.css"
})
export class ShellComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly zoomService = inject(ZoomService);

  readonly navItems = NAV_ITEMS;
  readonly zoom = this.zoomService.zoom;
  readonly breadcrumbHome = BREADCRUMB_HOME;
  readonly shortcuts: ShortcutItem[] = [
    { key: "F1", label: "Dashboard", path: "/dashboard" },
    { key: "F2", label: "Nova venda", path: "/vendas/nova" },
    { key: "F3", label: "Produtos", path: "/produtos" },
    { key: "F4", label: "Clientes", path: "/clientes" },
    { key: "F5", label: "Historico", path: "/historico" },
    { key: "F6", label: "Fiado", path: "/fiado" },
    { key: "F7", label: "Relatorios", path: "/relatorios" },
    { key: "F8", label: "Funcionarios", path: "/funcionarios" },
    { key: "F9", label: "Chatbot", path: "/chatbot" },
    { key: "F10", label: "Configuracoes", path: "/configuracoes" },
  ];
  currentPage = getPageMeta("dashboard");
  breadcrumbItems: MenuItem[] = buildBreadcrumbTrail("/dashboard", "dashboard");
  zoomInput = String(this.zoom());
  sidebarCollapsed = localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
  mobileSidebarOpen = false;
  helpOpen = false;
  shortcutsOpen = false;

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
        this.mobileSidebarOpen = false;
      });
  }

  toggleHelp(): void {
    this.helpOpen = !this.helpOpen;
  }

  closeHelp(): void {
    this.helpOpen = false;
  }

  toggleShortcuts(): void {
    this.shortcutsOpen = !this.shortcutsOpen;
  }

  closeShortcuts(): void {
    this.shortcutsOpen = false;
  }

  openHelpFromShortcuts(): void {
    this.shortcutsOpen = false;
    this.helpOpen = true;
  }

  navigateShortcut(item: ShortcutItem): void {
    this.shortcutsOpen = false;
    this.router.navigateByUrl(item.path);
  }

  get currentPageId(): string {
    return this.currentPage?.id ?? "";
  }

  @HostListener("document:keydown", ["$event"])
  handleGlobalKeydown(event: KeyboardEvent): void {
    if (this.isEditableTarget(event.target)) {
      return;
    }

    if (event.key === "Escape") {
      if (this.shortcutsOpen) {
        event.preventDefault();
        this.closeShortcuts();
      } else if (this.helpOpen) {
        event.preventDefault();
        this.closeHelp();
      }
      return;
    }

    if (event.key === "?") {
      event.preventDefault();
      this.toggleShortcuts();
      return;
    }

    const shortcut = this.shortcuts.find((item) => item.key === event.key);
    if (shortcut) {
      event.preventDefault();
      this.navigateShortcut(shortcut);
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem(SIDEBAR_STORAGE_KEY, this.sidebarCollapsed ? "1" : "0");
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen = !this.mobileSidebarOpen;
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen = false;
  }

  setPresetZoom(value: number): void {
    this.zoomService.setZoom(value);
    this.zoomInput = String(this.zoom());
  }

  decreaseZoom(): void {
    this.setPresetZoom(this.zoom() - ZOOM_STEP);
  }

  increaseZoom(): void {
    this.setPresetZoom(this.zoom() + ZOOM_STEP);
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

  get appScale(): string {
    return String((this.zoom() / 100) * BASE_APP_SCALE);
  }

  get currentThemeMode(): ThemeMode {
    return this.themeService.mode();
  }

  setThemeMode(mode: ThemeMode): void {
    this.themeService.setMode(mode);
  }

  isThemeMode(mode: ThemeMode): boolean {
    return this.themeService.isMode(mode);
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

  private isEditableTarget(target: EventTarget | null): boolean {
    const element = target as HTMLElement | null;
    if (!element) {
      return false;
    }

    const tagName = element.tagName?.toLowerCase();
    return tagName === "input" || tagName === "textarea" || tagName === "select" || element.isContentEditable;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl("/login");
  }
}
