# ADR 002 — NgZone + ChangeDetectorRef em telas com HttpClient

**Status:** accepted (2026-05-19)

## Context
Listas e formulários (funcionários, ponto, documentos) não atualizavam UI após `subscribe` até interação do usuário.

## Decision
Padrão em componentes afetados: callbacks dentro `ngZone.run()` + `changeDetectorRef.detectChanges()` após mutar estado.

## Aplicado em
- `employees.component.ts`
- `employee-timecard.component.ts`
- `employee-documents.component.ts`
