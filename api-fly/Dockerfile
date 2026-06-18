# Build context = repo root (`fly deploy --config fly.api.toml`)
FROM node:20-alpine
WORKDIR /app

COPY prisma ./prisma
COPY api-fly/package.json ./api-fly/

WORKDIR /app/api-fly
RUN npm install

COPY api-fly/tsconfig.json ./
COPY api-fly/src ./src

RUN npx prisma generate --schema=../prisma/schema.prisma
RUN npm run build

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/index.js"]
