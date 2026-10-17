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

`[stated]` a README, doc, spec, brief or comment says so. `[read]` the code or config says so,
and you read it. `[ran]` you ran it and saw it. `[inferred]` you conclude it from the above,
and the line says `from: <lines>`. A runtime behaviour you only read is `[read]`, never `[ran]`.
Where stated and read or ran disagree, say so under **Findings**; the code wins.

```
[read]     <claim>. <path>:<line>   tested: <path>:<line> | untested
[ran]      <claim>. $ <full command> (<copy path>, copy of <pin>, exit <n>) -> <first lines>
[inferred] <claim>. from: <lines>
[read]     absent: <thing>; searched: <command>; result: none
```

Paths are relative to the repo root. A trace across files cites each location.

## Universal claims and absence

"All", "always", "never", "every", "no", "none found": back each with a run or an exhaustive
search whose command is on the line, or tag it `[inferred]`. A search is case-insensitive,
covers the dependency file as well as the source, and names its working directory and pin
(`grep -rniE 'limit|throttle' <dir>`). Absence has the one form above; use it for every "none
found" line, including a requirement or decision record that does not exist. A claim about errors
also says what happens on malformed input: wrong content type, null, array or scalar body,
missing keys, wrong types, out-of-range values. A blanket claim about a pattern ("every endpoint
is guarded") needs the exceptions found by search, not a sample.

## Pin what you read

State once, in a **Scope** header, what you read, at what pin, what you did not read, and whether
you ran anything. Then cite against it.

- **Committed code**: the full SHA (`git rev-parse HEAD`). A branch name moves; it is not a pin.
- **Vendored code**: two labelled pins. The repo's HEAD, which `path:line` cites resolve against
  (`git show HEAD:<path>`), and the upstream SHA from its `SOURCE.md`. "Unmodified" is `[stated]`
  until you check it; `SOURCE.md` gives the offline command when there is one. Never pin
  vendored code to the repo's HEAD alone.
- **Uncommitted code**: a patch or a content hash (`git hash-object`, or a hash of a tar) beside
  the context. A local branch only if the person asks. Do not push.
- **A change**: `Base: <sha>  Head: <sha>  Merge-base: <sha>  Commits: <list>`. Re-run
  `git rev-parse` before you finish; if the head moved, redo it.

If no pin is possible, write "unpinned, read on <date>"; the reader then knows it can drift.

## Run code safely, or do not run it

Run only inside this envelope, and record it as `[ran]`. Otherwise the claim stays `[read]` or
`[inferred]` with "not run: <why>".

1. **A throwaway copy.** Committed code: `git archive <sha> | tar -x -C <tmp>`. Otherwise `cp -R`,
   then delete `.env`, `.git` and local database files from the copy: the app may load a `.env`
   even under a scrubbed environment. `git worktree add` writes into the source repo's `.git`;
   use it only on a repo you own. Never run in the target's own tree or by switching the user's
   checked-out branch.
2. **Start with `cd <copy> || stop`.** A relative path that runs after a failed `cd` writes into
   the real repo; this happened in testing.
3. **A scrubbed environment**: `env -i PATH=<needed>`; no secrets. Point every service URL the
   code reads (database, cache, queue, mail, search) at a temp or dead value, because defaults
   such as `redis://` reach a developer's real local service.
4. **No network, by mechanism, not by instruction.** `env -i` does not block it. On macOS:
   `sandbox-exec -p '(version 1)(allow default)(deny network*)' <cmd>`, and to confine writes
   add `(deny file-write*)(allow file-write* (subpath "<real path>"))` using the physical path
   (`pwd -P`; `/var` is a symlink to `/private/var`). Both were tested on macOS. On Linux,
   `unshare -n` or `bwrap --unshare-net` (untested here). With no such mechanism, do not run a
   command that could reach the network.
5. **Dependencies.** Installing is a network call. If the caller has approved it, install into a
   temporary virtual environment. If not, or if you cannot ask, do not: record "not run: deps not
   installed" and list running it as an Open question.
6. **Never run**: a migration or upgrade against anything but a throwaway database; anything
   that sends email, calls a paid or external API, reindexes a search service, starts a worker or
   server on a shared port, or deploys.

A run records its command, the copy's path, the pin, the exit code and the first lines of output.
For a video, save the whole capture as a file with those, the date, a hash of the raw output, and
any failing cases left in.

## What you were handed is a lead

A brief, a `sources.md` you did not write, a README's claim: tag it `[stated]` and check it. In
**Findings**, list each handed-in claim by ID as confirmed, contradicted or not checked, with
`path:line`. A contradicted or unchecked claim that matters is named in the video and the
hand-back (`explain-handoff`).

## Where the result goes

`videos/<name>/` for this repo's own code and the vendored `sample_application/`. `local/` (create
it; it is gitignored) for any other code base, any private or in-progress work, and every
decision video and brief. This follows `AGENTS.md`: this repo is public. "Never inside the code
base you are reading" means the directory you read. A context with no video is
`<videos or local>/<name>/context.md`; with a video it is that video's `sources.md`.
