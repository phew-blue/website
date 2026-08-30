export interface ChangelogEntry {
  type: 'feat' | 'fix' | 'chore'
  text: string
}

export interface ReleaseAsset {
  name: string
  size: number
  downloadUrl: string
}

export interface Release {
  tag: string
  publishedAt: string
  prerelease: boolean
  changelog: ChangelogEntry[]
  assets: ReleaseAsset[]
}

export interface RepoData {
  repo: string
  description: string | null
  language: string | null
  license: string | null
  /** Most recent non-draft release, or null. */
  release: Release | null
  /** Most recent releases, newest first, capped by MAX_RELEASES. */
  releases: Release[]
}

export const MAX_RELEASES = 5
export const MAX_CHANGELOG_ENTRIES = 8

/**
 * The build talks to api.github.com directly. The browser talks to this site's
 * own origin instead, where nginx keeps a short shared cache of these same two
 * endpoints (the /api/gh location in nginx.conf). The refresh then costs
 * GitHub one request per repo per cache TTL no matter how much traffic the
 * site takes, rather than one per visitor against a 60/hour limit — and no
 * visitor's browser ever contacts github.com.
 */
const API_BASE = import.meta.env.SSR ? 'https://api.github.com/repos' : '/api/gh'

/**
 * Commit scopes that are dependency or tooling churn rather than product
 * changes. Renovate opens one commit per bump, and release bodies here are
 * generated from raw `git log`, so without this filter a changelog reads as
 * "update vitest monorepo 4.1.2 -> 4.1.4" eight times over and the real
 * changes never appear.
 */
const NOISE_SCOPES =
  /^(deps|deps-dev|npm|mise|container|github-action|renovate|release|ci|build)$/i

/**
 * GitHub's generate_release_notes appends ` by @user in <pull-request-url>`
 * to every line. Useful on GitHub, noise on a page that just wants the change.
 */
const ATTRIBUTION = /\s+by\s+@[\w-]+\s+in\s+https?:\/\/\S+\s*$/

/** `- feat(scope)!: subject (abc1234)` -> type, scope, subject */
const CHANGELOG_LINE = /^[-*]\s+(feat|fix|chore)(?:\(([^)]+)\))?!?:\s*(.+?)(?:\s+\([0-9a-f]{7,40}\))?$/

/** `### Features` / `### Fixes` — headings emitted by create-release.yml. */
const SECTION_HEADING = /^#{2,3}\s+(Features?|Fixes|Improvements|Documentation|Maintenance)\s*$/i
const BULLET = /^[-*]\s+(.+?)\s*$/

const HEADING_TYPE: Record<string, ChangelogEntry['type'] | null> = {
  feature: 'feat',
  features: 'feat',
  fix: 'fix',
  fixes: 'fix',
  improvements: 'feat',
  documentation: null,
  maintenance: null,
}

/**
 * Release bodies come in two shapes across these repos:
 *
 *   1. Grouped, written by create-release.yml — `### Features` then bare
 *      bullets, with the conventional-commit prefix already stripped.
 *   2. A raw `git log` dump — `- feat(scope): subject (abc1234)` lines.
 *
 * Grouped wins when present; the headings carry the type that the stripped
 * bullets no longer do.
 */
export function parseChangelog(body: string): ChangelogEntry[] {
  return parseGrouped(body) ?? parseConventional(body)
}

function parseGrouped(body: string): ChangelogEntry[] | null {
  const lines = body.split('\n')
  if (!lines.some(l => SECTION_HEADING.test(l.trim()))) return null

  const entries: ChangelogEntry[] = []
  let type: ChangelogEntry['type'] | null = null

  for (const raw of lines) {
    const line = raw.trim()

    const heading = line.match(SECTION_HEADING)
    if (heading) {
      type = HEADING_TYPE[heading[1].toLowerCase()] ?? null
      continue
    }
    // Any other heading ends the current section.
    if (line.startsWith('#')) {
      type = null
      continue
    }

    if (!type) continue
    const bullet = line.match(BULLET)
    if (!bullet) continue

    entries.push({ type, text: bullet[1].replace(ATTRIBUTION, '') })
    if (entries.length >= MAX_CHANGELOG_ENTRIES) break
  }

  return entries
}

function parseConventional(body: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = []

  for (const line of body.split('\n')) {
    const match = line.match(CHANGELOG_LINE)
    if (!match) continue

    const [, type, scope, text] = match
    if (scope && NOISE_SCOPES.test(scope)) continue
    // chore is housekeeping by definition — never the reason someone upgrades.
    if (type === 'chore') continue

    entries.push({ type: type as ChangelogEntry['type'], text: text.replace(ATTRIBUTION, '').trim() })
    if (entries.length >= MAX_CHANGELOG_ENTRIES) break
  }

  return entries
}

interface GhRelease {
  tag_name: string
  published_at: string
  draft: boolean
  prerelease: boolean
  body: string | null
  assets?: { name: string; size: number; browser_download_url: string }[]
}

function toRelease(r: GhRelease): Release {
  return {
    tag: r.tag_name,
    publishedAt: r.published_at,
    prerelease: r.prerelease,
    changelog: parseChangelog(r.body ?? ''),
    assets: (r.assets ?? []).map(a => ({
      name: a.name,
      size: a.size,
      downloadUrl: a.browser_download_url,
    })),
  }
}

/**
 * The index page and every detail page ask for the same repos during one
 * build. Unauthenticated GitHub allows 60 requests/hour per IP, so cache per
 * build rather than paying two calls per page.
 */
const cache = new Map<string, Promise<RepoData>>()

export function fetchRepoData(repoSlug: string): Promise<RepoData> {
  let hit = cache.get(repoSlug)
  if (!hit) {
    hit = fetchRepoDataUncached(repoSlug)
    cache.set(repoSlug, hit)
  }
  return hit
}

async function fetchRepoDataUncached(repoSlug: string): Promise<RepoData> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' }
  // SSR-gated so the token can never reach a client bundle. Vite only inlines
  // PUBLIC_-prefixed vars, but this module is now imported by browser code and
  // a bare env read is one config change away from leaking into public JS.
  if (import.meta.env.SSR && import.meta.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${import.meta.env.GITHUB_TOKEN}`
  }

  const empty: RepoData = {
    repo: repoSlug,
    description: null,
    language: null,
    license: null,
    release: null,
    releases: [],
  }

  try {
    const [repoRes, releasesRes] = await Promise.all([
      fetch(`${API_BASE}/${repoSlug}`, { headers }),
      fetch(`${API_BASE}/${repoSlug}/releases?per_page=${MAX_RELEASES}`, { headers }),
    ])

    // Failures here degrade silently into a page with no versions, which looks
    // like the projects have no releases rather than like a broken build. Say
    // so in the build log. Unauthenticated GitHub allows 60 requests/hour, so
    // this is most often a rate limit — set GITHUB_TOKEN to raise it.
    if (!repoRes.ok || !releasesRes.ok) {
      const remaining = releasesRes.headers.get('x-ratelimit-remaining')
      console.warn(
        `[github] ${repoSlug}: repo ${repoRes.status}, releases ${releasesRes.status}` +
        (remaining !== null ? ` (rate limit remaining: ${remaining})` : '') +
        ' — page will render without release data',
      )
    }

    const repo = repoRes.ok ? await repoRes.json() : {}
    const raw: GhRelease[] = releasesRes.ok ? await releasesRes.json() : []
    const releases = raw.filter(r => !r.draft).map(toRelease)

    return {
      repo: repoSlug,
      description: repo.description ?? null,
      language: repo.language ?? null,
      license: repo.license?.spdx_id ?? null,
      release: releases[0] ?? null,
      releases,
    }
  } catch (err) {
    console.warn(`[github] ${repoSlug}: request failed — ${err} — page will render without release data`)
    return empty
  }
}
