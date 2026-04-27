# src

Codigo-fonte do backend da API.

## Estrutura principal

- `routes`: define os endpoints HTTP.
- `controllers`: recebe a requisicao e monta a resposta.
- `services`: concentra regras de negocio e validacoes.
- `repositories`: concentra o acesso ao banco via Prisma.
- `middlewares`: intercepta requisicoes ou erros globais.
- `utils`: guarda helpers pequenos e reutilizaveis.
- `config`: guarda configuracoes de ferramentas externas.
- `domain`: guarda entidades e enums do dominio.

## Guia do CRUD

A explicacao detalhada das funcoes CRUD esta em `CRUD_README.md`.
Use esse arquivo como guia para criar os CRUDs das outras entidades e para manter o contrato que sera consumido pelo chatbot.

## Como testar rapidamente

Suba a API:

```bash
npm run dev:api
```

Crie um cliente:

```bash
curl -X POST http://localhost:3000/clientes \
  -H "Content-Type: application/json" \
  -d "{\"nome\":\"Joao Silva\",\"telefone\":\"11999999999\",\"endereco\":\"Rua A\",\"cpf\":\"12345678900\"}"
```

Liste os clientes:

```bash
curl http://localhost:3000/clientes
```
