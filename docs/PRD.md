# ShipShow: product requirements

Keep this file current: any change to what ShipShow must do, for whom, or how well, updates it
in the same change (`AGENTS.md`, *Docs that stay current*). How it is built and why is in
[DESIGN.md](DESIGN.md). Dates are absolute. Status is one of **done**, **in progress**,
**planned**, **open**.

Last reviewed: 2026-10-17 (after red-team round 6 and the merge with main).

## Problem

Agents change a code base faster than a person can follow. The person still has to decide
and ship, so they either read everything or ship what they do not understand. ShipShow's
answer is a short narrated video of what changed and what needs a decision, made by an agent
that is checked by other agents, so the person can ship code they understand. (`AGENTS.md`,
*What this is*.)

## Users

| Who | Needs |
|---|---|
| **A developer or reviewer** | Understand a change, a feature or a release quickly and correctly |
| **A person making a call** | Enough to decide, with the options priced and one recommended |
| **A working agent** | Hand a decision off mid-work and get an answer back without losing the thread |
| **An explainer agent** | A grounded way to learn a code base and turn it into a video |
| **A critic agent** | A bar to judge against, and evidence to judge with |

The hackathon is for a company that main's README named amperium.ai (this branch removed the name), which does not resolve. The firm we can
read is **Aperiam** (aperiam.vc): "the leading adtech and martech venture capital firm", with a
ventures arm that backs adtech and martech startups, an advisory arm, an Ads arm doing "emerging tech
orchestration for supply chain, commerce, and identity", and a marketing arm. The person who asked for
the demo says it is now at `amperiu.vc`, which also does not resolve from here (unverified). The site says
nothing about AI, agents or **multimodal data**; that assumption, made earlier, is not supported and is
dropped (F19 stays open). The demo therefore speaks to an adtech company's pain: see
`sample_application/` (F18).

## Goals

1. A person can watch one short video and make a correct, informed call.
2. Every claim in a video traces to the code, and is checked by an agent that did not build it.
3. It runs on the person's own machine, with no cloud service for voice or video.
4. It ships as a **Claude Code plugin** (stated by the team, 2026-10-17), so it installs in
   other people's repositories.
5. Its cost in tokens and context is visible.

## Functional requirements

### Understand the code

| ID | Requirement | Status |
|---|---|---|
| F1 | An agent can get oriented in this repo before changing it (`repo-context`) | done |
| F2 | An agent can build a grounded context of any code base: purpose, functional and non-functional requirements, the behaviour of code and APIs, with unknowns listed (`code-context`) | done, being hardened |
| F3 | An agent can build a grounded context of a change (diff, PR, release): why, before and after, breaking, risk (`change-context`) | done, being hardened |
| F4 | Every statement of fact is tagged stated, read, ran or inferred, pinned to a commit or fallback, and absence claims are searchable (`evidence-standard`) | done, being hardened |

### Plan and make the video

| ID | Requirement | Status |
|---|---|---|
| F5 | Turn evidenced facts into a plan: viewer, outcome, one idea per scene, the picture for each (`explain-concept`) | done, being hardened |
| F6 | Write a script meant to be heard, at the pace the person set (`speed`, F25) (`narration-writing`) | done, being hardened |
| F7 | One name per concept across script, captions and scenes (`glossary`) | done, being hardened |
| F8 | Make a video from plain text: Kokoro voice, HyperFrames scenes, captions, MP4 (`bin/`, `kit/`, `explainer-video`) | done |
| F9 | A decision video: an agent hands a decision to a fresh explainer with options, costs and a pick (`decision-brief`) | done, being hardened |
| F10 | Elements appear on the word that names them (`data-cue`) | done |

### Judge it

| ID | Requirement | Status |
|---|---|---|
| F11 | Fresh critic agents judge a video; the builder never judges (`critic-loop`) | done |
| F12 | Nine critics, one skill each: `critic-accuracy`, `critic-clarity`, `critic-pacing`, `critic-sync`, `critic-visuals`, `critic-consistency`, `critic-engagement`, `critic-decision`, `critic-grounding` | done |
| F13 | A critic can verify that shown code and output match the source: a scripted excerpt check, capture files with a recomputable hash, and a per-asset table (`critic-grounding`) | done, being hardened |
| F14 | A review packet gives critics measurements and frames (`npm run review`) | done |

### Hand it back and see the cost

| ID | Requirement | Status |
|---|---|---|
| F15 | A finished video is returned with its status, next step, what was checked and what is unsure (`explain-handoff`) | done, being hardened |
| F16 | Tokens and context per agent, subagents included, for a session (`npm run usage`) | done, **repo only**: it ships as an inert file but is not invokable from the plugin; output tokens are as recorded in the transcript and may undercount |

### Ship and extend

| ID | Requirement | Status |
|---|---|---|
| F17 | Package as a Claude Code plugin: `.claude-plugin/plugin.json` and `marketplace.json`, all skills, a `critic` agent with Read, Grep, Glob, Bash and Skill that cannot Write or Edit (Bash still can: DESIGN D40); validates (one expected warning: no `version`, deliberate) | done. Standalone in any repo: `code-context`, `change-context`, `evidence-standard`. The rest produce an artifact only the pipeline consumes (a brief, a plan, a script, a hand-back) or judge one, and need this repo cloned (open question 3). Packaging limits in DESIGN D13 |
| F18 | A sample application that makes the problem recognisable: `sample_application/`, a toy ad-spend pacer built by three agents in one day, each change correct for its task, with a bug only their interaction shows, a replayable git history and the hand-off notes a manager would have received | done |
| F19 | Take multimodal inputs (images, audio, video, documents) as evidence for a video | **open**: nothing we can read says the company has multimodal data |
| F23 | A video's look is a theme (`themes/shipshow`, `paper`, `launch`, `buildday`, a client's in `local/themes/`) with motion and effects, made from a brand by the `theme` skill (main, #8) | done |
| F24 | How much critic review a video gets is a plan with presets and dials, set by the builder from the video's importance; a floor no dial lowers; `npm run critics` prints it (main, #9 and #10; this branch adds `critic-grounding` to the floor for a video that shows code) | done |
| F25 | The pace is the person's choice: `speed` is a multiplier on a base of about 160 words a minute, 1.25 by default; `critic-pacing` judges against 160 times it (main, #7) | done |
| F26 | A second voice engine, optional and Apple Silicon only: OmniVoice (MLX) for higher-quality and cloned voices, installed into the same `.venv` by `npm run setup:omnivoice`; Kokoro stays the default and runs anywhere (main, #11) | done |
| F27 | Captions a viewer follows word by word: a theme can light each word as it is spoken (`--cap-style: karaoke`), in short lines; `buildday` does (DESIGN D32) | done |
| F28 | Voices that read every word: OmniVoice takes are generated at their natural length and stretched to the speed, trimmed of dead air, and re-voiced if silent; `eve` is a built-in voice (DESIGN D31) | done; measured with Whisper, no dropped words in about 150 sentences |
| F29 | A decision video made through the real handoff, as the demo: a brief about a fictional code base, a fresh explainer agent, critics (`videos/invoice-leak`, `examples/ledgerly`; DESIGN D34) | done |
| F31 | Apply Anthropic's agent best practices: a smaller always-on context, hooks that enforce the hard rules, a read-only critic in fact, per-run results and evals with an independent judge. The step-by-step plan, with sources and what is unconfirmed, is `docs/PLAN.md` | planned |
| F32 | The hard rules are enforced, not only written: tracked project hooks refuse deleting and history-rewriting commands, edits to the demo's bugs and to recorded runs, and end a session on failing tests (first steps of F31; DESIGN D39) | done |
| F33 | The judge cannot rewrite what it judges: the `critic` agent has Write, Edit and NotebookEdit denied, a turn cap and a default model (plan steps 3.1 and 3.2, DESIGN D40) | done; the Bash half (no writes outside a scratch directory) is open |
| F34 | Skills are cheap to keep and keep triggering: a test caps a description at 600 characters and a `SKILL.md` at about 5,000 tokens and requires each to say when to load it, and the two script-bundling skills pre-approve their scripts. Trigger-first wording was tried and measured worse, so descriptions stay as they were (plan 1.3, 1.4, 1.6; DESIGN D41) | done; `allowed-tools` validated, not run live |
| F20 | Per-person preferences and private videos stay local (`tailor`, `local/`) | done in this repo; elsewhere a skill checks `local/` is ignored and uses `.git/info/exclude` |
| F21 | Run code to verify a claim without harm: a sandbox script, a faithful scratch copy, no network, writes confined (`evidence-standard`) | done on macOS; Linux untested |
| F22 | Scaffold and diagnose: `npm run new` from `template/`, `npm run setup` (picks a Python in 3.10 to 3.13, the range the pinned Kokoro supports, and upgrades the new venv's pip before installing), `npm run doctor` for what the machine lacks, a draft render mode | done |

## Non-functional requirements

| ID | Requirement | Where it shows | Status |
|---|---|---|---|
| N1 | **Local.** Voice and video are produced on the machine; nothing is sent to a cloud service for them | Kokoro-82M on CPU, HyperFrames headless | done |
| N2 | **Truth.** A fact the sources lack is reported as a gap, never filled | `sources.md`, `critic-accuracy`, `critic-grounding` | done |
| N3 | **Independence.** The builder never judges its own video; critics are fresh agents | `critic-loop` | done |
| N4 | **Public-safe.** A private code base's details never reach this public repo | `local/` is gitignored; `evidence-standard`, *Where the result goes* | done |
| N5 | **Safe to run.** Reading a code base does not change it, spend money or send data out | `evidence-standard`, `scripts/sandbox-run.sh` (DESIGN D9) | done on macOS, tested; refuses elsewhere; reads are not confined and it is not a defence against hostile code |
| N6 | **Cheap to carry.** Each skill's name and description count toward context on every turn once installed, so descriptions stay short and bodies stay under 500 lines | Measured 2026-10-17: 22 skills, 7,882 characters (about 1,971 tokens) of names and descriptions; longest SKILL.md 206 lines (a test checks these figures against the tree) | done |
| N7 | **Reproducible.** A voice take is cached by text, voice and speed; generated files are gitignored | `assets/voice/*.key` | done |
| N8 | **Observable.** Token and context use is readable per agent | `npm run usage` | done |
| N9 | **Tested without Kokoro.** `npm test` runs with no voice model; it is the only thing CI runs | `test/` (49 tests; the sandbox and capture tests run on macOS only, the CI docs check only on a pull request) | done; 3 tests need `npm install` (the build cue test, the bare-cue warning and the flair test) |
| N10 | **Portable.** The pipeline is tested on macOS; CI runs the unit tests on Linux (`ubuntu-latest`) | `README.md`, `.github/workflows/ci.yml` | open: pipeline on Linux untried |
| N11 | **Attribution.** The sample is original (its `SOURCE.md` says what it is and is not based on); Kokoro-82M and HyperFrames are Apache 2.0; GSAP is under its standard licence | `sample_application/SOURCE.md`, `README.md` | done |
| N12 | **Reviewable.** Every change is a pull request with CI and an automated review; a rename changes the reviewer's allowlist | `AGENTS.md`, traps | done |

## Out of scope for now

- Speech recognition. Timing comes from voicing each sentence separately (DESIGN D1).
- Publishing renders or audio. Generated files are never committed.
- A hosted service.

## Success criteria

- A fresh agent, given a code base and a question, produces a context in which a second agent
  can verify every line without asking the first.
- A video about the sample app (`sample_application/`) passes all of its critics, and `REVIEW.md` shows the
  rounds. The video answers the question a developer asks the morning after: which of three correct-looking
  changes made the Tokyo campaign spend 181% of its budget, and is anything else wrong.
- Planted defects (a hidden behaviour change, a wrong brief claim, a fabricated output) are
  caught by the skills' own method rather than by luck. The red-team record is in
  [`skills/REVIEW.md`](../skills/REVIEW.md).
- The plugin installs from a marketplace and its standalone skills (`code-context`, `change-context`, `evidence-standard`) run in a repo that is not this one: **partly met**, since the video skills need this repo cloned.

## Open questions

1. What is the company's data and product, and is the firm at `aperiam.vc`, `amperiu.vc` or the README's
   `amperium.ai` (the address main's README used)? Nothing readable mentions multimodal data; F19 waits on an answer.
2. Does the hackathon prompt require a particular deliverable or judging criterion?
3. Should the video pipeline (Kokoro, about 340 MB, HyperFrames and Chrome, about 190 MB, a Python
   environment) be installed by the plugin, for example under `${CLAUDE_PLUGIN_DATA}`, or stay a repo the
   user clones? Until it is decided the pipeline skills, `critic-loop`, the critics and `tailor` need a
   clone (DESIGN D13).
