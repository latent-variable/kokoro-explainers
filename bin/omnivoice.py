"""Voice sentences with OmniVoice on Apple's MLX (mlx-audio), in one process, no app.

  .venv/bin/python bin/omnivoice.py jobs.json

jobs.json, written by bin/voice.mjs:
  {"speed": 1.25, "voice": {"name": "caro_davy"} | {"name": "lino", "wav": "...", "text": "..."},
   "cache": "<dir for the trimmed reference>", "jobs": [{"text": "...", "wav": "...", "seed": 1}]}

OmniVoice clones every voice from a short recording, so a voice here is a recording: a clone is
a clip in local/voices/, a built-in one a CC0 clip from kyutai/tts-voices (bin/omnivoice-voices.json).
The reference is cut at its last pause before 10 s, which OmniVoice wants (3 to 10 s). Each
take is one sentence, so nothing is chunked.
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


def probe_seconds(clip):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(clip)],
                         check=True, capture_output=True, text=True).stdout
    return float(out)


def reference(voice, cache):
    """(path of the reference clip, its transcript or None) for a voice."""
    if voice.get("wav"):
        clip, text = Path(voice["wav"]), voice.get("text")
    else:
        from huggingface_hub import hf_hub_download
        clip = Path(hf_hub_download(SPEC["voicesRepo"], SPEC["builtIn"][voice["name"]], revision=SPEC["voicesRevision"]))
        text = None
    seconds = probe_seconds(clip)
    if seconds <= REF_SECONDS:
        return clip, text
    if text:
        raise SystemExit(f"{clip} is {seconds:.0f} s and has a transcript beside it, which cannot be cut to fit: "
                         f"OmniVoice wants a 3 to 10 s reference. Trim the clip and its .txt, or delete the .txt.")
    probe = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(clip), "-af", "silencedetect=noise=-35dB:d=0.2",
                            "-f", "null", "-"], capture_output=True, text=True).stderr
    pauses = [float(t) for t in re.findall(r"silence_start: ([0-9.]+)", probe)]
    end = max([t for t in pauses if 3.0 <= t <= REF_SECONDS], default=REF_SECONDS)
    Path(cache).mkdir(parents=True, exist_ok=True)
    out = Path(cache) / f"{voice['name']}-reference.wav"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(clip), "-t", f"{end + 0.15:.2f}", "-ar", str(SR), "-ac", "1",
                    str(out)], check=True)
    return out, None


def seconds_for(estimator, text, speed):
    """How long a sentence should run at `speed`: mlx-audio's own sizing of it (a fixed sentence's
    pace, padded 15%) divided by the speed, so 1.0 is exactly what it does unasked."""
    frames = max(10, int(estimator.estimate_duration(text, "Nice to meet you.", 25) * 1.15))
    return frames * 960 / SR / speed


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
        mx.random.seed(job["seed"])
        out = list(model.generate(text=job["text"], language="english", ref_tokens=tokens, ref_text=ref_text,
                                  num_steps=STEPS, duration_s=seconds_for(estimator, job["text"], spec["speed"])))
        sf.write(job["wav"], np.concatenate([np.array(r.audio, dtype=np.float32) for r in out]), SR)
        print(f"voiced {i}/{len(spec['jobs'])}", flush=True)


if __name__ == "__main__":
    main(sys.argv[1])
