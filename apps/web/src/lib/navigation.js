export const pages = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard.html", icon: "◫", placeholder: "Buscar no ERP..." },
  { id: "clientes", label: "Clientes", href: "/clientes.html", icon: "◎", placeholder: "Buscar clientes por nome ou telefone..." },
  { id: "produtos", label: "Produtos", href: "/produtos.html", icon: "▦", placeholder: "Buscar produtos por nome ou SKU..." },
  { id: "funcionarios", label: "Funcionários", href: "/funcionarios.html", icon: "◌", placeholder: "Buscar colaborador no sistema..." },
  { id: "nova-venda", label: "Nova venda", href: "/nova-venda.html", icon: "＋", placeholder: "Escaneie o código ou digite o nome do produto..." },
  { id: "historico", label: "Histórico", href: "/historico.html", icon: "◴", placeholder: "Buscar venda..." },
  { id: "fiado", label: "Fiado", href: "/fiado.html", icon: "¤", placeholder: "Buscar cliente ou dívida..." },
  { id: "relatorios", label: "Relatórios", href: "/relatorios.html", icon: "◷", placeholder: "Buscar relatórios..." },
  { id: "cameras", label: "Câmeras", href: "/cameras.html", icon: "◉", placeholder: "Pesquisar câmeras ou logs..." },
  { id: "chatbot", label: "Chatbot", href: "/chatbot.html", icon: "✦", placeholder: "Buscar no sistema..." },
  { id: "configuracoes", label: "Configurações", href: "/configuracoes.html", icon: "⚙", placeholder: "Buscar configurações..." }
];

export const getPageConfig = (pageId) => pages.find((page) => page.id === pageId) ?? pages[0];
