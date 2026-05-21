# Session 2026-05-19 — Chatbot, funcionários, ponto e documentos

## Objetivo
Rodar localmente branch com **login da main** + **chatbot/config** + **ponto/documentos** para funcionários; abrir PR para merge.

## Repo
`c:\Users\W11\Desktop\Programação\Padaria` — monorepo (`apps/api`, `apps/web`).

## Linha do tempo (resumo)
1. Branch `codex/chatbot-config-funcionarios` já estava no mesmo commit da `main` + commit chatbot; trabalho local não commitado virou `751c744`.
2. Problema 403 ao logar como PADEIRO — permissão, não API caída; proprietário (Joaquim) acessa tudo.
3. Shell mostrava "Administrador" fixo — corrigido com dados de `AuthService` + logout.
4. Modal operacional virou hub → páginas dedicadas ponto/documentos.
5. Seed `ponto:seed` — 120 registros, 4 funcionários, 01/05–18/05/2026 (dias úteis).
6. Página ponto não atualizava — `NgZone` + `ChangeDetectorRef` + filtro default 5/2026.
7. Upload PDF falhou `Invalid Compact JWS` — `SUPABASE_SERVICE_ROLE_KEY` era `sb_secret_*`; trocado para JWT service_role no `.env`.
8. Fallback storage local em `.runtime/documentos/` se Supabase falhar.
9. Documentos: lista só atualizava ao clicar — mesmo fix CD; abrir PDF usava `window.open` na API sem token — corrigido com `HttpClient` blob.
10. Removidos 4 PDFs teste; commit `93fecb2`; push; PR #25.

## PR
https://github.com/LuizApenas/Padaria-Pao-Fresquim/pull/25

## Arquivos-chave criados/alterados
- API: `chatbot.routes.js`, `chatbotService.js`, `chatbotSettingsService.js`, `evolutionService.js`, `funcionarioOperacionalService.js`, `funcionarioDocumentosStorageService.js`, `funcionarios.routes.js`
- Web: `settings.component.*`, `employee-timecard.component.*`, `employee-documents.component.*`, `employees.component.*`, `shell.component.*`, `employees-operations-api.service.ts`
- Scripts: `seed-ponto-historico.js`, `cleanup-documentos-teste.js`

## Não commitado / fora do escopo
- `apps/api/.env` (secrets)
- `apps/web/src/app/features/cameras/cameras (1).component.*` (lixo)
