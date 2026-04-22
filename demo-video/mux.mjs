/**
 * mux.mjs
 *
 * Combines WebM clips + narration + music into the final MP4.
 *
 * Pipeline:
 *   1. Probe each WebM for its actual duration.
 *   2. Build per-beat narration tracks padded to video length with lead-in +
 *      trailing silence.
 *   3. Concatenate WebMs, re-encoding to H.264 with a `drawtext` overlay
 *      per beat showing the section heading (e.g. "Featured Listings").
 *   4. If assets/music.mp3 exists, loop/trim it to total length and mix it
 *      under narration at -20 dB. Otherwise synthesize a soft ambient pad.
 *   5. Final mux → out/final.mp4.
 */

import { promises as fs } from 'node:fs'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'
import ffmpegStatic from 'ffmpeg-static'
import ffprobeStatic from 'ffprobe-static'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, 'out')
const rawDir = path.join(outDir, 'raw')
const audioDir = path.join(outDir, 'audio')
const tmpDir = path.join(outDir, 'tmp')
const assetsDir = path.join(__dirname, 'assets')

import { readdirSync } from 'node:fs'

function findMusicFile() {
  const preferred = path.join(assetsDir, 'music.mp3')
  if (existsSync(preferred)) return preferred
  try {
    const mp3 = readdirSync(assetsDir).find((f) => f.endsWith('.mp3'))
    return mp3 ? path.join(assetsDir, mp3) : preferred
  } catch {
    return preferred
  }
}
const USER_MUSIC_PATH = findMusicFile()
const FONT_FILE = 'C\\:/Windows/Fonts/georgiab.ttf' // escaped for ffmpeg filter

const LEAD_IN_SEC = 0.6
const MUSIC_GAIN_DB = -5
const AMBIENT_GAIN_DB = -24
const HEADING_SHOW_START = 1.0 // seconds into each beat when title appears
const HEADING_SHOW_DURATION = 4.0 // how long the heading stays on screen

const ffmpeg = (args, opts = {}) =>
  execa(ffmpegStatic, ['-hide_banner', '-loglevel', 'error', '-y', ...args], opts)

async function probe(filePath) {
  const { stdout } = await execa(ffprobeStatic.path, [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    filePath,
  ])
  return parseFloat(stdout.trim())
}

function escapeForDrawtext(text) {
  // drawtext needs colons, apostrophes, backslashes, and commas escaped.
  return text
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
    .replace(/,/g, '\\,')
}

async function main() {
  await fs.mkdir(tmpDir, { recursive: true })

  const videoManifest = JSON.parse(
    await fs.readFile(path.join(rawDir, 'video_manifest.json'), 'utf8'),
  )
  const audioManifest = JSON.parse(
    await fs.readFile(path.join(audioDir, 'manifest.json'), 'utf8'),
  )
  const audioByStep = Object.fromEntries(
    audioManifest.lines.map((l) => [l.step, l]),
  )

  // ── 1. Probe clips + audio at runtime so friend's voiceover swap syncs.
  console.log('[mux] probing clips + audio ...')
  const beats = []
  for (const b of videoManifest.beats.filter((x) => !x.isTransition)) {
    const clip = path.join(__dirname, b.file)
    const dur = await probe(clip)
    const audio = audioByStep[b.id]
    const audioPath = audio ? path.join(__dirname, audio.file) : null
    const audioDur = audioPath && existsSync(audioPath) ? await probe(audioPath) : 0
    beats.push({
      id: b.id,
      videoPath: clip,
      videoDur: dur,
      audioPath,
      audioDur,
      heading: audio?.heading ?? '',
    })
    console.log(`[mux]   ${b.id}: video ${dur.toFixed(2)}s, audio ${audioDur.toFixed(2)}s, "${audio?.heading ?? ''}"`)
  }

  // ── 2. Per-beat narration tracks padded to video length ────────────────
  console.log('[mux] building per-beat narration ...')
  const paddedAudios = []
  for (const b of beats) {
    const out = path.join(tmpDir, `${b.id}.m4a`)
    const tailSilence = Math.max(0, b.videoDur - LEAD_IN_SEC - b.audioDur)
    if (b.audioPath) {
      const filter = [
        `aevalsrc=0:d=${LEAD_IN_SEC}:s=44100[lead]`,
        `aevalsrc=0:d=${tailSilence.toFixed(3)}:s=44100[tail]`,
        `[lead][1:a][tail]concat=n=3:v=0:a=1[out]`,
      ].join(';')
      await ffmpeg([
        '-f', 'lavfi', '-i', 'anullsrc=cl=mono:r=44100',
        '-i', b.audioPath,
        '-filter_complex', filter,
        '-map', '[out]',
        '-ar', '44100', '-ac', '2',
        '-c:a', 'aac', '-b:a', '192k',
        out,
      ])
    } else {
      await ffmpeg([
        '-f', 'lavfi', '-i', 'anullsrc=cl=stereo:r=44100',
        '-t', `${b.videoDur.toFixed(3)}`,
        '-c:a', 'aac', '-b:a', '192k',
        out,
      ])
    }
    paddedAudios.push(out)
  }

  // ── 3. Per-beat video with heading overlay ─────────────────────────────
  console.log('[mux] burning-in section headings ...')
  const headedClips = []
  for (const b of beats) {
    const out = path.join(tmpDir, `${b.id}.mp4`)
    const filters = []
    if (b.heading && b.heading.trim()) {
      const text = escapeForDrawtext(b.heading)
      const start = HEADING_SHOW_START
      const end = HEADING_SHOW_START + HEADING_SHOW_DURATION
      const fade = 0.4

      const drawText =
        `drawtext=fontfile='${FONT_FILE}'` +
        `:text='${text}'` +
        `:fontcolor=white` +
        `:fontsize=46` +
        `:box=1` +
        `:boxcolor=0x0C1926@0.88` +
        `:boxborderw=28` +
        `:x=95:y=h-180` +
        `:alpha='if(lt(t\\,${start})\\,0\\,if(lt(t\\,${start + fade})\\,(t-${start})/${fade}\\,if(lt(t\\,${end - fade})\\,1\\,if(lt(t\\,${end})\\,(${end}-t)/${fade}\\,0))))'` +
        `:enable='between(t\\,${start}\\,${end})'`
      filters.push(drawText)
    }
    const vf = filters.length ? ['-vf', filters.join(',')] : []
    await ffmpeg([
      '-i', b.videoPath,
      ...vf,
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
      '-r', '30',
      '-pix_fmt', 'yuv420p',
      '-an',
      out,
    ])
    headedClips.push(out)
  }

  // ── 3b. Soften each clip's edges with fade-in/out, then concat ───────
  console.log('[mux] softening clip edges + concatenating ...')
  const FADE_DUR = 0.25
  const softenedClips = []
  for (let i = 0; i < headedClips.length; i++) {
    const src = headedClips[i]
    const out = path.join(tmpDir, `soft_${i}.mp4`)
    const dur = beats[i].videoDur
    const fadeOutStart = Math.max(0, dur - FADE_DUR)
    const filters = []
    if (i > 0) filters.push(`fade=t=in:st=0:d=${FADE_DUR}`)
    if (i < headedClips.length - 1) filters.push(`fade=t=out:st=${fadeOutStart.toFixed(3)}:d=${FADE_DUR}`)
    await ffmpeg([
      '-i', src,
      ...(filters.length ? ['-vf', filters.join(',')] : []),
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
      '-r', '30',
      '-pix_fmt', 'yuv420p',
      '-an',
      out,
    ])
    softenedClips.push(out)
  }
  const concatListPath = path.join(tmpDir, 'video_concat.txt')
  await fs.writeFile(
    concatListPath,
    softenedClips.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n'),
  )
  const concatVideo = path.join(tmpDir, 'video.mp4')
  await ffmpeg([
    '-f', 'concat', '-safe', '0', '-i', concatListPath,
    '-c:v', 'copy',
    '-movflags', '+faststart',
    '-an',
    concatVideo,
  ])

  // ── 3c. Concatenate per-beat narration + loudness-normalize ─────────
  // loudnorm lifts quiet recordings and tames loud ones to a consistent
  // broadcast-grade level so the mix is predictable regardless of how
  // the narrator set their input gain.
  console.log('[mux] concatenating + loudness-normalizing narration ...')
  const audioConcatList = path.join(tmpDir, 'audio_concat.txt')
  await fs.writeFile(
    audioConcatList,
    paddedAudios.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n'),
  )
  const narrationFull = path.join(tmpDir, 'narration.m4a')
  await ffmpeg([
    '-f', 'concat', '-safe', '0', '-i', audioConcatList,
    '-af', 'loudnorm=I=-11:TP=-1.0:LRA=9',
    '-c:a', 'aac', '-b:a', '192k',
    '-ar', '44100',
    narrationFull,
  ])

  // ── 4. Music bed: user-provided if available, else synthesized ─────────
  const totalDur = beats.reduce((s, b) => s + b.videoDur, 0)
  const bed = path.join(tmpDir, 'bed.m4a')
  let bedGainDb

  if (existsSync(USER_MUSIC_PATH)) {
    console.log(`[mux] using user music: ${path.relative(__dirname, USER_MUSIC_PATH)}`)
    bedGainDb = MUSIC_GAIN_DB
    await ffmpeg([
      '-stream_loop', '-1', '-i', USER_MUSIC_PATH,
      '-t', `${totalDur.toFixed(3)}`,
      '-filter_complex',
      `[0:a]afade=t=in:st=0:d=2,afade=t=out:st=${(totalDur - 2).toFixed(3)}:d=2,aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[out]`,
      '-map', '[out]',
      '-c:a', 'aac', '-b:a', '192k',
      bed,
    ])
  } else {
    console.log('[mux] no user music found — synthesizing ambient pad')
    bedGainDb = AMBIENT_GAIN_DB
    const filter =
      '[0]lowpass=f=800,volume=0.35[s1];' +
      '[1]lowpass=f=700,volume=0.25[s2];' +
      '[2]lowpass=f=400,highpass=f=80,volume=0.05[n];' +
      '[s1][s2][n]amix=inputs=3:normalize=0,' +
      `afade=t=in:st=0:d=2,afade=t=out:st=${(totalDur - 2).toFixed(3)}:d=2,` +
      'aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo'
    await ffmpeg([
      '-f', 'lavfi', '-t', `${totalDur.toFixed(3)}`, '-i', 'sine=frequency=220:sample_rate=44100',
      '-f', 'lavfi', '-t', `${totalDur.toFixed(3)}`, '-i', 'sine=frequency=330:sample_rate=44100',
      '-f', 'lavfi', '-t', `${totalDur.toFixed(3)}`, '-i', 'anoisesrc=color=pink:amplitude=0.6:seed=42',
      '-filter_complex', filter,
      '-c:a', 'aac', '-b:a', '192k',
      bed,
    ])
  }

  // ── 4b. Layer transition SFX between beats if available ──────────────
  const sfxFile = audioManifest.transitionSfx
    ? path.join(__dirname, audioManifest.transitionSfx)
    : null
  const hasSfx = sfxFile && existsSync(sfxFile)
  if (hasSfx) {
    console.log('[mux] layering transition SFX between beats ...')
    const sfxDur = await probe(sfxFile)
    // Build an overlay: place the SFX at each beat boundary offset
    let offset = 0
    const sfxInputs = []
    const sfxFilters = []
    for (let i = 0; i < beats.length - 1; i++) {
      offset += beats[i].videoDur
      const triggerAt = Math.max(0, offset - 0.3)
      const idx = i + 1
      sfxInputs.push('-i', sfxFile)
      sfxFilters.push(
        `[${idx}:a]volume=-18dB,adelay=${Math.round(triggerAt * 1000)}|${Math.round(triggerAt * 1000)}[sfx${i}]`,
      )
    }
    if (sfxFilters.length > 0) {
      const mixInputs = sfxFilters.map((_, i) => `[sfx${i}]`).join('')
      const mixedWithSfx = path.join(tmpDir, 'narration_sfx.m4a')
      await ffmpeg([
        '-i', narrationFull,
        ...sfxInputs,
        '-filter_complex',
        sfxFilters.join(';') + ';' +
          `[0:a]${mixInputs}amix=inputs=${sfxFilters.length + 1}:duration=first:dropout_transition=0:normalize=0[out]`,
        '-map', '[out]',
        '-c:a', 'aac', '-b:a', '192k',
        mixedWithSfx,
      ])
      await fs.rename(mixedWithSfx, narrationFull)
    }
  }

  // ── 5. Mix narration + bed ─────────────────────────────────────────────
  console.log(`[mux] mixing narration + bed at ${bedGainDb} dB ...`)
  const mixedAudio = path.join(tmpDir, 'mixed.m4a')
  await ffmpeg([
    '-i', narrationFull,
    '-i', bed,
    '-filter_complex',
    `[1:a]volume=${bedGainDb}dB[bed];` +
      '[0:a][bed]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0[out]',
    '-map', '[out]',
    '-c:a', 'aac', '-b:a', '192k',
    mixedAudio,
  ])

  // ── 6. Final mux ───────────────────────────────────────────────────────
  console.log('[mux] producing video-tutorial-ybp.mp4 ...')
  const finalOut = path.join(outDir, 'video-tutorial-ybp.mp4')
  await ffmpeg([
    '-i', concatVideo,
    '-i', mixedAudio,
    '-c:v', 'copy',
    '-c:a', 'aac', '-b:a', '192k',
    '-shortest',
    '-movflags', '+faststart',
    finalOut,
  ])

  const finalDur = await probe(finalOut)
  const stat = await fs.stat(finalOut)
  console.log(`\n[mux] SUCCESS — ${path.relative(process.cwd(), finalOut)}`)
  console.log(`[mux] duration: ${finalDur.toFixed(2)}s, size: ${(stat.size / 1e6).toFixed(2)} MB`)
}

main().catch((err) => {
  console.error('[mux] FAILED:', err?.stderr || err?.message || err)
  process.exit(1)
})
