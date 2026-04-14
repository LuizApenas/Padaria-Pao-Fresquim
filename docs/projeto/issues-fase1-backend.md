# Fase 1 — Back-end + Banco de Dados

**Stack:** Node.js · Express · Prisma · PostgreSQL · REST  
**Equipe:** 3 devs  
**Estimativa:** ~2 semanas

---

## Labels sugeridas no GitHub

| Label | Cor | Descrição |
|-------|-----|-----------|
| `setup` | `#0E8A16` | Configuração inicial do projeto |
| `database` | `#1D76DB` | Schema, migrations, seed |
| `crud` | `#5319E7` | Endpoints CRUD |
| `auth` | `#D93F0B` | Autenticação e autorização |
| `business-logic` | `#FBCA04` | Regras de negócio específicas |
| `integracao` | `#F9D0C4` | APIs externas (Serasa, NF-e, WhatsApp) |
| `prioridade-alta` | `#B60205` | Bloqueia outras tarefas |
| `prioridade-media` | `#FF9F1C` | Importante mas não bloqueia |

---

## Milestone: Setup do Projeto

### Issue #1 — Inicializar repositório back-end
**Labels:** `setup` `prioridade-alta`  
**Assignee:** Dev 1

**Descrição:**  
Configurar a estrutura base do projeto Node.js + Express + Prisma.

**Tarefas:**
- [ ] Inicializar `package.json` com scripts (`dev`, `start`, `prisma:migrate`, `prisma:generate`, `prisma:seed`)
- [ ] Instalar dependências: `express`, `cors`, `helmet`, `morgan`, `dotenv`, `express-async-errors`, `jsonwebtoken`, `bcryptjs`, `zod`, `@prisma/client`
- [ ] Instalar devDependencies: `prisma`, `nodemon`
- [ ] Criar estrutura de pastas: `src/routes`, `src/controllers`, `src/middlewares`, `src/services`, `src/utils`, `src/config`
- [ ] Criar `src/app.js` (Express com middlewares globais)
- [ ] Criar `src/server.js` (entry point)
- [ ] Criar `src/config/prisma.js` (singleton do PrismaClient)
- [ ] Criar `.env.example` com variáveis necessárias
- [ ] Criar `.gitignore` (node_modules, .env, prisma/*.db)
- [ ] Endpoint `GET /health` retornando `{ status: "ok" }`
- [ ] Testar subida do server local

**Critério de aceite:** `npm run dev` sobe sem erros e `GET /health` responde 200.

---

### Issue #2 — Middleware de error handling global
**Labels:** `setup` `prioridade-alta`  
**Assignee:** Dev 1

**Descrição:**  
Criar tratamento centralizado de erros para padronizar respostas da API.

**Tarefas:**
- [ ] Criar `src/utils/AppError.js` (classe com `message` e `statusCode`)
- [ ] Criar `src/middlewares/errorHandler.js` tratando:
  - Erros de validação Zod → 400 com detalhes dos campos
  - Prisma `P2025` (not found) → 404
  - Prisma `P2002` (unique constraint) → 409 com nome do campo
  - Prisma `P2003` (FK inválida) → 400
  - AppError customizado → statusCode dinâmico
  - Erro genérico → 500
- [ ] Registrar middleware no `app.js` como último `app.use`

**Critério de aceite:** Erros retornam JSON padronizado `{ error: "mensagem", details?: [] }`.

---

## Milestone: Banco de Dados (Schema + Seed)

### Issue #3 — Schema Prisma baseado no MER
**Labels:** `database` `prioridade-alta`  
**Assignee:** Dev 2

**Descrição:**  
Criar o schema Prisma espelhando o MER da documentação. Entidades: Cliente, Funcionario, Produto, Venda, ItemVenda, ContaFiado, RegistroPonto.

**Referência:** Página 33 da documentação — MER (Modelo Entidade Relacionamento)

**Tarefas:**
- [ ] Criar enums: `Role` (PROPRIETARIO, ATENDENTE, PADEIRO), `FormaPagamento` (DINHEIRO, DEBITO, CREDITO, PIX, FIADO), `StatusSerasa`, `StatusNotificacao`, `TipoRegistroPonto`, `StatusVenda`
- [ ] Model `Cliente`: id, nome, telefone, endereco, cpf (unique), statusSerasa → relação 1:0..1 com ContaFiado, 1:N com Venda
- [ ] Model `Funcionario`: id, nome, cpf (unique), telefone, endereco, matricula (unique), cargo, dataAdmissao, contatoEmergencia, role, email (unique), senhaHash → relação 1:N com Venda, RegistroPonto, Ferias, Licenca, Atestado
- [ ] Model `Produto`: id, codigoBarras (unique), nome, precoBase, categoria, imagemUrl → relação 1:N com ItemVenda
- [ ] Model `Venda`: id, dataHora, valorTotal, formaPagamento, status → FK funcionarioId, clienteId (opcional) → relação 1:N com ItemVenda
- [ ] Model `ItemVenda`: PK composta (vendaId + produtoId), quantidade, subtotal
- [ ] Model `ContaFiado`: id, saldoDevedor, dataUltimaCobranca, statusNotificacao → FK clienteId (unique)
- [ ] Model `RegistroPonto`: id, dataHoraBatida, tipoRegistro → FK funcionarioId
- [ ] Models auxiliares: `Ferias`, `Licenca`, `Atestado` (vinculados a Funcionario)
- [ ] Usar `@@map()` para nomes em snake_case no banco
- [ ] Campos de auditoria: `criadoEm`, `atualizadoEm` em todas as entidades principais
- [ ] Rodar `npx prisma migrate dev --name init` e validar que as tabelas foram criadas

**Critério de aceite:** `npx prisma studio` abre e mostra todas as tabelas com relacionamentos corretos.

---

### Issue #4 — Seed com dados de teste
**Labels:** `database` `prioridade-media`  
**Assignee:** Dev 2

**Descrição:**  
Criar script de seed para popular o banco com dados fictícios baseados no diagrama de objetos (pág. 27 da documentação).

**Tarefas:**
- [ ] Criar `prisma/seed.js`
- [ ] Seed de Funcionários: 1 Proprietário (Sr. Joaquim), 2 Atendentes, 1 Padeiro — com senhas hasheadas
- [ ] Seed de Produtos: Pão Francês, Pão de Queijo, Bolo de Fubá, Broa de Milho, Coca-Cola, Café, etc. com códigos de barras
- [ ] Seed de Clientes: Sr. João Batista (do diagrama de objetos) + 5 clientes fictícios
- [ ] Seed de Vendas: 3-5 vendas de exemplo (Concluída, Fiado, Cancelada)
- [ ] Seed de ContaFiado: 1-2 clientes com saldo devedor
- [ ] Configurar script `prisma:seed` no `package.json`

**Critério de aceite:** `npm run prisma:seed` executa sem erros, dados visíveis no Prisma Studio.

---

## Milestone: Autenticação

### Issue #5 — Auth: Login + JWT + Middleware
**Labels:** `auth` `prioridade-alta`  
**Assignee:** Dev 3

**Descrição:**  
Implementar autenticação JWT com roles conforme UC03 (Proprietário, Atendente, Padeiro).

**Tarefas:**
- [ ] Criar `src/middlewares/auth.js`:
  - `ensureAuth` — valida Bearer token, popula `req.user` com { id, role, nome }
  - `ensureRole(...roles)` — verifica se `req.user.role` está na lista permitida
- [ ] Criar `POST /api/auth/login`:
  - Recebe `{ email, senha }`
  - Valida com Zod
  - Busca funcionário por email (ativo = true)
  - Compara senha com bcrypt
  - Retorna `{ token, usuario: { id, nome, email, role, cargo } }`
- [ ] Criar `GET /api/auth/me`:
  - Rota protegida, retorna dados do usuário logado
- [ ] Variáveis de ambiente: `JWT_SECRET`, `JWT_EXPIRES_IN`

**Critério de aceite:** Login via Postman retorna token válido. Rotas protegidas rejeitam requests sem token (401) e com role errada (403).

---

## Milestone: CRUDs — APIs Core

### Issue #6 — CRUD Clientes (RF01 / UC01)
**Labels:** `crud` `business-logic` `prioridade-alta`  
**Assignee:** Dev 1

**Depende de:** #1, #2, #3, #5

**Descrição:**  
API completa de clientes conforme especificação do UC01.

**Endpoints:**
- [ ] `GET /api/clientes` — Listar com busca (nome, telefone, CPF) + paginação
- [ ] `GET /api/clientes/:id` — Detalhes com contaFiado e últimas vendas
- [ ] `POST /api/clientes` — Criar (validar campos obrigatórios com Zod)
- [ ] `PUT /api/clientes/:id` — Editar (validação parcial)
- [ ] `DELETE /api/clientes/:id` — Excluir

**Regras de negócio (do UC01):**
- [ ] Campo obrigatório em branco → 400 com detalhe do campo
- [ ] Telefone já cadastrado → 409 (Prisma P2002 já trata via CPF unique)
- [ ] Excluir cliente com fiado em aberto → 400 "Não é possível excluir cliente com fiado em aberto"

**Permissões:** Atendente e Proprietário (ambos autenticados)

**Critério de aceite:** Todos os endpoints testados no Postman, regras de negócio validadas.

---

### Issue #7 — CRUD Produtos (RF02 / UC02)
**Labels:** `crud` `prioridade-alta`  
**Assignee:** Dev 2

**Depende de:** #1, #2, #3, #5

**Descrição:**  
API de gestão do catálogo conforme UC02.

**Endpoints:**
- [ ] `GET /api/produtos` — Listar com busca (nome, código) + filtro por categoria + paginação
- [ ] `GET /api/produtos/categorias` — Listar categorias únicas (para filtros do front)
- [ ] `GET /api/produtos/codigo/:codigoBarras` — Buscar por código de barras (usado pelo PDV/leitor)
- [ ] `GET /api/produtos/:id` — Detalhes
- [ ] `POST /api/produtos` — Criar (apenas Proprietário e Padeiro)
- [ ] `PUT /api/produtos/:id` — Editar (apenas Proprietário e Padeiro)
- [ ] `DELETE /api/produtos/:id` — Soft delete, marca `ativo = false` (apenas Proprietário)

**Regras de negócio (do UC02):**
- [ ] Código de barras duplicado → 409
- [ ] Excluir produto com vendas vinculadas → exibir aviso, solicitar confirmação (flag `force=true` no request)

**Permissões:** Leitura = todos autenticados. Escrita = Proprietário + Padeiro. Delete = Proprietário.

**Critério de aceite:** Busca por código de barras funciona (endpoint crítico pro PDV).

---

### Issue #8 — CRUD Funcionários (RF03, RF11 / UC03)
**Labels:** `crud` `business-logic` `prioridade-alta`  
**Assignee:** Dev 3

**Depende de:** #1, #2, #3, #5

**Descrição:**  
API de gestão de funcionários com sub-recursos de ponto digital, férias, licenças e atestados.

**Endpoints principais:**
- [ ] `GET /api/funcionarios` — Listar com busca + paginação
- [ ] `GET /api/funcionarios/:id` — Detalhes com ponto, férias, licenças, atestados
- [ ] `POST /api/funcionarios` — Criar (com hash de senha)
- [ ] `PUT /api/funcionarios/:id` — Editar
- [ ] `DELETE /api/funcionarios/:id` — Soft delete

**Sub-recursos (RF11):**
- [ ] `POST /api/funcionarios/:id/ponto` — Registrar batida (ENTRADA/SAIDA)
- [ ] `GET /api/funcionarios/:id/ponto?mes=X&ano=Y` — Listar registros por mês
- [ ] `POST /api/funcionarios/:id/ferias` — Registrar férias
- [ ] `POST /api/funcionarios/:id/licencas` — Registrar licença
- [ ] `POST /api/funcionarios/:id/atestados` — Registrar atestado (recebe URL do arquivo)

**Regras de negócio (do UC03):**
- [ ] CPF duplicado → 409
- [ ] Férias antes do período aquisitivo (12 meses) → 400 com data em que direito será adquirido
- [ ] Arquivo de atestado: validar que URL foi fornecida (upload do arquivo fica pro front)

**Permissões:** Apenas Proprietário para todas as operações.

**Critério de aceite:** Registros de ponto aparecem no GET do funcionário, férias validam período aquisitivo.

---

### Issue #9 — CRUD Vendas (RF04, RF09, RF10 / UC04)
**Labels:** `crud` `business-logic` `prioridade-alta`  
**Assignee:** Dev 1

**Depende de:** #3, #5, #6, #7

**Descrição:**  
API de vendas com cálculo automático, formas de pagamento e integração com fiado. Esta é a transação mais importante do sistema.

**Endpoints:**
- [ ] `GET /api/vendas` — Histórico com filtros (período, funcionário) + paginação
- [ ] `GET /api/vendas/:id` — Detalhes completos (itens, funcionário, cliente)
- [ ] `POST /api/vendas` — Registrar venda
- [ ] `PATCH /api/vendas/:id/cancelar` — Cancelar (apenas Proprietário)

**Payload do POST:**
```json
{
  "formaPagamento": "FIADO",
  "clienteId": 1,
  "itens": [
    { "produtoId": 1, "quantidade": 10 },
    { "produtoId": 2, "quantidade": 5 }
  ]
}
```

**Regras de negócio (do UC04):**
- [ ] Buscar preço atual de cada produto e calcular subtotal/total automaticamente
- [ ] Identificar funcionário responsável via `req.user` (do JWT)
- [ ] Pagamento FIADO: clienteId obrigatório, validar status Serasa do cliente
- [ ] Cliente negativado → bloquear venda fiado (400)
- [ ] Usar transação Prisma (`$transaction`): criar venda + itens + atualizar saldo fiado (se aplicável)
- [ ] Cancelar venda: reverter saldo fiado se era FIADO, mudar status para CANCELADA

**Critério de aceite:** Venda fiado incrementa saldo devedor. Venda com cliente negativado é bloqueada. Cancelamento reverte saldo.

---

### Issue #10 — CRUD Fiado (RF05, RF13, RF14 / UC05)
**Labels:** `crud` `business-logic` `integracao` `prioridade-alta`  
**Assignee:** Dev 2

**Depende de:** #3, #5, #6

**Descrição:**  
API de gestão do fiado: habilitar cliente, visualizar saldo, enviar cobrança, protestar no Serasa.

**Endpoints:**
- [ ] `POST /api/fiado/:clienteId/habilitar` — Habilitar cliente para fiado (consulta Serasa)
- [ ] `GET /api/fiado` — Listar todos os clientes com fiado ativo + saldos
- [ ] `GET /api/fiado/:clienteId` — Detalhes: saldo, produtos comprados fiado, datas, histórico de cobranças
- [ ] `POST /api/fiado/:clienteId/cobranca` — Disparar cobrança manual (WhatsApp + e-mail)
- [ ] `POST /api/fiado/:clienteId/protestar` — Enviar ao Serasa (apenas Proprietário)

**Regras de negócio (do UC05):**
- [ ] Habilitar fiado: consultar API Serasa → se negativado, bloquear
- [ ] Se cliente ficar negativado após habilitação: flag de aviso no response
- [ ] Cobrança: marcar data da última cobrança, atualizar statusNotificacao

**Nota sobre integrações externas:**  
Na Fase 1, criar os endpoints com lógica mockada (serviço retorna sucesso simulado). Integração real com Serasa/WhatsApp/E-mail fica pra Fase 2. Criar interfaces dos services (`serasaService.js`, `whatsappService.js`, `emailService.js`) com métodos stub.

**Critério de aceite:** Fluxo completo funciona com mocks. Estrutura pronta para plugar APIs reais depois.

---

### Issue #11 — API de Relatórios (RF06, RF07 / UC06, UC07)
**Labels:** `crud` `prioridade-media`  
**Assignee:** Dev 3

**Depende de:** #3, #5, #9, #10

**Descrição:**  
Endpoints de relatórios para consumo do front.

**Endpoints:**
- [ ] `GET /api/relatorios/vendas?dataInicio=X&dataFim=Y&produtoId=Z` — Relatório de vendas por período
  - Total de vendas (R$)
  - Número de transações
  - Ticket médio
  - Vendas agrupadas por dia (para gráfico)
  - Ranking de produtos mais vendidos
- [ ] `GET /api/relatorios/devedores` — Lista de inadimplentes
  - Nome, telefone, total devido, produtos comprados com datas, histórico de cobranças
- [ ] `GET /api/relatorios/dashboard` — KPIs para tela principal
  - Total vendido hoje
  - Nº de vendas hoje
  - Ticket médio
  - Clientes com fiado (qtd)
  - Comparativo vs ontem (%)

**Regras de negócio (do UC06):**
- [ ] Relatório deve responder em menos de 2 segundos (usar queries otimizadas, `groupBy` do Prisma)

**Permissões:** Apenas Proprietário.

**Critério de aceite:** Endpoint de vendas retorna dados agrupados por dia. Dashboard retorna KPIs calculados.

---

## Milestone: Infraestrutura

### Issue #12 — Docker Compose (PostgreSQL + API)
**Labels:** `setup` `prioridade-media`  
**Assignee:** Dev 1

**Descrição:**  
Containerizar o ambiente de desenvolvimento para o time inteiro rodar igual.

**Tarefas:**
- [ ] `Dockerfile` para a API Node.js
- [ ] `docker-compose.yml` com:
  - PostgreSQL 16 (porta 5432, volume persistente)
  - API Node.js (porta 3333, depende do postgres)
- [ ] Script de inicialização: rodar migrations + seed automaticamente
- [ ] Atualizar README com instruções de setup

**Critério de aceite:** `docker compose up` sobe tudo, API responde no `/health`.

---

### Issue #13 — Collection Postman para testes
**Labels:** `setup` `prioridade-media`  
**Assignee:** Dev 3

**Descrição:**  
Criar collection Postman compartilhada para o time testar todos os endpoints.

**Tarefas:**
- [ ] Pasta "Auth" (login, me)
- [ ] Pasta "Clientes" (CRUD completo)
- [ ] Pasta "Produtos" (CRUD + busca por código de barras)
- [ ] Pasta "Funcionários" (CRUD + ponto + férias + licenças + atestados)
- [ ] Pasta "Vendas" (CRUD + cancelar)
- [ ] Pasta "Fiado" (habilitar, listar, cobrança, protestar)
- [ ] Pasta "Relatórios" (vendas, devedores, dashboard)
- [ ] Variáveis de ambiente: `{{base_url}}`, `{{token}}`
- [ ] Script de pré-request no login para setar token automaticamente
- [ ] Exportar `.json` e commitar no repo em `/docs/postman/`

**Critério de aceite:** Importar collection e rodar todos os requests sequencialmente sem erro.

---

## Distribuição sugerida (3 devs)

| Dev | Issues | Foco |
|-----|--------|------|
| **Dev 1** | #1, #2, #6, #9, #12 | Setup + Clientes + Vendas + Docker |
| **Dev 2** | #3, #4, #7, #10 | Banco (schema/seed) + Produtos + Fiado |
| **Dev 3** | #5, #8, #11, #13 | Auth + Funcionários + Relatórios + Postman |

### Ordem de execução (dependências)

```
Semana 1:
  Dev 1: #1 (setup) → #2 (error handler)
  Dev 2: #3 (schema) → #4 (seed)
  Dev 3: #5 (auth)
  
Semana 2:
  Dev 1: #6 (clientes) → #9 (vendas)
  Dev 2: #7 (produtos) → #10 (fiado)
  Dev 3: #8 (funcionários) → #11 (relatórios)
  
Semana 3:
  Dev 1: #12 (docker)
  Dev 3: #13 (postman)
  Todos: code review cruzado + testes integrados
```

---

## Git Flow sugerido

- `main` — produção (protegida)
- `develop` — integração
- `feature/issue-XX-descricao` — branch por issue
- PR para `develop` com pelo menos 1 review
