---
repo: "phew-blue/xeebra-ctrl"
featured: false
displayName: "xeebra-ctrl"
summary: "One place to monitor, configure and shut down a room of EVS Xeebra units."
tags: ["TypeScript", "Go", "Broadcast"]
downloadAsset: "setup"
screenshots:
  - src: "../../assets/software/xeebra-ctrl-preview.webp"
    alt: "Two Xeebra units side by side, each showing its full grid of live SDI sources, with the fleet listed down the left"
  - src: "../../assets/software/xeebra-ctrl-stacked.webp"
    alt: "The same two units stacked one above the other, the monitoring grid reflowing to full width in each pane"
  - src: "../../assets/software/xeebra-ctrl-metrics.webp"
    alt: "The metrics tab — service health for twenty-one checks with two critical failures, above a table of SDI signal status"
  - src: "../../assets/software/xeebra-ctrl-configuration.webp"
    alt: "The configuration tab — server details and maintenance actions, with video format and per-recorder SDI settings below"
---

EVS Xeebra is the multi-camera review system officials use for VAR. Once a
venue runs several of them, managing each through its own browser tab gets
tedious, which is where this came from.

## What it does

It brings the whole fleet into one window: monitoring tiles for every source,
the settings you'd otherwise reach device by device, and a shutdown that works
through the room in order at the end of the day.

Each unit is reached through two routes. The cluster REST API sits behind
haproxy, and the platform-console has its own endpoint — worth keeping separate,
because the platform-console stays reachable when haproxy or docker isn't.
Shutting a server down and restarting it happens over SSH.

The monitoring grid rearranges itself to suit split-view orientation. Each tile
keeps the last good SDI frame, so a brief signal drop shows the previous frame
rather than going black.

Health checks raise alerts in the sidebar. There's group and server management
for venues running several units, along with a metrics tab, and the interface
remembers its state between sessions.

## Running it

A Windows installer is attached to each release. The web frontend is embedded
in the binary, so there's nothing else to install and no separate server to
keep running.
