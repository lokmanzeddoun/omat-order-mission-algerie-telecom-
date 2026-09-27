FROM node:26-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci --workspace=server --include-workspace-root
COPY server server
RUN npx prisma generate --schema server/prisma/schema.prisma && npm run build --workspace=server

FROM node:26-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S omat && adduser -S omat -G omat
COPY package*.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci --omit=dev --workspace=server --include-workspace-root && npm cache clean --force
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/server/prisma server/prisma
COPY --from=build /app/node_modules/.prisma node_modules/.prisma
COPY server/docker-entrypoint.sh /usr/local/bin/omat-entrypoint
RUN chmod +x /usr/local/bin/omat-entrypoint && chown -R omat:omat /app
USER omat
EXPOSE 8000
ENTRYPOINT ["omat-entrypoint"]
