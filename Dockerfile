# ---- build stage ----
# project lives in site/ — build context is the repo root
FROM node:22-alpine AS build
WORKDIR /app

COPY site/package.json site/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY site/ .
RUN npm run build

# ---- runtime stage ----
FROM nginx:1.27-alpine
RUN rm -f /etc/nginx/conf.d/default.conf
COPY site/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# Render exposes PORT (default 10000) — nginx template listens on it
ENV PORT=10000
EXPOSE 10000
