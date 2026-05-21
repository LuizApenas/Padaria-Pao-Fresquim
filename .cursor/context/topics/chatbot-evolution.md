# Chatbot / Evolution API

## Configuração
- Painel: `/configuracoes` (front)
- Persistência: `apps/api/.runtime/chatbot-config.json` (gitignored)
- Env exemplo: `apps/api/.env.example` (URLs/keys podem ser só no JSON runtime)

## API (`/api/chatbot`)
- `POST /webhook/evolution` — webhook (token header)
- Rotas autenticadas `PROPRIETARIO`: config, métricas, disparos
- Serviços: `chatbotService.js`, `chatbotSettingsService.js`, `evolutionService.js`

## Branch
Incluído no commit `751c744` da PR #25.
