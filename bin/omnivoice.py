"""Voice sentences with OmniVoice on Apple's MLX (mlx-audio), in one process, no app.

  .venv/bin/python bin/omnivoice.py jobs.json

jobs.json, written by bin/voice.mjs:
  {"speed": 1.25, "voice": {"name": "caro_davy"} | {"name": "lino", "wav": "...", "text": "..."},
   "cache": "<dir for the trimmed reference>", "jobs": [{"text": "...", "wav": "...", "seed": 1}]}

OmniVoice clones every voice from a short recording, so a voice here is a recording: a clone is
a clip in local/voices/, a built-in one a clip from kyutai/tts-voices (bin/omnivoice-voices.json).
OmniVoice wants a 3 to 10 s reference: silence at the clip's edges is trimmed first, then a clip
still too long is cut at its last pause before 10 s. Each take is one sentence, so nothing is
chunked.

Speed is applied after generation, never by squeezing it. OmniVoice fills the duration it is
given, and a window cut to 1.3x its natural length dropped or garbled words in 7 of 24 sentences
(measured 2026-10-17 with Whisper); generating at the natural length and then time-stretching
the take (ffmpeg atempo, pitch kept) dropped none. The padding's silence at a take's edges is
trimmed. A take that comes out silent, which a short line can, is voiced again with another seed.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

SPEC = json.loads((Path(__file__).parent / "omnivoice-voices.json").read_text())
# 16 steps is twice as fast and dropped and repeated words on a long line (measured in a
# bake-off against Pocket and Qwen3-TTS); 32 does not.
STEPS = 32
SR = 24000
REF_SECONDS = 10.0
SILENT_DB = -45.0   # a take whose loudest moment is below this is silence, not speech
EDGES = (0.06, 0.12)   # seconds of quiet kept before and after the words
TRIES = 3


def probe_seconds(clip):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(clip)],
                         check=True, capture_output=True, text=True).stdout
    return float(out)


def silences(clip):
    """[(start, end)] of each pause in a clip."""
    probe = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(clip), "-af", "silencedetect=noise=-35dB:d=0.2",
                            "-f", "null", "-"], capture_output=True, text=True).stderr
    starts = [float(t) for t in re.findall(r"silence_start: ([0-9.]+)", probe)]
    ends = [float(t) for t in re.findall(r"silence_end: ([0-9.]+)", probe)]
    merged = []
    for s, e in zip(starts, ends + [probe_seconds(clip)] * (len(starts) - len(ends))):
        if merged and s - merged[-1][1] < 0.05:   # a click between two silences is still silence
            merged[-1] = (merged[-1][0], e)
        else:
            merged.append((s, e))
    return merged


def reference(voice, cache):
    """(path of the reference clip, its transcript or None) for a voice."""
    if voice.get("wav"):
        clip, text = Path(voice["wav"]), voice.get("text")
    else:
        from huggingface_hub import hf_hub_download
        entry = SPEC["builtIn"][voice["name"]]
        entry = entry if isinstance(entry, dict) else {"file": entry}
        clip = Path(hf_hub_download(SPEC["voicesRepo"], entry["file"], revision=SPEC["voicesRevision"]))
        text = entry.get("text")
    seconds = probe_seconds(clip)
    if seconds <= REF_SECONDS:
        return clip, text
    # Trim silence at the edges first: it holds no words, so a transcript stays true.
    pauses = silences(clip)
    start = next((e for s, e in pauses if s <= 0.05), 0.0)
    end = next((s for s, e in reversed(pauses) if e >= seconds - 0.05), seconds)
    start, end = max(0.0, start - 0.15), min(seconds, end + 0.15)
    if end - start > REF_SECONDS:
        if text:
            raise SystemExit(f"{clip} has {end - start:.1f} s of speech and a transcript beside it, which cannot be cut "
                             f"to fit: OmniVoice wants a 3 to 10 s reference. Trim the clip and its .txt, or delete the .txt.")
        inner = [s for s, e in pauses if start + 3.0 <= s <= start + REF_SECONDS]
        end = max(inner, default=start + REF_SECONDS) + 0.15
        if not inner:
            print(f"warning: {clip} has no pause to cut at before 10 s, so its reference ends mid-word", file=sys.stderr)
    Path(cache).mkdir(parents=True, exist_ok=True)
    out = Path(cache) / f"{voice['name']}-reference.wav"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(clip), "-ss", f"{start:.2f}", "-to", f"{end:.2f}",
                    "-ar", str(SR), "-ac", "1", str(out)], check=True)
    return out, text


def seconds_for(estimator, text):
    """How long a sentence should run: mlx-audio's own sizing of it (a fixed sentence's pace,
    padded 15%), exactly what it does unasked. Never shorter: see the docstring above."""
    frames = max(10, int(estimator.estimate_duration(text, "Nice to meet you.", 25) * 1.15))
    return frames * 960 / SR


def trim(audio):
    """The take without the silence the 15% padding leaves at its edges: it played as dead air
    between sentences, 13.8 s of a 67 s video (measured 2026-10-17). The pauses voice.mjs puts
    between sentences are the designed ones."""
    win = int(SR * 0.01)
    frames = audio[: len(audio) // win * win].reshape(-1, win)
    rms = 20 * np.log10(np.sqrt((frames ** 2).mean(axis=1)) + 1e-9)
    loud = np.nonzero(rms > SILENT_DB)[0]
    if not len(loud):
        return audio
    start = max(0, loud[0] * win - int(EDGES[0] * SR))
    end = min(len(audio), (loud[-1] + 1) * win + int(EDGES[1] * SR))
    return audio[start:end]


def stretch(audio, speed):
    """The take played at `speed`, its pitch kept (ffmpeg atempo)."""
    if abs(speed - 1.0) < 1e-6:
        return audio
    r = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "pipe:0",
                        "-af", f"atempo={speed}", "-f", "f32le", "pipe:1"], input=audio.tobytes(), capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32)


def main(spec_path):
    import mlx.core as mx
    from huggingface_hub import snapshot_download
    from mlx_audio.tts.models.omnivoice.duration import RuleDurationEstimator
    from mlx_audio.tts.models.omnivoice.utils import create_voice_clone_prompt
    from mlx_audio.tts.utils import load_model

    spec = json.loads(Path(spec_path).read_text())
    clip, ref_text = reference(spec["voice"], spec["cache"])
    model = load_model(snapshot_download(SPEC["model"], revision=SPEC["revision"]))
    tokens = create_voice_clone_prompt(str(clip), tokenizer=model.audio_tokenizer, max_duration_s=REF_SECONDS)
    mx.eval(tokens)
    estimator = RuleDurationEstimator()
    for i, job in enumerate(spec["jobs"], 1):
        for attempt in range(TRIES):
            mx.random.seed(job["seed"] + attempt * 7919)
            out = list(model.generate(text=job["text"], language="english", ref_tokens=tokens, ref_text=ref_text,
                                      num_steps=STEPS, duration_s=seconds_for(estimator, job["text"])))
            audio = np.concatenate([np.array(r.audio, dtype=np.float32) for r in out])
            peak = 20 * np.log10(max(float(np.abs(audio).max()), 1e-9))
            if peak > SILENT_DB:
                break
            print(f"take {i} came out silent ({peak:.0f} dB); voicing it again", file=sys.stderr, flush=True)
        else:
            raise SystemExit(f"OmniVoice gave silence {TRIES} times for: {job['text']}")
        sf.write(job["wav"], stretch(trim(audio), spec["speed"]), SR)
        print(f"voiced {i}/{len(spec['jobs'])}", flush=True)


if __name__ == "__main__":
    main(sys.argv[1])
