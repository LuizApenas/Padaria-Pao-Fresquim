#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import subprocess
import json
import sys
import os

os.environ['PYTHONIOENCODING'] = 'utf-8'

# Configurações
REPO = "LuizApenas/Padaria-Pao-Fresquim"
ISSUES = [
    {
        "title": "Inicializar repositório back-end",
        "body": """Configurar a estrutura base do projeto Node.js + Express + Prisma.

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

**Critério de aceite:** `npm run dev` sobe sem erros e `GET /health` responde 200.""",
        "labels": ["setup", "prioridade-alta"],
        "milestone": "Setup do Projeto"
    },
    {
        "title": "Middleware de error handling global",
        "body": """Criar tratamento centralizado de erros para padronizar respostas da API.

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

**Critério de aceite:** Erros retornam JSON padronizado `{ error: "mensagem", details?: [] }`.""",
        "labels": ["setup", "prioridade-alta"],
        "milestone": "Setup do Projeto"
    },
    {
        "title": "Schema Prisma baseado no MER",
        "body": """Criar o schema Prisma espelhando o MER da documentação. Entidades: Cliente, Funcionario, Produto, Venda, ItemVenda, ContaFiado, RegistroPonto.

**Tarefas:**
- [ ] Criar enums: `Role` (PROPRIETARIO, ATENDENTE, PADEIRO), `FormaPagamento` (DINHEIRO, DEBITO, CREDITO, PIX, FIADO), `StatusSerasa`, `StatusNotificacao`, `TipoRegistroPonto`, `StatusVenda`
- [ ] Model `Cliente`: id, nome, telefone, endereco, cpf (unique), statusSerasa
- [ ] Model `Funcionario`: id, nome, cpf (unique), telefone, endereco, matricula (unique), cargo, dataAdmissao, contatoEmergencia, role, email (unique), senhaHash
- [ ] Model `Produto`: id, codigoBarras (unique), nome, precoBase, categoria, imagemUrl
- [ ] Model `Venda`: id, dataHora, valorTotal, formaPagamento, status, funcionarioId, clienteId (opcional)
- [ ] Model `ItemVenda`: PK composta (vendaId + produtoId), quantidade, subtotal
- [ ] Model `ContaFiado`: id, saldoDevedor, dataUltimaCobranca, statusNotificacao, clienteId (unique)
- [ ] Model `RegistroPonto`: id, dataHoraBatida, tipoRegistro, funcionarioId
- [ ] Models auxiliares: `Ferias`, `Licenca`, `Atestado` (vinculados a Funcionario)
- [ ] Usar `@@map()` para nomes em snake_case no banco
- [ ] Campos de auditoria: `criadoEm`, `atualizadoEm`
- [ ] Rodar `npx prisma migrate dev --name init` e validar tabelas

**Critério de aceite:** `npx prisma studio` abre e mostra todas as tabelas com relacionamentos corretos.""",
        "labels": ["database", "prioridade-alta"],
        "milestone": "Banco de Dados (Schema + Seed)"
    },
    {
        "title": "Seed com dados de teste",
        "body": """Criar script de seed para popular o banco com dados fictícios.

**Tarefas:**
- [ ] Criar `prisma/seed.js`
- [ ] Seed de Funcionários: 1 Proprietário (Sr. Joaquim), 2 Atendentes, 1 Padeiro
- [ ] Seed de Produtos: Pão Francês, Pão de Queijo, Bolo de Fubá, Broa de Milho, etc. com códigos de barras
- [ ] Seed de Clientes: Sr. João Batista + 5 clientes fictícios
- [ ] Seed de Vendas: 3-5 vendas de exemplo
- [ ] Seed de ContaFiado: 1-2 clientes com saldo devedor
- [ ] Configurar script `prisma:seed` no `package.json`

**Critério de aceite:** `npm run prisma:seed` executa sem erros.""",
        "labels": ["database", "prioridade-media"],
        "milestone": "Banco de Dados (Schema + Seed)"
    },
    {
        "title": "Auth: Login + JWT + Middleware",
        "body": """Implementar autenticação JWT com roles (Proprietário, Atendente, Padeiro).

**Tarefas:**
- [ ] Criar `src/middlewares/auth.js`:
  - `ensureAuth` — valida Bearer token, popula `req.user`
  - `ensureRole(...roles)` — verifica role do usuário
- [ ] Criar `POST /api/auth/login`:
  - Recebe `{ email, senha }`
  - Valida com Zod
  - Busca funcionário por email
  - Compara senha com bcrypt
  - Retorna token + dados usuário
- [ ] Criar `GET /api/auth/me`:
  - Rota protegida
- [ ] Variáveis de ambiente: `JWT_SECRET`, `JWT_EXPIRES_IN`

**Critério de aceite:** Login retorna token válido. Rotas protegidas rejeitam requests sem token (401) e com role errado (403).""",
        "labels": ["auth", "prioridade-alta"],
        "milestone": "Autenticação"
    },
    {
        "title": "CRUD Clientes (RF01 / UC01)",
        "body": """API completa de clientes.

**Endpoints:**
- [ ] `GET /api/clientes` — Listar com busca + paginação
- [ ] `GET /api/clientes/:id` — Detalhes com contaFiado e últimas vendas
- [ ] `POST /api/clientes` — Criar
- [ ] `PUT /api/clientes/:id` — Editar
- [ ] `DELETE /api/clientes/:id` — Excluir

**Regras de negócio:**
- [ ] Campo obrigatório em branco → 400
- [ ] Excluir cliente com fiado em aberto → 400

**Permissões:** Atendente e Proprietário

**Critério de aceite:** Todos os endpoints testados no Postman.

**Depende de:** #1, #2, #3, #5""",
        "labels": ["crud", "business-logic", "prioridade-alta"],
        "milestone": "CRUDs — APIs Core"
    },
    {
        "title": "CRUD Produtos (RF02 / UC02)",
        "body": """API de gestão do catálogo.

**Endpoints:**
- [ ] `GET /api/produtos` — Listar com busca + filtro categoria + paginação
- [ ] `GET /api/produtos/categorias` — Listar categorias
- [ ] `GET /api/produtos/codigo/:codigoBarras` — Buscar por código (PDV/leitor)
- [ ] `GET /api/produtos/:id` — Detalhes
- [ ] `POST /api/produtos` — Criar
- [ ] `PUT /api/produtos/:id` — Editar
- [ ] `DELETE /api/produtos/:id` — Soft delete

**Regras de negócio:**
- [ ] Código de barras duplicado → 409
- [ ] Excluir com vendas vinculadas → pedir confirmação

**Permissões:** Leitura = todos. Escrita = Proprietário + Padeiro

**Critério de aceite:** Busca por código de barras funciona.

**Depende de:** #1, #2, #3, #5""",
        "labels": ["crud", "prioridade-alta"],
        "milestone": "CRUDs — APIs Core"
    },
    {
        "title": "CRUD Funcionários (RF03, RF11 / UC03)",
        "body": """API de gestão de funcionários com ponto digital, férias, licenças, atestados.

**Endpoints principais:**
- [ ] `GET /api/funcionarios` — Listar
- [ ] `GET /api/funcionarios/:id` — Detalhes
- [ ] `POST /api/funcionarios` — Criar
- [ ] `PUT /api/funcionarios/:id` — Editar
- [ ] `DELETE /api/funcionarios/:id` — Soft delete

**Sub-recursos:**
- [ ] `POST /api/funcionarios/:id/ponto` — Registrar batida
- [ ] `GET /api/funcionarios/:id/ponto?mes=X&ano=Y` — Listar por mês
- [ ] `POST /api/funcionarios/:id/ferias` — Férias
- [ ] `POST /api/funcionarios/:id/licencas` — Licença
- [ ] `POST /api/funcionarios/:id/atestados` — Atestado

**Regras de negócio:**
- [ ] CPF duplicado → 409
- [ ] Férias antes período aquisitivo → 400

**Permissões:** Apenas Proprietário

**Critério de aceite:** Registros de ponto aparecem no GET.

**Depende de:** #1, #2, #3, #5""",
        "labels": ["crud", "business-logic", "prioridade-alta"],
        "milestone": "CRUDs — APIs Core"
    },
    {
        "title": "CRUD Vendas (RF04, RF09, RF10 / UC04)",
        "body": """API de vendas com cálculo automático e integração com fiado.

**Endpoints:**
- [ ] `GET /api/vendas` — Histórico com filtros + paginação
- [ ] `GET /api/vendas/:id` — Detalhes
- [ ] `POST /api/vendas` — Registrar venda
- [ ] `PATCH /api/vendas/:id/cancelar` — Cancelar

**Regras de negócio:**
- [ ] Calcular subtotal/total automaticamente
- [ ] Identificar funcionário via `req.user` (JWT)
- [ ] FIADO: clienteId obrigatório, validar Serasa
- [ ] Cliente negativado → bloquear fiado
- [ ] Transação Prisma: criar venda + itens + atualizar saldo
- [ ] Cancelar: reverter saldo, mudar status

**Critério de aceite:** Venda fiado incrementa saldo. Cliente negativado bloqueado. Cancelamento reverte.

**Depende de:** #3, #5, #6, #7""",
        "labels": ["crud", "business-logic", "prioridade-alta"],
        "milestone": "CRUDs — APIs Core"
    },
    {
        "title": "CRUD Fiado (RF05, RF13, RF14 / UC05)",
        "body": """API de gestão do fiado: habilitar, saldo, cobrança, protestar.

**Endpoints:**
- [ ] `POST /api/fiado/:clienteId/habilitar` — Habilitar (consulta Serasa)
- [ ] `GET /api/fiado` — Listar com fiado ativo
- [ ] `GET /api/fiado/:clienteId` — Detalhes
- [ ] `POST /api/fiado/:clienteId/cobranca` — Cobrança
- [ ] `POST /api/fiado/:clienteId/protestar` — Protestar Serasa

**Regras de negócio:**
- [ ] Habilitar: consultar Serasa (mockado) → se negativado, bloquear
- [ ] Cobrança: marcar data, atualizar statusNotificacao

**Nota:** Fase 1 com mocks. Integração real (Serasa/WhatsApp/Email) fica pra Fase 2.

**Critério de aceite:** Fluxo completo funciona com mocks.

**Depende de:** #3, #5, #6""",
        "labels": ["crud", "business-logic", "integracao", "prioridade-alta"],
        "milestone": "CRUDs — APIs Core"
    },
    {
        "title": "API de Relatórios (RF06, RF07 / UC06, UC07)",
        "body": """Endpoints de relatórios para o front.

**Endpoints:**
- [ ] `GET /api/relatorios/vendas?dataInicio=X&dataFim=Y&produtoId=Z` — Vendas por período (total, qtd, ticket médio, por dia, ranking)
- [ ] `GET /api/relatorios/devedores` — Inadimplentes (nome, telefone, total, histórico)
- [ ] `GET /api/relatorios/dashboard` — KPIs (hoje, nº vendas, ticket, fiado, vs ontem)

**Regras de negócio:**
- [ ] Responder em menos de 2 segundos (queries otimizadas)

**Permissões:** Apenas Proprietário

**Critério de aceite:** Vendas agrupadas por dia. Dashboard com KPIs.

**Depende de:** #3, #5, #9, #10""",
        "labels": ["crud", "prioridade-media"],
        "milestone": "CRUDs — APIs Core"
    },
    {
        "title": "Docker Compose (PostgreSQL + API)",
        "body": """Containerizar o ambiente de desenvolvimento.

**Tarefas:**
- [ ] `Dockerfile` para API Node.js
- [ ] `docker-compose.yml`:
  - PostgreSQL 16 (porta 5432, volume persistente)
  - API Node.js (porta 3333)
- [ ] Script: rodar migrations + seed automaticamente
- [ ] Atualizar README

**Critério de aceite:** `docker compose up` sobe tudo. API responde em `/health`.""",
        "labels": ["setup", "prioridade-media"],
        "milestone": "Infraestrutura"
    },
    {
        "title": "Collection Postman para testes",
        "body": """Collection Postman compartilhada para o time.

**Tarefas:**
- [ ] Pasta "Auth" (login, me)
- [ ] Pasta "Clientes" (CRUD)
- [ ] Pasta "Produtos" (CRUD + código barras)
- [ ] Pasta "Funcionários" (CRUD + ponto + férias + licenças + atestados)
- [ ] Pasta "Vendas" (CRUD + cancelar)
- [ ] Pasta "Fiado" (habilitar, listar, cobrança, protestar)
- [ ] Pasta "Relatórios" (vendas, devedores, dashboard)
- [ ] Variáveis: `{{base_url}}`, `{{token}}`
- [ ] Script pré-request no login para setar token
- [ ] Exportar `.json` em `/docs/postman/`

**Critério de aceite:** Importar e rodar tudo sem erro.""",
        "labels": ["setup", "prioridade-media"],
        "milestone": "Infraestrutura"
    }
]

def create_issue(title, body, labels, milestone):
    """Cria uma issue usando gh CLI"""
    cmd = ["gh", "issue", "create"]
    cmd.extend(["--repo", REPO])
    cmd.extend(["--title", title])
    cmd.extend(["--body", body])
    for label in labels:
        cmd.extend(["--label", label])
    if milestone:
        cmd.extend(["--milestone", milestone])

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return True, result.stdout.strip()
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def main():
    print("[*] Criando 13 issues no repositorio LuizApenas/Padaria-Pao-Fresquim...")
    print()

    success_count = 0
    for idx, issue in enumerate(ISSUES, 1):
        success, msg = create_issue(
            title=issue["title"],
            body=issue["body"],
            labels=issue["labels"],
            milestone=issue.get("milestone")
        )

        if success:
            print(f"[OK] Issue #{idx} criada: {issue['title']}")
            success_count += 1
        else:
            print(f"[ERRO] Issue #{idx} falhou: {issue['title']}")
            print(f"   Erro: {msg}")

    print()
    print(f"[DONE] {success_count}/13 issues criadas com sucesso!")
    print("[*] Acesse: https://github.com/LuizApenas/Padaria-Pao-Fresquim/issues")

if __name__ == "__main__":
    main()
