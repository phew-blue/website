---
repo: "phew-blue/wallpaper-info"
featured: false
displayName: "wallpaper-info"
summary: "Draws a system-info panel onto your Windows wallpaper. Specs, rather than live usage."
tags: ["Go", "Windows", "Desktop"]
downloadAsset: "setup"
---

Draws a small system-info panel onto a background image and sets the result as
the Windows desktop wallpaper. It reports what the machine is rather than what
it's doing at the moment, so there are no usage graphs to watch.

## What it shows

`user @ host`, OS, uptime, CPU model and core count, total RAM, total disk, the
LAN IP for each adapter, and the WAN IP. You can choose which rows appear and
which corner they sit in, with bottom-right as the default. An optional centred
label is also available, defaulting to the hostname.

## How it runs

It's a single binary with no assets to ship alongside it. The font is taken
from the system — Open Sans where it's installed, otherwise Segoe UI — and if
no background is given it uses your current wallpaper.

Running it with `--tray` keeps it resident with a tray icon for refreshing,
switching presets, checking for updates and opening the config. If the tray
can't start, it falls back to a headless refresh loop so the desktop still gets
painted.

## Presets

A preset bundles colours, font, label rule, panel layout and matching
background images, and presets are published with each release.

```powershell
./wallpaper-info.exe --list-presets
./wallpaper-info.exe --preset mono
```

A preset only fills in settings you haven't set yourself. Precedence runs from
defaults, to preset, to config file, to explicit flags, so a machine you've
tuned by hand keeps its own settings.

## Installing

The installer is per-user and doesn't need admin rights. It adds an Add/Remove
Programs entry and a Startup entry that runs `--tray`.
