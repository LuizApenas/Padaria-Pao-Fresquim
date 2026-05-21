# apps/api/Dockerfile
# Build context: apps/api/
# EasyPanel: Dockerfile path = apps/api/Dockerfile | Port = 3334

FROM node:22-alpine AS build

WORKDIR /app

COPY package.json ./

RUN npm install --ignore-scripts

COPY . .

RUN DATABASE_URL=postgresql://dummy DIRECT_URL=postgresql://dummy npx prisma generate

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./

RUN npm install --omit=dev --ignore-scripts

COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

COPY src ./src
COPY prisma ./prisma
COPY scripts ./scripts

RUN mkdir -p .runtime/documentos

EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3333)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
