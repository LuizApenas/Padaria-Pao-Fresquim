#!/bin/bash

# Script para criar as 13 issues da Fase 1 no GitHub usando gh CLI
# Uso: ./criar-issues.sh

set -e

REPO="LuizApenas/Padaria-Pao-Fresquim"

echo "🚀 Criando 13 issues no repositório $REPO..."
echo ""

# Issue #1
gh issue create \
  --repo "$REPO" \
  --title "Inicializar repositório back-end" \
  --body "Configurar a estrutura base do projeto Node.js + Express + Prisma.

**Tarefas:**
- [ ] Inicializar \`package.json\` com scripts (\`dev\`, \`start\`, \`prisma:migrate\`, \`prisma:generate\`, \`prisma:seed\`)
- [ ] Instalar dependências: \`express\`, \`cors\`, \`helmet\`, \`morgan\`, \`dotenv\`, \`express-async-errors\`, \`jsonwebtoken\`, \`bcryptjs\`, \`zod\`, \`@prisma/client\`
- [ ] Instalar devDependencies: \`prisma\`, \`nodemon\`
- [ ] Criar estrutura de pastas: \`src/routes\`, \`src/controllers\`, \`src/middlewares\`, \`src/services\`, \`src/utils\`, \`src/config\`
- [ ] Criar \`src/app.js\` (Express com middlewares globais)
- [ ] Criar \`src/server.js\` (entry point)
- [ ] Criar \`src/config/prisma.js\` (singleton do PrismaClient)
- [ ] Criar \`.env.example\` com variáveis necessárias
- [ ] Criar \`.gitignore\` (node_modules, .env, prisma/*.db)
- [ ] Endpoint \`GET /health\` retornando \`{ status: \"ok\" }\`
- [ ] Testar subida do server local

**Critério de aceite:** \`npm run dev\` sobe sem erros e \`GET /health\` responde 200." \
  --label "setup,prioridade-alta" \
  --milestone "Setup do Projeto"

echo "✅ Issue #1 criada"

# Issue #2
gh issue create \
  --repo "$REPO" \
  --title "Middleware de error handling global" \
  --body "Criar tratamento centralizado de erros para padronizar respostas da API.

**Tarefas:**
- [ ] Criar \`src/utils/AppError.js\` (classe com \`message\` e \`statusCode\`)
- [ ] Criar \`src/middlewares/errorHandler.js\` tratando:
  - Erros de validação Zod → 400 com detalhes dos campos
  - Prisma \`P2025\` (not found) → 404
  - Prisma \`P2002\` (unique constraint) → 409 com nome do campo
  - Prisma \`P2003\` (FK inválida) → 400
  - AppError customizado → statusCode dinâmico
  - Erro genérico → 500
- [ ] Registrar middleware no \`app.js\` como último \`app.use\`

**Critério de aceite:** Erros retornam JSON padronizado \`{ error: \"mensagem\", details?: [] }\`." \
  --label "setup,prioridade-alta" \
  --milestone "Setup do Projeto"

echo "✅ Issue #2 criada"

# Issue #3
gh issue create \
  --repo "$REPO" \
  --title "Schema Prisma baseado no MER" \
  --body "Criar o schema Prisma espelhando o MER da documentação. Entidades: Cliente, Funcionario, Produto, Venda, ItemVenda, ContaFiado, RegistroPonto.

**Tarefas:**
- [ ] Criar enums: \`Role\` (PROPRIETARIO, ATENDENTE, PADEIRO), \`FormaPagamento\` (DINHEIRO, DEBITO, CREDITO, PIX, FIADO), \`StatusSerasa\`, \`StatusNotificacao\`, \`TipoRegistroPonto\`, \`StatusVenda\`
- [ ] Model \`Cliente\`: id, nome, telefone, endereco, cpf (unique), statusSerasa → relação 1:0..1 com ContaFiado, 1:N com Venda
- [ ] Model \`Funcionario\`: id, nome, cpf (unique), telefone, endereco, matricula (unique), cargo, dataAdmissao, contatoEmergencia, role, email (unique), senhaHash → relação 1:N com Venda, RegistroPonto, Ferias, Licenca, Atestado
- [ ] Model \`Produto\`: id, codigoBarras (unique), nome, precoBase, categoria, imagemUrl → relação 1:N com ItemVenda
- [ ] Model \`Venda\`: id, dataHora, valorTotal, formaPagamento, status → FK funcionarioId, clienteId (opcional) → relação 1:N com ItemVenda
- [ ] Model \`ItemVenda\`: PK composta (vendaId + produtoId), quantidade, subtotal
- [ ] Model \`ContaFiado\`: id, saldoDevedor, dataUltimaCobranca, statusNotificacao → FK clienteId (unique)
- [ ] Model \`RegistroPonto\`: id, dataHoraBatida, tipoRegistro → FK funcionarioId
- [ ] Models auxiliares: \`Ferias\`, \`Licenca\`, \`Atestado\` (vinculados a Funcionario)
- [ ] Usar \`@@map()\` para nomes em snake_case no banco
- [ ] Campos de auditoria: \`criadoEm\`, \`atualizadoEm\` em todas as entidades principais
- [ ] Rodar \`npx prisma migrate dev --name init\` e validar que as tabelas foram criadas

**Critério de aceite:** \`npx prisma studio\` abre e mostra todas as tabelas com relacionamentos corretos." \
  --label "database,prioridade-alta" \
  --milestone "Banco de Dados (Schema + Seed)"

echo "✅ Issue #3 criada"

# Issue #4
gh issue create \
  --repo "$REPO" \
  --title "Seed com dados de teste" \
  --body "Criar script de seed para popular o banco com dados fictícios.

**Tarefas:**
- [ ] Criar \`prisma/seed.js\`
- [ ] Seed de Funcionários: 1 Proprietário (Sr. Joaquim), 2 Atendentes, 1 Padeiro — com senhas hasheadas
- [ ] Seed de Produtos: Pão Francês, Pão de Queijo, Bolo de Fubá, Broa de Milho, Coca-Cola, Café, etc. com códigos de barras
- [ ] Seed de Clientes: Sr. João Batista + 5 clientes fictícios
- [ ] Seed de Vendas: 3-5 vendas de exemplo (Concluída, Fiado, Cancelada)
- [ ] Seed de ContaFiado: 1-2 clientes com saldo devedor
- [ ] Configurar script \`prisma:seed\` no \`package.json\`

**Critério de aceite:** \`npm run prisma:seed\` executa sem erros, dados visíveis no Prisma Studio." \
  --label "database,prioridade-media" \
  --milestone "Banco de Dados (Schema + Seed)"

echo "✅ Issue #4 criada"

# Issue #5
gh issue create \
  --repo "$REPO" \
  --title "Auth: Login + JWT + Middleware" \
  --body "Implementar autenticação JWT com roles (Proprietário, Atendente, Padeiro).

**Tarefas:**
- [ ] Criar \`src/middlewares/auth.js\`:
  - \`ensureAuth\` — valida Bearer token, popula \`req.user\` com { id, role, nome }
  - \`ensureRole(...roles)\` — verifica se \`req.user.role\` está na lista permitida
- [ ] Criar \`POST /api/auth/login\`:
  - Recebe \`{ email, senha }\`
  - Valida com Zod
  - Busca funcionário por email (ativo = true)
  - Compara senha com bcrypt
  - Retorna \`{ token, usuario: { id, nome, email, role, cargo } }\`
- [ ] Criar \`GET /api/auth/me\`:
  - Rota protegida, retorna dados do usuário logado
- [ ] Variáveis de ambiente: \`JWT_SECRET\`, \`JWT_EXPIRES_IN\`

**Critério de aceite:** Login via Postman retorna token válido. Rotas protegidas rejeitam requests sem token (401) e com role errado (403)." \
  --label "auth,prioridade-alta" \
  --milestone "Autenticação"

echo "✅ Issue #5 criada"

# Issue #6
gh issue create \
  --repo "$REPO" \
  --title "CRUD Clientes (RF01 / UC01)" \
  --body "API completa de clientes.

**Endpoints:**
- [ ] \`GET /api/clientes\` — Listar com busca (nome, telefone, CPF) + paginação
- [ ] \`GET /api/clientes/:id\` — Detalhes com contaFiado e últimas vendas
- [ ] \`POST /api/clientes\` — Criar (validar campos obrigatórios com Zod)
- [ ] \`PUT /api/clientes/:id\` — Editar (validação parcial)
- [ ] \`DELETE /api/clientes/:id\` — Excluir

**Regras de negócio:**
- [ ] Campo obrigatório em branco → 400 com detalhe do campo
- [ ] Excluir cliente com fiado em aberto → 400 \"Não é possível excluir cliente com fiado em aberto\"

**Permissões:** Atendente e Proprietário

**Critério de aceite:** Todos os endpoints testados no Postman, regras de negócio validadas.

**Depende de:** #1, #2, #3, #5" \
  --label "crud,business-logic,prioridade-alta" \
  --milestone "CRUDs — APIs Core"

echo "✅ Issue #6 criada"

# Issue #7
gh issue create \
  --repo "$REPO" \
  --title "CRUD Produtos (RF02 / UC02)" \
  --body "API de gestão do catálogo.

**Endpoints:**
- [ ] \`GET /api/produtos\` — Listar com busca (nome, código) + filtro por categoria + paginação
- [ ] \`GET /api/produtos/categorias\` — Listar categorias únicas
- [ ] \`GET /api/produtos/codigo/:codigoBarras\` — Buscar por código de barras (PDV/leitor)
- [ ] \`GET /api/produtos/:id\` — Detalhes
- [ ] \`POST /api/produtos\` — Criar (apenas Proprietário e Padeiro)
- [ ] \`PUT /api/produtos/:id\` — Editar (apenas Proprietário e Padeiro)
- [ ] \`DELETE /api/produtos/:id\` — Soft delete, marca \`ativo = false\` (apenas Proprietário)

**Regras de negócio:**
- [ ] Código de barras duplicado → 409
- [ ] Excluir produto com vendas vinculadas → exibir aviso, solicitar confirmação (flag \`force=true\`)

**Critério de aceite:** Busca por código de barras funciona (endpoint crítico pro PDV).

**Depende de:** #1, #2, #3, #5" \
  --label "crud,prioridade-alta" \
  --milestone "CRUDs — APIs Core"

echo "✅ Issue #7 criada"

# Issue #8
gh issue create \
  --repo "$REPO" \
  --title "CRUD Funcionários (RF03, RF11 / UC03)" \
  --body "API de gestão de funcionários com ponto digital, férias, licenças e atestados.

**Endpoints principais:**
- [ ] \`GET /api/funcionarios\` — Listar com busca + paginação
- [ ] \`GET /api/funcionarios/:id\` — Detalhes com ponto, férias, licenças, atestados
- [ ] \`POST /api/funcionarios\` — Criar (com hash de senha)
- [ ] \`PUT /api/funcionarios/:id\` — Editar
- [ ] \`DELETE /api/funcionarios/:id\` — Soft delete

**Sub-recursos:**
- [ ] \`POST /api/funcionarios/:id/ponto\` — Registrar batida (ENTRADA/SAIDA)
- [ ] \`GET /api/funcionarios/:id/ponto?mes=X&ano=Y\` — Listar registros por mês
- [ ] \`POST /api/funcionarios/:id/ferias\` — Registrar férias
- [ ] \`POST /api/funcionarios/:id/licencas\` — Registrar licença
- [ ] \`POST /api/funcionarios/:id/atestados\` — Registrar atestado

**Regras de negócio:**
- [ ] CPF duplicado → 409
- [ ] Férias antes do período aquisitivo (12 meses) → 400 com data

**Permissões:** Apenas Proprietário

**Critério de aceite:** Registros de ponto aparecem no GET, férias validam período aquisitivo.

**Depende de:** #1, #2, #3, #5" \
  --label "crud,business-logic,prioridade-alta" \
  --milestone "CRUDs — APIs Core"

echo "✅ Issue #8 criada"

# Issue #9
gh issue create \
  --repo "$REPO" \
  --title "CRUD Vendas (RF04, RF09, RF10 / UC04)" \
  --body "API de vendas com cálculo automático e integração com fiado.

**Endpoints:**
- [ ] \`GET /api/vendas\` — Histórico com filtros (período, funcionário) + paginação
- [ ] \`GET /api/vendas/:id\` — Detalhes completos (itens, funcionário, cliente)
- [ ] \`POST /api/vendas\` — Registrar venda
- [ ] \`PATCH /api/vendas/:id/cancelar\` — Cancelar (apenas Proprietário)

**Regras de negócio:**
- [ ] Calcular subtotal/total automaticamente a partir dos preços dos produtos
- [ ] Identificar funcionário responsável via \`req.user\` (JWT)
- [ ] Pagamento FIADO: clienteId obrigatório, validar status Serasa
- [ ] Cliente negativado → bloquear venda fiado (400)
- [ ] Usar transação Prisma: criar venda + itens + atualizar saldo fiado
- [ ] Cancelar venda: reverter saldo fiado, mudar status para CANCELADA

**Critério de aceite:** Venda fiado incrementa saldo devedor. Venda com cliente negativado é bloqueada. Cancelamento reverte saldo.

**Depende de:** #3, #5, #6, #7" \
  --label "crud,business-logic,prioridade-alta" \
  --milestone "CRUDs — APIs Core"

echo "✅ Issue #9 criada"

# Issue #10
gh issue create \
  --repo "$REPO" \
  --title "CRUD Fiado (RF05, RF13, RF14 / UC05)" \
  --body "API de gestão do fiado: habilitar cliente, visualizar saldo, cobrança, protestar.

**Endpoints:**
- [ ] \`POST /api/fiado/:clienteId/habilitar\` — Habilitar cliente para fiado (consulta Serasa mockada)
- [ ] \`GET /api/fiado\` — Listar todos os clientes com fiado ativo + saldos
- [ ] \`GET /api/fiado/:clienteId\` — Detalhes: saldo, produtos comprados, histórico de cobranças
- [ ] \`POST /api/fiado/:clienteId/cobranca\` — Disparar cobrança manual (com mocks de WhatsApp + e-mail)
- [ ] \`POST /api/fiado/:clienteId/protestar\` — Enviar ao Serasa mockado (apenas Proprietário)

**Regras de negócio:**
- [ ] Habilitar fiado: consultar Serasa (mockado) → se negativado, bloquear
- [ ] Cobrança: marcar data da última cobrança, atualizar statusNotificacao

**Nota:** Na Fase 1, criar com mocks (serasaService.js, whatsappService.js, emailService.js com métodos stub). Integração real fica pra Fase 2.

**Critério de aceite:** Fluxo completo funciona. Estrutura pronta para plugar APIs reais.

**Depende de:** #3, #5, #6" \
  --label "crud,business-logic,integracao,prioridade-alta" \
  --milestone "CRUDs — APIs Core"

echo "✅ Issue #10 criada"

# Issue #11
gh issue create \
  --repo "$REPO" \
  --title "API de Relatórios (RF06, RF07 / UC06, UC07)" \
  --body "Endpoints de relatórios para o front.

**Endpoints:**
- [ ] \`GET /api/relatorios/vendas?dataInicio=X&dataFim=Y&produtoId=Z\` — Relatório de vendas por período
  - Total de vendas (R$)
  - Número de transações
  - Ticket médio
  - Vendas agrupadas por dia
  - Ranking de produtos mais vendidos
- [ ] \`GET /api/relatorios/devedores\` — Lista de inadimplentes
  - Nome, telefone, total devido, produtos comprados, histórico de cobranças
- [ ] \`GET /api/relatorios/dashboard\` — KPIs para tela principal
  - Total vendido hoje
  - Nº de vendas hoje
  - Ticket médio
  - Clientes com fiado (qtd)
  - Comparativo vs ontem (%)

**Regras de negócio:**
- [ ] Relatório deve responder em menos de 2 segundos (queries otimizadas)

**Permissões:** Apenas Proprietário

**Critério de aceite:** Endpoint de vendas retorna dados agrupados por dia. Dashboard retorna KPIs.

**Depende de:** #3, #5, #9, #10" \
  --label "crud,prioridade-media" \
  --milestone "CRUDs — APIs Core"

echo "✅ Issue #11 criada"

# Issue #12
gh issue create \
  --repo "$REPO" \
  --title "Docker Compose (PostgreSQL + API)" \
  --body "Containerizar o ambiente de desenvolvimento.

**Tarefas:**
- [ ] \`Dockerfile\` para a API Node.js
- [ ] \`docker-compose.yml\` com:
  - PostgreSQL 16 (porta 5432, volume persistente)
  - API Node.js (porta 3333, depende do postgres)
- [ ] Script de inicialização: rodar migrations + seed automaticamente
- [ ] Atualizar README com instruções de setup

**Critério de aceite:** \`docker compose up\` sobe tudo, API responde no \`/health\`." \
  --label "setup,prioridade-media" \
  --milestone "Infraestrutura"

echo "✅ Issue #12 criada"

# Issue #13
gh issue create \
  --repo "$REPO" \
  --title "Collection Postman para testes" \
  --body "Collection Postman compartilhada para o time testar todos os endpoints.

**Tarefas:**
- [ ] Pasta \"Auth\" (login, me)
- [ ] Pasta \"Clientes\" (CRUD completo)
- [ ] Pasta \"Produtos\" (CRUD + busca por código de barras)
- [ ] Pasta \"Funcionários\" (CRUD + ponto + férias + licenças + atestados)
- [ ] Pasta \"Vendas\" (CRUD + cancelar)
- [ ] Pasta \"Fiado\" (habilitar, listar, cobrança, protestar)
- [ ] Pasta \"Relatórios\" (vendas, devedores, dashboard)
- [ ] Variáveis de ambiente: \`{{base_url}}\`, \`{{token}}\`
- [ ] Script de pré-request no login para setar token automaticamente
- [ ] Exportar \`.json\` e commitar em \`/docs/postman/\`

**Critério de aceite:** Importar collection e rodar todos os requests sem erro." \
  --label "setup,prioridade-media" \
  --milestone "Infraestrutura"

echo "✅ Issue #13 criada"

echo ""
echo "✨ Todas as 13 issues foram criadas com sucesso!"
echo "📍 Acesse: https://github.com/LuizApenas/Padaria-Pao-Fresquim/issues"
