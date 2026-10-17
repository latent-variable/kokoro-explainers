---
name: critic-engagement
description: >
  Critic for whether an explainer video holds its intended viewer: a reason to keep
  watching from the first seconds, the viewer's own stakes made visible, and design
  choices that serve that persona rather than a generic audience. Load when the critic
  loop assigns you this critic.
---

# Critic: engagement

**Judges:** whether the persona in `video.json` `"audience"` would choose to keep watching,
and whether the video's design decisions are made for that person. Not whether they
understand it (`critic-clarity`) or whether a frame is well made (`critic-visuals`).

**Evidence:** `video.json` for the persona; the script in `review/packet.md` for what they
hear; the frames for what they see. Picture that one person, with their job and their
reason for pressing play, and watch it as them.

## Criteria

- **blocking:** nothing in the first ten seconds tells this viewer why it is worth their
  time: no problem they have, no change that affects them, no payoff promised.
- **major:** the video talks about the tool or the project instead of what the viewer gets
  or must do. For a release video: features listed without what each changes for them.
- **major:** a stretch of over 15 seconds where nothing new happens for this viewer: a list
  read out, a point repeated, a screen they have already understood.
- **major:** a design choice that fights the persona: code too small for a developer to
  read, jargon a newcomer will not have, a tone that talks down to an expert.
- **major:** no concrete example where one would land: an abstract claim the viewer has to
  take on trust while a real snippet, command or before and after would show it.
- **minor:** an opening or ending that is generic (a title card, "thanks for watching")
  where the viewer's own outcome could have been.

Say who you watched as, in one line, before the findings.

**Done:** when you have watched the whole video once as that persona and said where you
would have stopped watching, if anywhere, and why.
