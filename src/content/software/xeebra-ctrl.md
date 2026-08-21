---
repo: "phew-blue/xeebra-ctrl"
featured: false
displayName: "xeebra-ctrl"
summary: "Fleet control, monitoring and orderly shutdown for EVS Xeebra multi-camera review systems."
tags: ["TypeScript", "Go", "Broadcast"]
downloadAsset: "setup"
---

Control and shutdown utility for EVS Xeebra units — the multi-camera review
systems match officials use for VAR — built for sites running more than one and
tired of a browser tab per device.

## What it does

Talks to Xeebra units over their platform-console API and presents the whole
fleet in a single interface: monitoring tiles per source, per-unit
configuration, health alerting, and a controlled shutdown path for end of day.

- **Monitoring grid** that adapts to split-view orientation, with the last good
  SDI frame cached per input so a tile doesn't go black on a momentary drop
- **Health-check alerting** surfaced in the sidebar
- **Group and server management** for venues running several units
- **Metrics tab** and persisted UI state between sessions
- **Orderly shutdown** — the original reason the tool exists

## Running it

Ships as a Windows installer, attached to each release. It embeds its own web
frontend, so there's nothing else to install and no separate server to run.
