FROM node:24-alpine3.24@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53 AS deps

WORKDIR /app
RUN apk add --no-cache 'zlib=1.3.2-r1'
RUN npm install --global --no-audit --no-fund 'npm@12.2.1'
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine3.24@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53 AS builder

WORKDIR /app
RUN apk add --no-cache 'zlib=1.3.2-r1'
RUN npm install --global --no-audit --no-fund 'npm@12.2.1'
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json next.config.ts tsconfig.json ./
COPY postcss.config.mjs eslint.config.mjs ./
COPY src ./src
COPY content ./content
COPY public ./public
RUN npm run build

FROM node:24-alpine3.24@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53 AS runner

WORKDIR /app
RUN apk add --no-cache 'zlib=1.3.2-r1'
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

COPY --from=builder --chown=root:root /app/.next/standalone ./
COPY --from=builder --chown=root:root /app/.next/static ./.next/static
COPY --from=builder --chown=root:root /app/public ./public
COPY --from=builder --chown=root:root /app/content ./content

USER node
EXPOSE 3000
CMD ["node", "server.js"]
