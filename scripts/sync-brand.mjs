#!/usr/bin/env node
/**
 * Vendors the Phew Blue brand theme into src/styles/brand/.
 *
 * The old one-line `cp ../brand/...` silently did nothing useful when the
 * sibling checkout was missing or stale: a missing source aborted the copy with
 * a bare cp error, and nothing ever told you the vendored file had drifted
 * behind the brand kit. This does both explicitly.
 *
 *   npm run sync:brand    copy the brand kit's theme in, reporting the result
 *   npm run check:brand   exit non-zero if the vendored copy has drifted
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = path.resolve(root, '../brand/themes/tailwind/phew-blue.theme.css')
const DEST = path.resolve(root, 'src/styles/brand/phew-blue.theme.css')
const checkOnly = process.argv.includes('--check')

if (!fs.existsSync(SOURCE)) {
  console.error(`✗ brand kit not found at ${SOURCE}`)
  console.error('  Clone it alongside this repo: git clone git@github.com:phew-blue/brand.git ../brand')
  process.exit(1)
}

const source = fs.readFileSync(SOURCE, 'utf8')
const current = fs.existsSync(DEST) ? fs.readFileSync(DEST, 'utf8') : null

if (current === source) {
  console.log('✓ vendored brand theme is up to date')
  process.exit(0)
}

if (checkOnly) {
  console.error('✗ vendored brand theme has drifted from ../brand')
  console.error(`  ${DEST}`)
  console.error('  Run `npm run sync:brand` and commit the result.')
  process.exit(1)
}

fs.mkdirSync(path.dirname(DEST), { recursive: true })
fs.writeFileSync(DEST, source)
console.log(current === null ? '✓ vendored brand theme (new file)' : '✓ updated vendored brand theme')
