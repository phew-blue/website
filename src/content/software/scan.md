---
repo: "phew-blue/scan"
featured: true
displayName: "scan"
summary: "Scan barcodes into named jobs, then export the results."
tags: ["Go", "Next.js", "PostgreSQL", "OIDC"]
install:
  - label: "Docker"
    command: "docker pull ghcr.io/phew-blue/scan:latest"
  - label: "Compose"
    command: "docker compose up -d"
screenshots:
  - src: "../../assets/software/scan-preview.png"
    alt: "A job with six scanned codes, each checked against the job pattern, and the output ready to copy"
---

Barcode scanning for job tracking. You create a named job, scan barcodes into
it, and export the collected results when the job is finished.

## What it does

Each job can have its own regex patterns, so a job expecting one kind of label
will reject barcodes that don't match. If a job has no patterns set, it accepts
everything.

There are two ways to get barcodes in. The browser can scan through a device
camera and beeps on each successful read, which means a phone works as a
scanner. A USB HID scanner is also supported, arriving as keyboard input.

Authentication is OIDC, so it works with any provider — it runs against
Authelia here. There's also an optional access password in front of the OIDC
login, rate-limited per IP, if you'd like an additional layer.

The `/metrics` endpoint exposes scan and job counters alongside auth failure
alerting.

## Running it

It's a single binary that serves the Next.js frontend as static files, so
there's no separate web server to run alongside it. PostgreSQL is required, and
migrations run at startup.

The compose file brings up Postgres and the app together, which is the easiest
way to try it.
