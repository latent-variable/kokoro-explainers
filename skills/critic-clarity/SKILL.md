---
name: critic-clarity
description: >
  Use when the critic loop assigns you this critic. Critic for whether an explainer video teaches:
  the intended viewer follows it on one viewing, understands what changed and why it matters, and
  knows what to do next.
---

# Critic: clarity

**Judges:** the content as teaching, for the viewer `video.json` and `sources.md` describe
(for a release video: a developer who uses the project and has not read the release notes).
Not truth (`critic-accuracy`) or speed (`critic-pacing`).

**Evidence:** the script in `review/packet.md`, read as that viewer hears it once, at speed,
with no rewind; the frames for what they see alongside it.

## Criteria

- **blocking:** the viewer cannot tell what the video is about within its first scene.
- **blocking:** a release video that never says what the viewer must do (upgrade, change
  this call, nothing), or says it so vaguely they could not act on it.
- **major:** a term, acronym or concept used before it is explained, or never explained,
  that this viewer would not know.
- **major:** a scene that carries two ideas, or an order that makes the viewer hold
  something unexplained for more than a scene.
- **major:** time spent on what this viewer does not need, while something they need is
  thin. Name both.
- **blocking:** the video never answers the question in its title or its brief, or answers a different one, even if every line is true.
- **major:** a claim of cause is stated as fact with no test: removing the supposed cause was never tried, and
  another cause would fit the same lines.
- **major:** spoken aliases (`glossary`) that the viewer is never told map to the names they will meet
  when they open the code, so the video teaches a vocabulary the code does not use.
- **major:** the scene that carries the central mechanism shows code the viewer could not read in the
  time it is up, or never says what the constructs they would need to change do.
- **major:** the design's cost or limit is neither stated nor said to be absent from the sources.
- **minor:** a sentence that is hard to follow by ear: long, nested, or with the point at
  the end.

**Done:** when you have walked the whole script once as that viewer and said where they
would get lost, and what they leave knowing.
