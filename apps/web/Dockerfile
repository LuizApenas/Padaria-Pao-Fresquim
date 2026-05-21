# apps/web/Dockerfile
# Build context: repository root (Padaria/)
# EasyPanel: Dockerfile path = apps/web/Dockerfile | Port = 80
# Build arg API_URL = public URL of the API (e.g. https://api.seudominio.com)

FROM node:22-alpine AS build

WORKDIR /app

ARG API_URL=http://localhost:3333

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json

RUN npm ci --workspace @padaria/web

COPY apps/web ./apps/web

WORKDIR /app/apps/web

RUN sed -i "s|__API_URL__|${API_URL}|g" src/environments/environment.prod.ts

RUN npm run build

FROM nginx:1.27-alpine AS runner

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist/padaria-web/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
