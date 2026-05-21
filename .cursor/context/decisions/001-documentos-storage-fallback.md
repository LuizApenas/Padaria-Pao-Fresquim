# ADR 001 — Fallback local para upload de PDF

**Status:** accepted (2026-05-19)

## Context
Upload para Supabase Storage falhava com `403 Invalid Compact JWS` quando `SUPABASE_SERVICE_ROLE_KEY` inválida.

## Decision
`uploadFuncionarioPdf` tenta Supabase; em falha ou ausência de credenciais, grava em `apps/api/.runtime/documentos/{funcionarioId}/` e retorna URL `/api/funcionarios/documentos-arquivo/...`.

## Consequences
- Dev funciona sem bucket configurado.
- Abertura do PDF deve ser via front com Bearer (não link direto no browser).
