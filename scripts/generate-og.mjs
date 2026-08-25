#!/usr/bin/env node
/**
 * Renders public/og-image.png — the 1200x630 card social platforms show when a
 * phew.blue link is shared. OG requires a raster; the brand logo is an SVG, so
 * this composites it over the site's own background and typography.
 *
 * Headless Chrome does the rendering rather than a pure-SVG rasteriser because
 * the card needs real Poppins text, and the self-hosted font is a woff2 that
 * only a browser will load — there is no system-installed Poppins to fall back
 * on. The @font-face rules are lifted from the build output, so the card always
 * uses exactly the font files the site itself ships.
 *
 * Usage:
 *   npm run build && npm run og
 *
 * Requires a Chrome/Chromium binary. Set CHROME_BIN if it isn't on PATH, and
 * LD_LIBRARY_PATH if it needs sideloaded system libraries.
 */
import fs from 'node:fs'
import os from 'node:os'
import http from 'node:http'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(root, 'dist')
const OUT = path.join(root, 'public', 'og-image.png')

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('✗ dist/index.html not found — run `npm run build` first')
  process.exit(1)
}

const chrome = process.env.CHROME_BIN ?? 'chromium'

// Lift the real @font-face rules (hashed font URLs and all) out of the build.
const built = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
const faces = (built.match(/@font-face\{[^}]*\}/g) ?? [])
  .filter(face => face.includes('/_astro/fonts/'))
  .map(face => face.replace(/font-family:[^;]+;/, 'font-family:Poppins;'))
if (!faces.length) {
  console.error('✗ no self-hosted @font-face rules in the build — did the fonts config change?')
  process.exit(1)
}

const cardPath = path.join(DIST, '__og.html')
fs.writeFileSync(
  cardPath,
  fs.readFileSync(path.join(root, 'scripts/og/card.html'), 'utf8')
    .replace('{{FONT_FACES}}', faces.join('\n  ')),
)

const TYPES = { '.html': 'text/html', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const file = path.join(DIST, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end() }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' })
    res.end(data)
  })
})

const shoot = (args) => new Promise((resolve, reject) => {
  const child = execFile(chrome, args, { timeout: 60_000 })
  child.on('error', reject)
  child.on('exit', code => (code === 0 ? resolve() : reject(new Error(`chrome exited ${code}`))))
})

// Port 0 — the OS picks a free one, so a stray dev server can't block this.
// The spawn must be async: execFileSync would block this process's event loop,
// and the server it is hosting could then never answer Chrome's requests.
server.listen(0, async () => {
  const { port } = server.address()
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'og-chrome-'))
  try {
    await shoot([
      '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
      // A throwaway profile keeps a stale singleton lock in the default profile
      // directory from blocking the run.
      `--user-data-dir=${profile}`,
      '--no-first-run', '--no-default-browser-check',
      '--force-device-scale-factor=1', '--window-size=1200,630',
      // Let the webfont finish loading before the frame is captured.
      '--virtual-time-budget=3000',
      `--screenshot=${OUT}`,
      `http://localhost:${port}/__og.html`,
    ])
    // Chrome's PNG encoder is fast, not small. sharp ships with Astro's image
    // pipeline, so recompress with it when it's there and skip quietly if not.
    try {
      const sharp = (await import('sharp')).default
      const buf = await sharp(OUT).png({ compressionLevel: 9 }).toBuffer()
      if (buf.length < fs.statSync(OUT).size) fs.writeFileSync(OUT, buf)
    } catch {}
    const { size } = fs.statSync(OUT)
    console.log(`✓ public/og-image.png — 1200x630, ${Math.round(size / 1024)}kB`)
  } catch (err) {
    console.error(`✗ chrome failed: ${err.message}`)
    console.error('  Set CHROME_BIN to a Chrome/Chromium binary.')
    process.exitCode = 1
  } finally {
    fs.rmSync(cardPath, { force: true })
    fs.rmSync(profile, { recursive: true, force: true })
    server.close()
  }
})
