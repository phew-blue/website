# syntax=docker/dockerfile:1

# Build stage
# node 22.23.2 (22-alpine as of 2026-08-24)
FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# The build calls the GitHub API for repo and release data. Unauthenticated
# that is 60 requests/hour per IP, shared across every runner on that address,
# and exceeding it yields a site with no versions rather than a failure.
#
# Mounted as a BuildKit secret rather than passed as a build-arg: build-args
# are recorded in image history and would ship the token in the published
# image. The mount exists only for this RUN.
RUN --mount=type=secret,id=github_token \
    GITHUB_TOKEN="$(cat /run/secrets/github_token 2>/dev/null || true)" \
    npm run build

# Runtime stage
# nginx 1.29.8 (1.29-alpine as of 2026-08-24)
FROM nginxinc/nginx-unprivileged:1.29-alpine@sha256:0c79d56aee561a1d81c63f00eee5fb5fe29279560cdc55e91425133104c7fbe6 AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
