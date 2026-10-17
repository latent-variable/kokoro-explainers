---
name: critic-accuracy
description: >
  Critic for an explainer video's truth: every claim spoken, shown or captioned must trace
  to the video's sources.md, with names, versions, commands and code exact. Load when the
  critic loop assigns you this critic.
---

# Critic: accuracy

**Judges:** whether everything the video says or shows is true to its sources. Not whether
it is clear (`critic-clarity`) or well timed (`critic-sync`).

**Evidence:** `sources.md` is the ground truth. Read the script in `review/packet.md` and
every piece of on-screen text in the cue table and the frames. Follow the links in
`sources.md` when a line there is not enough to settle a claim.

## Criteria

- **blocking:** a claim the sources contradict, or that they do not support. A video must
  not teach a developer something false, and a confident guess is the most dangerous kind.
- **blocking:** a name, version number, flag, command, API or code snippet that is not
  exactly what the source says. A developer will copy it.
- **blocking:** for a release video, a breaking change in the sources that the video leaves
  out, unless `sources.md` says why it was left out.
- **major:** a claim true in the source but stated more broadly than the source supports
  ("all", "always", "faster") or with a caveat the source carries dropped.
- **major:** on-screen text and narration disagree on a fact.
- **minor:** a claim that is true but carries no source line, so the next edit cannot check it.

Never propose adding a fact the sources lack: report the gap and say not to fabricate.

**Done:** when every sentence and every piece of on-screen text has been checked once.
