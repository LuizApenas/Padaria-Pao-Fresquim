# Current — Padaria Pão FresQUIM

**Updated:** 2026-05-19

## Status
- Branch `codex/chatbot-config-funcionarios` pushed; **PR #25** pronta para merge na `main`.
- Local: API `:3333`, front `:4200`.
- Login Supabase ativo; testar como **proprietário** (`joaquim@paofresquim.com`).

## Entregue nesta linha de trabalho
1. **Chatbot / Configurações** — Evolution API, webhook, métricas, painel em `/configuracoes` (persistência `.runtime/chatbot-config.json`).
2. **Funcionários** — Hub operacional (relógio) → `/funcionarios/:id/ponto` e `/funcionarios/:id/documentos`.
3. **Cartão de ponto** — Tabela por dia, filtro mês/ano (default 5/2026), seed histórico 01/05–18/05.
4. **Documentos** — Upload PDF (Supabase ou fallback `.runtime/documentos/`), lista com abertura via blob + Bearer.
5. **Shell** — Nome/e-mail/role do usuário logado + botão **Sair**.
6. **Limpeza** — 4 PDFs de teste removidos do DB; fake generator não cria mais atestado.

## Commits na PR (ordem)
- `751c744` feat(chatbot): Evolution + config
- `851ecd7` feat(funcionarios): ponto + documentos + seed
- `93fecb2` fix(documentos): UI + abrir PDF autenticado

## Env crítico (`apps/api/.env`)
- `SUPABASE_SERVICE_ROLE_KEY` deve ser **JWT** `service_role` (não `sb_secret_...`).
- `SUPABASE_STORAGE_BUCKET_FUNCIONARIOS=funcionarios-documentos`
- `SUPABASE_AUTH_SEED_PASSWORD` para seeds/login dos funcionários

## Scripts úteis
```bash
npm run dev:api --workspace @padaria/api
npm run dev:web
npm run ponto:seed --workspace @padaria/api          # marcacoes 01/05–18/05/2026
npm run documentos:cleanup-teste --workspace @padaria/api
```

## Next steps
- [ ] Merge PR #25 na `main`
- [ ] Criar bucket `funcionarios-documentos` no Supabase Storage (se usar cloud)
- [ ] Opcional: esconder itens do menu por `role` (PADEIRO só Produtos)
- [ ] Remover arquivos lixo `cameras (1).component.*` (untracked)

## Riscos / notas
- Rotas `/funcionarios/*` exigem `PROPRIETARIO` (403 para PADEIRO).
- PDFs locais: URL `/api/funcionarios/documentos-arquivo/...` — abrir só pelo front (com token).
- Logs dev: `.codex-run-logs/`
