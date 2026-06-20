# Build context = repo root (`fly deploy --config fly.api.toml`)
FROM node:20-alpine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY prisma ./prisma
COPY api-fly/package.json ./api-fly/

WORKDIR /app/api-fly
# Skip postinstall prisma generate here (Alpine/OpenSSL + monorepo paths); generate explicitly below.
RUN npm install --ignore-scripts
RUN npx prisma generate --schema=../prisma/schema.prisma

COPY api-fly/tsconfig.json ./
COPY api-fly/src ./src

RUN npm run build

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/index.js"]
