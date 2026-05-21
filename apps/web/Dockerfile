# apps/web/Dockerfile
# Build context: apps/web/
# EasyPanel: Dockerfile path = apps/web/Dockerfile | Port = 80
# Build arg API_URL = URL publica da API (ex: https://api.seudominio.com)

FROM node:22-alpine AS build

WORKDIR /app

ARG API_URL=http://localhost:3334

COPY package.json ./

RUN npm install

COPY . .

RUN sed -i "s|__API_URL__|${API_URL}|g" src/environments/environment.prod.ts

RUN npx ng build --configuration=production

FROM nginx:1.27-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/padaria-web/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
