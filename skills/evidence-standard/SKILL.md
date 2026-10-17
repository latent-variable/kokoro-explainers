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
and you read it. `[ran]` you ran it and saw it. `[inferred]` you conclude it from the above.
A runtime behaviour you only read is `[read]`, never `[ran]`. Where stated and read or ran
disagree, say so under **Findings**; the code wins.

```
[stated]   <claim>. <doc path>:<line>   checked: yes | no
[read]     <claim>. <path>:<line>   tested: <path>:<line> | untested
[ran]      <claim>. $ <command> (<copy>, copy of <pin>, <date>, <interpreter or tool version>, exit <n>) -> <first lines>
[inferred] <claim>. from: <path:line or claim IDs>
[ran|read] absent: <thing>; searched: <command>; result: none      ([ran] if a command produced it)
```

Number the lines (C1, C2, ...) when another document will refer to them. Paths are relative to
the repo root. A trace across files cites each location.

**Behaviour that lives in a dependency** (a framework's handling of a bad request, a library's
default) is not in the repo, so reading the call site does not settle it. Tag it
`[inferred] ... from: <requirements.txt:line pin>; library behaviour, not read, not run`, and put
it under Open questions until a run in a throwaway virtual environment settles it. A malformed-input
table that is mostly "unknown (library)" is an honest one.

## Universal claims and absence

"All", "always", "never", "every", "no", "none found": back each with a run or an exhaustive
search whose command is on the line, or tag it `[inferred]`. A search is case-insensitive, covers
the dependency file, config and deployment files as well as the source, and names its working
directory and pin (`grep -rniE 'limit|throttle' <dir>`). For a claim over a set (every route,
every endpoint), the evidence is the enumeration (`grep -rnE '@bp.route|login_required' <dir>`,
counted or pasted), so the exceptions are visible on the line. Absence has the one form above; use
it for every "none found" line, including a requirement or decision record that does not exist.
A claim about errors says what happens on malformed input: wrong content type, null, array or
scalar body, missing keys, wrong types, out-of-range values.

## Pin what you read

State once, in a **Scope** header, what you read, at what pin, what you did not read, and whether
you ran anything. Then cite against it.

- **Committed code**: the full SHA (`git rev-parse HEAD`). A branch name moves; it is not a pin.
- **Vendored code**: two labelled pins. The repo's HEAD, which `path:line` cites resolve against
  (`git show HEAD:<path>`), and the upstream SHA from its `SOURCE.md`. "Unmodified" is `[stated]`
  until you check it with the offline recipe in that `SOURCE.md` (read-only, any directory, and
  `git diff --quiet HEAD -- <dir>` for uncommitted edits). Never pin vendored code to the repo's
  HEAD alone.
- **Uncommitted code**: a patch or a content hash (`git hash-object`, or a hash of a tar) beside
  the context. A local branch only if the person asks. Do not push.
- **A change**: `Base: <sha>  Head: <sha>  Merge-base: <sha>  Commits: <list>`. Re-run
  `git rev-parse` before you finish; if the head moved, redo it.

If no pin is possible, write "unpinned, read on <date>"; the reader then knows it can drift.

## Run code safely, or do not run it

Run only inside this envelope and record it as `[ran]`. Otherwise the claim stays `[read]` or
`[inferred]` with "not run: <why>".

1. **A throwaway copy of the pinned code.** `git clone --no-hardlinks <repo> <tmp> && cd <tmp> &&
   git checkout <sha>` is the faithful form. `git archive <sha> [<subdir>] | tar -x -C <tmp>` is
   quicker but honours `export-ignore` and `export-subst` in `.gitattributes`, so it can drop or
   rewrite files: compare `git ls-tree -r <sha> --name-only` with what you extracted. `git worktree
   add` writes into the source repo's `.git`; use it only on a repo you own. Never run in the
   target's own tree or by switching the user's checked-out branch. In the copy, delete `.env*`,
   `.flaskenv` and any other dotfile the code reads for configuration, `.git`, and local databases;
   the app may load them even under a scrubbed environment.
2. **`cd "<copy>" || exit 1` before anything that writes.** A relative path that runs after a
   failed `cd` writes into the real repo; this happened in testing. (`stop` is not a command.)
3. **Run through `scripts/sandbox-run.sh <copy> <command>`** (next to this file; it is
   `${CLAUDE_SKILL_DIR}/scripts/sandbox-run.sh` when this skill is invoked). It starts from an empty
   environment, sets `HOME` and `TMPDIR` inside the copy, denies the network, confines writes to the
   copy, denies reading `~/.ssh`, `~/.aws`, `~/.gnupg`, `~/.kube` and gcloud config, and denies
   `open` and `osascript`. Tested on macOS (`sandbox-exec`). It refuses on any other system rather
   than run unsandboxed; on Linux `bwrap --unshare-net` is the likely tool and is untested here.
   Known limits: reads elsewhere are not confined, BSD `mktemp` with no template ignores `TMPDIR`
   and fails, and it is not a defence against hostile code. Point every service URL the code reads
   (database, cache, queue, mail, search) at a temp or dead value too, because defaults such as
   `redis://` name a developer's real local service.
4. **Dependencies.** Installing is a network call. If the caller has approved it, install into a
   temporary virtual environment before the sandboxed run. If not, or if you cannot ask, do not:
   record "not run: deps not installed" and list running it as an Open question. Without
   dependencies only syntax and static checks run; tag them `[ran]` and say what they do not show.
   A pinned requirements file may not install on the current interpreter; record which Python the
   pins target.
5. **Never run**: a migration or upgrade against anything but a throwaway database; anything that
   sends email, calls a paid or external API, reindexes a search service, starts a worker or
   server on a shared port, or deploys.

A run records its command, the copy's path, the pin, the date, the tool version and the exit code,
and the first lines of output. For a video, save the whole capture as a file with those, the
SHA-256 of the raw stdout and stderr bytes in a sidecar file, and any failing cases left in.

## What you were handed is a lead

A brief, a `sources.md` you did not write, a README's claim: tag it `[stated]` and check it. In
**Findings**, list each handed-in claim by ID as confirmed, contradicted or not checked, with
`path:line`. Re-run a handed-in "absent:" search yourself over the whole pinned tree rather than
copying its command. A contradicted or unchecked claim that matters is named in the video and the
hand-back (`explain-handoff`).

## Where the result goes

`videos/<name>/` for this repo's own code and the vendored `sample_application/`. `local/` for any
other code base, any private or in-progress work, and every decision video and brief. This follows
`AGENTS.md`: this repo is public. **`local/` is gitignored in this repo only.** In another repo,
run `git check-ignore local/`; if it is not ignored, add `local/` to `.git/info/exclude` (local,
untracked) before writing anything private, or do not write private material there. Anything that
may reach a public repo has absolute paths and usernames scrubbed from its `[ran]` lines. "Never
inside the code base you are reading" means the directory you read. A context with no video is
`<videos or local>/<name>/context.md`; with a video it is that video's `sources.md`.
