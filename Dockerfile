FROM node:22-bookworm-slim AS builder

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV DEPLOYMENT_ENV=ci
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ENV BETTER_AUTH_SECRET=container-build-placeholder-secret-at-least-32-chars
ENV BETTER_AUTH_URL=http://127.0.0.1:3000
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm db:generate
RUN pnpm build

FROM node:22-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

COPY --from=builder /app /app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health/live').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["pnpm", "--filter", "@studepartment/web", "start"]
