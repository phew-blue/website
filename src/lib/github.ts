interface GithubRelease {
  tag_name: string
  name: string
  published_at: string
  body: string
}

interface GithubRepo {
  description: string | null
  language: string | null
  stargazers_count: number
}

export interface RepoData {
  repo: string
  description: string | null
  language: string | null
  release: {
    tag: string
    name: string
    publishedAt: string
    changelog: ChangelogEntry[]
  } | null
}

export interface ChangelogEntry {
  type: 'feat' | 'fix' | 'chore' | 'other'
  text: string
}

function parseChangelog(body: string): ChangelogEntry[] {
  return body
    .split('\n')
    .filter(line => /^- (feat|fix|chore)\(/.test(line) || /^- (feat|fix|chore):/.test(line))
    .slice(0, 8)
    .map(line => {
      const match = line.match(/^- (feat|fix|chore)[\(:](.*?)(?:\):|:)\s*(.+)$/)
      if (!match) return null
      const type = match[1] as 'feat' | 'fix' | 'chore'
      const text = match[3].trim()
      return { type, text }
    })
    .filter((e): e is ChangelogEntry => e !== null)
}

export async function fetchRepoData(repoSlug: string): Promise<RepoData> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
  }
  if (import.meta.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${import.meta.env.GITHUB_TOKEN}`
  }

  try {
    const [repoRes, releaseRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${repoSlug}`, { headers }),
      fetch(`https://api.github.com/repos/${repoSlug}/releases/latest`, { headers }),
    ])

    const repo: GithubRepo = repoRes.ok ? await repoRes.json() : { description: null, language: null, stargazers_count: 0 }
    const release: GithubRelease | null = releaseRes.ok ? await releaseRes.json() : null

    return {
      repo: repoSlug,
      description: repo.description,
      language: repo.language,
      release: release ? {
        tag: release.tag_name,
        name: release.name,
        publishedAt: release.published_at,
        changelog: parseChangelog(release.body ?? ''),
      } : null,
    }
  } catch {
    return { repo: repoSlug, description: null, language: null, release: null }
  }
}
