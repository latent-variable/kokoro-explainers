# Sources: how-it-works

The video explains this repository, so the source of record is the repository itself at the
commit the video is built from, plus the two tools it runs.

- Kokoro-82M: https://huggingface.co/hexgrad/Kokoro-82M (82 million parameters, Apache 2.0)
- HyperFrames: https://hyperframes.heygen.com (HTML compositions rendered to video)

## Claims

| Claim | Source |
|---|---|
| The video is made from five short text files and one HTML page | `script/` holds five `.txt` files; `scenes.html` is the page. `video.json` is a sixth, configuration file, not counted as "text files" in the narration |
| Kokoro is a small, open text-to-speech model (82 million parameters, Apache 2.0 weights) | Kokoro-82M model card |
| It is small enough to run on a laptop's processor | `hyperframes tts` runs kokoro-onnx on onnxruntime's CPU provider; the model is about 340 MB (`~/.cache/hyperframes/tts`). Measured: 16 sentences in 8.6 s on an M-series MacBook |
| Each sentence of the script is voiced on its own | `bin/voice.mjs`: one `hyperframes tts` call per sentence from `sentences()` in `bin/lib.mjs` |
| So we know exactly when every sentence starts, without speech recognition | `bin/voice.mjs` places each take on the track at a time it chooses and records it in `timing.json`; no transcription step exists |
| Each scene is a section of HTML, drawn by HyperFrames | `scenes.html` `<section data-scene>`; `bin/build.mjs` writes the HyperFrames composition |
| Tag a picture with a word and it appears as the voice reaches that word | `data-cue` in `bin/build.mjs` (`cueTime`) and `kit/kit.js`. The time inside a sentence is estimated from the share of letters before the word |
| One command voices, builds, and records frame by frame into an MP4 | `npm run make` runs `bin/make.mjs`: voice, build, lint, render (`hyperframes render`, frame by frame in headless Chrome) |
| Change a sentence and only that sentence is voiced again (an edit; an insertion renumbers later takes) | `bin/voice.mjs` keeps a take whose text, voice and speed are unchanged (`.key` files). Inserting a sentence renumbers the takes after it, which re-voices those too |
| Everything runs on your own machine | No network call in the pipeline once the model is downloaded; the first `doctor` run downloads it |
| The project is open source, on GitHub | `LICENSE` (MIT); public at github.com/latent-variable/kokoro-explainers |
| To make your own, clone it and follow the setup in its README | `README.md`, *Set it up*: `npm install`, the Python venv with `requirements.txt`, `npm run doctor` |
| Then run npm run new with a folder name | `npm run new -- videos/<name>` copies `template/` (`bin/new.mjs`) |
| Write one text file per scene and a section for each in scenes.html, then run npm run make on it | `npm run make -- videos/<name>` (`bin/make.mjs`); `README.md`, *Make your own*: `script/01-intro.txt`, one per scene |

## Left out

- The pronunciation fixes (`say`), the doctor, and the critic loop: each is a detail of
  using the repo, not of how a video gets made.
