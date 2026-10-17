---
name: evidence-standard
description: >
  Use with `code-context`, `change-context`, `decision-brief` or `critic-grounding`, or whenever
  you write or check a line of evidence. The shared rules for grounding a claim about code: how to
  tag what kind of knowing it is, what to pin it to when there is no commit, how to run code
  without harm, how to state that something is absent, and where the result goes.
allowed-tools: Bash(sh ${CLAUDE_SKILL_DIR}/scripts/*) Bash(node ${CLAUDE_SKILL_DIR}/scripts/*)
---

# Evidence standard

One place for the rules the context, brief and critic skills share, so they cannot drift. The scripts
named here are `sandbox-run.sh`, `capture.mjs` and `verify-vendored.sh`, in `${CLAUDE_SKILL_DIR}/scripts/`
(from the repo root: `skills/evidence-standard/scripts/`). Always call them by that full path: a call made after
`cd <copy>` has no relative `scripts/` to find, and the working directory in an installed plugin is the
user's repo.

## Tag every line

`[stated]` a README, doc, spec, brief or comment says so. `[read]` the code or config says so, and
you read it. `[ran]` you ran it and saw it. `[inferred]` you conclude it from the above. A runtime
behaviour you only read is `[read]`, never `[ran]`. Where stated and read or ran disagree, say so
under **Findings**; the code wins. An untagged claim stated as certain is `[stated]`, and `not
checked` if the code cannot settle it.

```
[stated]   <claim>. <doc path>:<line>     checked: yes (compared with the code) | no (only quoted)
[read]     <claim>. <path>:<line>         tested: <path>:<line> | untested
[ran]      <claim>. $ <command> (<run dir>, copy of <pin>, <date>, <tool version>, exit <n>) input: <body, env or fixture> -> <first lines>
[inferred] <claim>. from: <path:line or claim IDs>
[ran]      absent: <thing>; searched: <command>; result: none        (a command produced it)
[read]     absent: <thing>; searched by reading <paths>; result: none   (a manual read)
[inferred] <claim>. unknown (library): run <what would settle it>; from <requirements pin>
```

Number the lines (C1, C2, ...) when another document will refer to them. Paths are relative to the
repo root. A trace across files cites each location. Mark the lines a narration may use with `*`, so
the uncapped evidence stays and the script draws from a short list.

**Behaviour that lives in a dependency** (a framework's handling of a bad request, a library's
default) is not in the repo, so reading the call site does not settle it. Tag it as the last form
above and list it under Open questions until a run in a throwaway virtual environment settles it. A
malformed-input table that is mostly "unknown (library)" is an honest one. Reasoning from the code
about Python or JavaScript operators and truthiness on parsed input is `[read]`, not library behaviour.

## Universal claims and absence

"All", "always", "never", "every", "no", "none found": back each with a run or an exhaustive search
whose command is on the line, or tag it `[inferred]`. A clean search proves only that the *words* are
absent, so search the concept in several vocabularies and read the hits: for a limit, `grep -rniE
'limit|throttle|rate|quota|max|min\(|per_page|page_size|size|timeout|cap'` over the source, config,
dependency and deployment files, named by working directory and pin. Before an absence line about
limits, pagination or validation, say what such a thing looks like in this framework. For a claim over
a set (every route), the evidence is the enumeration, counted or pasted, so the exceptions are visible:
`grep -rniE '\.(route|get|post|put|patch|delete)\(|add_url_rule|before_request|login_required|_auth'
<dir>`, cross-checked against the framework's own route table when it can be run, else tagged inferred.
A claim about errors says what happens on malformed input (wrong content type, null, array or scalar
body, missing keys, wrong types, out-of-range values) and, for each error status, which handler layer
(blueprint, app, framework default) answers, whether content negotiation applies, and whether debug mode
changes it. A validation rule is compared across every entry point (form, API, CLI, model).

## Pin what you read

State once, in a **Scope** header, what you read, at what pin, what you did not read, and whether you
ran anything. Then cite against it.

- **Committed code**: the full SHA (`git rev-parse HEAD`). A branch name moves; it is not a pin.
- **Vendored code** (a directory whose `SOURCE.md` names an upstream commit or tree hash): two labelled pins. The repo's HEAD, which `path:line` cites resolve against
  (`git show HEAD:<path>`), and the upstream SHA from its `SOURCE.md`. "Unmodified" is `[stated]`
  until `sh "${CLAUDE_SKILL_DIR}/scripts/verify-vendored.sh" <dir> <upstream tree hash>` prints `MATCH` (read-only; it also
  fails on edits and on untracked files). It checks the repo it runs in, so run it before deleting
  `.git` from a copy; it does not verify an archive copy. Never pin vendored code to the repo's HEAD alone.
- **Uncommitted code**: a patch or a content hash (`git hash-object`, or a hash of a tar) beside the
  context. A local branch only if the person asks. Do not push.
- **A change**: `Base: <sha>  Head: <sha>  Merge-base: <sha>  Commits: <git rev-list --reverse base..head>`.
  A history that exists only as patches or a replay script inside the host repo (a synthetic one) has two
  pins: the host repo's HEAD, which the patches and notes resolve against, and the replayed repo's SHAs.
  Re-run `git rev-parse` before you finish; if the head moved, redo it. Write `${sha}:path`, not
  `$sha:path`: zsh reads the colon as a modifier.

If no pin is possible, write "unpinned, read on <date>"; the reader then knows it can drift.

## Run code safely, or do not run it

Run only inside this envelope and record it as `[ran]`. Otherwise the claim stays `[read]` or
`[inferred]` with "not run: <why>".

1. **One throwaway copy per pin.** The faithful form is `git clone --no-hardlinks <repo> <tmp> && cd
   <tmp> && git checkout <sha>`. `git archive <sha> <subdir> | tar -x -C <tmp>` (make `<tmp>` first) is
   quicker but honours `export-ignore` and `export-subst`: compare `git ls-tree -r --name-only <sha> --
   <subdir> | sort` with `(cd <tmp> && find <subdir> -type f | sort)`, and prefer the clone. `git
   worktree add` writes into the source repo's `.git`; use it only on a repo you own. Never run in the
   target's own tree or by switching the user's checked-out branch. Delete nothing from the copy. A
   clone or archive holds only tracked files, so it has none of your untracked `.env*`, `.flaskenv` or local
   databases; a dotfile the repo does track is repo content, so read it before running, since the app may
   load it even under a scrubbed environment. `git archive` goes further: it has no `.git` either. For a change, a copy at base and a copy at head,
   and the base's test files copied into the head copy (`git show ${base}:<path> > <copy>/<path>`).
2. **`cd "<copy>" || exit 1` before anything that writes.** A relative path that runs after a failed
   `cd` writes into the real repo; this happened in testing. (`stop` is not a command.)
3. **Run through `sh "${CLAUDE_SKILL_DIR}/scripts/sandbox-run.sh" <copy> <command>`.** It starts from an empty environment,
   sets `HOME` and `TMPDIR` inside the copy, denies the network, confines file writes to the copy, denies
   the clipboard and preference daemons (`pbcopy`, `defaults write`), denies reading `~/.ssh`, `~/.aws`,
   `~/.gnupg`, `~/.kube`, `~/.docker`, `~/.claude`, `~/.config`, the keychains and token files, and denies
   `open` and `osascript`. It refuses `$HOME`, `/` and a directory holding a `.git`. Pass the copy's root;
   run inside a subdirectory, or with a shell glob, through `sh -c 'cd <subdir> && ...'`; `node --test test/`
   needs the glob form (`test/*.test.mjs`) on Node 22. It adds `.sandbox-home` and `.sandbox-tmp`,
   which are not part of the pin. Tested on macOS (`sandbox-exec`); on any other system it refuses rather
   than run unsandboxed (Linux: `bwrap --unshare-net` is the likely tool and is untested here). Known
   limits: other reads are not confined, any daemon not listed is reachable, BSD `mktemp` with no template
   ignores `TMPDIR` and fails, and it is not a defence against hostile code. Point every service URL the
   code reads (database, cache, queue, mail, search) at a temp or dead value too: defaults such as `redis://`
   name a developer's real local service.
4. **Record a run you will show as a capture:** `node "${CLAUDE_SKILL_DIR}/scripts/capture.mjs" record <copy> <capture file> --
   <command>` (set `PIN` to the commit). It writes the header (command, dir, pin, date, exit), a line
   holding only `---`, the raw stdout and stderr, and `<capture file>.sha256`, the SHA-256 of the whole
   file. `capture.mjs verify <capture file>` recomputes it. Keep captures somewhere gitignored
   (`videos/<name>/review/` is) and scrub absolute paths and usernames before anything is published.
5. **Dependencies.** Installing is a network call. If the caller has approved it, install into a
   temporary virtual environment before the sandboxed run. If not, or if you cannot ask, do not: record
   "not run: deps not installed" and list running it as an Open question. Without dependencies only syntax
   and static checks run; tag them `[ran]` and say what they do not show. A pinned requirements file may
   not install on the current interpreter; record which Python the pins target.
6. **Never run**: a migration or upgrade against anything but a throwaway database; anything that sends
   email, calls a paid or external API, reindexes a search service, starts a worker or server on a shared
   port, or deploys.

## What you were handed is a lead

A brief, a `sources.md` you did not write, a README's claim: tag it `[stated]` and check it. In
**Findings**, list each handed-in claim by ID as confirmed, contradicted, partly or not checked, with
`path:line`. Re-run a handed-in "absent:" search yourself over the whole pinned tree rather than copying
its command. A contradicted, partly or unchecked claim that matters is named in the video and the
hand-back (`explain-handoff`).

## Where the result goes

Name the output root: this repo's checkout, or an absolute scratch directory outside the code base you
read. Never inside that code base ("the directory you read"), and never in its `.git` without the
person's consent. In this repo: `videos/<name>/` for its own code and a video about `sample_application/` (the directory
read is the sample, and `videos/` is outside it); `local/`
(gitignored here, and only here) for any other code base, any private or in-progress work, and every
decision video and brief. In another repo, a path under that repo is only for something the person
asked to keep there; otherwise use the scratch directory. Anything that may reach a public repo has
absolute paths and usernames scrubbed from its `[ran]` lines. A context with no video is
`<videos or local>/<name>/context.md`; with a video it is that video's `sources.md`.
