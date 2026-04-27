import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        dashboard: resolve(__dirname, "dashboard.html"),
        clientes: resolve(__dirname, "clientes.html"),
        produtos: resolve(__dirname, "produtos.html"),
        funcionarios: resolve(__dirname, "funcionarios.html"),
        novaVenda: resolve(__dirname, "nova-venda.html"),
        historico: resolve(__dirname, "historico.html"),
        fiado: resolve(__dirname, "fiado.html"),
        relatorios: resolve(__dirname, "relatorios.html"),
        cameras: resolve(__dirname, "cameras.html"),
        chatbot: resolve(__dirname, "chatbot.html"),
        configuracoes: resolve(__dirname, "configuracoes.html")
      }
    }
  }
});
