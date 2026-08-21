---
repo: "phew-blue/scan"
featured: true
displayName: "scan"
summary: "Barcode scanner with formatted output — camera and HID input, OIDC authentication, Prometheus metrics."
tags: ["TypeScript", "Go", "PostgreSQL", "OIDC", "Kubernetes"]
install:
  - label: "Docker"
    command: "docker pull ghcr.io/phew-blue/scan:latest"
  - label: "Kubernetes"
    command: "kubectl apply -k github.com/phew-blue/scan//deploy"
---

Barcode scanner with formatted output, built for environments where the same
code needs to be read by a phone camera in one room and a fixed HID scanner in
another.

## What it does

Scans barcodes from either a device camera or an attached HID scanner, then
formats the result according to configurable rules before storing or forwarding
it. The web frontend works on a phone without installing anything — useful when
the alternative is carrying a dedicated terminal around.

- **Camera and HID input** — the same interface accepts both, so a phone and a
  bench scanner behave identically
- **OIDC authentication** via Authelia, so access follows existing identity
  rather than a separate user list
- **Prometheus metrics endpoint** for scan rates and error counts
- **PostgreSQL** persistence

## Deployment

Runs as a container. The Kubernetes manifests are set up for Flux, but the
image works with plain Docker if you'd rather not.
