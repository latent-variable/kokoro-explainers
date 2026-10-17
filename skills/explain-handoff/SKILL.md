---
name: explain-handoff
description: >
  Package a finished explainer for the person who asked for it: where the video is, what it
  says in a few lines, what to do next, what the critics found and what remains uncertain,
  and where its sources are. Load when a video has passed its critics and you are returning
  it, including the hand-back of a decision video to the agent or person waiting on it.
---

# Explain handoff

The video is not the end; the person acting on it is. The hand-back says where the video is
and what a viewer who skips it should know, without making the viewer trust you: the sources
and the review are there to check.

Only hand back a video whose critics have passed and whose `REVIEW.md` says so. If they have
not, say that instead, with what is still open.

## The hand-back

Return, in this order, as a message and not a new file in the repo:

```
Video: <path to the MP4, e.g. out/<name>.mp4>   Length: <m:ss>
For: <the viewer and what they can do after>
In short: <two or three lines: what it covers>
Next: <the action the viewer should take>
Recommendation: <decision video only: the option and the reason; and where the code overruled the brief>
Checked: <critics that passed, rounds, anything declined and why>
Unsure: <open questions from sources.md; anything you could not verify>
Sources: <sources.md path, commit read>
```

## The bar

- **The path is real.** Confirm the file exists and play-length matches the packet. Never
  report an MP4 you have not seen exist.
- **Honest status.** Say what was checked and what was not: a Kokoro voice that could not be
  run, a command shown but not re-run, a critic skipped. Do not hedge what was verified.
- **Unsure is not hidden.** An open question in `sources.md` appears in the hand-back.
- **A decision video returns the call framed and the pick**, plus any place the code
  disagreed with the brief (`decision-brief`).
- **Ship only what belongs.** For `videos/<name>/` commit `sources.md`, `script/`,
  `scenes.html`, `video.json`, `critics.md`, `REVIEW.md`. Never audio, frames or renders. A
  video in `local/videos/` is never committed. Do not push or publish anything unless asked.
- **Stale warning.** The video is true as of the commit in `sources.md`. Say so; a later
  change means updating it (`explainer-video`, *Updating one*).

## For other agents

If another agent is waiting on this (the working agent that asked for a decision video), the
hand-back is its input: short enough to act on, with enough pointers for it to check any line.
