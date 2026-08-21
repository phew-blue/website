# phew.blue Website Redesign

**Date:** 2026-04-21
**Status:** Approved — ready for implementation

---

## Overview

Rebuild the current placeholder `phew.blue` website into a production site. Primary purpose is a software showcase (open source projects). A broadcast/freelance portfolio mode is gated behind a build-time env var for future use.

Inspired by [peterbroadcast.com](https://peterbroadcast.com/) — specifically the terminal boot sequence aesthetic. The site uses the existing "signal theme" (near-black + steel blue palette).

---

## Stack

- **Framework:** Astro 6 (static build)
- **Styles:** Tailwind CSS v4 + signal theme (already in `src/styles/global.css`)
- **Font:** Space Grotesk (already configured)
- **Deployment:** Kubernetes/Flux to `phew.blue`

---

## Environment Variables

| Variable | Default | Effect |
|---|---|---|
| `PHEW_BLUE_FREELANCE` | unset | When `true`, enables all broadcast/personal sections |
| `GITHUB_TOKEN` | unset | Required if `xeebra-ctrl` remains a private repo |

---

## Pages

| Route | Description |
|---|---|
| `/` | Homepage (single scroll) |
| `/software` | Full software detail page |
| `/work` | Portfolio listing page (`PHEW_BLUE_FREELANCE` only) |
| `/work/[slug]` | Individual portfolio project pages (`PHEW_BLUE_FREELANCE` only) |
| `/404` | Not found |

---

## Homepage Sections

### Software-only mode (default)

1. Boot sequence
2. Software — scan + xeebra-ctrl row cards → `/software`
3. Contact

### Freelance mode (`PHEW_BLUE_FREELANCE=true`)

1. Boot sequence
2. Hero — tagline + VT/Edit Guarantee role cards + software teaser (scan + xeebra-ctrl pills)
3. Skills — 4-column grid
4. Portfolio — 6 project cards
5. Software — row cards → `/software`
6. About — bio + headshot
7. Contact

---

## Navigation

**Software-only:** logo · Software · Contact

**Freelance:** logo · Work (`/work`) · Skills · Software · About · Contact

---

## Boot Sequence

### Storage

`src/content/bootSequences/` — one `.yaml` file per variant. The component loads all entries and picks one randomly on each page load.

### Schema

```yaml
name: string
lines:
  - type: header | separator | line | ok | warn
    text: string      # full line text (for header/line/warn)
    label: string     # left column (for ok rows)
    value: string     # right column (for ok rows)
```

### Variants

**evs.yaml** — EVS LSM-VIA firmware boot. I/O boards, NVMe array, IPDirector, XTAccess, LSM Remote panels, ingest channels.

**ob.yaml** — OB Pre-TX check. Sync reference (1080i/50), video router (MVS-8000X), intercom (RTS ADAM-M), record channels (4× EVS), confidence monitoring.

**ip.yaml** — ST 2110 network init. IEEE 1588 PTP grandmaster lock (+2ns, 4.3μs path delay), NMOS IS-04 registry (47 senders, 31 receivers), IS-05 connection management, flow audit (ST 2110-20/30/40).

### End frame

All variants resolve to the phew.blue logo mark (SVG `public/phew-blue-logo.svg`, blue symbol only) + "phew.blue" in Space Grotesk beside it.

### Animation

All variants are rendered in the HTML. A small inline `<script>` (the only client-side JS on the page) picks one randomly on load and hides the rest before first paint. Staggered CSS animation on the visible variant, ~3 seconds total. Fades out, reveals page beneath.

---

## Content Collections

### `src/content/portfolio/` (6 files, migrated from `website-old`)

Existing `.md` files with Astro Content Collections schema. Colour frontmatter remapped:

| File | Old gradient | Signal theme |
|---|---|---|
| `paralympics-cbc-2024.md` | emerald-400→500 | palette-green |
| `glastonbury-2024.md` | pink-500→cyan-500 | palette-rose → palette-cyan |
| `head-of-vt.md` | indigo-500→600 | palette-violet |
| `cloudbass-ob9.md` | purple-500→600 | `#2080b9` (Cloudbass brand blue, extracted from logo) |
| `btcc.md` | emerald-500→600 | palette-green |
| `six-day-cycling.md` | orange-500→600 | palette-amber |

Cloudbass OB9 photo updated to: `https://bectuob.org.uk/wp-content/uploads/2024/07/cloudbass-e1719935849170.png` (download at build time / commit to assets).

### `src/content/software/` (2 files)

```yaml
# scan.md frontmatter
repo: "phew-blue/scan"
featured: true
displayName: "scan"
tags: ["Go", "TypeScript", "PostgreSQL", "OIDC", "Kubernetes"]
```

```yaml
# xeebra-ctrl.md frontmatter
repo: "phew-blue/xeebra-ctrl"
featured: false
displayName: "xeebra-ctrl"
tags: ["TypeScript", "Broadcast"]
```

GitHub API data (latest release tag, published date, changelog body) fetched at build time via `GITHUB_TOKEN`. Falls back gracefully if API unreachable at build time — release pill and changelog are omitted, repo card still renders with static content from the `.md` file.

### `src/content/bootSequences/` (3 files)

`evs.yaml`, `ob.yaml`, `ip.yaml` — see Boot Sequence section above.

---

## Components

| Component | Gated | Notes |
|---|---|---|
| `BootSequence.astro` | No | Reads all bootSequences entries, picks randomly, animates |
| `Navigation.astro` | No | Renders correct links based on `PHEW_BLUE_FREELANCE` |
| `HeroSection.astro` | `PHEW_BLUE_FREELANCE` | Tagline + role cards + software teaser pills |
| `SkillsSection.astro` | `PHEW_BLUE_FREELANCE` | 4-column grid, migrated from old site |
| `PortfolioSection.astro` | `PHEW_BLUE_FREELANCE` | 6 project cards, signal palette colours |
| `PortfolioCard.astro` | `PHEW_BLUE_FREELANCE` | Individual card, used in section + detail page |
| `SoftwareSection.astro` | No | Row cards, fetches GitHub data, links to `/software` |
| `AboutSection.astro` | `PHEW_BLUE_FREELANCE` | Bio + headshot, migrated from old site |
| `ContactSection.astro` | No | Email + LinkedIn |

---

## `/software` Detail Page

- **Featured repo** (scan): name, description, version, published date, Docker pull command (`ghcr.io/phew-blue/scan:vX.Y.Z`), tags, parsed changelog
- **Changelog parsing**: release body lines prefixed `feat`/`fix`/`chore` are colour-coded (green/amber/muted). Other lines omitted.
- **Secondary repos** (xeebra-ctrl): smaller card, description, version, GitHub link

---

## Signal Theme Colour Reference

| Token | Value | Use |
|---|---|---|
| `--palette-cyan` | `oklch(0.70 0.12 218)` | Primary accent, links, pills |
| `--palette-green` | `oklch(0.69 0.18 152)` | Paralympics, BTCC portfolio cards; changelog `feat` |
| `--palette-amber` | `oklch(0.76 0.16 65)` | Six Day Cycling card; changelog `fix` |
| `--palette-rose` | `oklch(0.72 0.15 15)` | Glastonbury card (gradient start) |
| `--palette-violet` | `oklch(0.72 0.14 290)` | Head of VT card |
| `#2080b9` | — | Cloudbass OB9 card only (brand colour) |

---

## Source Migration

From `website-old-local`:

- Copy `src/content/portfolio/*.md` → update colour frontmatter
- Copy `src/assets/photos/portfolio/*` → keep filenames
- Copy `src/config/personal.ts` → keep as-is (used by HeroSection, AboutSection, ContactSection)
- Port component logic from `HeroSection`, `AboutSection`, `SkillsSection`, `PortfolioSection`, `ContactSection` → rewrite markup to use signal theme classes
- Do **not** copy: old theme package, old CSS, old navigation, old layout

---

## Out of Scope

- Blog
- Analytics
- CMS
- Comment system
- Any client-side data fetching (all GitHub data baked at build time)
