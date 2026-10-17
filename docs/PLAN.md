# Plan: Claude best practices, applied to ShipShow

Written 2026-10-17. Nothing here is done; each step is a proposal with the fact that motivates it, the source, and how
to tell it worked. Sources are Anthropic's own docs and engineering posts, read by a research agent on 2026-10-17 (listed
at the end); where a source did not say something, it is marked **unconfirmed** rather than filled in. The repo facts
were measured on the same day.

## Progress

| Step | Status |
|---|---|
| 0.1 results folder per video | done by hand for `videos/pacer-dev-journey` (PR #20); 0.2 automates it |
| 2.0 commit project settings, 2.1 Bash guard, 2.2 protect files, 2.3 Stop hook, 2.7 read denials | done: DESIGN D37, `test/hooks.test.mjs` |
| 3.1 read-only critic (Write, Edit, NotebookEdit denied; the Bash hook is not done), 3.2 `maxTurns` and an explicit model | done: DESIGN D38, checked with a headless run |
| 1.3 trigger-first descriptions, 1.4 size ceiling (as a test), 1.6 `allowed-tools` | done: DESIGN D39; whether triggering is unchanged waits for the evals |
| 0.2 `bin/results.mjs` and `usage --since`; 2.6 dropped (usage.mjs reads the transcripts already) | done: DESIGN D40, `test/results.test.mjs` |
| everything else | not started |

## What the repo looks like today (measured)

| Fact | Value | Best-practice yardstick |
|---|---|---|
| `AGENTS.md` (read as `CLAUDE.md`) | 263 lines, 22 KB, loaded every session | Under 200 lines; cut lines whose removal would not cause mistakes |
| Skills | 22, descriptions 213 to 529 characters, all trigger-last ("Load when ..." at the end) | Trigger first; `description` plus `when_to_use` under 1,536 characters |
| Skill front matter in use | `name`, `description` only | Also: `allowed-tools`, `disable-model-invocation`, `when_to_use`, `paths`, `context: fork`, `hooks` |
| `agents/critic.md` | `tools` allowlist (Read, Grep, Glob, Bash, Skill), `model: inherit`, "told not to write", no `maxTurns`, no hooks | `disallowedTools`, `maxTurns`, scoped `hooks`, an explicit `model` |
| Hooks | none | 33 events; command, prompt, agent and http handlers |
| `.claude/` | **gitignored whole** (`.gitignore:21`), so `settings.json` and `rules/` cannot be committed | Project settings and rules are meant to be committed |
| Evals | none; checks are `npm test` and six hand-run red-team rounds | `claude plugin eval` exists (Claude Code 2.1.302) with `--ablation with-without` |
| Run data | `npm run usage` reads transcripts; nothing joins it to a video or a critic round | Record tokens, tool calls, runtime and errors per run |
| Judges | Sonnet only, same family as the builder | Anthropic's sources do not name self-preference bias (**unconfirmed** there); they do say a fresh context keeps a reviewer unbiased toward code it just wrote |

## Phase 0: measure first (so every later step has a number)

0.1 **A `results/` folder per video.** `videos/<name>/results/` holds `run.json` (start and end time, branch, pin, model,
    voice, speed, plan and importance), `usage-at-start.json` and `usage-at-end.json` with the delta (`npm run usage --
    --json`), the critic rounds (findings by critic and severity, who agreed), the captures, and a short `run.md`. The
    first one is this video's (`videos/pacer-dev-journey/results/`), written by hand; step 0.2 automates it.
    *Why:* "record tokens, tool-call counts, runtime and errors per run" (writing-tools-for-agents).
    *Done when:* a second video produces the same folder with no hand editing.
0.2 **`bin/results.mjs`** writes the folder from the transcript (`usage.mjs` already parses it), `timing.json`, the packet
    and `REVIEW.md`. Add a time window to `usage.mjs` (`--since <timestamp>`) so a run's cost is not the whole session's.
    *Done when:* `npm run results -- videos/x` produces `results/run.json` that a test validates.
0.3 **The numbers to compare against**, taken from 0.1 on the first three real videos: tokens per critic round against the
    estimate printed by `npm run critics` (about 520k for round one); rounds to pass; findings the person agreed with.

## Phase 1: shrink and sharpen always-on context

1.1 **Cut `AGENTS.md` below 200 lines.** Candidates: *A video's files* (73 lines), *How the timing works* and *Layout*
    become path-scoped rules or skill reference files; keep the traps, the commands and the "what is expected" bars.
    *Source:* memory docs (under 200 lines; imports do not reduce cost, so move, do not `@`-import).
    *Needs:* un-ignore `.claude/rules/` (step 2.0). *Done when:* `wc -l AGENTS.md` is under 200 and `npm test` still
    passes (the docs test names sections; update it with the move, and DESIGN gets a decision entry).
1.2 **Path-scoped rules.** `.claude/rules/video-files.md` with `paths: videos/**, template/**`; `kit-and-themes.md` with
    `paths: kit/**, themes/**` (the "never write a literal style tag" trap lives there); `sample-app.md` with
    `paths: sample_application/**` ("the bugs are the point; do not fix them here"). Loaded only when Claude reads a
    matching file. *Source:* memory docs, `.claude/rules` with `paths`.
1.3 **Trigger-first descriptions.** Rewrite each of the 22 so the first clause says when to load it. *Source:* skills
    docs (put the trigger first; the listing truncates). *Done when:* a test asserts every description starts with
    "Load" or a trigger phrase, and the total stays at or under today's 7,882 characters (docs count: PRD N6, DESIGN D13).
1.4 **Front-load each `SKILL.md`.** After compaction only the first 5,000 tokens of each invoked skill are kept.
    Measure the biggest (`critic-loop` 206 lines, `explainer-video` 196, `evidence-standard` 145) and make sure the
    bars come before the examples. *Source:* skills docs. *Done when:* a script prints each skill's token estimate and
    flags anything over 5,000 with its tail holding a rule.
1.5 **Trial `disable-model-invocation: true`** on `explainer-video`, `critic-loop` and `tailor` (they write files or
    spawn agents). It also removes their descriptions from context (about 1,400 characters). *Risk:* an agent no longer
    reaches for them on its own; they would be `/explainer-video` and named in `AGENTS.md`. *Done when:* the eval in 5.1
    shows no drop in the cases that should trigger them. Do not ship without that.
1.6 **`allowed-tools` for bundled scripts**, for example `Bash(node ${CLAUDE_SKILL_DIR}/scripts/*)` on `critic-grounding`
    and `evidence-standard`, so a critic is not asked to approve the same script every round. *Source:* skills docs.

## Phase 2: hooks and settings (rules that must hold every time)

CLAUDE.md is advisory; hooks and deny rules are enforced (memory and permissions docs). Today every hard rule in this repo
("never delete", "docs stay current", "the sample stays buggy") is prose plus CI.

2.0 **Commit project settings.** Change `.gitignore` from `.claude/` to `.claude/skills/` (the links `npm install`
    makes), so `.claude/settings.json` and `.claude/rules/` are tracked. Check `git status` shows no secrets first.
2.1 **PreToolUse guard on Bash** (`.claude/settings.json`, command hook, exit 2 with a reason on a match): `rm -r`,
    `rm -f`, `git restore`, `git checkout --`, `git clean`, `git push --force`, `git reset --hard`. This repo's rule is
    "scripts never delete files"; a contributor without the user-level hook has no guard today. *Source:* hooks guide
    (PreToolUse exit 2 or `permissionDecision: "deny"`; a hook block overrides allow rules).
2.2 **Protect what must not change.** PreToolUse on `Edit|Write` denying `sample_application/src/**` (the demo's bugs
    are the point), `videos/*/review/*.txt` and `*.sha256` (captures), and `package-lock.json`. Override by an env var for
    a deliberate change. *Source:* hooks guide (protect files).
2.3 **Stop hook that runs `npm test`** (about 7 s) and blocks with the failing test names; read `stop_hook_active` to avoid
    loops (Claude Code stops overriding after eight consecutive blocks). *Source:* hooks guide. *Why:* today a failing
    docs-count test is found by CI, not by the agent.
2.4 **Docs-rule hook** (Stop): if `bin/`, `kit/`, `skills/`, `template/` changed and neither `docs/PRD.md` nor
    `docs/DESIGN.md` has a substantive added text, block with the CI's own message. Reuse the CI check's code from
    `test/pipeline.test.mjs`, so the rule lives in one place. This shifts the check left of the PR.
2.5 **SessionStart context**: inject branch, whether `.venv` and `ffmpeg` exist (the cheap half of `npm run doctor`) and
    the current docs counts, as `additionalContext` (capped at 10,000 characters). Add a PostCompact hook that re-injects the
    three rules that must survive compaction (never delete, docs stay current, the builder never judges).
2.6 **Token logging**: a `SubagentStop` command hook appending one line per critic to `videos/*/results/agents.jsonl`
    (agent id, skill, tokens from its transcript). Output goes to a file, not to Claude. Feeds 0.1 without anyone remembering.
2.7 **Permissions**: `permissions.deny` for `Read(./.env*)` and `Read(./local/voices/**)` (a clone is somebody's voice);
    `sandbox.enabled` with `failIfUnavailable: true` for headless critic runs. *Source:* permissions and sandboxing docs.
    Note the sandbox covers shell commands only; file tools, MCP and hooks run outside it.

## Phase 3: harden the critic agent

3.1 **Make "told not to write" true.** In `agents/critic.md`: `disallowedTools: Write, Edit, NotebookEdit` and a
    frontmatter `hooks` PreToolUse on Bash that denies redirects and `tee`, `mv`, `cp`, `git` writes outside a scratch
    directory. (Frontmatter hooks run only while that agent is active, and project agent hooks only after the folder is
    trusted: **plugin-shipped agent hooks are unconfirmed; test before relying on them.**) *Done when:* a test spawns the
    critic with a prompt to write a file and the file does not appear.
3.2 **`maxTurns`** (a runaway critic burns a round's tokens) and an explicit `model: sonnet` instead of `inherit`, so the
    workspace's Sonnet-only limit is visible and a parent on another model cannot silently change the judge.
3.3 **Hand the critic only the packet and the criteria** (already the design); add a test that the prompt the loop builds
    contains no builder transcript. Writer/Reviewer is Anthropic's own pattern (best-practices).
3.4 **Structured output.** Each critic returns findings as JSON (severity, evidence path, quote), validated by a script,
    so `REVIEW.md` and `results/` are filled by code and an invented line number is caught (`check-excerpt` already does this
    for code).

## Phase 4: plugin hardening

4.1 **Clean-machine install test** (still open since the first PR): `claude plugin install shipshow --marketplace
    latent-variable/shipshow` into an empty `HOME`, then invoke a skill and the `critic` agent. Record the result in
    `skills/REVIEW.md`.
4.2 **`bin/` at the plugin root.** The docs say a plugin's `bin/` executables are added to the Bash PATH; ours is the
    pipeline (`voice.mjs`, `build.mjs`, ...). Check whether they are put on PATH, whether that matters (no execute bit,
    generic names such as `build`), and if so move them to `scripts/` or `pipeline/` with a DESIGN decision.
4.3 **Versioning, unconfirmed.** The docs say a `version` pins users until it changes; the research could not confirm how an
    absent `version` is handled (the repo assumes the commit SHA). Verify by installing at two commits (see 4.1).
4.4 **Ship nothing risky as a plugin hook.** Plugin hooks run on every user's machine. Keep the guards of Phase 2 in
    this repo's `.claude/settings.json`, not in `hooks/hooks.json`, unless a hook is harmless to everyone.
4.5 **Plugin-level `CLAUDE.md` is not loaded** (manifest reference), so nothing the plugin needs may live there; the
    skills already carry their own rules. Add a line to `docs/DESIGN.md` saying so.

## Phase 5: evaluate, with data and with an independent judge

5.1 **`evals/` with `claude plugin eval`.** Start with 20 to 50 cases from real failures (the red-team findings in
    `skills/REVIEW.md` are exactly that): `critic-grounding` flags a doctored excerpt; `evidence-standard` refuses an
    unpinned `[ran]`; `code-context` plus `change-context` find the pacer's two causes from `sample_application/` without
    `ANSWER.md`; `repo-context` names the espeak path-length trap. Deterministic graders first (does the output name
    `src/pacing.mjs:3`?), an LLM judge only where needed, with an "Unknown" verdict. *Source:* demystifying-evals.
5.2 **`--ablation with-without`** on the same cases, to see what the plugin adds over a bare agent. If a skill adds
    nothing, delete it or merge it: 22 skills cost about 1,971 tokens every turn.
5.3 **Several trials per case** and report pass@k and pass^k (a critic that is right once in three is not a gate).
5.4 **An independent judge.** All six rounds so far were Sonnet judging Sonnet's work. Anthropic's sources do not name
    the bias, so this is our own caution, not a cited rule; the cheapest test is to have a person label 20 critic findings
    right or wrong and compare with the judge's own severity. Do not use Opus here (rate limit); a human is the independent
    judge.
5.5 **Run the suite in CI** with `--threshold`, `--json` archived as an artifact, `--trust-plugin`, and pinned `--model`
    and `--judge-model`. Keep it off the required checks until it is stable (model runs cost money and vary).
5.6 **Skill-doctor / unused skills**: the skills page mentions `/skill-doctor` for unused skills (**unverified**); run it
    after a month of use and cut what is never triggered.

## Phase 6: cost control for the multi-agent loop

Anthropic measured agents at about 4x the tokens of chat and multi-agent systems at about 15x, worth it only when the task
is valuable and parallelizes; it says most coding tasks share context and fit poorly (multi-agent-research-system). A critic
round here is about 520k tokens by our own estimate.

6.1 **Replace mechanical critics with code.** `critic-pacing` and `critic-sync` judge numbers the packet already measures.
    A `bin/lint-packet.mjs` that turns the packet's own flags (late, short, still stretch, cue offset) into findings would
    run in milliseconds and leave the LLM critics to judgment (accuracy, clarity, grounding, engagement).
6.2 **Cap by importance** (exists: `quick`, `standard`, `thorough`); add a token ceiling per round from 0.3's measurements
    and have `npm run critics` refuse a plan that exceeds it without `--force`.
6.3 **Each critic gets an objective, an output format, its tools and its boundaries** (the multi-agent post's brief) and a
    scaled effort: one scene's frames for a sync check, not the whole packet.
6.4 **Stop when the findings stop being new**: if round two's findings are all repeats, stop (today the cap is 2).

## Order I would do it in

1. 0.1 (this run), 2.0, 2.1, 2.3 (a day: they make everything after safer and measurable).
2. 3.1, 3.2, 1.3, 1.6 (the critic becomes read-only in fact; descriptions trigger-first).
3. 0.2, 2.6, 5.1 (cases from the red-team findings), then 5.2 (is each skill earning its tokens).
4. 1.1, 1.2 (the AGENTS.md diet, once the Stop hook protects the docs rule).
5. 4.1 to 4.3 (clean-machine install), then 6.1.
6. 5.4 (the human-labelled sample) before claiming the critics are reliable.

## Sources

- Claude Code docs: memory (https://code.claude.com/docs/en/memory), best practices (.../best-practices), skills
  (.../skills), sub-agents (.../sub-agents), hooks (.../hooks) and hooks guide (.../hooks-guide), permissions
  (.../permissions), sandboxing (.../sandboxing), plugin manifest reference (.../plugins/manifest-reference), plugin evals
  (.../plugin-evals).
- Anthropic engineering: effective context engineering for AI agents, equipping agents for the real world with Agent Skills,
  building effective agents, writing tools for agents, how we built our multi-agent research system, demystifying evals for
  AI agents (all under https://www.anthropic.com/engineering/).

## Unconfirmed, to check before relying on it

Plugin-shipped agent hooks; how a missing plugin `version` is resolved; `/skill-doctor`'s behaviour; whether the
engineering posts' figures (25,000-token tool cap, compaction rules) are current; a public docs page for plugin evals
(one URL answered, another returned 404 for the research agent).
