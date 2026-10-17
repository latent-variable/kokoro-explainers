---
name: critic-grounding
description: >
  Critic for whether the evidence an explainer video shows is real: every command, output,
  request, response, screenshot, recording or code excerpt on screen was captured from the
  commit and run that `sources.md` names, and is shown as it was captured. Load when the
  critic loop assigns you this critic, for any video that shows code, output or captures.
---

# Critic: grounding

**Judges:** whether what the viewer *sees as evidence* is genuine: copied or captured, not
retyped, tidied or imagined. Not whether a claim is true (`critic-accuracy` checks claims
against `sources.md`) or whether it is shown at the right moment (`critic-sync`). A claim can
be true while the output shown for it was never produced; this critic catches that.

**Evidence:** `sources.md` (each shown asset should have its provenance there: the commit, the
command or file, and when it was captured), the cue table and frames in `review/`, and the
code itself. Check out the commit `sources.md` names, or read it with `git show`, and compare.
Re-run a captured command when it is safe and cheap; never run anything that sends data out,
spends money or changes shared state.

## Criteria

- **blocking:** on-screen code, command output, a request or response, or a log that does not
  match the named commit or a real run: a line added, removed, reordered or invented.
- **blocking:** a command shown as runnable that does not run as shown from the stated place
  (a missing flag, a wrong path, a step it depends on that is not shown).
- **blocking:** a shown asset with no provenance in `sources.md`. If the video cannot say where
  it came from, the viewer cannot trust it. Report the gap; never ask for one to be made up.
- **major:** an excerpt trimmed so that it changes the meaning, or "output" abbreviated without
  a visible mark (`…`) saying so.
- **major:** values that look real but are placeholders (ids, timestamps, numbers) presented as
  captured, or captured values that leak secrets or private data.
- **major:** an asset captured at an older commit than the one `sources.md` says the video is
  true for, or code shown that the named commit has since changed.
- **minor:** a capture whose command or file is not named on screen or in `sources.md`, so the
  next edit cannot reproduce it.
- **minor:** a diagram's labels or arrows that assert something the code does not do.

For each finding, give the shown line, the real one and where you found it.

**Done:** when every on-screen code block, command, output and captured image has been traced
to its source once, and each is marked genuine, trimmed (visibly) or unsupported.
