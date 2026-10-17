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
not, return the **not ready** form below, never the ready one.

## The hand-back

Return as a message, not a new file in the repo. The first line is the status.

```
Status: ready | not ready
Video: <path to the MP4, e.g. out/<name>.mp4, or "none">   Length: <m:ss, from ffprobe on the MP4>
For: <the viewer and what they can do after>
In short: <two or three lines: what it covers>
Next: <the action the viewer should take>
Recommendation: <decision video only: the option and the reason>
Brief vs code: <claims checked: N; contradicted: which; costs added: which>
Checked: <every critic this video requires, each passed / not run / declined, with REVIEW.md round>
Unsure: <open questions from sources.md, and what you did not read or run>
As of: <commit or hash the video is true for>   Sources: <sources.md path>
```

When not ready: `Status: not ready`, `Video: none`, `Open:` (critics or rounds outstanding) and
`Next:` (what happens now). Leave out In short and Recommendation, or mark them provisional.

## The bar

- **The path is real.** Confirm the file exists and read its length from `ffprobe`. Never
  report an MP4 you have not seen exist.
- **Honest status.** List every required critic, not only the ones that passed, and what was
  not checked: a voice that could not be run, a command not re-run, a critic skipped. Do not
  hedge what was verified.
- **Unsure is not hidden.** An open question in `sources.md` appears in the hand-back.
- **A decision video returns the call framed and the pick**, plus any place the code
  disagreed with the brief (`decision-brief`).
- **Never commit, push or publish unless the person asks.**
- **If asked to commit** a video in `videos/<name>/`: only `sources.md`, `script/`, `scenes.html`,
  `video.json`, `critics.md`, `REVIEW.md`. Never audio, frames or renders. A video in
  `local/videos/` is not committed; say so in the hand-back.
- **Stale warning.** The video is true as of the `As of` line. A later change means updating
  it (`explainer-video`, *Updating one*).

## For other agents

If another agent is waiting on this (the working agent that asked for a decision video), the
hand-back is its input: short enough to act on, with enough pointers for it to check any line.
