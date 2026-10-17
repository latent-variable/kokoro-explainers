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

Follow `evidence-standard` (tags, pins, safe running, where it goes). For a change:

1. **Both ends are pinned**: full SHAs for base, head and the merge-base. A branch name is not
   a reference; it moves, so record what it pointed to.
2. **Intent comes from people; behaviour comes from code.** The PR description, linked issues,
   commit messages and review comments say *why*; the diff, tests and runs say *what*. If none
   of them states a reason, write `Why: not stated (looked at: <where>)`. Do not infer a motive.
   A commit message that misdescribes its diff is a finding.
3. **A commit's label is a claim, not evidence.** Read every hunk of every commit in the range.
   Set aside only hunks that are provably behaviour-neutral, and list each with its reason.
   Changed defaults, limits, ordering and status codes are never neutral; list them on their own.
4. **Every behavioural claim is a before and an after**, each with evidence; a new thing is
   "did not exist at base", a removed one "absent at head".
5. **Run the tests at base and at head**, in a worktree or scratch clone (`evidence-standard`),
   or say "not run" under Open questions.
6. **Unknowns are listed, never filled.**

## What it covers

- **Scope.** Files and modules touched, grouped by purpose, not by file order; what is
  incidental (formatting, renames, generated files) and set aside.
- **Why.** The problem, who hit it, what was tried or rejected. Quote the source; do not
  reconstruct a motive.
- **Behaviour before and after.** For each user- or caller-visible effect: inputs, outputs,
  errors, side effects, defaults, config and flags. Run the old and new where that is safe
  and cheap; otherwise read the code paths and the tests.
- **Interfaces and compatibility.** Changed signatures, endpoints, status codes, response keys,
  schemas, file formats, config defaults and limits, env vars, dependencies and versions. Mark each **breaking** (callers must change), **additive**,
  or **internal**, and say what a caller does about each breaking one.
- **Requirements touched.** Functional behaviour now guaranteed or no longer guaranteed, and
  non-functional effects (performance, reliability, security, observability, operations);
  see `code-context` for where each shows. Say which the change measurably affects and which
  you only suspect.
- **Data and migrations.** Each migration: its parent against the existing heads (run the
  tool's heads check on a throwaway database), whether a downgrade exists, whether models and
  migration agree, and what happens to existing rows.
- **Evidence it works.** Tests added or changed and what they prove. For each changed test,
  show the old and new assertion and say whether it widens, narrows or moves what is guaranteed; what is *not* tested;
  CI status as observed, not assumed.
- **Risk and rollback.** What could go wrong, what migrates, what is irreversible, how to
  undo it.
- **Left alone.** What a reader might expect the change to cover and it does not.
- **Open questions.** Including review threads still unresolved.

## Reading the change

For a PR: `gh pr view <n> --json title,body,commits,files,reviews` and `gh pr diff <n>` (say
"gh unavailable" if it is). For a range: `git rev-parse` for both ends, `git merge-base`, then
`git log -p <base>..<head>` or `git show --stat` per commit **as well as** `git diff
<base>...<head>`: the range diff squashes commits and hides what a label disguises, and
reverts inside the range. For a release: the release page, the changelog at the new tag and the
pull requests it lists (`explainer-video`). Read the tests with the code.

## Form

`context.md` (or `sources.md` when it feeds a video): the change in two sentences, the pinned
ends, then tagged lines, then Findings and Open questions:

```
[read] added: <thing>; did not exist at <base>. <path>:<line> (head)
[read] removed: <thing>. <path>:<line> (base)
[read] <before>, now <after>. <path>:<line> (base), <path>:<line> (head); test "<name>"
[ran]  $ <command> (<cwd>, <sha>, exit <n>) -> <output>
```

Where it goes: `evidence-standard`. Never write it inside the repo you are reading.

## Handing it on

- **To a video**: breaking changes first, then the new things worth using, then fixes
  (`explainer-video`). The evidence column becomes `sources.md`; captured outputs carry their
  commit so `critic-grounding` can check them.
- **To a decision**: each alternative the change considered or could have is an option for
  `decision-brief`, with its gain and its cost.
- **To a reviewer or developer**: pair with `repo-context` when the change is to this repo.
