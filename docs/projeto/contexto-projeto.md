# Padaria Pão FresQUIM - Contexto do Projeto

## O que é
Sistema de gestão para a Padaria Pão FresQUIM (projeto acadêmico - Anhanguera, disciplina Projeto de Sistemas). Substitui controle manual em caderno por sistema digital.

## Equipe
- 3 devs
- Repo: https://github.com/LuizApenas/Padaria-Pao-Fresquim
- GitHub Projects para gerenciamento

## Stack definida
- **Back-end:** Node.js + Express + Prisma + PostgreSQL + REST
- **Front-end:** Next.js (fase futura)
- **Chatbot:** WhatsApp (fase futura, consome APIs do back)

## Documentação completa
Arquivo `docs/projeto/documentacao-completa-padaria-pao-fresquim.pdf` contém:
- 14 RFs do sistema + 6 RFs do chatbot + 4 RNFs
- 10 Casos de Uso detalhados (UC01-UC10) com fluxos, exceções, pré/pós-condições
- Diagramas: Sequência, Atividades, Classes, Objetos, Componentes, Estados, Colaboração, MER
- Mockups de todas as telas (Dashboard, Clientes, Produtos, Funcionários, PDV, Histórico, Fiado, Relatórios, Câmeras, Chatbot, Login, Cadastro)

## Entidades do MER (banco)
- **Cliente:** id, nome, telefone, endereco, cpf (unique), status_serasa
- **Funcionario:** id, nome, cpf (unique), telefone, endereco, matricula (unique), cargo, data_admissao, contato_emergencia + auth (email, senha_hash, role)
- **Produto:** id, codigo_barras (unique), nome, preco_base, categoria
- **Venda:** id, data_hora, valor_total, forma_pagamento, status → FK funcionario, FK cliente (opcional)
- **ItemVenda:** PK composta (id_venda + id_produto), quantidade, subtotal
- **ContaFiado:** id, saldo_devedor, data_ultima_cobranca, status_notificacao → FK cliente (1:1)
- **RegistroPonto:** id, data_hora_batida, tipo_registro → FK funcionario
- **Ferias, Licenca, Atestado:** vinculados a Funcionario

## Roles (perfis de acesso)
- PROPRIETARIO (acesso total)
- ATENDENTE (vendas, clientes)
- PADEIRO (produtos)

## Fases do projeto

### Fase 1 - Back-end + Banco (ATUAL)
13 issues prontas para criar no GitHub:

1. **Setup projeto** (Express + Prisma + estrutura de pastas)
2. **Error handling global** (Zod, Prisma errors, AppError)
3. **Schema Prisma** (baseado no MER)
4. **Seed dados de teste** (baseado no diagrama de objetos)
5. **Auth JWT** (login, middleware ensureAuth, ensureRole)
6. **CRUD Clientes** (RF01/UC01) - busca, paginação, bloqueio delete com fiado aberto
7. **CRUD Produtos** (RF02/UC02) - busca por código de barras (PDV), filtro categoria, soft delete
8. **CRUD Funcionários** (RF03,RF11/UC03) - ponto digital, férias, licenças, atestados
9. **CRUD Vendas** (RF04,RF09,RF10/UC04) - cálculo automático, fiado valida Serasa, transação Prisma
10. **CRUD Fiado** (RF05,RF13,RF14/UC05) - habilitar, cobrança, protestar (mocks das APIs externas)
11. **Relatórios** (RF06,RF07/UC06,UC07) - vendas por período, devedores, dashboard KPIs
12. **Docker Compose** (PostgreSQL + API)
13. **Collection Postman**

### Distribuição sugerida
| Dev | Issues | Foco |
|-----|--------|------|
| Dev 1 | #1, #2, #6, #9, #12 | Setup + Clientes + Vendas + Docker |
| Dev 2 | #3, #4, #7, #10 | Banco + Produtos + Fiado |
| Dev 3 | #5, #8, #11, #13 | Auth + Funcionários + Relatórios + Postman |

### Ordem de execução
```
Semana 1: Setup (#1,#2) + Schema (#3) + Auth (#5) em paralelo
Semana 2: CRUDs (#6,#7,#8,#9,#10) + Relatórios (#11)
Semana 3: Docker (#12) + Postman (#13) + review cruzado
```

### Fase 2 - Integrações externas
APIs reais: Serasa, NF-e (Sefaz), WhatsApp, E-mail

### Fase 3 - Front-end Next.js
Telas conforme mockups. RNFs: fontes grandes (min 16px), botões grandes, sem submenus.

### Fase 4 - Chatbot WhatsApp
UC09 (cobrança automática) + UC10 (pedidos)

## Git Flow
- `main` → produção (protegida)
- `develop` → integração
- `feature/issue-XX-descricao` → branch por issue
- PR para develop com 1 review

## Primeira tarefa
Criar as 13 issues no GitHub usando `gh` CLI. O arquivo `docs/projeto/issues-fase1-backend.md` tem o conteúdo completo de cada issue. Usar o script `scripts/criar-issues.sh` para automatizar.
