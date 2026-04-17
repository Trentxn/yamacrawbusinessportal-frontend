# Demo Video Pipeline

Generates a narrated ~3:40 MP4 walkthrough of the Yamacraw Business Portal, pointed at the live production site.

## Output

`out/final.mp4` — H.264 + AAC, 1920x1080.

## One-time setup

```bash
# Inside this folder
npm install
npx playwright install chromium
pip install edge-tts
```

Background music (`assets/music.mp3`) is already checked in — no extra download needed.

## Build the video

```bash
npm run build-video
```

This runs three stages in order:

1. `npm run narrate` — calls Microsoft Edge Neural TTS (Aria voice) once per script line, writes MP3s and computed durations under `out/audio/`.
2. `npm run record` — drives Playwright through the 8-step storyboard, timing each beat from the durations produced in step 1. Saves one WebM per page under `out/raw/`.
3. `npm run mux` — concatenates the WebMs, mixes narration over background music at -18 dB, encodes the final `out/final.mp4`.

Rerunning just one stage is fine. If you tweak `script.json`, rerun `narrate` + `record` + `mux`. If you only tweak storyboard pacing, rerun `record` + `mux`.

## Narration script

See `script.json`. Edit the `text` fields to tweak wording; the pipeline will regenerate voice and re-time automatically.
