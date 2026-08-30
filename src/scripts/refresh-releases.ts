/**
 * Keeps the release data on the software pages current without a rebuild.
 *
 * The pages are statically rendered, so every version number, date and
 * changelog is frozen at build time — a new release of one of these projects
 * would otherwise not appear until the site itself was rebuilt and redeployed.
 * This re-fetches the same data on load and patches it in.
 *
 * Two rules shape the implementation:
 *
 *   1. The build-time render stays the fallback. Nothing here is required for
 *      the page to be correct — with JS off, or GitHub unreachable, the page
 *      shows exactly what it always did. A failed fetch returns empty data and
 *      is ignored rather than blanking what the build rendered.
 *
 *   2. Nothing is constructed from markup strings. Astro scopes component CSS
 *      by stamping a data-astro-cid-* attribute onto elements at build time,
 *      which JS-built nodes would not carry — they would render unstyled. So
 *      the templates emit every slot the data could need (capped by the same
 *      MAX_* limits the parser uses), hidden when empty, and this only ever
 *      sets text on nodes that already exist.
 */
import { fetchRepoData, type ChangelogEntry, type Release, type RepoData } from '../lib/github'

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`

const slot = (root: ParentNode, name: string) =>
  root.querySelector<HTMLElement>(`[data-gh="${name}"]`)
const slots = (root: ParentNode, name: string) =>
  Array.from(root.querySelectorAll<HTMLElement>(`[data-gh="${name}"]`))

/** Set a slot's text and reveal it; hide it when there is nothing to show. */
function fill(el: HTMLElement | null, text: string | null | undefined) {
  if (!el) return
  if (!text) {
    el.hidden = true
    return
  }
  el.textContent = text
  el.hidden = false
}

function fillChangelog(container: HTMLElement | null, entries: ChangelogEntry[]) {
  if (!container) return

  slots(container, 'cl-slot').forEach((row, i) => {
    const entry = entries[i]
    if (!entry) {
      row.hidden = true
      return
    }

    const type = slot(row, 'cl-type')
    if (type) {
      // Only the modifier is swapped — the scoping attribute and base class
      // both have to survive or the row loses its styling.
      type.classList.remove('cl-type--feat', 'cl-type--fix', 'cl-type--chore')
      type.classList.add(`cl-type--${entry.type}`)
      type.textContent = entry.type
    }
    fill(slot(row, 'cl-text'), entry.text)
    row.hidden = false
  })

  container.hidden = entries.length === 0
}

function fillReleases(scope: HTMLElement, releases: Release[]) {
  const section = slot(scope, 'releases')
  if (!section) return

  slots(section, 'rel-slot').forEach((block, i) => {
    const release = releases[i]
    if (!release) {
      block.hidden = true
      return
    }

    fill(slot(block, 'rel-tag'), release.tag)
    fill(slot(block, 'rel-date'), longDate(release.publishedAt))

    const pre = slot(block, 'rel-pre')
    if (pre) pre.hidden = !release.prerelease

    fillChangelog(slot(block, 'cl-list'), release.changelog)

    const noNotes = slot(block, 'cl-none')
    if (noNotes) noNotes.hidden = release.changelog.length > 0

    // Only the newest release is shown at full strength.
    block.classList.toggle('release--old', i > 0)
    block.hidden = false
  })

  section.hidden = releases.length === 0
}

function fillDownload(scope: HTMLElement, latest: Release | null) {
  const download = slot(scope, 'download')
  if (!download) return

  const wanted = scope.dataset.ghAsset
  const asset = wanted && latest ? latest.assets.find(a => a.name.includes(wanted)) : undefined

  if (asset) {
    if (download instanceof HTMLAnchorElement) download.href = asset.downloadUrl
    fill(slot(download, 'download-meta'), `${asset.name} · ${mb(asset.size)}`)
    download.hidden = false
  } else {
    download.hidden = true
  }

  // The install command is the fallback when a release carries no matching
  // asset, so the two swap together.
  const install = slot(scope, 'install')
  if (install) install.hidden = !!asset
}

function apply(scope: HTMLElement, data: RepoData) {
  const latest = data.release

  fill(slot(scope, 'tag'), latest?.tag)
  fill(slot(scope, 'date-short'), latest && shortDate(latest.publishedAt))
  fill(slot(scope, 'date-long'), latest && longDate(latest.publishedAt))

  const none = slot(scope, 'none')
  if (none) none.hidden = !!latest

  // The version and its date share a wrapper; an empty one would still take a
  // slot in the flex band, so it is hidden and revealed as a unit.
  const group = slot(scope, 'tag-group')
  if (group) group.hidden = !latest

  const title = slot(scope, 'cl-title')
  if (title && latest) title.textContent = `Changes in ${latest.tag}`

  fillDownload(scope, latest)
  fillChangelog(slot(scope, 'changelog'), latest?.changelog ?? [])
  fillReleases(scope, data.releases)
}

async function refresh(scope: HTMLElement) {
  const repo = scope.dataset.ghRepo
  if (!repo) return

  const data = await fetchRepoData(repo)

  // An unreachable API returns the same empty shape as a repo with no
  // releases. Either way there is nothing to say that the build did not
  // already say, and overwriting would replace real versions with blanks.
  if (data.releases.length === 0) return

  apply(scope, data)
}

for (const scope of document.querySelectorAll<HTMLElement>('[data-gh-repo]')) {
  refresh(scope).catch(() => {
    /* The build-time render stands. */
  })
}
