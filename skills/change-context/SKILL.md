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

1. **Both ends are named.** The base and the head, as commits or a tag range, and whether the
   change is merged. A "latest" is not a reference.
2. **Intent comes from people; behaviour comes from code.** The PR description, linked issues,
   commit messages and review comments say *why*. The diff, tests and runs say *what*. Where
   they disagree, that is a finding, and the code wins.
3. **Every behavioural claim is a before and an after**, each with evidence: "`x` returned 200
   with an empty body; now 400. `path:line` at base and at head."
4. **Unknowns are listed, never filled.** A reason you cannot find, a path you did not read, a
   test you could not run: say it, and where you looked.

## What it covers

- **Scope.** Files and modules touched, grouped by purpose, not by file order; what is
  incidental (formatting, renames, generated files) and set aside.
- **Why.** The problem, who hit it, what was tried or rejected. Quote the source; do not
  reconstruct a motive.
- **Behaviour before and after.** For each user- or caller-visible effect: inputs, outputs,
  errors, side effects, defaults, config and flags. Run the old and new where that is safe
  and cheap; otherwise read the code paths and the tests.
- **Interfaces and compatibility.** Changed signatures, endpoints, schemas, file formats, env
  vars, dependencies and versions. Mark each **breaking** (callers must change), **additive**,
  or **internal**, and say what a caller does about each breaking one.
- **Requirements touched.** Functional behaviour now guaranteed or no longer guaranteed, and
  non-functional effects (performance, reliability, security, observability, operations);
  see `code-context` for where each shows. Say which the change measurably affects and which
  you only suspect.
- **Evidence it works.** Tests added or changed and what they prove; what is *not* tested;
  CI status as observed, not assumed.
- **Risk and rollback.** What could go wrong, what migrates, what is irreversible, how to
  undo it.
- **Left alone.** What a reader might expect the change to cover and it does not.
- **Open questions.** Including review threads still unresolved.

## Reading the change

For a PR: `gh pr view <n> --json title,body,commits,files,reviews` and `gh pr diff <n>`. For a
range: `git log --oneline <base>..<head>` and `git diff <base>...<head>`. For a release: the
release page, the changelog at the new tag and the pull requests it lists (`explainer-video`).
Read the tests with the code: they are the change's own claim about behaviour.

## Form

`context.md` (or `sources.md` when it feeds a video): the change in two sentences, the base and
head, then the covered items as evidence-backed lines, then open questions. Each line is one
claim and its evidence:

```
- <before>, now <after>. <path>:<line> (<base>), <path>:<line> (<head>); test "<name>"
```

Another team's change goes in `local/`; this repo is public. A change to this repo that is to
be published as an example goes in the video's folder.

## Handing it on

- **To a video**: breaking changes first, then the new things worth using, then fixes
  (`explainer-video`). The evidence column becomes `sources.md`; captured outputs carry their
  commit so `critic-grounding` can check them.
- **To a decision**: each alternative the change considered or could have is an option for
  `decision-brief`, with its gain and its cost.
- **To a reviewer or developer**: pair with `repo-context` when the change is to this repo.
