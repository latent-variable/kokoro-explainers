# ShipShow: product requirements

Keep this file current: any change to what ShipShow must do, for whom, or how well, updates it
in the same change (`AGENTS.md`, *Docs that stay current*). How it is built and why is in
[DESIGN.md](DESIGN.md). Dates are absolute. Status is one of **done**, **in progress**,
**planned**, **open**.

Last reviewed: 2026-10-17 (after red-team round 3).

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

The hackathon is for amperium.ai. We were told the company handles significant amounts of
multimodal data. Beyond that, what Amperium's data and users are is **open** (see *Open
questions*).

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
| F6 | Write a script meant to be heard, with pace set from measurement (`narration-writing`) | done, being hardened |
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
| F16 | Tokens and context per agent, subagents included, for a session (`npm run usage`) | done, **repo only**: it is not a skill, so the plugin does not ship it |

### Ship and extend

| ID | Requirement | Status |
|---|---|---|
| F17 | Package as a Claude Code plugin: `.claude-plugin/plugin.json` and `marketplace.json`, all skills, a `critic` agent restricted to Read, Grep, Glob, Bash and Skill and told not to write; validates (one expected warning: no `version`, deliberate) | done; the pipeline skills, `critic-loop`, the critics and `tailor` need a clone (open question 3); known packaging limits in DESIGN D13 |
| F18 | A vendored sample application to test the skills on (`sample_application/`, microblog) | done |
| F19 | Take multimodal inputs (images, audio, video, documents) as evidence for a video | **open**: depends on Amperium's data |
| F20 | Per-person preferences and private videos stay local (`tailor`, `local/`) | done in this repo; elsewhere a skill checks `local/` is ignored and uses `.git/info/exclude` |
| F21 | Run code to verify a claim without harm: a sandbox script, a faithful scratch copy, no network, writes confined (`evidence-standard`) | done on macOS; Linux untested |
| F22 | Scaffold and diagnose: `npm run new` from `template/`, `npm run doctor` for what the machine lacks, a draft render mode | done |

## Non-functional requirements

| ID | Requirement | Where it shows | Status |
|---|---|---|---|
| N1 | **Local.** Voice and video are produced on the machine; nothing is sent to a cloud service for them | Kokoro-82M on CPU, HyperFrames headless | done |
| N2 | **Truth.** A fact the sources lack is reported as a gap, never filled | `sources.md`, `critic-accuracy`, `critic-grounding` | done |
| N3 | **Independence.** The builder never judges its own video; critics are fresh agents | `critic-loop` | done |
| N4 | **Public-safe.** A private code base's details never reach this public repo | `local/` is gitignored; `evidence-standard`, *Where the result goes* | done |
| N5 | **Safe to run.** Reading a code base does not change it, spend money or send data out | `evidence-standard`, `scripts/sandbox-run.sh` (DESIGN D9) | done on macOS, tested; refuses elsewhere; reads are not confined and it is not a defence against hostile code |
| N6 | **Cheap to carry.** Each skill's name and description count toward context on every turn once installed, so descriptions stay short and bodies stay under 500 lines | Measured 2026-10-17: 21 skills, 7,408 characters (about 1,850 tokens) of names and descriptions; longest SKILL.md 139 lines | done; re-measure when a skill is added |
| N7 | **Reproducible.** A voice take is cached by text, voice and speed; generated files are gitignored | `assets/voice/*.key` | done |
| N8 | **Observable.** Token and context use is readable per agent | `npm run usage` | done |
| N9 | **Tested without Kokoro.** `npm test` runs with no voice model; it is the only thing CI runs | `test/` (13 tests; the sandbox test runs on macOS only) | done; 2 tests need `npm install` |
| N10 | **Portable.** The pipeline is tested on macOS; CI runs the unit tests on Linux (`ubuntu-latest`) | `README.md`, `.github/workflows/ci.yml` | open: pipeline on Linux untried |
| N11 | **Attribution.** The vendored sample is MIT with its licence kept; Kokoro-82M and HyperFrames are Apache 2.0; GSAP is under its standard licence | `sample_application/LICENSE`, `README.md` | done |
| N12 | **Reviewable.** Every change is a pull request with CI and an automated review; a rename changes the reviewer's allowlist | `AGENTS.md`, traps | done |

## Out of scope for now

- Speech recognition. Timing comes from voicing each sentence separately (DESIGN D1).
- Publishing renders or audio. Generated files are never committed.
- A hosted service.

## Success criteria

- A fresh agent, given a code base and a question, produces a context in which a second agent
  can verify every line without asking the first.
- A video about the sample app passes all of its critics, and `REVIEW.md` shows the rounds.
- Planted defects (a hidden behaviour change, a wrong brief claim, a fabricated output) are
  caught by the skills' own method rather than by luck. The red-team record is in
  [`skills/REVIEW.md`](../skills/REVIEW.md).
- The plugin installs from a marketplace and its skills run in a repo that is not this one.

## Open questions

1. What is Amperium's multimodal data (modalities, volume, domain), and what must a video of it
   show? F19 waits on this.
2. Does the hackathon prompt require a particular deliverable or judging criterion?
3. Should the video pipeline (Kokoro, about 340 MB, HyperFrames and Chrome, about 190 MB, a Python
   environment) be installed by the plugin, for example under `${CLAUDE_PLUGIN_DATA}`, or stay a repo the
   user clones? Until it is decided the pipeline skills, `critic-loop`, the critics and `tailor` need a
   clone (DESIGN D13).
