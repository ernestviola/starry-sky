# Build the Vite client and generate the Prisma client in separate stages so the
# production image only contains the runtime dependencies it needs.
FROM node:22-bookworm-slim AS client-build
WORKDIR /app/client
RUN corepack enable
COPY client/package.json client/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY client/ ./
ARG VITE_STAR_API=/
ENV VITE_STAR_API=${VITE_STAR_API}
RUN pnpm build

FROM node:22-bookworm-slim AS server-deps
WORKDIR /app/server
RUN corepack enable
COPY server/package.json server/pnpm-lock.yaml server/pnpm-workspace.yaml ./
COPY server/prisma ./prisma
COPY server/prisma.config.js ./
RUN pnpm install --frozen-lockfile
RUN DATABASE_URL='postgresql://build:build@127.0.0.1:5432/build' pnpm exec prisma generate

FROM server-deps AS migrator
COPY server/ ./
CMD ["node", "node_modules/prisma/build/index.js", "migrate", "deploy"]

FROM node:22-bookworm-slim AS production
ENV NODE_ENV=production
WORKDIR /app/server
RUN corepack enable
COPY server/package.json server/pnpm-lock.yaml server/pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY server/ ./
COPY --from=server-deps /app/server/generated ./generated
COPY --from=client-build /app/client/dist /app/client/dist
EXPOSE 8080
CMD ["node", "app.js"]
