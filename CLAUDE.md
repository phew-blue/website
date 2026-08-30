# CLAUDE.md

## Overview

The [phew.blue](https://phew.blue) website — a static personal/portfolio site for Robert Sumner (broadcast technology specialist). Built with Astro 6, served by nginx in a container, deployed to Kubernetes via Flux GitOps from the home-ops repo.

**Tech Stack:**
- Framework: Astro 6, `output: 'static'` (build-time rendering only, no SSR)
- Styling: Tailwind CSS v4 (via `@tailwindcss/vite`), signal theme in `src/styles/global.css`
- Language: TypeScript (`npm run astro check` for type checking)
- Runtime container: `nginxinc/nginx-unprivileged:alpine` on port 8080 (see `Dockerfile`, `nginx.conf`)
- Registry: `ghcr.io/phew-blue/website`
- Node: >= 22.12.0, npm (package-lock.json — not pnpm)

## Commands

```bash
npm install            # or npm ci
npm run dev            # dev server at http://localhost:4321
npm run build          # production build to dist/
npm run preview        # preview the production build
npm run astro check    # type check (this is what CI runs)
npm run check:brand    # fail if the vendored brand theme has drifted from ../brand
npm run sync:brand     # re-vendor it from the sibling ../brand checkout
npm run og             # regenerate public/og-image.png (needs a build first)
```

There is no test suite — CI gates on `npm run astro check` and the Docker build.

## Key Directories

- `src/pages/` — routes (`index.astro`, `404.astro`, `software/index.astro`)
- `src/components/` — `BootSequence`, `Navigation`, `ContactSection`, `SoftwareSection`
- `src/layouts/Layout.astro` — base layout
- `src/content/` — content collections (schemas in `src/content.config.ts`):
  - `bootSequences/` — YAML boot-sequence animations (evs, ip, ob)
  - `portfolio/` — Markdown portfolio entries (projects/experience)
  - `software/` — Markdown entries pointing at GitHub repos
- `src/config/personal.ts` — single source of truth for personal info (name, contact, SEO/structured data)
- `src/lib/github.ts` — GitHub API fetch for the repo/release data on the software pages. Isomorphic: the build calls `api.github.com` directly (with `GITHUB_TOKEN` if set), the browser calls the site's own `/api/gh` mirror. Degrades gracefully either way.
- `src/scripts/refresh-releases.ts` — client-side refresh of that data, so a release published since the last deploy appears without a rebuild
- `src/assets/photos/` — portfolio photos; `@assets` alias resolves to `src/assets`
- `src/assets/fonts/` — vendored Poppins woff2 (latin subset, weights 400/600/700), emitted by Astro's `fonts` config
- `scripts/` (repo root, build tooling — not `src/scripts/`) — `sync-brand.mjs` (vendor/drift-check the brand theme), `generate-og.mjs` + `og/card.html` (social card)
- `docs/superpowers/specs/` — design specs (e.g. the 2026-04-21 redesign)

## Deployment Model

Dev and prod run simultaneously in the home-ops cluster (phew-blue/home-ops):

- **dev**: push to the `dev` branch → `.github/workflows/dev.yml` builds and pushes the `:dev` image → auto-deployed to the `dev` namespace → https://website.dev.phew.blue
- **prod**: `v*` tag → `.github/workflows/ci.yml` builds versioned + `latest` images → deployed to the `default` namespace from `main` → https://phew.blue

Release data on the software pages does **not** need a deploy to update: nginx serves a cached same-origin mirror of the GitHub API at `/api/gh/<owner>/<repo>[/releases]`, pinned by regex to this org, cached 10 minutes in the `/var/cache/nginx` emptyDir and shared across visitors. The client refreshes through it on load.

The mirror authenticates with a scopeless read-only PAT — 1Password item `website-github`, field `WEBSITE_GITHUB_TOKEN`, rendered into an nginx snippet by the ExternalSecret in home-ops at `kubernetes/apps/default/website/app/externalsecret.yaml` and mounted at `/etc/nginx/gh-auth`. That buys 5000 requests/hour instead of 60. Without it the mirror still works anonymously, and the TTL should go back to 30m — see the arithmetic in `nginx.conf`.

Releases are cut via the **Prepare Release** workflow dispatch (`prepare-release.yml`): it bumps `VERSION` from the `dev` branch and opens a release PR; tagging happens via `create-release.yml` / `auto-tag.yml`. Day-to-day work targets `dev`; `main` is updated through release PRs.

Kubernetes manifests live in home-ops at `kubernetes/apps/default/website/` (prod) and `kubernetes/apps/dev/website/` (dev) — image bumps and HTTPRoute changes happen there, not in this repo.

## Conventions

- Conventional Commits: `type(scope): description` (e.g. `feat(software): ...`, `fix(nginx): ...`). No `Co-Authored-By` trailers.
- The software page renders changelog entries parsed from the *listed repos'* latest GitHub release notes (`src/lib/github.ts` matches `- feat(...)/fix(...)/chore(...)` bullet lines) — repos featured here should keep release notes in that format.
- Update personal/contact details only in `src/config/personal.ts`, never inline in components. It also feeds the schema.org `Person` in `Layout.astro`, so adding a field there is how it reaches structured data.
- Dimmed text uses the `--text-faint` / `--text-muted` / `--text-subtle` tokens in `global.css`, not inline `oklch()`. Every step clears WCAG AA against the background; hardcoding a dimmer value silently reintroduces the contrast failures.
- New portfolio/software/boot-sequence content goes in `src/content/` and must match the zod schemas in `src/content.config.ts`.

## Gotchas

- The GitHub token reaches nginx as a mounted file, not an env var — nginx cannot read the environment. `nginx.conf` has `include /etc/nginx/gh-auth/*.conf;` inside the `/api/gh` location, and home-ops mounts a Secret there holding a single `proxy_set_header Authorization "Bearer ...";` line. The wildcard is deliberate: nginx accepts a glob that matches nothing, where a named missing file is fatal, so the image starts with or without the token and the two repos can be released in either order.
- nginx config sets `port_in_redirect off; absolute_redirect off;` — the container listens on 8080 behind the Gateway, and without these, redirects leak `:8080` to clients. Don't remove them.
- Static assets referenced by raw URL (e.g. logos) belong in `public/`, not `src/assets/` — Astro fingerprints/relocates `src/assets` imports.
- The boot sequence only plays on first visit, gated by the `phew-blue-boot-seen` localStorage key — clear it to see the animation again while developing.
- Poppins is vendored, not fetched: `astro.config.mjs` uses `fontProviders.local()` against `src/assets/fonts/`, so builds need no network for fonts. Adding a weight means adding the woff2 file too — there is no Google Fonts fallback.
- `public/og-image.png` is a generated artefact, committed. Rerun `npm run build && npm run og` after brand or title changes; it needs a Chrome binary (`CHROME_BIN`).
- Release data is rendered **twice**: baked in at build time, then refreshed in the browser on load. The build-time render is the fallback and must stay correct on its own — with JS off, or GitHub unreachable, the page shows what the build saw. Unauthenticated builds can hit rate limits, so CI/local builds may bake in no release data at all; `GITHUB_TOKEN` avoids that, and the client refresh covers it either way.
- `refresh-releases.ts` only ever sets text on nodes the build already emitted — it never creates elements. Astro scopes component CSS with a `data-astro-cid-*` attribute stamped at build time, so a JS-built node renders unstyled. That is why the software templates emit a hidden slot for every release and changelog row the parser could return (`MAX_RELEASES`, `MAX_CHANGELOG_ENTRIES`) rather than only the ones the build found.
- The refresh is coupled to markup: it finds its targets by `data-gh-repo` and `data-gh="..."` attributes. Restructuring the software templates can break it silently — there is no test suite and the build will not complain. If you move those elements, re-check that `data-gh` markers travel with them.
- `[hidden] { display: none !important }` in `global.css` is load-bearing for the above: `.changelog-row` and `.cl-row` set `display: flex`, which outranks the UA rule for `[hidden]` and would show empty placeholder rows.
- The `/api/gh` mirror is an nginx location, so it exists only in the container. `npm run dev` gets the same path from a Vite proxy in `astro.config.mjs`; `astro preview` has neither, and the refresh will 404 there — that is expected, not a bug.
