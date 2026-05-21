# Deploy na VPS (EasyPanel)

Guia para publicar o monorepo **Padaria Pão FresQUIM** com dois serviços Docker: **API** (backend) e **Web** (frontend Angular + nginx).

## Arquivos

| Serviço | Dockerfile | Porta do container |
|---------|------------|------------------|
| API | `apps/api/Dockerfile` | `3333` |
| Web | `apps/web/Dockerfile` | `80` |

**Contexto de build (obrigatório):** raiz do repositório (`Padaria/`), não a pasta `apps/*`.

## 1. Banco de dados

Use PostgreSQL (Supabase ou Postgres no EasyPanel). Copie variáveis de `apps/api/.env.example`:

- `DATABASE_URL` — pooler (runtime da API)
- `DIRECT_URL` — conexão direta (Prisma CLI / migrations)
- `JWT_SECRET`, chaves Supabase, buckets, etc.

Após o primeiro deploy da API, rode **uma vez** (terminal do container ou job):

```bash
npx prisma db push
npm run prisma:seed
npm run auth:seed
```

## 2. Serviço API no EasyPanel

1. **Novo app** → tipo **Dockerfile**
2. **Repositório:** GitHub `LuizApenas/Padaria-Pao-Fresquim` (ou seu fork)
3. **Build context:** `/` (raiz)
4. **Dockerfile path:** `apps/api/Dockerfile`
5. **Porta publicada:** `3333`
6. **Domínio sugerido:** `api.seudominio.com` (HTTPS)

### Variáveis de ambiente (API)

```env
NODE_ENV=production
PORT=3333
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=troque-por-um-segredo-forte
JWT_EXPIRES_IN=1d
SUPABASE_PROJECT_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET_PRODUTOS=produtos
CORS_ORIGIN=https://app.seudominio.com
```

### Volume persistente (recomendado)

Monte um volume em:

```text
/app/apps/api/.runtime
```

Guarda configuração do chatbot/Evolution e PDFs locais de funcionários.

### Health check

```text
GET /health
```

## 3. Serviço Web no EasyPanel

1. **Novo app** → **Dockerfile**
2. **Build context:** `/`
3. **Dockerfile path:** `apps/web/Dockerfile`
4. **Porta publicada:** `80`
5. **Domínio:** `app.seudominio.com`

### Build argument (obrigatório)

| Argumento | Exemplo | Descrição |
|-----------|---------|-----------|
| `API_URL` | `https://api.seudominio.com` | URL pública da API **sem** barra no final |

No EasyPanel, adicione em **Build Args** ou variáveis de build:

```text
API_URL=https://api.seudominio.com
```

O frontend é compilado com essa URL; se mudar o domínio da API, **rebuild** o serviço web.

### CORS

`CORS_ORIGIN` na API deve incluir a URL exata do front, por exemplo:

```text
https://app.seudominio.com
```

## 4. Evolution / WhatsApp

Webhook da Evolution deve apontar para a **API**, não para o front:

```text
https://api.seudominio.com/api/chatbot/webhook/evolution
```

Token e instância continuam no painel **Configurações** do sistema.

## 5. Teste local com Docker Compose

Na raiz do projeto, crie `.env` na raiz (ou exporte variáveis) com `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, etc.

```bash
API_URL=http://localhost:3333 docker compose up --build
```

- API: http://localhost:3333/health  
- Web: http://localhost:8080  

## 6. Checklist pós-deploy

- [ ] `GET https://api.../health` retorna `{ "status": "ok" }`
- [ ] Login no front com usuário seed (`auth:seed`)
- [ ] `CORS_ORIGIN` bate com o domínio do front
- [ ] Volume `.runtime` montado na API
- [ ] `API_URL` no build do web igual ao domínio público da API
- [ ] Webhook Evolution usando URL da API

## Estrutura resumida

```text
Internet
   |
   +-- app.seudominio.com  -->  container web (nginx :80)
   |
   +-- api.seudominio.com  -->  container api (node :3333)
                                      |
                                      v
                               PostgreSQL (Supabase)
```
