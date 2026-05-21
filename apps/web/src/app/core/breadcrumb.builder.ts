// apps/web/src/app/core/breadcrumb.builder.ts
import { MenuItem } from "primeng/api";
import { getPageMeta, resolvePageIdFromUrl } from "./navigation";

export const BREADCRUMB_HOME: MenuItem = {
  icon: "pi pi-home",
  routerLink: "/dashboard",
  label: "Inicio",
};

/** Builds breadcrumb items after the home link; last item always matches current page label. */
export function buildBreadcrumbTrail(
  url: string,
  pageId: string | undefined,
): MenuItem[] {
  const resolvedPageId = pageId ?? resolvePageIdFromUrl(url);
  const meta = getPageMeta(resolvedPageId);

  if (url.includes("/configuracoes/chatbot-fluxo") || resolvedPageId === "chatbot-fluxo") {
    return [
      { label: "Configuracoes", routerLink: "/configuracoes" },
      { label: meta.label },
    ];
  }

  if (url.includes("/funcionarios/") && url.includes("/ponto")) {
    return [
      { label: "Funcionarios", routerLink: "/funcionarios" },
      { label: "Cartao de ponto" },
    ];
  }

  if (url.includes("/funcionarios/") && url.includes("/documentos")) {
    return [
      { label: "Funcionarios", routerLink: "/funcionarios" },
      { label: "Documentos" },
    ];
  }

  // Top-level pages: home icon + current page label (no link on current page).
  return [{ label: meta.label }];
}
