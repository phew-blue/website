---
repo: "phew-blue/xeebra-ctrl"
featured: false
displayName: "xeebra-ctrl"
summary: "Xeebra multi-viewer control and shutdown utility for broadcast production environments."
tags: ["TypeScript", "Go", "Broadcast"]
downloadAsset: "setup"
---

Control and shutdown utility for EVS Xeebra multi-viewers, built for broadcast
production environments where the operator needs one place to see every unit
rather than a browser tab per device.

## What it does

Talks to Xeebra units over their platform-console API and presents them in a
single interface — monitoring tiles for each source, per-unit configuration,
and an orderly shutdown path for end of day.

- **Monitoring grid** that adapts to split-view orientation, with the last good
  SDI frame cached per input so a tile doesn't go black on a momentary drop
- **Health-check alerting** surfaced in the sidebar
- **Group and server management** for sites running more than a handful of units
- **Metrics tab** and persisted UI state between sessions
- **Orderly shutdown** — the original reason the tool exists

## Running it

Ships as a Windows installer, attached to each release. It embeds its own web
frontend, so there's nothing else to install and no separate server to run.
