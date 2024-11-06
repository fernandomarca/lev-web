# Etapa 1: Construção
FROM node:20.18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

RUN npm prune --production

# Etapa 2: Execução
FROM node:20.18-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create system user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# COPY --from=builder /app/package.json ./
# COPY --from=builder /app/package-lock.json ./
# COPY --from=builder /app/node_modules ./node_modules
# COPY --from=builder /app/.next ./.next
# COPY --from=builder /app/next.config.ts ./
# COPY --from=builder /app/public ./public

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Instala apenas as dependências de produção (não é necessário instalar as devDependencies)
# RUN npm install --only=production

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV DATABASE_URL="file:./dev.db"
ENV SOCKET_SERVER_URL="http://localhost:8080"
ENV AGENT_SERVER_URL="http://localhost:8000/save_audio/"

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]