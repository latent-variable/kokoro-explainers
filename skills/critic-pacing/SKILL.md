---
name: critic-pacing
description: >
  Critic for an explainer video's pace: speaking rate, pauses, scene length, how long the
  screen goes without change, and whether on-screen text stays up long enough to read.
  Load when the critic loop assigns you this critic.
---

# Critic: pacing

**Judges:** time. Whether the viewer can keep up and is never left waiting. Not what is
said (`critic-clarity`) or whether a cue matches its word (`critic-sync`).

**Evidence:** `review/packet.md` measures most of this: the video's speed and the target it
sets, words a minute per scene, every pause, every cue's time and how long its text stays up
against its reading time (code is counted in identifier tokens, at a slower reading speed than
prose), and the *Stillness* table, the longest stretch of each scene in which nothing new appears.

The person chose the speed (`video.json`, their `local/config.json`, or `--speed`), so judge
against the target it sets: about 160 words a minute times the speed. A faster video is what
they asked for, not a defect.

## Criteria

- **major:** a scene more than 15% off the target: dense sentences rushing it, or slack
  dragging it. The fix is fewer or plainer words, not a different speed: the speed is the
  person's choice.
- **minor:** a speed outside 0.8 to 1.6, said once, so the person knows it is unusual.
- **major:** on-screen text marked "short" in the cue table: it leaves before a viewer could
  read it while listening.
- **major:** a pause over 2 seconds anywhere but the very end, or a screen with no change
  (no cue, no new scene) for over 12 seconds while the voice goes on.
- **major:** a scene over 40 seconds. It almost always holds two ideas.
- **minor:** sentence gaps that feel rushed (under 0.25 s) or a scene change with no breath
  (under 0.8 s between scenes).
- **minor:** total length out of proportion to what the video teaches.

**Done:** when every row of the packet's tables has been read against these numbers.
