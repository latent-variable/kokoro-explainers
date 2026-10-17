---
name: evidence-standard
description: >
  The shared rules for grounding a claim about code: how to tag what kind of knowing it is,
  what to pin it to when there is no commit, how to run code without harm, how to state that
  something is absent, and where the result goes. Load with `code-context`, `change-context`,
  `decision-brief` or `critic-grounding`, or whenever you write or check a line of evidence.
---

# Evidence standard

One place for the rules the context, brief and critic skills share, so they cannot drift.

## Tag every line

`[stated]` a README, doc, spec or comment says so. `[read]` the code or config says so, and
you read it. `[ran]` you ran it and saw it. `[inferred]` you conclude it from the above.
Read and ran are different strengths: a claim about runtime behaviour that you only read is
`[read]`, never `[ran]`. Where stated and read or ran disagree, say so in a **Findings** list;
the code wins.

A line is one claim, its tag and its evidence: `[read] <claim>. <path>:<line>`. A trace across
files cites each location. Where the code has tests, say which claim a test covers; a claim
resting on code alone is marked `untested`.

## Universal claims need more

"All", "always", "never", "every", "no": back each with a run or an exhaustive search whose
command is on the line, or tag it `[inferred]`. A claim about errors or edge cases also names
what happens on malformed input.

## Absence

Nothing cites a line for "nothing else happens". Write
`[read] absent: <thing>; searched: <command or glob>; result: none`, so anyone can re-run it.

## Pin what you read

State once, in a **Scope** header: the commit you read (full SHA), what you did not read, and
whether the code was run. Then cite `path:line` against it.

- **Committed code**: `git rev-parse HEAD`. A branch name is not a pin; it moves.
- **Vendored code**: the upstream SHA from its `SOURCE.md`, and say the tree was compared or
  not.
- **Untracked or uncommitted code**: commit it to a local WIP branch, or save a patch or a
  content hash (`git hash-object`, or a hash of a tar) next to the context. Do not push.
- **A change**: both ends, full SHAs, and the merge-base.

If no pin is possible, say "unpinned, read on <date>"; a reader then knows the claim can drift.

## Run code safely, or do not run it

Run only inside this envelope, and say what you ran as `[ran]`:

- In a **throwaway copy** (`cp -R` to a temp folder, or `git worktree add`). Never in the
  target's own tree, and never by switching the user's checked-out branch.
- With a **scrubbed environment** (`env -i` plus the PATH it needs), no `.env`, and none of the
  target's real secrets, database, mail, search or queue URLs.
- **No network**, `PYTHONDONTWRITEBYTECODE=1` or the equivalent, and a throwaway database.
- **Installing dependencies is a network call**: ask first, or do not.

Never run: a migration or upgrade against anything but a throwaway database; anything that
sends email, calls a paid or external API, reindexes a search service, starts a worker or
server on a shared port, or deploys. Not clearly inside the envelope: do not run it, and mark
the claim `[read]` or `[inferred]` with "not run: <why>".

A run goes on the line as `$ <command>` with its working directory, commit, exit code and the
first lines of output. For a video, save the full capture as a file with those four things.

## What a brief or source claims is not evidence

Claims handed to you (a brief, a `sources.md` you did not write) are leads. Check each against
the code before building on it, and list the result: confirmed, contradicted, or not checked,
with `path:line`. A contradicted claim is named in the video's hand-back.

## Where the result goes

| The code is | It goes in |
|---|---|
| Public and licensed for this repo (a vendored sample, this repo's own code) | `videos/<name>/` |
| Private, someone's work in progress, or not licensed for here | `local/` (create it; it is gitignored) |

Never inside the code base you are reading. The context is `context.md`, or `sources.md` when
it feeds a video.
