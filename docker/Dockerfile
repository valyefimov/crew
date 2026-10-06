# syntax=docker/dockerfile:1
FROM node:22-slim AS build
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production CREW_HOME=/data CREW_HOST=0.0.0.0 CREW_PORT=3000
COPY --from=build /app/cli/dist ./dist
COPY --from=build /app/cli/package.json ./package.json
RUN npm i --omit=dev --no-audit --no-fund
VOLUME /data
EXPOSE 3000
CMD ["node", "dist/crew.js", "start"]
