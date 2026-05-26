import { PageMeta } from "./models";

export const NAV_ITEMS: PageMeta[] = [
  { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: "D", placeholder: "Buscar no ERP..." },
  { id: "clientes", label: "Clientes", path: "/clientes", icon: "C", placeholder: "Buscar clientes por nome ou telefone..." },
  { id: "produtos", label: "Produtos", path: "/produtos", icon: "P", placeholder: "Buscar produtos por nome ou SKU..." },
  { id: "funcionarios", label: "Funcionarios", path: "/funcionarios", icon: "F", placeholder: "Buscar colaborador no sistema..." },
  { id: "nova-venda", label: "Nova venda", path: "/vendas/nova", icon: "+", placeholder: "Escaneie o codigo ou digite o nome do produto..." },
  { id: "historico", label: "Historico", path: "/historico", icon: "H", placeholder: "Buscar venda..." },
  { id: "fiado", label: "Fiado", path: "/fiado", icon: "$", placeholder: "Buscar cliente ou divida..." },
  { id: "relatorios", label: "Relatorios", path: "/relatorios", icon: "R", placeholder: "Buscar relatorios..." },
  { id: "cameras", label: "Cameras", path: "/cameras", icon: "M", placeholder: "Pesquisar cameras ou logs..." },
  { id: "chatbot", label: "Chatbot", path: "/chatbot", icon: "AI", placeholder: "Buscar no sistema..." },
  {
    id: "chatbot-kpis",
    label: "KPIs do chatbot",
    path: "/chatbot/kpis",
    icon: "K",
    placeholder: "Buscar metricas e KPIs do chatbot...",
    parentId: "chatbot",
  },
  { id: "configuracoes", label: "Configuracoes", path: "/configuracoes", icon: "CFG", placeholder: "Buscar configuracoes..." },
  {
    id: "chatbot-fluxo",
    label: "Fluxo chatbot",
    path: "/configuracoes/chatbot-fluxo",
    icon: "FL",
    placeholder: "Buscar fluxo e prompt do chatbot...",
    parentId: "configuracoes",
  },
];

export function getPageMeta(pageId: string | undefined): PageMeta {
  return NAV_ITEMS.find((item) => item.id === pageId) ?? NAV_ITEMS[0];
}

/** Resolves page id from the browser URL when route data is missing on the active snapshot. */
export function resolvePageIdFromUrl(url: string): string | undefined {
  const pathname = url.split(/[?#]/)[0].replace(/\/$/, "") || "/";

  if (pathname.includes("/configuracoes/chatbot-fluxo")) {
    return "chatbot-fluxo";
  }

  if (pathname.includes("/chatbot/kpis")) {
    return "chatbot-kpis";
  }

  const sorted = [...NAV_ITEMS].sort((a, b) => b.path.length - a.path.length);
  const match = sorted.find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
  );

  return match?.id;
}

