# Codificação do Diagrama de Classes

Este documento registra como o diagrama de classes da documentação oficial foi traduzido para código na base inicial do backend.

## Local da Implementação

A codificação das classes principais foi feita no backend:

- [`apps/api/src/domain/entities`](../../apps/api/src/domain/entities)
- [`apps/api/src/domain/enums.js`](../../apps/api/src/domain/enums.js)

O schema do Prisma continua sendo a implementação do MER e da persistência:

- [`apps/api/prisma/schema.prisma`](../../apps/api/prisma/schema.prisma)

Assim, a entrega do diagrama de classes fica separada da implementação do banco: as classes do backend representam o domínio da aplicação, enquanto o Prisma representa as tabelas e relacionamentos físicos.

## Classes Codificadas

As classes/entidades centrais codificadas foram:

- `Cliente`
- `Funcionario`
- `Produto`
- `Venda`
- `ItemVenda`
- `ContaFiado`
- `RegistroPonto`
- `Ferias`
- `Licenca`
- `Atestado`

## Enums Codificados

Também foram codificados enums de domínio usados pelas classes:

- `Role`
- `FormaPagamento`
- `StatusSerasa`
- `StatusNotificacao`
- `TipoRegistroPonto`
- `StatusVenda`

## Relacionamentos Implementados

Os principais relacionamentos do domínio também foram representados:

- `Cliente` possui zero ou uma `ContaFiado`
- `Cliente` possui várias `Venda`
- `Funcionario` possui várias `Venda`
- `Funcionario` possui vários `RegistroPonto`
- `Funcionario` possui vários registros de `Ferias`, `Licenca` e `Atestado`
- `Venda` possui vários `ItemVenda`
- `Produto` possui vários `ItemVenda`
- `ItemVenda` liga `Venda` e `Produto` por chave composta

## Escopo da Entrega

Esta entrega cobre a codificação estrutural do diagrama de classes na camada de domínio do backend.

Não fazem parte desta entrega:

- CRUDs
- autenticação JWT
- controllers
- services
- interface gráfica
- regras completas de negócio
- relatórios
- integrações externas

Esses itens serão implementados nas próximas etapas do cronograma do projeto.
