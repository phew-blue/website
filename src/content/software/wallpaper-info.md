---
repo: "phew-blue/wallpaper-info"
featured: false
displayName: "wallpaper-info"
summary: "Paints a system-info panel onto your Windows wallpaper. Specs, not live usage."
tags: ["Go", "Windows", "Desktop"]
downloadAsset: "setup"
---

Draws a small system-info panel onto a background image and sets the result as
your Windows wallpaper. It shows what the machine *is*, not what it's currently
doing — no CPU graphs.

## What it shows

`user @ host`, OS, uptime, CPU model and core count, total RAM, total disk,
LAN IPs per adapter, and the WAN IP. You choose which rows appear and which
corner they sit in; bottom-right by default. There's an optional centred label
too, which defaults to the hostname.

## How it runs

Single binary, no assets to ship with it. The font comes from the system — Open
Sans if you have it, otherwise Segoe UI — and if you don't point it at a
background it uses your current wallpaper.

Run it with `--tray` and it stays resident with a tray icon for refreshing,
switching presets, checking for updates and opening the config. If the tray
can't start, it drops back to a headless refresh loop rather than leaving your
desktop unpainted.

## Presets

Presets bundle colours, font, label rule, panel layout and matching
backgrounds, and are published with each release.

```powershell
./wallpaper-info.exe --list-presets
./wallpaper-info.exe --preset mono
```

A preset only fills in settings you haven't set yourself. Precedence runs
defaults, then preset, then config file, then explicit flags — so a machine
you've tuned by hand keeps its settings.

## Installing

The installer is per-user, so it doesn't need admin. It adds an Add/Remove
Programs entry and a Startup entry that runs `--tray`.
