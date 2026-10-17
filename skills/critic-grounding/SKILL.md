---
name: critic-grounding
description: >
  Critic for whether the evidence an explainer video shows is real: every command, output,
  request, response, screenshot, recording or code excerpt on screen was captured from the
  commit and run that `sources.md` names, and is shown as it was captured. Load when the
  critic loop assigns you this critic, for any video that shows code, output or captures.
---

# Critic: grounding

**Judges:** whether what the viewer *sees as evidence* is genuine: copied or captured, not retyped,
tidied or imagined. It owns every shown excerpt, command and output, and every spoken quote of one.
`critic-accuracy` owns claims and prose (and checks the `[read]` and `[ran]` cites behind spoken
claims); `critic-sync` owns timing. A defect that is both is reported here, and accuracy cites "see
grounding".

**Evidence:** `sources.md` (each shown asset needs provenance: pin, command or file with line range,
capture date, exit code), `review/packet.md` (the script, for spoken quotes), the cue table, the
**rendered frames** (the text can be right and the pixels wrong), and the code itself at the pin: the
brief or `sources.md` gives its path and SHA. Follow `evidence-standard` for pins and for running
anything; its scripts are `${CLAUDE_SKILL_DIR}/../evidence-standard/scripts/` (`skills/evidence-standard/scripts/` from the
repo root).

## Method

For each shown asset, check it yourself and record how:

- **Code excerpt.** Extract the source from the pin, not from a working tree (`git show ${pin}:<path> >
  <tmp>`; for vendored code that is `git show HEAD:<path>`, plus `verify-vendored.sh` for "unmodified"),
  save the shown text to a file, and run `node "${CLAUDE_SKILL_DIR}/scripts/check-excerpt.mjs" <source>
  <excerpt> --ranges <ranges from sources.md>` (if `${CLAUDE_SKILL_DIR}` shows unexpanded, it is
  `skills/critic-grounding/scripts/check-excerpt.mjs` from the repo root). Exit 0 and `ok: true` means every segment between `…`
  markers is consecutive lines of the file, in order, with the same text and relative indentation, at the
  stated lines, and that the segments sit at the same relative depth to one another as in the source. It
  catches a one-token change (`600` for `3600`), a splice of non-adjacent lines, a dedent, a statement
  shown inside a block it is not in, and a wrong or ambiguous range. **Exit 1 or 2, or no output, is not a
  pass.** If the source itself holds a `…` line, it warns; use `--marker "<text>"`. Then read every gap it
  lists (`preview`): a gap holding a guard, branch, decorator, early exit or default is a trim that can
  change the meaning (see Criteria). The flags are an aid; an empty flag list does not mean safe. It does
  not check absolute indentation, tabs against spaces, a marker hidden by CSS, or an unmarked cut at the
  start or end of the excerpt: compare the stated range with the gutter in the frame.
- **Label and range on screen.** The file name, gutter line numbers and caption on screen must equal the
  file and range `sources.md` states. A genuine excerpt shown under another file's name passes the script
  and fails here.
- **Command and output.** Re-run it with `evidence-standard`'s `sandbox-run.sh` and compare, exactly or
  after stripping what is nondeterministic (timestamps, ids, timings), saying which. A capture is a file
  made by `capture.mjs record` (header, a `---` line, the raw output) with a `.sha256` sidecar over the
  whole file: run `node "${CLAUDE_SKILL_DIR}/../evidence-standard/scripts/capture.mjs" verify <capture>`; `ok` means integrity only, not that the command ran. **A mismatch (exit 1) means the capture was
  altered: blocking.** No sidecar or no capture file (exit 2) is `unsupported`. A capture that cannot be
  re-run (dependencies absent, a service needed) is checked statically (counts of tests, names, paths,
  that the command exists) and is `unsupported`: a self-written capture proves nothing by itself.
- **Pin.** For code under a directory whose `SOURCE.md` names an upstream commit or tree hash,
  `sources.md` must name both pins (`evidence-standard`); a repo-HEAD pin alone is a major finding.
  Where `SOURCE.md` names none (original code kept in this repo), one repo pin is enough, and `sources.md`
  says the directory is original code.
- **Screenshot or recording.** Look at the frame (method `viewed`) and compare it with the capture and the
  code. A code asset that exists only as pixels, with no text node in `scenes.html` to extract, is
  `unsupported`. Map each frame to its asset id, so a stale frame after a cue is caught.
- **Spoken or captioned quote of output.** Compare the words in `review/packet.md` with the capture.

Return the per-asset table in the JSON's `assets` array (`critic-loop`): asset, source, method (a list:
`diff`, `re-run`, `static`, `viewed`), result: `genuine`; `trimmed` (marked, and a developer would not
infer different behaviour); `trimmed-misleading`; `unsupported`; or `no-provenance`. The verdict is `pass`
only when every row is `genuine` or `trimmed`.

## Criteria

- **blocking:** shown code, output, request, response or log that does not match the pin or a real run: a
  line added, removed, reordered, spliced or invented.
- **blocking:** a capture whose recorded hash does not match (it was altered after it was made).
- **blocking:** a command shown as runnable that does not run as shown from the stated place.
- **blocking:** `no-provenance`: a shown asset with no provenance at all. The viewer cannot tell genuine
  from invented. Report the gap; never ask for one to be made up. It outranks `unsupported`: an asset with
  a provenance line you could not verify is the major below.
- **major:** `unsupported`: any asset you could not trace or reproduce. The verdict cannot be `pass` while
  one exists.
- **major:** `trimmed-misleading`: after dropping the omitted lines, a developer would infer different
  behaviour (a guard, branch, decorator, default or error path vanishes), marked or not. Each `…` has its
  omitted lines listed in `sources.md`; check that list against the real gap.
- **major:** the on-screen label, line numbers or caption disagree with the file and range in `sources.md`.
- **major:** placeholder values presented as captured, or a capture that leaks a secret, private data, an
  absolute path or username, or a development default shown as if real.
- **major:** an asset captured at a different commit or environment (OS, language or dependency version)
  than `sources.md` says the video is true for; a cherry-picked pass with failing cases left out; two files
  stitched into one block.
- **minor:** a provenance line missing a part (pin, command or file, date, exit code), so the next edit
  cannot reproduce it. A range that is present but wrong carries the severity of the content it
  misdescribes.
- **minor:** a diagram's labels or arrows that assert something the code does not do.

For each finding give the shown line, the real one and where you found it.

**Done:** when every asset in the per-asset table has a method and a result.
