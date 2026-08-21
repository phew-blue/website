---
repo: "phew-blue/xeebra-ctrl"
featured: false
displayName: "xeebra-ctrl"
summary: "One place to watch, configure and shut down a room full of EVS Xeebra units."
tags: ["TypeScript", "Go", "Broadcast"]
downloadAsset: "setup"
---

EVS Xeebra is the multi-camera review system officials use for VAR. Run more
than one and you end up with a browser tab per unit, which is how this started.

## What it does

It talks to each unit over the platform-console API and puts the whole lot in
one window: monitoring tiles per source, the configuration you'd otherwise
click through per device, and a shutdown that works through the room in order
at the end of the day.

The monitoring grid rearranges itself for split-view orientation. Each tile
holds the last good SDI frame, so a momentary drop doesn't leave you looking at
a black square wondering whether something died.

Health checks raise alerts in the sidebar. If you're running enough units to
care, there's group and server management, plus a metrics tab. UI state sticks
between sessions.

## Running it

Windows installer, attached to each release. The web frontend is embedded in
the binary, so there's nothing else to install and no server to keep running.
