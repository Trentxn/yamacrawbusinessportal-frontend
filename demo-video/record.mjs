/**
 * record.mjs
 *
 * Drives Playwright through the 8-step storyboard, with each beat's on-screen
 * time set to `narrationDurationSec + postPaddingSec` so the video always
 * outlasts its narration line. Writes one WebM per beat under out/raw/ and
 * a manifest to out/raw/video_manifest.json.
 *
 * Uses a fresh BrowserContext per beat so each WebM is a clean clip we can
 * concatenate deterministically later.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rawDir = path.join(__dirname, 'out', 'raw')
const audioManifestPath = path.join(__dirname, 'out', 'audio', 'manifest.json')

const BASE_URL = 'https://yamacrawbusinessportal.com'
const VIEWPORT = { width: 1920, height: 1080 }

// Per-step padding added AFTER narration finishes, so the clip breathes and
// the viewer gets a beat to absorb what they just heard. Tuned so total runtime
// sits near 3:40.
const PADDING_SEC = {
  hero: 3,
  featured: 4,
  categories: 3,
  directory: 4,
  detail: 6,
  dashboard: 4,
  create: 4,
  inquiries: 3,
}

const DEMO_EMAIL = 'demo@yamacrawbusinessportal.com'
const DEMO_PASSWORD = 'Demo@YBP2026!'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function smoothScrollTo(page, selector, { duration = 1500 } = {}) {
  await page.evaluate(
    ([sel, dur]) => new Promise((resolve) => {
      const el = document.querySelector(sel)
      if (!el) return resolve()
      const start = window.scrollY
      const target = el.getBoundingClientRect().top + window.scrollY - 80
      const delta = target - start
      const t0 = performance.now()
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur)
        const ease = 0.5 - Math.cos(p * Math.PI) / 2
        window.scrollTo(0, start + delta * ease)
        if (p < 1) requestAnimationFrame(step)
        else resolve()
      }
      requestAnimationFrame(step)
    }),
    [selector, duration],
  )
}

async function slowScrollDown(page, totalPx, { duration = 4000 } = {}) {
  await page.evaluate(
    ([px, dur]) => new Promise((resolve) => {
      const start = window.scrollY
      const t0 = performance.now()
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur)
        const ease = 0.5 - Math.cos(p * Math.PI) / 2
        window.scrollTo(0, start + px * ease)
        if (p < 1) requestAnimationFrame(step)
        else resolve()
      }
      requestAnimationFrame(step)
    }),
    [totalPx, duration],
  )
}

async function recordBeat({ id, durationMs, storageState }, run) {
  const beatDir = path.join(rawDir, id)
  await fs.mkdir(beatDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: VIEWPORT,
    storageState,
    recordVideo: { dir: beatDir, size: VIEWPORT },
  })
  const page = await context.newPage()

  const start = Date.now()
  try {
    await run(page)
  } catch (err) {
    console.error(`[record] ${id} action failed:`, err.message)
  }
  const elapsed = Date.now() - start
  const remaining = Math.max(500, durationMs - elapsed)
  await sleep(remaining)

  const capturedStorage = await context.storageState()
  await page.close()
  await context.close()
  await browser.close()

  const files = await fs.readdir(beatDir)
  const webm = files.find((f) => f.endsWith('.webm'))
  if (!webm) throw new Error(`[record] no WebM produced for ${id}`)
  const finalPath = path.join(beatDir, 'clip.webm')
  await fs.rename(path.join(beatDir, webm), finalPath)

  return { id, file: finalPath, storageState: capturedStorage }
}

async function main() {
  const audioManifest = JSON.parse(await fs.readFile(audioManifestPath, 'utf8'))
  const byStep = Object.fromEntries(audioManifest.lines.map((l) => [l.step, l]))

  await fs.rm(rawDir, { recursive: true, force: true })
  await fs.mkdir(rawDir, { recursive: true })

  const manifest = { viewport: VIEWPORT, beats: [] }
  let storageState

  // Helper to compute each beat's duration: narration + padding
  const beatDuration = (step) => {
    const audio = byStep[step]?.durationSec ?? 15
    const pad = PADDING_SEC[step] ?? 3
    return Math.round((audio + pad) * 1000)
  }

  // 1 — hero
  console.log('[record] beat 1/8: hero')
  let result = await recordBeat(
    { id: 'hero', durationMs: beatDuration('hero') },
    async (page) => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
      await sleep(2000)
    },
  )
  manifest.beats.push(result)

  // 2 — featured businesses carousel
  console.log('[record] beat 2/8: featured')
  result = await recordBeat(
    { id: 'featured', durationMs: beatDuration('featured') },
    async (page) => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
      await sleep(800)
      // Scroll to Featured Businesses section via heading text
      await page.evaluate(() => {
        const h = [...document.querySelectorAll('h2')].find((el) =>
          el.textContent?.toLowerCase().includes('featured businesses'),
        )
        h?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
      await sleep(3000)
      // Gentle additional scroll to reveal contractor row
      await slowScrollDown(page, 400, { duration: 3000 })
    },
  )
  manifest.beats.push(result)

  // 3 — browse by category grid
  console.log('[record] beat 3/8: categories')
  result = await recordBeat(
    { id: 'categories', durationMs: beatDuration('categories') },
    async (page) => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
      await sleep(500)
      await page.evaluate(() => {
        const h = [...document.querySelectorAll('h2')].find((el) =>
          el.textContent?.toLowerCase().includes('browse by category'),
        )
        h?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
      await sleep(3500)
      await slowScrollDown(page, 300, { duration: 3000 })
    },
  )
  manifest.beats.push(result)

  // 4 — directory filtering
  console.log('[record] beat 4/8: directory')
  result = await recordBeat(
    { id: 'directory', durationMs: beatDuration('directory') },
    async (page) => {
      await page.goto(`${BASE_URL}/directory`, { waitUntil: 'domcontentloaded' })
      await sleep(2500)
      // Gentle scroll through results
      await slowScrollDown(page, 500, { duration: 4000 })
      await sleep(500)
      // Scroll back up to show filters
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
      await sleep(2000)
    },
  )
  manifest.beats.push(result)

  // 5 — business detail
  console.log('[record] beat 5/8: detail')
  result = await recordBeat(
    { id: 'detail', durationMs: beatDuration('detail') },
    async (page) => {
      await page.goto(`${BASE_URL}/business/conch-shack-yamacraw-demo`, {
        waitUntil: 'domcontentloaded',
      })
      await sleep(2500)
      // Scroll slowly through the page
      await slowScrollDown(page, 900, { duration: 6000 })
      await sleep(1000)
      await slowScrollDown(page, 700, { duration: 5000 })
    },
  )
  manifest.beats.push(result)

  // 6 — login + dashboard
  console.log('[record] beat 6/8: dashboard (with login)')
  result = await recordBeat(
    { id: 'dashboard', durationMs: beatDuration('dashboard') },
    async (page) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
      await sleep(800)
      await page.fill('#email', DEMO_EMAIL)
      await sleep(400)
      await page.fill('#password', DEMO_PASSWORD)
      await sleep(400)
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/dashboard/, { timeout: 15000 }).catch(() => {})
      await sleep(3000)
      // Gentle scroll through the overview
      await slowScrollDown(page, 500, { duration: 4000 })
    },
  )
  storageState = result.storageState
  manifest.beats.push(result)

  // 7 — create listing form
  console.log('[record] beat 7/8: create listing')
  result = await recordBeat(
    { id: 'create', durationMs: beatDuration('create'), storageState },
    async (page) => {
      await page.goto(`${BASE_URL}/dashboard/listings/new`, { waitUntil: 'domcontentloaded' })
      await sleep(2500)
      await slowScrollDown(page, 700, { duration: 6000 })
      await sleep(500)
      await slowScrollDown(page, 500, { duration: 4000 })
    },
  )
  manifest.beats.push(result)

  // 8 — inquiries + outro
  console.log('[record] beat 8/8: inquiries + outro')
  result = await recordBeat(
    { id: 'inquiries', durationMs: beatDuration('inquiries'), storageState },
    async (page) => {
      await page.goto(`${BASE_URL}/dashboard/inquiries`, { waitUntil: 'domcontentloaded' })
      await sleep(3000)
      await slowScrollDown(page, 400, { duration: 3500 })
      await sleep(1500)
      // Outro: go back to homepage for the closing line
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
      await sleep(2500)
    },
  )
  manifest.beats.push(result)

  // Persist manifest (stripping bulky storageState fields)
  const thin = {
    viewport: manifest.viewport,
    beats: manifest.beats.map(({ id, file }) => ({
      id,
      file: path.relative(__dirname, file).replace(/\\/g, '/'),
    })),
  }
  await fs.writeFile(
    path.join(rawDir, 'video_manifest.json'),
    JSON.stringify(thin, null, 2),
  )

  console.log(`\n[record] wrote ${manifest.beats.length} clips under out/raw/`)
}

main().catch((err) => {
  console.error('[record] FAILED:', err)
  process.exit(1)
})
