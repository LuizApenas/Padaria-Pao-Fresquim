# Padaria Pão FresQUIM

Monorepo inicial do sistema de gestão da Padaria Pão FresQUIM.

Este repositório concentra a base organizacional do projeto acadêmico, a documentação oficial, o backlog da Fase 1 e a estrutura de pastas que será usada para o desenvolvimento das aplicações.

## Objetivo

Substituir o controle manual da padaria por um sistema digital com foco em:

- cadastro de clientes, produtos e funcionários;
- operação de vendas e controle de fiado;
- relatórios gerenciais;
- expansão futura para front-end web, monitoramento por câmeras e chatbot no WhatsApp.

## Escopo Atual

- **Fase 1:** back-end + banco de dados
- **Fase 2:** integrações externas
- **Fase 3:** front-end em Next.js
- **Fase 4:** chatbot WhatsApp

## Stack Planejada

- **Back-end:** Node.js + Express + Prisma + PostgreSQL + REST
- **Front-end:** Next.js
- **Banco:** PostgreSQL
- **Integrações futuras:** Serasa, NF-e, WhatsApp e e-mail

## Estrutura do Monorepo

```text
.
├── apps
│   ├── api
│   │   ├── package.json
│   │   ├── README.md
│   │   └── src
│   │       └── README.md
│   └── web
│       ├── package.json
│       ├── README.md
│       └── src
│           └── README.md
├── docs
│   ├── README.md
│   └── projeto
│       ├── README.md
│       ├── contexto-projeto.md
│       ├── documentacao-completa-padaria-pao-fresquim.pdf
│       └── issues-fase1-backend.md
├── packages
│   └── shared
│       ├── package.json
│       ├── README.md
│       └── src
│           └── README.md
├── scripts
│   ├── criar-issues.py
│   ├── criar-issues.sh
│   └── README.md
├── .gitignore
├── package.json
└── README.md
```

## Organização do Repositório

- [`apps/api`](./apps/api/README.md): backend principal da Fase 1
- [`apps/web`](./apps/web/README.md): frontend futuro em Next.js
- [`packages/shared`](./packages/shared/README.md): código compartilhado entre aplicações
- [`docs`](./docs/README.md): documentação consolidada do projeto
- [`scripts`](./scripts/README.md): automações auxiliares para gestão do repositório

## Documentação de Referência

- [Contexto do projeto](./docs/projeto/contexto-projeto.md)
- [Backlog detalhado da Fase 1](./docs/projeto/issues-fase1-backend.md)
- [Documentação completa em PDF](./docs/projeto/documentacao-completa-padaria-pao-fresquim.pdf)

## Gestão do Projeto

- **Repositório:** <https://github.com/LuizApenas/Padaria-Pao-Fresquim>
- **GitHub Project:** <https://github.com/users/LuizApenas/projects/2>
- **Fluxo sugerido:** `main` para base estável, `develop` para integração e `feature/*` por issue

## Estado do Commit Inicial

Este primeiro commit cria a fundação do monorepo, versiona a documentação oficial e prepara a estrutura onde o time vai implementar o sistema.
