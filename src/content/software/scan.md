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
---

Barcode scanning for job tracking. You make a job, scan barcodes into it, and
export what you collected when you're done.

## What it does

Each job can carry its own regex patterns, so a job set up for one kind of
label will reject anything that doesn't match. Leave the patterns empty and it
takes whatever you scan.

Two ways to get barcodes in. The browser can use a device camera, with a beep
on each successful scan, so a phone works as a scanner. Or plug in a USB HID
scanner and it arrives as keyboard input.

Login goes through OIDC, so any provider works — it runs against Authelia here.
There's also an optional password gate in front of the OIDC login, rate-limited
per IP, for when you want a second door.

`/metrics` exposes scan and job counters plus auth failure alerting.

## Running it

One binary. It serves the Next.js frontend as static files, so there's no
separate web server to run alongside it. It needs PostgreSQL; migrations run on
startup.

The compose file brings up Postgres and the app together, which is the quickest
way to try it.
