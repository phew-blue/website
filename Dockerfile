# syntax=docker/dockerfile:1

# Build stage
FROM node:22-alpine AS build
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
FROM nginxinc/nginx-unprivileged:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
