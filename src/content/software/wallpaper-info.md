---
repo: "phew-blue/wallpaper-info"
featured: false
displayName: "wallpaper-info"
summary: "Composites a system-info panel onto the Windows desktop wallpaper — specs, not usage graphs."
tags: ["Go", "Windows", "Desktop"]
downloadAsset: "setup"
---

Composites a system-info panel — user, OS, uptime, CPU, RAM, disk, LAN and WAN
IPs — onto the Windows desktop wallpaper. Specs at a glance, not another usage
graph competing for attention.

## What it does

Renders the panel directly into the wallpaper image rather than drawing an
overlay window, so it survives full-screen apps, doesn't steal focus, and costs
nothing to keep on screen. A tray app handles refreshes and preset changes.

- **System info, not monitoring** — the details you actually recite when
  someone asks what a machine is, rather than live CPU graphs
- **Preset backgrounds** pulled from a manifest, so the panel stays legible
  against a background designed for it
- **Tray app** for refresh, preset switching and update checks
- **Single Go binary** with a per-user installer — no admin rights, no runtime
  to install

## Running it

Windows only. Download the installer from the latest release; it installs
per-user and adds the tray app to startup.
