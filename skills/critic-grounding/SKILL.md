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
retyped, tidied or imagined. It owns every shown excerpt, command and output; `critic-accuracy`
owns claims and prose, and `critic-sync` owns timing. A defect that is both is reported here,
and accuracy cites "see grounding".

**Evidence:** `sources.md` (each shown asset needs provenance: commit, command or file with
line range, capture date, exit code), the cue table, the **rendered frames** (not only the
packet text: the text can be right and the pixels wrong), and the code itself. Follow
`evidence-standard` for pins and for running anything.

## Method

For each shown asset, check it yourself and record how:

- **Code excerpt:** save the shown text to a file and run `node bin/check-excerpt.mjs <source
  file> <excerpt file> --ranges <ranges from sources.md>`. Each segment between `…` markers must
  be consecutive lines of the file, in file order, and the matched ranges must equal the stated
  ones. That catches a one-token change ("600" for "3600"), a splice of non-adjacent lines, and
  a wrong range, which reading does not. Then read every gap it lists: a gap holding a guard,
  branch, return, raise or default is a trim that can change the meaning (see Criteria). The
  tool is a decision aid; judging a trim is yours.
- **Command and output:** re-run it inside `evidence-standard`'s envelope and compare, exactly
  or after stripping what is nondeterministic (timestamps, ids, timings), saying which. A
  capture file holds the command, copy path, pin, exit code, date, a hash of the raw output, and
  the full output with any failing cases left in; no capture file is no provenance. When it
  cannot be re-run (dependencies absent, a service needed), check what is checkable statically
  (counts of tests, names, paths, that the command exists), and the asset is `unsupported`: a
  self-written capture proves nothing by itself.
- **Pin:** for code under a directory with a `SOURCE.md`, `sources.md` must name both pins
  (`evidence-standard`): cites resolve against the repo's HEAD and the code is the upstream SHA.
  A repo-HEAD pin alone is a major finding. Verify "unmodified" offline with the tree hash in
  `SOURCE.md`, never by cloning (no network).
- **Screenshot or recording:** look at the frame (method `viewed`) and compare with the capture
  file and the code it shows; look for cropped prompts, edited values and missing failures.
  Require each code asset to be a text node in `scenes.html` you can extract and diff; map each
  frame to its asset id, so the check is per asset, including a stale frame after a cue.

Return the per-asset table in the JSON's `assets` array (`critic-loop`): asset, source, method
(`diff`, `re-run`, `static`, `viewed`), result: `genuine`; `trimmed` (marked, and a developer
would not infer different behaviour); `trimmed-misleading`; or `unsupported`. The verdict is
`pass` only when every row is `genuine` or `trimmed`.

## Criteria

- **blocking:** shown code, output, request, response or log that does not match the pinned
  commit or a real run: a line added, removed, reordered, spliced or invented.
- **blocking:** a command shown as runnable that does not run as shown from the stated place.
- **blocking:** a shown asset with no provenance at all. The viewer cannot tell genuine from
  invented. Report the gap; never ask for one to be made up. No provenance outranks
  `unsupported`: an asset with a provenance line you could not verify is the major below.
- **major:** any asset you could not trace or reproduce is `unsupported`. The verdict cannot be
  `pass` while one exists.
- **major:** `trimmed-misleading`: after dropping the omitted lines, a developer would infer
  different behaviour (a guard, branch, default or error path vanishes), marked or not. Each
  `…` has its omitted lines listed in `sources.md`; check that list against the real gap.
  Code spliced from non-adjacent lines with no `…`.
- **major:** placeholder values presented as captured, or a capture that leaks a secret,
  private data, or a development default shown as if real.
- **major:** an asset captured at a different commit or environment (OS, language or
  dependency version) than `sources.md` says the video is true for; a capture that is a
  cherry-picked pass with failing cases left out; two files stitched into one block.
- **minor:** a provenance line missing a part (pin, command or file, date, exit code), so the
  next edit cannot reproduce it. A range that is present but wrong carries the severity of the
  content it misdescribes.
- **minor:** a diagram's labels or arrows that assert something the code does not do.

Narration and alt text that quote output are assets too.

For each finding give the shown line, the real one and where you found it.

**Done:** when every asset in the per-asset table has a method and a result.
