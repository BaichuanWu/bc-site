# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base

ARG FRONTEND_DIR=bc-site
ARG PNPM_VERSION=10.17.1

ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:${PATH}"

RUN corepack enable && corepack prepare "pnpm@${PNPM_VERSION}" --activate


FROM base AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /workspace/bc-site

COPY ${FRONTEND_DIR}/package.json ${FRONTEND_DIR}/pnpm-lock.yaml ${FRONTEND_DIR}/pnpm-workspace.yaml* ./

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile


FROM base AS builder

WORKDIR /workspace/bc-site

COPY --from=deps /workspace/bc-site/node_modules ./node_modules
COPY ${FRONTEND_DIR} ./

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm build


FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=80 \
    HOSTNAME=0.0.0.0

COPY --from=builder /workspace/bc-site/public ./public
COPY --from=builder /workspace/bc-site/.next/standalone ./
COPY --from=builder /workspace/bc-site/.next/static ./.next/static

EXPOSE 80

CMD ["node", "server.js"]
