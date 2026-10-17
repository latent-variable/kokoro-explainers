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

**Evidence:** `review/packet.md` measures most of this: words a minute per scene, every
pause, every cue's time and how long its text stays up against its reading time.

## Criteria

- **major:** a scene spoken faster than 175 words a minute, or slower than 130. 150 to 165
  is the target for technical content. The fix is `"speed"` in `video.json`
  first (the packet's rate is speech-only, so cutting words does not change it); reword only a
  scene that is the outlier at the speed that suits the rest. Not more pauses.
- **major:** on-screen text marked "short" in the cue table: it leaves before a viewer could
  read it while listening.
- **major:** a pause over 2 seconds anywhere but the very end, or a screen with no change
  (no cue, no new scene) for over 12 seconds while the voice goes on.
- **major:** a scene over 40 seconds. It almost always holds two ideas.
- **minor:** sentence gaps that feel rushed (under 0.25 s) or a scene change with no breath
  (under 0.8 s between scenes).
- **minor:** total length out of proportion to what the video teaches.

**Done:** when every row of the packet's tables has been read against these numbers.
