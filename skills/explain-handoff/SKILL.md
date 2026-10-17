---
name: explain-handoff
description: >
  Use when you are returning a video, finished or not, including the hand-back of a decision video
  to the working agent waiting on it. Return an explainer to the person or agent that asked for
  it: its status, where the video is, what it says in a few lines, what to do next, which critics
  passed, what the brief got wrong and what is still unchecked.
---

# Explain handoff

> **Needs a clone of the ShipShow repo**, set up with `npm install` (this skill uses `bin/`, `npm run` and
> `AGENTS.md`). Outside one, say so and stop; the plugin alone ships the understanding skills
> (`code-context`, `change-context`, `evidence-standard`).

The video is not the end; the person acting on it is. The hand-back says where the video is and what
a viewer who skips it should know, without asking them to trust you: the sources and the review are
there to check. Return it as a message, not a new file in the repo.

## Ready or not

`Status: ready` only when **every critic in the video's review plan has passed** (`npm run critics --
<folder>` lists them) and `REVIEW.md` says so. The plan always includes the floor: `critic-accuracy`,
`critic-decision` for a decision video, and `critic-grounding` for a video that shows code, output or
captures. A critic the person's plan (`review.critics`) left out is listed as `not in the plan (<who chose it>)`; a
floor critic is never left out, because the plan adds it back. A critic `not run` or `declined` makes the hand-back `not ready`.

```
Status: ready
Video: <path to the MP4, e.g. out/<name>.mp4>   Length: <m:ss from ffprobe on the MP4, or "ffprobe unavailable: not verified">
For: <the viewer, and what they can do after>
In short: <two or three lines>
Next: <the action the viewer should take>
Recommendation: <decision video: the option and why. The agent working on this picks B because ...>
Overruled claims the pick's reason depended on: <the brief's `Pick rests on` IDs that are contradicted, partly or not checked, plus any added cost (`X`) or contradiction that bears on the recommended option, or none>
Brief vs code: <every brief claim ID (`C`) appears once: confirmed ..; contradicted ..; partly ..; not checked ..; then what you added, by `X` ID: costs ..; options added or dropped ..; brief faults ..>
Checked: <every required critic: passed | not run | declined | removed from video.json by <who>, with the REVIEW.md path and round>
Unsure: <open questions from sources.md; assumptions and "by when" claims not checked; what you did not read or run>
Read at: repo HEAD <sha> / upstream <sha | none> / replayed history <shas | none> / patch or hash <h | none>   Run: <yes | no>   Sources: <sources.md path>   Stored: <path; "not committed" for local/>
```

`Run: yes (<the [ran] line IDs>)` means behaviour at the pin was observed inside `evidence-standard`'s
envelope; a syntax check or compile is `Run: no (static checks only)`, and building the video is not a run.

```
Status: not ready
Video: none   Draft: <path, not reviewed | none>
Open: <critics or rounds outstanding>
Next: <what happens now, and who does it>
Brief vs code: <provisional, by claim ID: contradicted and not checked so far>
Unsure: <what you did not read or run>
Read at: <as above>   Sources: <sources.md path>   Stored: <path>
```

The paths in `Draft` and `Sources` must exist. Leave out In short and Recommendation when not ready, or
mark them provisional. The brief-versus-code findings are often the most useful thing a waiting agent
can get early. The explainer does not judge whether the pick "still holds": that is the working agent's call. The
`Overruled` line is mechanical: the intersection of the brief's `Pick rests on` with the claims that are
contradicted, partly confirmed or not checked, plus every `X` item that touches the recommended option.
The brief numbers its own clauses, so a reason that carries no ID is itself a brief fault to report.

## The bar

- **The path is real.** Confirm the file exists and read its length with `ffprobe`. Never report an
  MP4 you have not seen exist.
- **List every required critic**, not only the ones that passed. Copy the verdict from `REVIEW.md`.
- **Brief vs code is by claim ID**, so the reader can diff it against the brief. "Checked: N" with no
  list is not an answer.
- **Unsure is not hidden.** An open question in `sources.md`, an unchecked assumption, a command not
  re-run, a voice not played: all appear. Do not hedge what was verified.
- **Never commit, push or publish unless the person asks.** If asked to commit a video in
  `videos/<name>/`: only `sources.md`, `script/`, `scenes.html`, `video.json`, `critics.md`,
  `REVIEW.md`; never audio, frames or renders. A video in `local/videos/` is never committed.
- **It is true as of `Read at`.** A later change means updating it (`explainer-video`, *Updating one*).

## For other agents

If another agent is waiting on this (the working agent that asked for a decision video), the hand-back
is its input: short enough to act on, with enough pointers to check any line.
