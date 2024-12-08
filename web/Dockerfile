FROM node:20.18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV DATABASE_URL="file:./dev.db"

ENV NEXT_PUBLIC_SOCKET_SERVER_URL="https://lev-server-1011986942225.us-central1.run.app"
ENV NEXT_PUBLIC_AGENT_SERVER_URL="https://levbot-1011986942225.us-central1.run.app"

RUN npm run build

RUN npm prune --production

# Etapa 2: Execução
FROM node:20.18-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

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

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENV NEXT_PUBLIC_SOCKET_SERVER_URL="https://lev-server-1011986942225.us-central1.run.app"
ENV NEXT_PUBLIC_AGENT_SERVER_URL="https://levbot-1011986942225.us-central1.run.app"

CMD ["node", "server.js"]