/**
 * narrate.mjs
 *
 * Two providers in one file, chosen via `TTS_PROVIDER`:
 *   - "elevenlabs" (default when ELEVENLABS_API_KEY is present)
 *   - "edge"       (Microsoft Edge Neural TTS fallback via edge-tts CLI)
 *
 * Both write MP3s to out/audio/<id>.mp3 and produce out/audio/manifest.json
 * so record.mjs + mux.mjs can time against real audio durations.
 *
 * ElevenLabs setup: drop your key in demo-video/.env as:
 *     ELEVENLABS_API_KEY=sk_xxx
 *     ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM   # optional (Rachel default)
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'
import ffprobeStatic from 'ffprobe-static'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const scriptPath = path.join(__dirname, 'script.json')
const audioDir = path.join(__dirname, 'out', 'audio')
const manifestPath = path.join(audioDir, 'manifest.json')
const envPath = path.join(__dirname, '.env')

// ── Minimal .env loader (no dep) ────────────────────────────────────────────
async function loadDotEnv() {
  try {
    const text = await fs.readFile(envPath, 'utf8')
    for (const line of text.split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/.exec(line)
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
      }
    }
  } catch {
    /* no .env file — fine */
  }
}

async function probeDuration(filePath) {
  const { stdout } = await execa(ffprobeStatic.path, [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    filePath,
  ])
  return parseFloat(stdout.trim())
}

// ── ElevenLabs ──────────────────────────────────────────────────────────────
// Rachel is "21m00Tcm4TlvDq8ikWAM" — the default warm-female voice.
const ELEVEN_DEFAULT_VOICE = '21m00Tcm4TlvDq8ikWAM'

async function ttsElevenLabs({ text, out, voiceId, apiKey }) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`
  const body = {
    text,
    model_id: 'eleven_turbo_v2_5',
    voice_settings: {
      stability: 0.40,
      similarity_boost: 0.80,
      style: 0.25,
      use_speaker_boost: true,
    },
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`ElevenLabs HTTP ${res.status}: ${err.slice(0, 200)}`)
  }
  const buffer = Buffer.from(await res.arrayBuffer())
  await fs.writeFile(out, buffer)
}

// ── Edge TTS fallback ───────────────────────────────────────────────────────
async function ttsEdge({ text, out, voice, rate, pitch }) {
  await execa('python', [
    '-m', 'edge_tts',
    '--voice', voice,
    `--rate=${rate ?? '+0%'}`,
    `--pitch=${pitch ?? '+0Hz'}`,
    '--text', text,
    '--write-media', out,
  ], { stdio: 'inherit' })
}

async function main() {
  await loadDotEnv()

  const script = JSON.parse(await fs.readFile(scriptPath, 'utf8'))
  await fs.mkdir(audioDir, { recursive: true })

  const provider =
    (process.env.TTS_PROVIDER ||
      (process.env.ELEVENLABS_API_KEY ? 'elevenlabs' : 'edge')).toLowerCase()

  console.log(`[narrate] provider: ${provider}`)

  const manifest = { provider, lines: [] }
  if (provider === 'elevenlabs') {
    manifest.voiceId = process.env.ELEVENLABS_VOICE_ID || ELEVEN_DEFAULT_VOICE
  } else {
    manifest.voice = script.voice
  }

  for (const line of script.lines) {
    const out = path.join(audioDir, `${line.id}.mp3`)
    console.log(`[narrate] ${line.id} ... "${line.text.slice(0, 60)}..."`)

    if (provider === 'elevenlabs') {
      if (!process.env.ELEVENLABS_API_KEY) {
        throw new Error('ELEVENLABS_API_KEY not set (put it in demo-video/.env)')
      }
      await ttsElevenLabs({
        text: line.text,
        out,
        voiceId: manifest.voiceId,
        apiKey: process.env.ELEVENLABS_API_KEY,
      })
    } else {
      await ttsEdge({
        text: line.text,
        out,
        voice: script.voice,
        rate: script.rate,
        pitch: script.pitch,
      })
    }

    const duration = await probeDuration(out)
    manifest.lines.push({
      id: line.id,
      step: line.step,
      text: line.text,
      heading: line.heading ?? null,
      file: path.relative(__dirname, out).replace(/\\/g, '/'),
      durationSec: duration,
    })
    console.log(`[narrate]   duration: ${duration.toFixed(2)}s`)
  }

  // Generate a subtle transition SFX via ElevenLabs Sound Generation (free tier)
  const sfxPath = path.join(audioDir, 'transition.mp3')
  if (provider === 'elevenlabs') {
    console.log('[narrate] generating transition SFX ...')
    try {
      const sfxRes = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: 'gentle soft digital whoosh transition, subtle and clean',
          duration_seconds: 1.2,
        }),
      })
      if (sfxRes.ok) {
        const buf = Buffer.from(await sfxRes.arrayBuffer())
        await fs.writeFile(sfxPath, buf)
        manifest.transitionSfx = path.relative(__dirname, sfxPath).replace(/\\/g, '/')
        console.log('[narrate] transition SFX saved')
      } else {
        console.log('[narrate] SFX generation skipped (non-200 response)')
      }
    } catch {
      console.log('[narrate] SFX generation skipped (network error)')
    }
  }

  const totalSec = manifest.lines.reduce((s, l) => s + l.durationSec, 0)
  manifest.totalDurationSec = totalSec

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))
  console.log(`\n[narrate] wrote ${manifest.lines.length} lines, total ${totalSec.toFixed(1)}s`)
}

main().catch((err) => {
  console.error('[narrate] FAILED:', err.message)
  process.exit(1)
})
