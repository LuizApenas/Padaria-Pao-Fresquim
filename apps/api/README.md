# API

Workspace do back-end da Padaria Pão FresQUIM.

## Objetivo desta etapa

Nesta fase, o backend foi preparado para:

- conectar no PostgreSQL hospedado no Supabase;
- modelar o banco com Prisma;
- popular o banco com dados iniciais;
- expor um endpoint mínimo de verificação da API.

## Responsabilidades futuras

- autenticação e autorização por perfil;
- CRUD de clientes, produtos, funcionários, vendas e fiado;
- relatórios gerenciais;
- integração com PostgreSQL/Supabase via Prisma;
- preparação de integrações externas futuras.

## Stack

- Node.js
- Express
- Prisma
- PostgreSQL
- Supabase

## O que já foi feito

- estrutura base da API;
- cliente Prisma 7 configurado com `@prisma/adapter-pg`;
- `schema.prisma` inicial derivado do MER da documentação;
- `prisma.config.ts` configurado para uso da conexão direta na CLI;
- seed inicial com funcionários, clientes, produtos, contas de fiado e vendas;
- endpoint `GET /health` para validar a subida do serviço;
- integração local testada com `prisma validate`, `prisma db push`, `prisma seed` e `/health`.

## Estrutura principal

```text
apps/api
├── prisma
│   ├── schema.prisma
│   └── seed.js
├── src
│   ├── config
│   │   └── prisma.js
│   ├── routes
│   │   └── index.js
│   ├── app.js
│   └── server.js
├── .env.example
├── package.json
└── prisma.config.ts
```

## Arquivos importantes

- `prisma/schema.prisma`: definição das tabelas e enums do banco
- `prisma/seed.js`: carga inicial de dados para desenvolvimento
- `src/config/prisma.js`: inicialização do Prisma Client
- `src/routes/index.js`: rota `/health`
- `.env.example`: modelo das variáveis de ambiente do backend
- `prisma.config.ts`: configuração da CLI do Prisma 7

## Scripts disponíveis

- `npm run dev --workspace @padaria/api`: sobe a API com nodemon
- `npm run start --workspace @padaria/api`: sobe a API com node
- `npm run prisma:generate --workspace @padaria/api`: gera o cliente Prisma
- `npm run prisma:validate --workspace @padaria/api`: valida o schema
- `npm run prisma:db:push --workspace @padaria/api`: sincroniza o schema com o banco
- `npm run prisma:seed --workspace @padaria/api`: executa a carga inicial
- `npm run prisma:studio --workspace @padaria/api`: abre o Prisma Studio

## Variáveis de ambiente

O backend usa três URLs de banco:

- `DATABASE_URL`: conexão principal usada pela API em runtime
- `DIRECT_URL`: conexão direta usada pela CLI do Prisma
- `TRANSACTION_DATABASE_URL`: referência para cenários futuros com transaction pooler

Também ficam definidos:

- `PORT`
- `NODE_ENV`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`

## Como subir o backend

### 1. Instalar as dependências do monorepo

Na raiz do projeto, execute:

```bash
npm install
```

### 2. Configurar o arquivo de ambiente da API

Use o arquivo de exemplo como base:

```bash
cp apps/api/.env.example apps/api/.env
```

No Windows PowerShell, você pode usar:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

Depois, ajuste no `apps/api/.env`:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `PORT`

### 3. Validar o schema do Prisma

```bash
npm run prisma:validate --workspace @padaria/api
```

### 4. Sincronizar o banco com o schema atual

```bash
npm run prisma:db:push --workspace @padaria/api
```

### 5. Popular o banco com dados iniciais

```bash
npm run prisma:seed --workspace @padaria/api
```

### 6. Subir a API em ambiente local

```bash
npm run dev --workspace @padaria/api
```

### 7. Testar se a API está online

Abra no navegador, Postman ou Insomnia:

```text
http://localhost:3333/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "service": "padaria-api"
}
```

## Estado atual

Pronto nesta etapa:

- banco modelado;
- tabelas sincronizadas no Supabase;
- seed inicial funcionando;
- API mínima respondendo `GET /health`.

Ainda não iniciado:

- autenticação;
- middlewares de erro;
- CRUDs;
- regras completas de negócio;
- relatórios.
