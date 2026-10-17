---
name: explain-handoff
description: >
  Return an explainer to the person or agent that asked for it: its status, where the video is,
  what it says in a few lines, what to do next, which critics passed, what the brief got wrong
  and what is still unchecked. Load when you are returning a video, finished or not, including
  the hand-back of a decision video to the working agent waiting on it.
---

# Explain handoff

The video is not the end; the person acting on it is. The hand-back says where the video is and
what a viewer who skips it should know, without asking them to trust you: the sources and the
review are there to check. Return it as a message, not a new file in the repo.

## Ready or not

`Status: ready` only when **every critic this video requires has passed** and `REVIEW.md` says so.
A critic that is `not run` or `declined` makes it `not ready`.

```
Status: ready
Video: <path to the MP4, e.g. out/<name>.mp4>   Length: <m:ss from ffprobe on the MP4>
For: <the viewer, and what they can do after>
In short: <two or three lines>
Next: <the action the viewer should take>
Recommendation: <decision video: the option and why. The agent working on this picks B because ...>
Recommendation still holds after what the code overruled: yes | no, because <...>
Brief vs code: <by claim ID: confirmed: ..; contradicted: ..; not checked: ..; costs added: ..>
Checked: <every required critic: passed | not run | declined, with its REVIEW.md round>
Unsure: <open questions from sources.md; what you did not read or run>
Read at: <pin(s)>   Run: yes | no   Sources: <sources.md path>   Stored: <path; "not committed" for local/>
```

```
Status: not ready
Video: none   Draft: <path, not reviewed> | none
Open: <critics or rounds outstanding>
Next: <what happens now, and who does it>
Brief vs code: <provisional: contradicted and not checked so far, by claim ID>
Unsure: <what you did not read or run>
```

Leave out In short and Recommendation when not ready, or mark them provisional. The brief-versus-code
findings are often the most useful thing a waiting agent can get early.

## The bar

- **The path is real.** Confirm the file exists and read its length with `ffprobe`. Never report
  an MP4 you have not seen exist.
- **List every required critic**, not only the ones that passed. Copy the verdict from `REVIEW.md`.
- **Brief vs code is by claim ID**, so the reader can diff it against the brief. "Checked: N" with
  no list is not an answer.
- **Unsure is not hidden.** An open question in `sources.md`, an unchecked assumption, a command
  not re-run, a voice not played: all appear. Do not hedge what was verified.
- **Never commit, push or publish unless the person asks.** If asked to commit a video in
  `videos/<name>/`: only `sources.md`, `script/`, `scenes.html`, `video.json`, `critics.md`,
  `REVIEW.md`; never audio, frames or renders. A video in `local/videos/` is not committed, and
  the hand-back says so.
- **It is true as of `Read at`.** A later change means updating it (`explainer-video`,
  *Updating one*).

## For other agents

If another agent is waiting on this (the working agent that asked for a decision video), the
hand-back is its input: short enough to act on, with enough pointers to check any line.
