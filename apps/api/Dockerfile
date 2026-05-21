# apps/api/Dockerfile
# Build context: repository root (Padaria/)
# EasyPanel: Dockerfile path = apps/api/Dockerfile | Port = 3333

FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json

RUN npm ci --workspace @padaria/api

COPY apps/api ./apps/api

WORKDIR /app/apps/api

RUN npx prisma generate

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json

RUN npm ci --workspace @padaria/api --omit=dev

COPY apps/api ./apps/api
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

WORKDIR /app/apps/api

RUN mkdir -p .runtime/documentos

EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3333)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
