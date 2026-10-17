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

- **Code excerpt:** extract the shown text, normalise only whitespace, and confirm it is an
  ordered subsequence of the named file at the pinned commit, with every gap marked `…` and the
  line range in `sources.md` matching what is shown. A literal diff catches one-token changes
  ("600" shown for "3600") that reading does not.
- **Command and output:** re-run it inside `evidence-standard`'s envelope and compare, or, when
  it cannot be run, check what is checkable statically (counts, names, paths, that the command
  exists) against the saved capture file. A capture file is `command, cwd, commit, exit code,
  date` plus the output; no capture file is no provenance.
- **Pin:** the commit in `sources.md` equals the pin of record (the repo's HEAD, or the
  upstream SHA in `SOURCE.md` for vendored code). If it cannot be checked out, compare against
  the vendored tree or a fresh clone of the upstream SHA and say which.
- **Screenshot or recording:** compare against the capture file and the code it shows; look for
  cropped prompts, edited values and missing failures.

Return a per-asset table with the JSON: asset, source, method (`diff`, `re-run`, `static`),
result (`genuine`, `trimmed`, `unsupported`).

## Criteria

- **blocking:** shown code, output, request, response or log that does not match the pinned
  commit or a real run: a line added, removed, reordered, spliced or invented.
- **blocking:** a command shown as runnable that does not run as shown from the stated place.
- **blocking:** a shown asset with no provenance. The viewer cannot tell genuine from invented.
  Report the gap; never ask for one to be made up.
- **major:** any asset you could not trace or reproduce is `unsupported`. The verdict cannot be
  `pass` while one exists.
- **major:** a trim, marked or not, after which a developer would infer different behaviour
  (drop the omitted lines and ask: does a guard, branch, default or error path vanish?).
  `sources.md` lists what each trim omits. Code spliced from non-adjacent lines with no `…`.
- **major:** placeholder values presented as captured, or a capture that leaks a secret,
  private data, or a development default shown as if real.
- **major:** an asset captured at a different commit or environment (OS, language or
  dependency version) than `sources.md` says the video is true for; a capture that is a
  cherry-picked pass with failing cases left out; two files stitched into one block.
- **minor:** a provenance line missing one of its parts (commit, command or file with range,
  date, exit code), so the next edit cannot reproduce it.
- **minor:** a diagram's labels or arrows that assert something the code does not do.

Narration and alt text that quote output are assets too.

For each finding give the shown line, the real one and where you found it.

**Done:** when every asset in the per-asset table has a method and a result.
