# ShipShow: design decisions and behaviour

Keep this file current: a decision, or a change to how ShipShow behaves, is recorded here in
the same change (`AGENTS.md`, *Docs that stay current*). Requirements are in
[PRD.md](PRD.md). Add decisions at the end of the log; do not rewrite a past one, supersede it
with a new entry that names it. Dates are absolute.

## Keeping these files current

The rule itself is in `AGENTS.md`; the detail that does not need to be in every agent's context is here.

- A new decision is a new entry at the end of the log: number, date, decision, why, what it
  costs. Never rewrite a past entry; supersede it with a new one that names it.
- A requirement keeps its ID. Move its status (done, in progress, planned, open) rather than
  deleting it.
- Behaviour lines name the file they come from, so they can be checked. Verify a line before
  you write it: read the code or run it.
- Ground a decision in evidence: a file, a measurement, a finding in `skills/REVIEW.md`, or a
  source you read. What you do not know goes in the PRD's open questions, not in a guess.
- `npm test` fails if either file is missing or empty, if `AGENTS.md` loses its *Docs that stay current* heading, if a skill
  is missing from the skills table or the PRD, if a critic is missing from `docs/assets/critics.svg`, if
  a number the docs quote (skills, characters of descriptions, longest `SKILL.md`, tests, critics) is not
  the tree's, or, in CI on a pull request, if code, skills, the plugin, CI, `package.json` or the README
  changed and the docs got no real change (whitespace and the `Last reviewed` date do not count) and no
  `docs: no change - <reason>`. It makes a stale number loud, not a stale claim: read the docs you touch.

## How it fits together

```
 facts ─► plan ─► script ─► voice ─► scenes ─► lint ─► render ─► MP4
 (sources.md,    (explain-   (Kokoro,   (HyperFrames           │
  Terms)         concept)    per        + kit/)                 ▼
   ▲                         sentence)                 review packet + frames
   │                                                            │
 code-context / change-context / decision-brief                 ▼
 (evidence-standard)                              fresh critics ─► findings ─► fix ─► repeat
                                                                │
                                                                ▼
                                                       explain-handoff (status, next step, unsure)
```

Three layers: **understand** (the context skills and `evidence-standard`), **make** (`bin/`,
`kit/`, `explainer-video`, `explain-concept`, `narration-writing`, `glossary`), **judge**
(`critic-loop` and nine critics). `explain-handoff` closes it. `npm run usage` watches the cost.

## Decision log

### D1. No speech recognition (2026-10-17)
**Decision.** Word timing comes from voicing each sentence on its own, and placing a word by
its share of the sentence's letters. No ASR step. **Why.** `hyperframes transcribe` built
whisper.cpp and then timed out downloading its model after six minutes; a second model is a
larger download. **Consequence.** A cue can be a few hundred milliseconds off; fix it by
splitting the sentence or using `data-cue="+seconds"`. A spoken alias made through `say`
changes the voiced text but not the cue arithmetic (D16). Source: `AGENTS.md`, traps.

### D2. The builder never judges (2026-10-17)
**Decision.** Every critic is a fresh agent that never saw the build; never a fork, never the
builder. A video is done when its critics pass. **Why.** The builder sees its intent, not the
frames, and is biased to finish. Research on model judges also finds self-preference bias, a
judge favouring output like its own, which argues for a judge that differs from the builder.
**Consequence.** The loop spends agents per round; use a stronger model for the final round.
Source: `skills/critic-loop`; self-preference bias, <https://arxiv.org/html/2410.21819v1>.

### D3. `sources.md` is the ground truth (2026-10-17)
**Decision.** A claim not in `sources.md` does not go in the video. A fact the sources lack is a
gap to report. **Why.** A video that teaches a developer something false is worse than none.

### D4. Skills set the bar, not the method (team, 2026-10-17)
**Decision.** Skills say what good is and how it is judged. How an agent manages its context or
plans its steps is its own business. **Why.** A method rule is friction the next model has to
work around. **Consequence.** Who builds, who judges, and where facts come from stay fixed for
every agent. Round-two red-teaming found several of our skills still prescribing method
(templates, fixed order); those were marked as suggestions in round three, and round four found the
alias rule and the 0.8 starting speed each stated in several places (D15, D16). Source: `AGENTS.md`.

### D5. This repo is public (2026-10-17)
**Decision.** A video about another code base goes in `local/videos/`; a decision video always
does. Only this repo's own videos and the sample app's live in `videos/`. **Why.** A private
code base's details must not reach a public repo. **Superseded in part.** An earlier draft of
`evidence-standard` routed any public, licensed code to `videos/`; the red team showed it clashed
with `AGENTS.md` (round 2), so the rule is the narrower one above.

### D6. One shared evidence standard (2026-10-17)
**Decision.** `evidence-standard` holds the rules every context, brief and critic skill shares:
four tags (`[stated]`, `[read]`, `[ran]`, `[inferred]`), a pin, safe running, absence claims,
where the result goes. **Why.** Round one found the same five gaps in four skills; one place
cannot drift. **Alternative.** Restating the rules per skill, which is what had drifted.
Research points the same way: a citation looks like evidence but is only a claim about a source,
so it must be checked like any other claim (<https://kodekloud.com/blog/ground-llm-answers-with-citations/>),
and one preprint reports checking each citation mechanically against retrieved code
(<https://arxiv.org/pdf/2512.12117>, self-reported, one study).

### D7. Pinning when there is no commit (2026-10-17)
**Decision.** Committed code is pinned to a full SHA. Vendored code needs both pins: this repo's
HEAD (what cites resolve against) and the upstream SHA from `SOURCE.md`, labelled, with an
uncompared upstream SHA counted as `[stated]`. Uncommitted code is handed over as a patch or a
content hash, not a branch. **Why.** The sample app has no history here, and a branch name
moves. **Superseded in part by D18:** the offline tree hash now exists.

### D8. Read-only by default, run in a throwaway copy (2026-10-17)
**Decision.** Understanding a code base must not change it. Runs happen in a scratch copy with
a scrubbed environment; installs are a network call and need consent. **Why.** Red-teaming
showed commands writing into the repo and a `.env` being loaded.

### D9. The safe-running envelope is a script, not advice (2026-10-17)
**Decision.** Running goes through `skills/evidence-standard/scripts/sandbox-run.sh`: an empty environment (PATH
and LANG only), `HOME` and `TMPDIR` inside the copy, no network, writes confined to the copy, **no controlling
terminal** (a new session with stdin from `/dev/null`, so a command cannot type into the caller's shell with
`TIOCSTI`: found and tested under a real pty), no signalling or inspecting other processes, the clipboard,
preference, window-server, keychain and LaunchServices daemons denied, a list of credential, history and
shell-startup files under the real home unreadable, and `open`, `osascript`, `screencapture`, `say` and
`shortcuts` denied. macOS only (`sandbox-exec`); elsewhere it refuses rather than run unsandboxed. Paths are
profile parameters, never text, and risky scratch directories are refused (system roots, home and its
ancestors, dot-directories and `~/Library` under home, `/Users/Shared`, the firmlink alias) before anything is
created in them. **Why.** Testing showed `env -i` does not block the network, a copy does not stop a command
writing to `../`, `cp -R` carries a `.env`, a failed `cd` wrote into the real repo, a quote in a directory name
spliced into the profile string and added write access (round five), a sandboxed command could type into the
caller's terminal (round six), and denying a tool by name does not deny the capability (the screen was readable
through CoreGraphics until the window server was denied). **It is not a confidentiality boundary.** Reads
outside the denied list are open, and any daemon not listed is reachable; treat what a sandboxed command can read
as disclosed to it. Claude Code itself isolates with Seatbelt and Bubblewrap, and sandboxing limits damage without
making untrusted code trustworthy.
Sources: <https://medium.com/@Koukyosyumei/how-claude-code-and-codex-sandbox-untrusted-code-ba39b493046a>
(returned 403 to an automated fetch; unverified), <https://dev.to/traceseal/how-to-sandbox-an-ai-coding-agent-and-what-a-sandbox-cannot-prove-h9b>.

### D10. Tokens and context come from the transcripts Claude Code already writes (2026-10-17)
**Decision.** `npm run usage` reads `~/.claude/projects/<repo>/<session>.jsonl` and its
`subagents/agent-*.jsonl`, counting each API call once (a call is streamed over several lines).
**Why.** Nothing to instrument, and it covers subagents. **Consequence.** It depends on Claude
Code's transcript format; `CLAUDE_PROJECTS_DIR` points it elsewhere. Output tokens are as recorded in the
transcript and may undercount a call still streaming when it was logged. A test covers the counting on a
synthetic file and on a content-free fixture cut from a real subagent transcript (14 lines, 8 calls); the
script also runs from a path with a space or a symlink (it used to print nothing and exit 0 there).

### D11. A sample application to test the skills on (2026-10-17; replaced by D21)
**Decision.** `sample_application/` was Miguel Grinberg's microblog (MIT), vendored unmodified with its
`.git` removed: familiar, about 1,800 lines, real engineering to find. It served as the target of the first
four red-team rounds. **Superseded by D21**, which replaces it.

### D12. Merge, do not rebase, a long-lived branch (2026-10-17)
**Decision.** `main`'s rename to ShipShow and its README and `AGENTS.md` rewrite were merged
into the feature branch. **Why.** The branch was already pushed; a merge avoids a force-push.
**Consequence.** Reference material (commands, files, layout) lives in `AGENTS.md`; the README
is short. Skills point at `AGENTS.md`.

### D13. The end goal is a Claude Code plugin (team, 2026-10-17)
**Decision.** The repo root is the plugin: `.claude-plugin/plugin.json` (name `shipshow`, **no
`version`**), `skills/`, `agents/critic.md`, and a one-plugin `.claude-plugin/marketplace.json` with
`source: "./"`. `claude plugin validate .` passes for the marketplace and the manifest (it checks only those two); its
only warning, and the only thing `--strict` rejects, is the missing `version`, which is deliberate
(below). Install (Claude Code 2.1.275 or later):
`claude plugin install shipshow --marketplace latent-variable/shipshow` (the form `claude plugin install --help`
lists; not run here, since installing changes the user's settings), which works once this is on `main`.
**Why.** It installs in other repositories, with updates from the marketplace. Setting `version`
pins users to it until someone bumps it, so it is omitted and the commit SHA versions the plugin.
**Facts from the docs that shaped it.** Only `name` is required, in kebab-case, and may not start
with `claude-`, `anthropic-`, `anthropics-` or `cc-plugin-`, or equal a reserved name. Skills load
namespaced as `/<plugin>:<skill>`. An enabled plugin's skill names and descriptions sit in context
every turn (measured: 22 skills, 7,882 characters, about 1,971 tokens), so descriptions stay short
and SKILL.md under 500 lines (longest 206). A bundled script is found with `${CLAUDE_SKILL_DIR}`, so
the scripts live inside their skills, not in `bin/`. `${CLAUDE_PLUGIN_ROOT}` is substituted in skill
and agent bodies, hooks and MCP configs, but is not exported to Bash-tool commands. A `CLAUDE.md` at
a plugin root is not loaded as context. A plugin runs with the user's privileges.
**The critic agent.** `agents/critic.md` gives a critic Read, Grep, Glob, Bash and Skill and tells it
not to write. Bash can write, so it is told, not enforced; the sandbox script is the enforcement for
anything it runs. `critic-loop` names `shipshow:critic` for Claude Code.
**Known limits, not fixed.**
- `source: "./"` copies every tracked file (`git ls-files` counts them; about half a megabyte when this was
  written, a fifth of it skills, agents and manifests; not checked by a test). The rest (the sample app, videos,
  docs, tests, `package-lock.json`) is dead weight in the user's plugin cache. A plugin in a subdirectory would fix it, but the skills,
  `npm run skills` and this repo's conventions live at the root; that restructuring is deferred.
- A `bin/` at a plugin root is the reserved executables directory: its files go on the Bash tool's
  `PATH`, and claude.ai and Cowork do not install a plugin that has one. Ours are non-executable,
  extension-named Node files, so they are inert on `PATH`; the target is Claude Code, so the second
  point does not bite.
- Installed in a clone of this repo, every skill loads twice (the plugin and `.claude/skills`).
- Skills refer to each other by bare name (`critic-loop`); how that resolves under the
  `/shipshow:` namespace is untested.
- Which skills work outside a clone: three. `code-context`, `change-context` and `evidence-standard` need
  no repo files (running code needs macOS, for the sandbox). The rest produce an artifact only the pipeline
  consumes (`decision-brief`, `explain-concept`, `glossary`, `narration-writing`, `explain-handoff`: a brief,
  a plan, names, a script, a hand-back) or run or judge it (`explainer-video`, `critic-loop`, the nine
  critics, `theme`, `tailor`), and need this repo cloned and set up. They also cite `AGENTS.md`. `local/` is
  gitignored only here, so a skill that writes private material elsewhere first checks `git check-ignore
  local/` and uses `.git/info/exclude` with the person's consent. `repo-context` is for this repo only.
- `claude plugin validate .` passes with one warning, the missing version, and looks only at the two manifests
  (a broken skill or agent file does not change its output: checked); `validate skills` and `validate agents`
  look at components but are lenient. So a test runs `validate .` when the CLI is present and asserts the
  warning is the version and nothing else, and another parses every `SKILL.md` and `agents/critic.md` front
  matter (name, description, tools).
- The root has a `package.json` and a lockfile, so an install may try to install Node dependencies into
  the plugin cache (the docs describe runtime dependencies; whether `devDependencies` such as
  `hyperframes` are installed is untested).
**Open.** The Kokoro and HyperFrames pipeline (a 340 MB model, about 190 MB of Chrome, a Python
virtual environment) is not installed by the plugin (PRD, open question 3). Sources:
<https://code.claude.com/docs/en/plugins>, <https://code.claude.com/docs/en/skills>,
<https://code.claude.com/docs/en/plugins/manifest-reference>,
<https://code.claude.com/docs/en/plugins/create-marketplace>.

### D14. A ninth critic, grounding (2026-10-17)
**Decision.** `critic-grounding` judges that every shown excerpt, command and output is genuine
and from the named pin. It owns shown code and output; `critic-accuracy` owns claims and prose;
`critic-sync` owns timing. **Why.** A claim can be true while the output shown for it was never
produced. **Consequence.** The check is decidable, so it is scripted (`skills/critic-grounding/scripts/check-excerpt.mjs`,
tested) rather than left as prose: each `…`-separated segment must be contiguous lines of the file, in order, and every
omitted gap is listed and flagged if it contains a guard, branch, return or default. Capture files carry command, working
directory, pin, exit code, date, an output hash and the full output. A critic returns a
per-asset table with its verdict.

### D15. Pace comes from measurement, not a formula (2026-10-17; superseded by D24)
**Decision (withdrawn).** Start `speed` at 0.8 and adjust it from the review packet, because words a
minute is not 190 times `speed`: the repo's own `videos/how-it-works/REVIEW.md` shows scenes at 176 to 209
words a minute at speed 1.0 and the 0.85 video at 168 and 171, and the packet's rate is speech-only, so
cutting words does not change it. **Superseded** when main (#7) made `speed` a multiplier on a base of about
160 words a minute that the person chooses; the measurement that a scene's rate varies stands.

### D16. A spoken alias is written into the script (2026-10-17)
**Decision.** Where two identifiers sound alike or one name covers two things, write the alias
in the script itself and show the literal on screen on the same cue. Captions come from the script,
so a caption shows the alias; `critic-accuracy`, `critic-consistency` and `critic-sync` are told that
a recorded alias with its literal on screen is not a mismatch. `video.json` `say` is for
pure pronunciation of a one-meaning word. **Why.** `say` is global, case-sensitive and
whole-word, so it cannot disambiguate one written name across scenes; it also changes the
voiced text while captions and cue timing use the written text, which trips `critic-sync`.

### D17. Decision videos hand back a checked brief (2026-10-17)
**Decision.** The explainer checks every claim in the brief against the code and lists each as
confirmed, contradicted or not checked; it derives each option's costs from the code, treating
the brief's list as a floor; an assumption it cannot check is named in the video and the
hand-back. A hand-back is `ready` only when every required critic passed. **Why.** Round one's
red team planted a wrong claim and a hidden cost; the first version of the skill surfaced
neither, and round two surfaced the wrong claim but not the thin cost. Round three added: briefs
number their claims (`C1`..), a cost needs a mechanism, the explainer re-runs absence searches over
the whole tree and traces the recommended option end to end, the working agent (not the explainer)
judges whether the pick still holds, `critic-decision` sees the code at the pin, and `ready` requires
the full required critic set, defined in `explain-handoff`.

### D18. The offline tree hash exists (2026-10-17; supersedes the open item in D7)
**Decision.** A vendored directory's `SOURCE.md` records the upstream commit's tree hash, and
`skills/evidence-standard/scripts/verify-vendored.sh <dir> <hash>` checks it offline: it rebuilds the
directory's committed tree (without `SOURCE.md`) from this repo's own objects, compares it, and fails on
edits and on untracked files. It writes no object into `.git` (tested by counting objects) and works from
any directory in the repo. **History.** It was first a recipe in the microblog's `SOURCE.md`; running that
verbatim found two bugs (a `git write-tree` that wrote into `.git`, and a diff check run against the
temporary index), and round four showed it printed "no uncommitted edits" while an untracked file existed.
It is now a script with tests.

### D19. Decidable checks are scripts, and every recipe in a skill is run as written (2026-10-17)
**Decision.** Where a check is decidable it is code with tests, not prose: the excerpt check
(`skills/critic-grounding/scripts/`: `excerpt.mjs` and the CLI `check-excerpt.mjs`), the sandbox runner
(D9), `capture.mjs` (record and verify a capture; the sidecar is the SHA-256 of the whole file, so a changed
exit code is caught too) and `verify-vendored.sh` (D18). **Why.** Round three found a blocking bug in the
first excerpt script (a path with a space or a symlink printed nothing and exited 0, a false pass) plus
blank-line, empty-input, ambiguity and indentation defects; round four found that segments were not checked
against each other (a statement could be shown inside a block it is not in), that piping the script to node
exited 0 silently, and that large inputs crashed. Several recipes I had put in skills were wrong when run
literally (`|| stop`, `git grep -E` with `\b`, a diff check against the wrong index, a sandbox that let
`pbcopy` and `defaults write` through, a recorder that read a command's own exit 3 as a refusal).
**Consequence.** A script fails closed: no segments, a missing `--ranges`, a bad path or bad input never
exits 0, and the CLI has no entry-point guard to fail silently. Each reported bug has a test in
`test/pipeline.test.mjs`. A command written into a skill is run verbatim before it ships.

### D20. Judges are Sonnet only here (2026-10-17)
**Decision.** The red-team rounds ran on Sonnet 5.5. **Why.** The workspace limits agents to Sonnet:
six Opus agents were rejected at once with HTTP 429 (a configured limit of one request per minute).
**Consequence.** Every judge shares the builder's model family, so self-preference bias applies
(<https://arxiv.org/html/2410.21819v1>) and the red-team record is evidence of what a Sonnet attacker
finds, not proof. `critic-loop` still recommends a stronger model for a public release "where the
account allows it".

### D21. The sample is a pacing service built by three agents in one day (2026-10-17; replaces D11)
**Decision.** `sample_application/` is `pacer-demo`, a toy ad-spend pacer of about 80 lines of
dependency-free Node (about 250 with its tests and scenario), written for this demo and not Aperiam's code. Three agents each take one task: budget
pacing, batched ledger writes, and EUR and JPY campaigns. Each is correct for its task and each gets its
tests green; the morning after, the same traffic gives a US campaign 111% of budget, a EUR one 93% and a
yen one 181%, and no note says why. **Why.** The goal is a problem a developer who manages many agents would
recognise ("that could have been me"). Aperiam describes itself as an adtech and martech investor with an
Ads arm doing "emerging tech orchestration" and portfolio companies it helps grow; budget pacing is a
plausible service for one of them, and an overspend nobody can explain is a familiar one. The earlier
assumption that the company handles multimodal data is not supported by its site and is dropped.
**Design.** The bug is in the interaction, not in any change: pacing compares USD cents with a budget in the
campaign's own minor units (yen have none, so a 15,000-yen budget is read as $150); the throughput agent's
batching makes pacing read stale spend, and it edited the older tests to `flushEvery: 1`; the currency agent's
note says pacing needs no change; the one test that would catch it is marked `todo`. Real history: five
commits as patches, replayable (`history/replay.sh`) and checked by a test; the three hand-off notes each hold
one confident claim that turns out false; `ANSWER.md` is a labelled spoiler. **Why zero dependencies.** The
microblog needed Flask and an install the skills' safe-running rules forbid, so no agent could run anything;
this runs with `node --test`. **Checked** by a root test: the tests pass with two `todo` cases (EUR under budget, JPY over), the scenario prints
the documented percentages, and the README table matches.

### D22. The docs rule is structural and count-driven (2026-10-17; replaces the first form of the docs test)
**Decision.** `npm test` checks that both docs have content, that every skill is in the `AGENTS.md` table and
the PRD, every critic is in `critics.svg`, the plugin names match, that the numbers the docs quote (skills,
characters of descriptions, longest `SKILL.md`, test count, the number of critics) are the tree's as whole
numbers, that the PRD's `Last reviewed` date is not older than its last edit, and that every script a skill names
exists at the path it gives. In CI, a change to `bin/`, `kit/`, `template/`, `skills/`, `agents/`, `themes/`,
`test/`, `sample_application/`, `.claude-plugin/`, `.github/`, `package.json`, the lockfile, `requirements.txt`,
`README.md`, `AGENTS.md` or `CLAUDE.md` needs a docs change that adds at least 40 characters of text (a
punctuation edit or the review date does not count), or `docs: no change - <reason>` in the PR title or the
last non-merge commit (the CI checkout is a merge commit, which says nothing). **Why.** The round-four and
round-five auditors met earlier forms in letter while docs rotted: a trailing space, a punctuation edit, an
override on any commit, a substring match (`longest 142` satisfies `1420`), a reversed decision with its entry
untouched. **Still not caught:** a docs change that is real but wrong, a reversed decision whose entry someone
leaves true-sounding, and a PR title edit does not re-run CI unless the workflow listens for it. The rule makes
a stale number loud, not a stale claim.

### D23. The packet measures stillness and counts code in tokens (2026-10-17)
**Decision.** `bin/measure.mjs` holds the two measurements the review packet makes about on-screen time.
Reading time for code counts identifier tokens (`Author.followers.of_type` is four: an underscore splits one)
at 1.5 a second instead of words at 3.3, because a two-line query counted as 9 words passed the "short" check
while taking about ten seconds to read; a new *Stillness* table gives each scene's longest stretch with nothing new on screen.
`critic-pacing` holds the limit, so the number lives in one place.

### D24. Main's speed, themes and review plans are adopted (2026-10-17; supersedes D15)
**Decision.** After main moved (#7 to #10) this branch was merged and its own pace guidance withdrawn.
`speed` is the person's multiplier on a base of about 160 words a minute (1.25 by default;
`--speed`, `video.json` or `local/config.json`), `critic-pacing` judges each scene against 160 times it,
and an off-target scene is fixed with fewer or plainer words. How much review a video gets is a plan with
presets, dials and a floor (`npm run critics`; the builder sets `importance`), so `video.json` no longer
takes a `critics` list and the template does not carry one. A video's look is a theme with motion tokens.
**What this branch added to that design.** `critic-grounding` is on the floor for a video that shows code or
output (`shows_code` in `video.json`, or a `<pre>` or `<code>` in `scenes.html`), so no preset or critics
list removes it, and `explain-handoff` takes the critic set from the plan instead of listing it. The
template keeps `audience`, which two skills read. **Consequence.** The docs and `narration-writing` no longer
say "start at 0.8"; the review packet prints the speed and the target.

### D25. Rounds five and six hardened the scripts, and the reading check queues (2026-10-17)
**Decision.** `verify-vendored.sh` fails on gitignored files and on `--assume-unchanged` or `--skip-worktree`
edits, validates its arguments, forces off the repo-local settings that hide edits (`core.fsmonitor`, whose hook
it therefore never runs, `core.fileMode=false`, submodule `ignore=all`), uses the repo's common directory so a
linked worktree works, and leaves `.git/index` alone; it creates no new object, ref or index entry, and may
refresh the timestamp of an existing object. `capture.mjs` JSON-encodes its header (the command as an argv
array, so a newline cannot forge a header line or an exit status), compares hashes case-insensitively, exits 2
on unreadable input, refuses a command that is missing, starts with a dash or was killed, and writes each file
to a random temporary name and renames it into place, so a symlink the sandboxed command planted at the capture
path or its sidecar cannot redirect the write (found: it overwrote a victim file; a swapped parent directory is
refused too). Its `ok` means integrity, not provenance: an unkeyed hash can be forged, and a critic still re-runs
the command. The packet's reading check is a queue: a viewer reads in order, so text that lands together waits,
and anything unreadable before its scene ends is `late`; a highlight, or a line cued inside a block already
shown, adds no reading; a count, pulse or type entrance is photographed after it finishes. **Known limit:** a
closed stdout cannot be detected, because Node reopens it as `/dev/null` at startup; "no output is not a pass"
is the rule.

### D26. Setup picks a Python Kokoro supports (2026-10-17)
**Decision.** `npm run setup` runs `bin/setup.mjs`, which takes the first of python3.13 to 3.10, then
`python3`, that is in range; `doctor` checks the version. **Why.** The pinned `kokoro-onnx 0.6.1` requires
Python 3.10 to 3.13, and `python3` is 3.14 on a current Homebrew machine, where pip refuses it (checked).

### D27. OmniVoice is an optional second voice engine (main, #11; adopted 2026-10-17)
**Decision.** `engine` in `video.json` or `local/config.json` picks `kokoro` (the default, anywhere) or
`omnivoice` (higher quality, clones a voice from a 3 to 10 second clip, Apple Silicon only through MLX). It installs
into the same `.venv` through `npm run setup:omnivoice`, which calls `npm run setup`, so this branch's
supported-Python pick (D26) applies to both. `doctor` lists the engine as optional until asked with `--omnivoice`.
**Consequences recorded by main.** A clone is somebody's voice (clone yourself or someone who agreed; `local/` never
leaves the machine); OmniVoice can drop or repeat a word and nothing here hears it back (no speech recognition, D1);
a take's identity includes the voice file's bytes (the dropped words were fixed later, D31). This branch did not change any of it; the merge only combined
`doctor` (its version check and main's engine lines), `package.json` (both setup scripts) and the tests.

### D28. Review of #12: code in the scenes always gets the grounding critic; the scripts say "move aside", not "delete" (2026-10-17)
**Decision.** `shows_code` is true when `video.json` says so or when `scenes.html` holds code, so `"shows_code": false`
cannot lower the floor (`bin/lib.mjs`, `config`). `bin/setup.mjs` tells a person with an out-of-range `.venv` to
`mv .venv .venv.old`, and `verify-vendored.sh` leaves its temp directory to the operating system instead of
deleting it, in line with "the scripts never delete files".
**Costs.** A video cannot opt out of the grounding critic once it shows code; a verifier run leaves a small temp folder.

### D29. Main's launch theme, music bed and why-shipshow pitch video adopted (main, #13; 2026-10-17)
**Decision.** Merged main's third theme (`launch`), the optional music bed under the narration (needs `ffmpeg`, so `npm test`
needs it too, as CI already installs it) and the `videos/why-shipshow` pitch. In `bin/review.mjs` the packet keeps main's
syllables-a-minute pace target next to this branch's measured reading queue and stillness table; both import from
`bin/lib.mjs` and `bin/measure.mjs`. The skill count and description size did not change.
**Costs.** A machine without `ffmpeg` cannot load the test file (the music helper exits the process); install it first.

### D30. Main's caption rule for function words adopted (main, #14; 2026-10-17)
**Decision.** Merged main's caption fixes (a caption never ends on a function word, and carried function words never push one
past the 12-word limit) and the `how-we-built-it` video. Nothing on this branch touches captions; the merge was clean.
**Costs.** None known; the test count is now 47.

### D31. OmniVoice speed is a stretch after generation, never a shorter window (2026-10-17; corrects D27's consequence)
**Decision.** `bin/omnivoice.py` asks OmniVoice for each sentence at its natural length (mlx-audio's own sizing, padded
15%), trims the padding's silence from the take's edges, then applies `speed` with ffmpeg `atempo`, which keeps the pitch.
A take that comes out silent is voiced again with another seed (three tries). A reference clip over 10 s is trimmed at its
silent edges first, which keeps a transcript true, and cut at a pause only if it is still too long. A take's key records
the method, so old takes re-voice once.
**Why.** OmniVoice fills the duration it is given. Squeezed to 1.3x, 7 of 24 sentences of `why-shipshow` lost or garbled
words ("not a" vanished from "not a wall of logs"); generated at the natural length and stretched, none did, and none in
about 150 sentences across six videos (measured 2026-10-17 with Whisper, a diagnostic outside the pipeline: D1 stands).
The padding's silence was 13.8 s of a 67 s video. Eve's clip (built in, VCTK p361, CC BY 4.0) is one unbroken 9.3 s
sentence; cut at exactly 10 s it ended mid-word and short lines came out silent.
**Costs.** A changed speed re-voices every take, as before. `atempo` past about 1.5 starts to smear consonants; the
tested range stays 1.0 to 1.3.

### D32. Karaoke captions are a theme option (2026-10-17)
**Decision.** A theme sets `--cap-style: karaoke` and `--cap-words` (the line length); `bin/build.mjs` reads them from the
theme's CSS and wraps each caption word with its time as `data-word-at`; `kit/kit.js` lights the word being spoken (the
`--cap-hot` colour, a lift and a glow), keeps spoken words in the ink colour and unspoken ones dimmed. `plain` stays the
default, so `shipshow`, `paper` and `launch` are unchanged; `buildday` turns it on.
**Traps found building it.** A word timed as `data-at` was picked up by the cue engine and given the theme's entrance, so
unspoken words sat lower; hence `data-word-at`. A scaled word grows into the spaces beside it, so the lit word lifts and
glows instead. A line that continues its sentence appears at once and the gap between lines is 20 ms, under one frame:
fading each line in from nothing made the caption blink between lines (a sync critic caught it at 63.8 s).

### D33. The buildday theme and the horizon ambient (2026-10-17)
**Decision.** `themes/buildday` takes the LA AI Hackathon page's look (deep space navy, ember, ice and iris; Space Grotesk
and JetBrains Mono, both SIL OFL, in the theme folder) without its logo or name. `--ambient: horizon` draws a lit planet
rim low in the frame, rising slowly; it is marked as intentional overflow for HyperFrames' layout check. The README's
diagrams are drawn in the same look by `docs/assets/make-assets.mjs`, which embeds the fonts cut to the letters each
image uses, because an SVG shown as an image cannot load a font from anywhere else.
**Costs.** A scene written for a dark theme can look muddy in `paper` where it uses a light-on-dark gradient on text
(`invoice-leak`'s headings); the theme grid in the README shows it.

### D34. A decision video's folder may start with only the brief (2026-10-17)
**Decision.** `npm run new` scaffolds into a folder that holds nothing but the working agent's `brief.md` and keeps the
brief; any other file still refuses, so a video is never overwritten. The skill told the working agent to write the brief
first and `new` refused the folder, so the handoff could not run as written. `videos/invoice-leak` is the handoff run end
to end: a brief about `examples/ledgerly` (a fictional invoicing API with one authorization bug), a fresh Sonnet explainer
agent that built it, and four critic rounds with a floor re-check.
**Costs.** None known.

## Behaviour

What an agent or person observes. Each line is checkable against the cited file.

**The pipeline** (`bin/`, `kit/`)
- `voice` voices one sentence at a time and writes `timing.json`. A take is cached by its text,
  voice and speed, so inserting a sentence re-voices every later sentence in that scene (numbering restarts per
  scene; the cost per take has not been measured).
- `build` writes `index.html` from `scenes.html` and the timing. It stops on a cue word its
  scene never says and warns when a bare cue word occurs more than once in its scene. A cue
  matches the start of a spoken word across the whole scene, so use `word#n` or a distinctive
  word.
- `render` writes `out/<name>.mp4`; `make` chains voice, build, lint and render.
- `review` writes `review/packet.md` (words a minute while speaking, every pause, every cue's
  time and reading time, with code counted in tokens, the longest still stretch of each scene) and
  `review/frames/`. The packet measures; the critics judge.
- `usage` prints, per agent, API calls, input, output, cache-write and cache-read tokens,
  peak and last context, wall time and model, and a total; `--json` for data.
- `critic-grounding` runs `check-excerpt.mjs <source> <excerpt> --ranges ...`: exit 0 and `ok: true`
  only when every `…`-separated segment is consecutive source lines (blank lines ignored, relative
  indentation and text exact) at the stated lines and the segments sit at the same relative depth as in
  the source; exit 1 on a mismatch, an empty excerpt or an
  ambiguous or wrong range; exit 2 on bad usage or input. It lists each gap with a preview and flags
  guards, branches, decorators and early exits.
- `sandbox-run.sh <dir> <cmd>` runs with no network, writes confined to `<dir>` (paths are profile parameters, not
  text), the clipboard and preference daemons denied, and credential folders under the real home unreadable; it refuses (exit 3) where it cannot sandbox
  and exits 2 for `$HOME`, `/`, a directory holding `.git`, or bad usage.
- `capture.mjs record <dir> <file> -- <cmd>` writes a header, a `---` line and the raw output plus a
  `.sha256` of the whole file, and keeps the command's own exit code; `verify` exits 0 matching, 1 altered,
  2 unsupported (no sidecar). `verify-vendored.sh <dir> <hash>` prints MATCH only for the upstream tree with
  no edits and no untracked files.
- Scripts never delete files. Generated files are gitignored. The kit renders entrances on a
  cue (the list, `up` to `pulse` including `type`, `draw`, `count` and `highlight`, is in `AGENTS.md`); an
  exit, a swap and a connector between boxes need a custom `<script>`.

**The skills**
- A context line is `[tag] claim. path:line`, with `tested` or `untested` on behaviour lines.
  Nothing cites a line for absence, so it is `absent: <thing>; searched: <command>; result: none`.
- A change is read commit by commit as well as by range, because a range diff hides what a
  commit label disguises. A commit's label is a claim, not evidence.
- A decision brief states the decision as a question, every option with gains and costs, doing
  nothing as an option, the pick as the working agent's, and at least one assumption it has not
  verified. The explainer returns a hand-back whose first line is `Status: ready | not ready`.

**The loop** (`critic-loop`)
- One fresh agent per critic per round, run in parallel; nothing is rebuilt while a round runs.
  Findings carry a severity; a verdict is `fail` on any blocking or major finding. A finding
  that survives three rounds, two critics that contradict, or a round that only finds problems
  in the last round's fixes escalates to a human.

## How the design was tested

The skills and scripts were red-teamed by fresh adversarial agents, six per round, who planted defects of
their own choosing in a sample app and then attacked the skills, the scripts and these docs. Each round's
findings, what changed, and what is still open are in [`skills/REVIEW.md`](../skills/REVIEW.md); the
rounds so far found fewer blocking problems each time and caught more planted defects by the skills' own
method, while each fix exposed the next layer. Every judge was Sonnet (D20). The numbers belong in that
file, not here.
