# backend/Dockerfile (prod)
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache netcat-openbsd
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma
RUN npx prisma generate
ENV NODE_ENV=production
EXPOSE 5000

# entrypoint to wait for DB and run migrations (see docker-entrypoint.sh)
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

CMD ["docker-entrypoint.sh"]
