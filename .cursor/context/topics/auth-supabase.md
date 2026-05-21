# Auth / Supabase

## Login
- Front: `/login` → `POST /api/auth/login` (Supabase Auth + vínculo `funcionario`)
- Token em `localStorage`: `pao-fresquim-auth-token`
- Interceptor: `auth.interceptor.ts` (401 → logout)

## Perfis (`role`)
| Role | Acesso típico |
|------|----------------|
| PROPRIETARIO | Tudo (funcionários, relatórios, config, chatbot) |
| ATENDENTE | Clientes, vendas, fiado (não funcionários) |
| PADEIRO | Principalmente produtos |

## Seeds / credenciais demo
- Proprietário: `joaquim@paofresquim.com` + `SUPABASE_AUTH_SEED_PASSWORD` no `.env`
- Padeiro teste: `joao.silva@paofresquim.com` (403 em rotas admin)

## Storage keys (`.env`)
- `SUPABASE_PROJECT_URL`
- `SUPABASE_ANON_KEY` — login
- `SUPABASE_SERVICE_ROLE_KEY` — **JWT** `eyJ...` (service_role), não `sb_secret_...`
- Erro `Invalid Compact JWS` = chave errada para Storage API
