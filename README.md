# phew.blue

The [phew.blue](https://phew.blue) website — built with [Astro 6](https://astro.build) and deployed to Kubernetes via Flux GitOps.

## Stack

- **Framework:** Astro 6 (static output)
- **Styling:** Tailwind CSS v4 + signal theme
- **Container:** `nginxinc/nginx-unprivileged` on port 8080
- **Registry:** `ghcr.io/phew-blue/website`

## Development

```bash
npm install
npm run dev        # dev server at http://localhost:4321
npm run build      # production build to dist/
npm run astro check  # type check
```

## Deployment

Images are built and pushed automatically:

- **`dev` branch** → `:dev` tag → deployed to `website.dev.phew.blue`
- **`v*` tags** → versioned tags + `latest` → deployed to `phew.blue`

Releases are created via the **Prepare Release** workflow dispatch.
