# Codificação do Diagrama de Classes

Este documento registra como o diagrama de classes da documentação oficial foi traduzido para código na base inicial do backend.

## Local da Implementação

A codificação das classes principais foi feita no backend:

- [`apps/api/src/domain/entities`](../../apps/api/src/domain/entities)
- [`apps/api/src/domain/enums.js`](../../apps/api/src/domain/enums.js)

O schema do Prisma continua sendo a implementação do MER e da persistência:

- [`apps/api/prisma/schema.prisma`](../../apps/api/prisma/schema.prisma)

Assim, a entrega do diagrama de classes fica separada da implementação do banco: as classes do backend representam o domínio da aplicação, enquanto o Prisma representa as tabelas e relacionamentos físicos.

## Classes Codificadas Nesta Entrega

Nesta entrega, foram codificadas apenas as duas primeiras classes como exemplo para continuidade manual pelo time:

- `Cliente`
- `Funcionario`

## Enums Codificados Nesta Entrega

Também foram codificados apenas os enums necessários para essas duas classes:

- `Role`
- `StatusSerasa`

## Relacionamentos Representados

As duas classes de exemplo deixam preparados os campos que representam relacionamentos futuros:

- `Cliente` possui zero ou uma `ContaFiado`
- `Cliente` possui várias `Venda`
- `Funcionario` possui várias `Venda`
- `Funcionario` possui vários `RegistroPonto`
- `Funcionario` possui vários registros de `Ferias`, `Licenca` e `Atestado`

## Escopo da Entrega

Esta entrega cobre apenas os dois primeiros exemplos da codificação estrutural do diagrama de classes na camada de domínio do backend.

As próximas classes devem seguir o mesmo padrão de comentários, construtor e métodos simples de domínio.

Não fazem parte desta entrega:

- demais classes do diagrama
- CRUDs
- autenticação JWT
- controllers
- services
- interface gráfica
- regras completas de negócio
- relatórios
- integrações externas

Esses itens serão implementados nas próximas etapas do cronograma do projeto.
