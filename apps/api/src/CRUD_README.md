# Guia das funcoes CRUD

Este arquivo explica o papel das funcoes usadas no CRUD de exemplo da entidade `Cliente`.
Use este guia como base para criar os CRUDs das outras entidades do `domain`.

## Ideia geral

Um CRUD tem cinco operacoes principais:

- listar registros;
- buscar um registro por id;
- criar um registro;
- atualizar um registro;
- remover um registro.

No projeto, essas operacoes passam por quatro camadas:

- `routes`: define o caminho HTTP.
- `controllers`: recebe a requisicao e devolve a resposta.
- `services`: valida dados e aplica regras de negocio.
- `repositories`: acessa o banco com Prisma.

## Fluxo de uma requisicao

Exemplo com `GET /clientes/1`:

1. A rota `/clientes/:id` recebe a requisicao.
2. O controller chama `clienteService.getClienteById(request.params.id)`.
3. O service valida o `id` e chama `clienteRepository.findById(clienteId)`.
4. O repository consulta o Prisma.
5. O resultado volta para o controller.
6. O controller responde com JSON.

## Funcoes do repository

Arquivo de exemplo:

`repositories/clienteRepository.js`

O repository deve ter apenas codigo de acesso ao banco.
Ele nao deve validar regra de negocio.

### `findAll()`

Lista todos os registros da entidade.

No CRUD de `Cliente`, ela usa:

```js
prisma.cliente.findMany()
```

Use essa funcao para telas de listagem e consultas gerais do chatbot.

### `findById(id)`

Busca um unico registro pelo id.

No CRUD de `Cliente`, ela usa:

```js
prisma.cliente.findUnique({
  where: { id },
})
```

Use essa funcao quando o frontend ou chatbot precisar abrir os detalhes de um registro.

### `create(data)`

Cria um novo registro.

No CRUD de `Cliente`, ela usa:

```js
prisma.cliente.create({
  data,
})
```

O objeto `data` ja deve chegar limpo e validado pelo service.

### `update(id, data)`

Atualiza um registro existente.

No CRUD de `Cliente`, ela usa:

```js
prisma.cliente.update({
  where: { id },
  data,
})
```

Envie em `data` somente os campos que devem mudar.

### `delete(id)`

Remove um registro existente.

No CRUD de `Cliente`, ela usa:

```js
prisma.cliente.delete({
  where: { id },
})
```

Antes de usar essa rota pelo chatbot, confirme a acao com o usuario.

## Funcoes do service

Arquivo de exemplo:

`services/clienteService.js`

O service protege a aplicacao contra dados invalidos.
Ele tambem deixa as regras de negocio em um lugar facil de encontrar.

### `parseClienteId(id)`

Converte o `id` recebido pela rota para numero.
Se o valor nao for um numero inteiro positivo, dispara `AppError`.

Essa funcao evita consultas com ids invalidos.

### `normalizeText(value)`

Remove espacos extras de textos.

Exemplo:

```js
" Joao ".trim()
```

Isso evita salvar dados sujos no banco.

### `pickClienteData(body)`

Monta um novo objeto apenas com os campos permitidos.

No exemplo de `Cliente`, os campos permitidos sao:

- `nome`
- `telefone`
- `endereco`
- `cpf`
- `statusSerasa`
- `ativo`

Essa funcao impede que campos inesperados sejam enviados ao Prisma.

### `validateClienteData(data, requiredFields)`

Valida os dados recebidos antes de criar ou atualizar.

No exemplo de `Cliente`, ela verifica:

- campos obrigatorios;
- status do Serasa valido;
- tipo booleano para `ativo`.

Quando algo esta errado, ela dispara `AppError`.
O middleware global transforma esse erro em resposta HTTP.

### `listClientes()`

Lista todos os clientes.

Fluxo:

```js
clienteService.listClientes()
clienteRepository.findAll()
```

### `getClienteById(id)`

Busca um cliente pelo id.

Ela valida o id antes de consultar o banco.
Se o cliente nao existir, retorna erro `404`.

### `createCliente(body)`

Cria um cliente novo.

Fluxo:

1. limpa os dados com `pickClienteData`;
2. valida campos obrigatorios;
3. chama `clienteRepository.create(data)`.

### `updateCliente(id, body)`

Atualiza um cliente existente.

Fluxo:

1. valida o id;
2. limpa os dados enviados;
3. verifica se existe pelo menos um campo para atualizar;
4. valida os campos enviados;
5. chama `clienteRepository.update(clienteId, data)`.

### `deleteCliente(id)`

Remove um cliente pelo id.

Ela valida o id e chama o repository.
Se o id nao existir, o Prisma gera erro e o middleware global devolve `404`.

## Funcoes do controller

Arquivo de exemplo:

`controllers/clienteController.js`

O controller deve ser pequeno.
Ele recebe `request`, chama o service e devolve `response`.

### `index(_request, response)`

Atende:

`GET /clientes`

Retorna status `200` com a lista de clientes.

### `show(request, response)`

Atende:

`GET /clientes/:id`

Retorna status `200` com um cliente.

### `store(request, response)`

Atende:

`POST /clientes`

Retorna status `201` com o cliente criado.

### `update(request, response)`

Atende:

`PUT /clientes/:id`

Retorna status `200` com o cliente atualizado.

### `destroy(request, response)`

Atende:

`DELETE /clientes/:id`

Retorna status `204` sem corpo.

## Funcoes das rotas

Arquivo de exemplo:

`routes/clienteRoutes.js`

Cada rota liga um metodo HTTP a uma funcao do controller.

```js
clienteRoutes.get("/", clienteController.index);
clienteRoutes.get("/:id", clienteController.show);
clienteRoutes.post("/", clienteController.store);
clienteRoutes.put("/:id", clienteController.update);
clienteRoutes.delete("/:id", clienteController.destroy);
```

Depois, registre o grupo de rotas no arquivo principal:

```js
router.use("/clientes", clienteRoutes);
```

## Contrato para o chatbot

O chatbot deve consumir as rotas usando este contrato:

- `GET /clientes`: listar clientes.
- `GET /clientes/:id`: buscar cliente por id.
- `POST /clientes`: criar cliente.
- `PUT /clientes/:id`: atualizar cliente.
- `DELETE /clientes/:id`: remover cliente.

Para criar cliente, envie:

```json
{
  "nome": "Joao Silva",
  "telefone": "11999999999",
  "endereco": "Rua A",
  "cpf": "12345678900",
  "statusSerasa": "REGULAR",
  "ativo": true
}
```

Para atualizar cliente, envie apenas o que vai mudar:

```json
{
  "telefone": "11888888888"
}
```

## Regras importantes

- Controllers nao devem ter regra de negocio.
- Services nao devem acessar Prisma diretamente.
- Repositories nao devem conhecer HTTP.
- Rotas devem ser simples e previsiveis.
- Erros devem usar `AppError` quando forem erros esperados.
- O chatbot deve confirmar com o usuario antes de chamar `DELETE`.

## Como replicar para outra entidade

Exemplo para `Produto`:

1. Crie `repositories/produtoRepository.js`.
2. Crie `services/produtoService.js`.
3. Crie `controllers/produtoController.js`.
4. Crie `routes/produtoRoutes.js`.
5. Troque `cliente` por `produto`.
6. Ajuste os campos permitidos.
7. Ajuste as validacoes.
8. Registre `router.use("/produtos", produtoRoutes)` em `routes/index.js`.
