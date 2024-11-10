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

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# RUN npm install --only=production

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV DATABASE_URL="file:./dev.db"
ENV NEXT_PUBLIC_SOCKET_SERVER_URL="http://localhost:8080"
ENV NEXT_PUBLIC_AGENT_SERVER_URL="http://localhost:8000/save_audio/"

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]