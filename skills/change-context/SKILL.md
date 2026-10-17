---
name: change-context
description: >
  Build a grounded understanding of a change, not a code base: what a diff, pull request,
  branch or commit range does, why it was made, what behaves differently before and after,
  what it breaks or risks, and what it left alone, every statement traced to the diff,
  tests, description or a run. Load before explaining, reviewing or deciding about a
  development, a PR or a release, and for the sources of a feature, decision or release
  video.
---

# Change context

`code-context` describes a state of the code. A development is a *delta*: the person needs
to know what is different, why, and what it costs. Same bar: every statement names its
evidence, and stated, observed and inferred stay apart.

## The bar

How you get there is yours. The numbered items are what the result must show, and the commands in this
skill are one way that has worked, not a required sequence. Follow `evidence-standard` (tags, pins, safe
running, where it goes). For a change:

1. **Both ends are pinned**: `Base`, `Head`, `Merge-base` and the commit list, as full SHAs. A
   branch name moves; record what it pointed to, and re-check before you finish.
2. **Intent comes from people; behaviour comes from code.** The PR description, linked issues,
   commit messages and review comments say *why*; the diff, tests and runs say *what*. If none of
   them states a reason, write `Why: not stated (checked, empty: <sources>; unreachable:
   <sources>)` over those four. A message that names only the feature ("mute") states no reason.
   Do not infer a motive. A commit message that misdescribes or under-describes its diff is a
   finding: `Finding: commit <sha> says "<msg>"; the diff changes <behaviour>`.
3. **A commit's label is a claim, not evidence.** Read every hunk of every commit in the range. Set aside
   only hunks that are provably behaviour-neutral, and list each with its reason. Changed defaults,
   limits, ordering, comparison and boolean flips, exception types and status codes are never neutral;
   list them on their own. **A merge commit's own change is the hunks that match neither parent**, which
   is what a conflict resolution decides: for every merge in the range (`git rev-list --merges
   base..head`) run `git show --cc <merge>`; a line marked in both columns (`++`, `--`) is the merge's own,
   a line marked in one column came from one side. List each merge-made value as a Finding with its
   resolved value, unless a message states it. (`git log -p -m` shows the merge's whole diff against one
   parent, which makes every changed value look accounted for.) Then reconcile: each hunk of the range
   diff equals the value the last commit that touched that line added, or a merge's own resolution; a
   value that no commit's added lines and no merge resolution produced is a Finding.
4. **Every behavioural claim is a before and an after**, each with evidence; a new thing is absent
   at base, a removed one absent at head, each says how that was searched, and a thing added and
   then undone inside the range is recorded as both.
5. **Run the tests at base and at head** in a faithful scratch copy (`evidence-standard`, *Run code
   safely*), or say "not run: <why>" under Open questions. A green head run does not show that a
   changed assertion is harmless: with dependencies available, also run the **base** version of
   every changed test against the head code; a failure there is the evidence the assertion was
   weakened to fit.
6. **Unknowns are listed, never filled.**

## What it covers

- **Scope.** Files and modules touched, grouped by purpose, not by file order; what is incidental
  and set aside, but only hunks proven neutral under rule 3, each with its reason.
- **Why.** The problem, who hit it, what was tried or rejected. Quote the source; do not
  reconstruct a motive.
- **Behaviour before and after.** For each user- or caller-visible effect: inputs, outputs, errors,
  side effects, defaults, config and flags. Run the old and new inside the safe envelope; otherwise
  read the code paths and the tests.
- **Interfaces and compatibility.** Changed signatures, endpoints, status codes, response keys,
  schemas, file formats, config defaults and limits, env vars, dependencies and versions. Mark each
  `[breaking]` (callers must change), `[additive]` or `[internal]`, and say what a caller does
  about each breaking one.
- **Requirements touched.** Functional behaviour now guaranteed or no longer guaranteed, and
  non-functional effects (performance, reliability, security, observability, operations); see
  `code-context` for where each shows. Say which the change measurably affects and which you only
  suspect.
- **Data and migrations.** Each migration: its `revision` and `down_revision` read from the file
  (not the docstring's `Revises:` line, which can disagree), whether two migrations share a parent
  or a `down_revision` is a tuple, whether a `downgrade()` exists, whether models and migration
  agree, and what happens to existing rows. Run the tool's heads check on a throwaway database if
  you may; otherwise compute heads statically: `git grep -nE '^(down_)?revision[ :=]' <sha> --
  '*/versions/*.py'` (tolerates type annotations; `\b` is not portable in `git grep -E`), heads are the revision ids named by no
  `down_revision`. Tag it `[read]` and say the tool check was not run.
- **Evidence it works.** Tests added or changed and what they prove. For each changed test, show
  the old and new assertion and say whether it widens, narrows or moves what is guaranteed. What is
  *not* tested. CI status as observed, not assumed.
- **Risk and rollback.** What could go wrong, what migrates, what is irreversible, how to undo it,
  and dead code or a half-live feature left by a partial revert.
- **Left alone.** What a reader might expect the change to cover and it does not.
- **Open questions.** Including review threads still unresolved.

## Reading the change

One way that has worked (any route that meets the bar is fine). For a PR: `gh pr view <n> --json title,body,commits,files,reviews` and `gh pr diff <n>` (say "gh
unavailable" if it is). For a range: `git rev-parse` for both ends, `git merge-base`, and `git rev-list
--reverse <base>..<head>` for the `Commits:` list (full SHAs; side-branch commits of a merge are in it),
then **all three** of `git log -p <base>..<head>` for each commit, `git show --cc <merge>` for each merge
(rule 3), and `git diff <base>...<head>`. The range diff squashes commits and hides what a label disguises
and what was added and then reverted; the per-commit read hides what no single commit shows, and a
merge's own resolution hides in a diff against one parent. Reconcile them (rule 3). Write `${sha}:path`,
not `$sha:path`, in zsh. For a release: the release page, the changelog at the new tag and the pull
requests it lists (`explainer-video`). Read the tests with the code.

## Form

`context.md`, or the video's `sources.md` when it feeds a video (where it goes: `evidence-standard`).
The change in two sentences, the pinned ends (`Base / Head / Merge-base / Commits`), then tagged
lines in `evidence-standard`'s formats, then Findings and Open questions. Added and removed things are absence claims, so they carry the search and
are `[ran]` where a command produced it; add the compatibility mark and `tested:` to any behavioural
line. The marks: `[breaking]` callers must change; `[additive]` a new capability, nothing existing
changes; `[behaviour]` the same interface gives a different result, default or limit (say who is
affected); `[internal]` nothing a caller can observe. When unsure, do not choose `[internal]`.

```
[ran]  added: <thing>; absent at <base>: $ git grep -n <term> <base> -- <path> -> none; present <path>:<line> (head)   [additive]   tested: <path>:<line> | untested
[ran]  removed: <thing>; present <path>:<line> (base); absent at <head>: $ git grep -n <term> <head> -- <path> -> none   [breaking]   tested: <path>:<line> | untested
[read] <before>, now <after>. <path>:<line> (base), <path>:<line> (head)   [breaking|additive|behaviour|internal]   tested: <path>:<line> | untested
[read] added in <sha1>, removed in <sha2>: <thing>; net at head: <what remains>   tested: ... | untested
[read] merge <sha>: resolved <thing> to <value>; parents had <value1> and <value2>   [behaviour]
[read] test "<name>" <path>:<line>: <old assertion> (base) -> <new assertion> (head) | removed; widens | narrows | moves
[ran]  <claim>. $ <command> (<copy>, copy of <pin>, <date>, <tool version>, exit <n>) -> <output>
```

One line per assertion for a changed test, so a weakened and a deleted assertion in one test are both
recorded.

## Handing it on

- **To a video**: breaking changes first, then the new things worth using, then fixes
  (`explainer-video`). The tagged lines become `sources.md`; captured outputs carry their pin so
  `critic-grounding` can check them.
- **To a decision**: each alternative the change considered or could have is an option for
  `decision-brief`, with its gain and its cost.
- **To a reviewer or developer**: pair with `repo-context` when the change is to this repo.
