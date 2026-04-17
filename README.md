# Padaria Pão FresQUIM

Monorepo do sistema de gestão da Padaria Pão FresQUIM.

Este repositório concentra a documentação oficial do projeto, o backlog da Fase 1 e a base técnica inicial do backend, incluindo banco de dados, seed e rota de health check.

## Objetivo

Substituir o controle manual da padaria por um sistema digital com foco em:

- cadastro de clientes, produtos e funcionários;
- operação de vendas e controle de fiado;
- relatórios gerenciais;
- expansão futura para frontend web, monitoramento por câmeras e chatbot no WhatsApp.

## Escopo Atual

- **Fase 1:** backend + banco de dados
- **Status atual:** estrutura inicial da API, schema do Prisma, seed e `/health`
- **Frontend:** ainda não iniciado nesta etapa

## Stack do Projeto

- **Backend:** Node.js + Express + Prisma + PostgreSQL + REST
- **Banco:** PostgreSQL / Supabase
- **Frontend futuro:** React
- **Integrações futuras:** Serasa, NF-e, WhatsApp e e-mail

## Estrutura Atual

```text
.
|-- apps
|   |-- api
|   |   |-- prisma
|   |   |   |-- schema.prisma
|   |   |   `-- seed.js
|   |   |-- src
|   |   |   |-- config
|   |   |   |   `-- prisma.js
|   |   |   |-- routes
|   |   |   |   `-- index.js
|   |   |   |-- app.js
|   |   |   |-- README.md
|   |   |   `-- server.js
|   |   |-- .env.example
|   |   |-- package.json
|   |   |-- prisma.config.ts
|   |   `-- README.md
|   `-- web
|       |-- package.json
|       |-- README.md
|       `-- src
|           `-- README.md
|-- docs
|   |-- projeto
|   |   |-- README.md
|   |   |-- contexto-projeto.md
|   |   |-- documentacao-completa-padaria-pao-fresquim.pdf
|   |   `-- issues-fase1-backend.md
|   `-- README.md
|-- scripts
|   |-- criar-issues.py
|   |-- criar-issues.sh
|   `-- README.md
|-- .gitignore
|-- package.json
`-- README.md
```

## Organização do Repositório

- [`apps/api`](./apps/api/README.md): backend principal da Fase 1, com Prisma, seed e tutorial de execução
- [`apps/web`](./apps/web/README.md): workspace reservado para o frontend futuro
- [`docs`](./docs/README.md): documentação consolidada do projeto
- [`scripts`](./scripts/README.md): automações auxiliares para gestão do repositório

## Como Subir o Backend

O passo a passo completo está em [`apps/api/README.md`](./apps/api/README.md).

Resumo:

1. Instale as dependências com `npm install`.
2. Crie o arquivo `apps/api/.env` a partir de `apps/api/.env.example`.
3. Execute `npm run prisma:generate`.
4. Execute `npm run prisma:db:push`.
5. Execute `npm run prisma:seed`.
6. Suba a API com `npm run dev:api` ou `npm run start:api`.
7. Teste em `http://localhost:3333/health`.

## Documentação de Referência

- [Contexto do projeto](./docs/projeto/contexto-projeto.md)
- [Backlog detalhado da Fase 1](./docs/projeto/issues-fase1-backend.md)
- [Documentação completa em PDF](./docs/projeto/documentacao-completa-padaria-pao-fresquim.pdf)

## Gestão do Projeto

- **Repositório:** <https://github.com/LuizApenas/Padaria-Pao-Fresquim>
- **GitHub Project:** <https://github.com/users/LuizApenas/projects/2>
- **Fluxo atual:** `main` como base estável e `feature/*` para desenvolvimento por etapa
