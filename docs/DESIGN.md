# ShipShow: design decisions and behaviour

Keep this file current: a decision, or a change to how ShipShow behaves, is recorded here in
the same change (`AGENTS.md`, *Docs that stay current*). Requirements are in
[PRD.md](PRD.md). Add decisions at the end of the log; do not rewrite a past one, supersede it
with a new entry that names it. Dates are absolute.

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
(templates, fixed order); those are being marked as suggestions. Source: `AGENTS.md`.

### D5. This repo is public (2026-10-17)
**Decision.** A video about another code base goes in `local/videos/`; a decision video always
does. Only this repo's own videos and the vendored sample live in `videos/`. **Why.** A private
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
**Decision.** Record what testing showed: `env -i` does not block the network, a copy does not stop a
command writing to `../`, `cp -R` carries a `.env`, and a failed `cd` wrote into the real repo.
**Consequence.** Running goes through `skills/evidence-standard/scripts/sandbox-run.sh`: empty
environment, `HOME` and `TMPDIR` inside the copy, no network, writes confined to the copy, `~/.ssh`
and similar unreadable, `open` and `osascript` denied. macOS only (`sandbox-exec`); on any other
system it refuses rather than run unsandboxed. Tested: network, outside writes, `../`, `/dev/null`,
Python's tempfile. Known limits: reads elsewhere are not confined, BSD `mktemp` with no template
ignores `TMPDIR`, and it is not a defence against hostile code. Claude Code itself isolates with
Seatbelt and Bubblewrap, and sandboxing limits damage without making untrusted code trustworthy.
Sources: <https://medium.com/@Koukyosyumei/how-claude-code-and-codex-sandbox-untrusted-code-ba39b493046a>,
<https://dev.to/traceseal/how-to-sandbox-an-ai-coding-agent-and-what-a-sandbox-cannot-prove-h9b>.

### D10. Tokens and context come from the transcripts Claude Code already writes (2026-10-17)
**Decision.** `npm run usage` reads `~/.claude/projects/<repo>/<session>.jsonl` and its
`subagents/agent-*.jsonl`, counting each API call once (a call is streamed over several lines).
**Why.** Nothing to instrument, and it covers subagents. **Consequence.** It depends on Claude
Code's transcript format; `CLAUDE_PROJECTS_DIR` points it elsewhere. A test covers the
counting.

### D11. A vendored sample application (2026-10-17)
**Decision.** `sample_application/` is Miguel Grinberg's microblog (MIT, upstream commit in
its `SOURCE.md`), unmodified, with its `.git` removed. **Why.** A familiar domain, about 1,800
lines, and real engineering to find: a token API, a read-time timeline, a background-job queue,
optional search and translation. Used as the target for the red-team rounds.

### D12. Merge, do not rebase, a long-lived branch (2026-10-17)
**Decision.** `main`'s rename to ShipShow and its README and `AGENTS.md` rewrite were merged
into the feature branch. **Why.** The branch was already pushed; a merge avoids a force-push.
**Consequence.** Reference material (commands, files, layout) lives in `AGENTS.md`; the README
is short. Skills point at `AGENTS.md`.

### D13. The end goal is a Claude Code plugin (team, 2026-10-17)
**Decision.** The repo root is the plugin: `.claude-plugin/plugin.json` (name `shipshow`, **no
`version`**), `skills/`, `agents/critic.md`, and a one-plugin `.claude-plugin/marketplace.json` with
`source: "./"`. `claude plugin validate .` passes for the marketplace, the manifest, the skills and the agent; its
only warning, and the only thing `--strict` rejects, is the missing `version`, which is deliberate
(below). Install (Claude Code 2.1.275 or later):
`/plugin install shipshow --marketplace latent-variable/shipshow`, which works once this is on `main`.
**Why.** It installs in other repositories, with updates from the marketplace. Setting `version`
pins users to it until someone bumps it, so it is omitted and the commit SHA versions the plugin.
**Facts from the docs that shaped it.** Only `name` is required, in kebab-case, and may not start
with `claude-`, `anthropic-`, `anthropics-` or `cc-plugin-`, or equal a reserved name. Skills load
namespaced as `/<plugin>:<skill>`. An enabled plugin's skill names and descriptions sit in context
every turn (measured: 21 skills, 7,408 characters, about 1,850 tokens), so descriptions stay short
and SKILL.md under 500 lines (longest 139). A bundled script is found with `${CLAUDE_SKILL_DIR}`, so
the scripts live inside their skills, not in `bin/`. `${CLAUDE_PLUGIN_ROOT}` is substituted in skill
and agent bodies, hooks and MCP configs, but is not exported to Bash-tool commands. A `CLAUDE.md` at
a plugin root is not loaded as context. A plugin runs with the user's privileges.
**The critic agent.** `agents/critic.md` gives a critic Read, Grep, Glob, Bash and Skill and tells it
not to write. Bash can write, so it is told, not enforced; the sandbox script is the enforcement for
anything it runs. `critic-loop` names `shipshow:critic` for Claude Code.
**Known limits, not fixed.**
- `source: "./"` copies every tracked file: 142 files, about 520 KB, of which `skills/`, `agents/` and
  the manifests are about 103 KB. The rest (the sample app, videos, docs, tests, `package-lock.json`)
  is dead weight in the user's plugin cache. A plugin in a subdirectory would fix it, but the skills,
  `npm run skills` and this repo's conventions live at the root; that restructuring is deferred.
- A `bin/` at a plugin root is the reserved executables directory: its files go on the Bash tool's
  `PATH`, and claude.ai and Cowork do not install a plugin that has one. Ours are non-executable,
  extension-named Node files, so they are inert on `PATH`; the target is Claude Code, so the second
  point does not bite.
- Installed in a clone of this repo, every skill loads twice (the plugin and `.claude/skills`).
- Skills refer to each other by bare name (`critic-loop`); how that resolves under the
  `/shipshow:` namespace is untested.
- Which skills work outside a clone: the understanding and brief skills (`code-context`,
  `change-context`, `evidence-standard`, `decision-brief`, `explain-concept`, `glossary`,
  `narration-writing`, `explain-handoff`) with caveats (they cite `AGENTS.md` and `local/`; `local/`
  is gitignored only here, so they check and use `.git/info/exclude`). `explainer-video`, `critic-loop`,
  the nine critics (they judge `review/packet.md`) and `tailor` need this repo cloned and set up.
  `repo-context` is for this repo only.
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

### D15. Pace comes from measurement, not a formula (2026-10-17)
**Decision.** Start `speed` at 0.8 (the template and `AGENTS.md`) and adjust it from the review
packet. **Why.** An earlier skill said words a minute is about 190 times `speed`; the repo's own
`videos/how-it-works/REVIEW.md` shows scenes at 176 to 209 words a minute at speed 1.0, a spread of
about 19%, and scenes 1 and 2 of the shipped 0.85 video at 168 and 171. Words a minute is
speech-only (`bin/review.mjs`), so cutting words shortens a scene but does not change its rate.
The template used to ship `speed: 1.0`, about 190 and a `critic-pacing` fail; it is now 0.8.

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
**Decision.** `sample_application/SOURCE.md` records the upstream commit's tree hash
(`2c6e850f...`, from `gh api`) and a read-only recipe that reproduces it from this repo's own
objects, so "unmodified" is checkable with no network. **Checked:** it prints the same hash from any
directory, writes no object into `.git` (loose objects 365 before and after, with a tree that
needed a new one), and reports uncommitted edits. Running the recipe verbatim found two bugs in it
(a `git write-tree` that wrote into `.git`; a diff check that ran against the temporary index).

### D19. Decidable checks are scripts, and every recipe in a skill is run as written (2026-10-17)
**Decision.** Where a check is decidable it is code with tests, not prose: the excerpt check
(`skills/critic-grounding/scripts/check-excerpt.mjs`) and the sandbox runner (D9). **Why.** Round three
found a blocking bug in the first excerpt script (a path with a space or a symlink printed nothing
and exited 0, a false pass), plus blank-line, empty-input, ambiguity and indentation defects, and
found that recipes I had put in skills were wrong when run literally (`|| stop`, `git grep -E` with
`\b`, a diff check against the wrong index). **Consequence.** A script fails closed: no segments, a
missing `--ranges`, a bad path or bad input never exits 0. The test for each reported bug is in
`test/pipeline.test.mjs`. A command written into a skill is run verbatim before it ships.

### D20. Judges are Sonnet only here (2026-10-17)
**Decision.** The red-team rounds ran on Sonnet 5.5. **Why.** The workspace limits agents to Sonnet:
six Opus agents were rejected at once with HTTP 429 (a configured limit of one request per minute).
**Consequence.** Every judge shares the builder's model family, so self-preference bias applies
(<https://arxiv.org/html/2410.21819v1>) and the red-team record is evidence of what a Sonnet attacker
finds, not proof. `critic-loop` still recommends a stronger model for a public release "where the
account allows it".

## Behaviour

What an agent or person observes. Each line is checkable against the cited file.

**The pipeline** (`bin/`, `kit/`)
- `voice` voices one sentence at a time and writes `timing.json`. A take is cached by its text,
  voice and speed, so inserting a sentence re-voices every later take (about a second each).
- `build` writes `index.html` from `scenes.html` and the timing. It stops on a cue word its
  scene never says and warns when a bare cue word occurs more than once in its scene. A cue
  matches the start of a spoken word across the whole scene, so use `word#n` or a distinctive
  word.
- `render` writes `out/<name>.mp4`; `make` chains voice, build, lint and render.
- `review` writes `review/packet.md` (words a minute while speaking, every pause, every cue's
  time and reading time) and `review/frames/`. The packet measures; the critics judge.
- `usage` prints, per agent, API calls, input, output, cache-write and cache-read tokens,
  peak and last context, wall time and model, and a total; `--json` for data.
- `critic-grounding` runs `check-excerpt.mjs <source> <excerpt> --ranges ...`: exit 0 and `ok: true`
  only when every `…`-separated segment is consecutive source lines (blank lines ignored, relative
  indentation and text exact) at the stated lines; exit 1 on a mismatch, an empty excerpt or an
  ambiguous or wrong range; exit 2 on bad usage or input. It lists each gap with a preview and flags
  guards, branches, decorators and early exits.
- `sandbox-run.sh <dir> <cmd>` runs with no network and writes confined to `<dir>`, or refuses (exit 3)
  where it cannot sandbox, and exits 2 on bad usage.
- Scripts never delete files. Generated files are gitignored. The kit renders entrances on a
  cue (`up`, `fade`, `pop`, `left`, `right`, `grow`); exit, swap, arrows, highlight and counters
  need a custom `<script>`.

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

The new skills were red-teamed twice by five fresh adversarial agents each, planting defects of
their own choosing in a sample app and then attacking the skills. Round one: all five failed
the skills, and neither planted behaviour change nor planted wrong claim was caught by the
method. Round two: all five still failed, with fewer blocking findings and the traps caught more
often. The findings, what changed, and what is still open are in
[`skills/REVIEW.md`](../skills/REVIEW.md).
