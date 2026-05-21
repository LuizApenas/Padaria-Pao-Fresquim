# Funcionários — ponto e documentos

## UX
- Lista `/funcionarios` → ícone relógio → modal **Area operacional**
- **Cartão de ponto:** `/funcionarios/:employeeId/ponto`
- **Documentos:** `/funcionarios/:employeeId/documentos`

## API (todas `ensureAuth` + `PROPRIETARIO`)
| Método | Rota | Uso |
|--------|------|-----|
| GET/POST | `/:id/ponto` | listar / registrar batida |
| GET | `/:id/atestados` | listar documentos |
| POST | `/:id/documentos` | upload PDF base64 |
| GET | `/documentos-arquivo/:funcionarioId/:fileName` | servir PDF local |
| POST | `/:id/dados-operacionais/fake` | ponto/férias/licença (sem atestado desde `93fecb2`) |

## Storage PDF
- `funcionarioDocumentosStorageService.js` → Supabase bucket `funcionarios-documentos` ou `.runtime/documentos/`
- Abrir no front: **nunca** `window.open` direto na API — usar blob + interceptor

## Seeds
- `npm run ponto:seed` — 01/05 a 18/05/2026, dias úteis
- `npm run documentos:cleanup-teste` — remove fakes/teste do DB

## UI fixes
- `NgZone` + `ChangeDetectorRef` em timecard e documents (padrão igual `employees.component`)
