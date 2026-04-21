export interface ChangelogEntry {
  type: 'feat' | 'fix' | 'chore'
  text: string
}

export interface RepoData {
  repo: string
  description: string | null
  language: string | null
  release: {
    tag: string
    publishedAt: string
    changelog: ChangelogEntry[]
  } | null
}

function parseChangelog(body: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = []
  for (const line of body.split('\n')) {
    const m = line.match(/^-\s+(feat|fix|chore)[\(:].*?[):]\s*(.+)$/)
    if (m) {
      entries.push({ type: m[1] as 'feat' | 'fix' | 'chore', text: m[2].trim() })
      if (entries.length >= 8) break
    }
  }
  return entries
}

export async function fetchRepoData(repoSlug: string): Promise<RepoData> {
  const headers: Record<string, string> = { 'Accept': 'application/vnd.github+json' }
  if (import.meta.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${import.meta.env.GITHUB_TOKEN}`
  }
  try {
    const [repoRes, releaseRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${repoSlug}`, { headers }),
      fetch(`https://api.github.com/repos/${repoSlug}/releases/latest`, { headers }),
    ])
    const repo = repoRes.ok ? await repoRes.json() : {}
    const release = releaseRes.ok ? await releaseRes.json() : null
    return {
      repo: repoSlug,
      description: repo.description ?? null,
      language: repo.language ?? null,
      release: release ? {
        tag: release.tag_name,
        publishedAt: release.published_at,
        changelog: parseChangelog(release.body ?? ''),
      } : null,
    }
  } catch {
    return { repo: repoSlug, description: null, language: null, release: null }
  }
}
