# API

Workspace do back-end da Padaria Pão FresQUIM.

## Objetivo desta etapa

Nesta fase, o backend foi preparado para:

- conectar no PostgreSQL hospedado no Supabase;
- modelar o banco com Prisma;
- popular o banco com dados iniciais;
- expor um endpoint mínimo de verificação da API;
- padronizar o retorno de erros da aplicação.

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
- classes de domínio do backend baseadas no diagrama de classes;
- cliente Prisma 7 configurado com `@prisma/adapter-pg`;
- `schema.prisma` inicial derivado do MER da documentação;
- `prisma.config.ts` configurado para uso da conexão direta na CLI;
- seed inicial com funcionários, clientes, produtos, contas de fiado e vendas;
- endpoint `GET /health` para validar a subida do serviço;
- tratamento global de erros com `AppError` e middleware centralizado;
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
│   ├── domain
│   │   ├── entities
│   │   └── enums.js
│   ├── middlewares
│   │   └── errorHandler.js
│   ├── routes
│   │   └── index.js
│   ├── utils
│   │   └── AppError.js
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
- `src/domain/entities`: classes do domínio baseadas no diagrama de classes
- `src/domain/enums.js`: enums do domínio usados pelas classes
- `src/routes/index.js`: rota `/health`
- `src/utils/AppError.js`: classe para erros controlados da aplicação
- `src/middlewares/errorHandler.js`: middleware global que padroniza respostas de erro
- `.env.example`: modelo das variáveis de ambiente do backend
- `prisma.config.ts`: configuração da CLI do Prisma 7
- `sql/setup-storage-produtos.sql`: definição idempotente do bucket de imagens de produtos
- `scripts/setup-storage-produtos.js`: executor para provisionar o bucket no Supabase

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
- `SUPABASE_PROJECT_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET_PRODUTOS`

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

### 6. Provisionar o bucket de imagens dos produtos

```bash
npm run storage:setup --workspace @padaria/api
```

Esse passo cria o bucket público `produtos` no Supabase com:

- limite de 5 MB por arquivo;
- tipos permitidos `image/jpeg`, `image/png`, `image/webp` e `image/avif`;
- políticas básicas para usuários autenticados fazerem upload, atualização e remoção futuramente.

### 7. Subir a API em ambiente local

```bash
npm run dev --workspace @padaria/api
```

### 8. Testar se a API está online

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
- API mínima respondendo `GET /health`;
- tratamento global de erros preparado para Zod, Prisma e erros customizados;
- provisionamento do bucket de imagens de produtos automatizado.

Ainda não iniciado:

- autenticação;
- CRUDs;
- regras completas de negócio;
- relatórios.
