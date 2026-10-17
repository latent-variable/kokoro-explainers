---
name: decision-brief
description: >
  Use when you are mid-work, need a person's call, and want a decision video made; or when you
  receive such a brief and must check it. Write the brief that hands a decision to a fresh
  explainer agent: the decision in one sentence, every option with what it gains and costs, doing
  nothing, the working agent's pick and reason, an assumption it has not verified, and the code to
  read at an exact pin.
---

# Decision brief

> **Needs a clone of the ShipShow repo**, set up with `npm install` (this skill uses `bin/`, `npm run` and
> `AGENTS.md`). Outside one, say so and stop; the plugin alone ships the understanding skills
> (`code-context`, `change-context`, `evidence-standard`).

A decision video is made by an agent that has *not* absorbed your reasoning, so it can see the
options as the person will. The brief is how you hand over the question. It states what you know.
It does not script the video, and it is not ground truth: the code is. `critic-decision` checks
the finished video against it. Follow `evidence-standard` for tags, pins and where things go.

Write it to `brief.md` in a new `local/videos/<name>/` in the ShipShow checkout, or in an absolute
scratch directory outside the code base (`evidence-standard`, *Where the result goes*). "The code base" is
the directory the brief pins and the explainer reads (here `sample_application/`, or the target repo), so
`local/videos/` in the ShipShow checkout is allowed, being gitignored and outside that directory; never
write inside the pinned directory. If you used a scratch directory, you copy `brief.md` into the video's
folder before starting the explainer, and `sources.md` cites the pin, not the copy. A decision video in
`local/` is never committed; only a person's explicit request to move it to `videos/<name>/` changes that.

## What it contains

Number every factual claim `C1`, `C2`, ... wherever it appears: in Why now, Gains, Costs, Evidence, If
nobody decides, **My pick, Not verified**, and in a date or an effort estimate. `C` belongs to the brief; the
explainer numbers its own `sources.md` lines `S1`.. and what it adds (a cost, an option) `X1`.., so the three
never collide.

```
Decision: <one sentence the person could answer yes/no or A/B/C>
Why now: <what is blocked until it is made>
Read: repo <absolute path> at <full sha>; upstream <sha, for vendored code>; for uncommitted code the
      stored patch <path> against that sha (a hash alone cannot be read), never a branch; the paths that matter
Person: <who decides, what they already know>
Options:
  A. <name>: <what it is>. Doing nothing is an option row too, or "= A" if the status quo is A.
     Gains: C1 ...
     Costs / breaks: C2 <mechanism>, <path:line>, and who or what it affects and what breaks. Never
       empty, never "none"; a cost with no mechanism ("some work") is not a cost: write "unknown".
     Evidence: <[tag] path:line | test | run>
  B. ...
If nobody decides: <what happens by default>. By when: <a source>, or "unknown", or "[stated] by me,
  unchecked".
My pick: <option> because <the reason, including what it trades away>
Pick rests on: <the claim IDs the reason depends on, C..>
Not verified: <at least one assumption that matters to the pick, which I did not check, and how the
  person can check it>
```

## The bar

- **The decision is a question, not a topic.** "Which store for X, A or B?", not "storage".
- **Every option has both sides**, including the one you favour and doing nothing. If you cannot name
  a cost with a mechanism, you have not understood it yet; trace your favourite option hardest.
- **The pick is the working agent's**, labelled as yours, with its reason, and **`Pick rests on`** lists the
  claims that reason depends on, so the person can see where they would differ and the hand-back can say
  which of them the code overruled. The video attributes it ("the agent working on this picks B").
- **Facts carry a tag and evidence** (`evidence-standard`). A "no X" claim has an `absent:` line over
  the whole tree, deployment and config files included. A date or an effort estimate needs a source,
  or is tagged `[stated] by the working agent, unchecked`.
- **A real unverified assumption is stated**, one the pick depends on. "None" is not an answer.
- **No script.** Do not write scenes, narration or what to show.

## Receiving one

If you are the explainer agent: open **Decision** and **Read** first, read the code at that pin, then
read the rest. You cannot ask the working agent; what you cannot settle goes in the hand-back.

1. **Check every numbered claim against the code** and put the result in `sources.md` under the same
   IDs: confirmed, contradicted, partly or not checked, each with `path:line` or the command. A claim
   stated as certain with no tag is `[stated]`; if the code cannot settle it, it is `not checked`, and one
   the pick rests on is named to the person. Re-run each `absent:` search yourself over the whole pinned
   tree (including deployment, config, dependency and docs files), case-insensitively and under several
   names for the thing (`convert|toUsd|usdCents|rate`, not one spelling); do not copy the brief's command
   (`evidence-standard`, *Universal claims and absence*).
2. **Record a thin cost as a brief fault.** A cost with no mechanism ("some load"), a "none", or an effort
   estimate or "by when" with no source goes in the hand-back as a fault in the brief, next to the cost you
   derived, and is named to the person if the pick rests on it.
3. **Derive each option's costs from the code yourself**, with `path:line` for each. The brief's list is a
   floor. Trace the recommended option end to end (entry point, client, storage, failure) and every
   option's path far enough to name what it needs that the brief omits.
4. Options the brief omits but the code reveals are added (`X1: added option <name>, <path:line>, not in
   brief`); an option the code does not support is dropped (`dropped option <name>, <path:line>`).
5. **Everything the code overruled or only partly confirmed, every cost or option you added, and every claim
   or assumption you could not check** (including a "by when") goes into the hand-back, by ID. What the pick
   rests on (`Pick rests on`), and every contradiction and added cost, is spoken in the video, attributed
   ("the agent says Redis is provisioned; unchecked"); the rest may be a row of an on-screen table. If
   there are too many to speak, group them by option, speak the ones on the pick's path first, and say in
   the video that more are in the hand-back; or hand back `not ready` and tell the working agent to fix the
   brief.

Then `explain-concept` and `explainer-video`; `critic-decision` joins the critics. If you cannot start
critics (a delegated agent may have no Agent tool), hand back `Status: not ready` with each critic `not
run`.

## Hand-back

The MP4's path, the call as framed, the pick, the brief-versus-code result by claim ID, and what is
unchecked: `explain-handoff`.
