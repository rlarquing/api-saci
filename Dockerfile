# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine

WORKDIR /app

# Solo dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copiar artefactos compilados desde builder
COPY --from=builder /app/dist ./dist

# Copiar plantillas de correo estrictamente necesarias en runtime
COPY --from=builder /app/src/mail/templates ./dist/mail/templates

# Usuario no-root para seguridad
RUN addgroup -S sacp && adduser -S sacp -G sacp
USER sacp

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
