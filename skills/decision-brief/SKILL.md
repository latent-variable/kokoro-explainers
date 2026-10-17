---
name: decision-brief
description: >
  Write the brief that hands a decision to a fresh explainer agent: the decision in one sentence,
  every option with what it gains and costs, doing nothing, the working agent's pick and reason,
  an assumption it has not verified, and the code to read at an exact pin. Load when you are
  mid-work, need a person's call, and want a decision video made; or when you receive such a
  brief and must check it.
---

# Decision brief

A decision video is made by an agent that has *not* absorbed your reasoning, so it can see the
options as the person will. The brief is how you hand over the question. It states what you know.
It does not script the video, and it is not ground truth: the code is. `critic-decision` checks
the finished video against it. Follow `evidence-standard` for tags, pins and where things go.

Write it to `brief.md` in a new `local/videos/<name>/` (check that `local/` is ignored:
`evidence-standard`). A decision is about work in progress, so it goes there even when the code is
this repo's or the vendored sample. A decision video in `local/` is never committed; only a
person's explicit request to move it to `videos/<name>/` changes that.

## What it contains

Number every factual claim `C1`, `C2`, ... wherever it appears (in Why now, Gains, Costs,
Evidence, If nobody decides), so the explainer and the hand-back can refer to it.

```
Decision: <one sentence the person could answer yes/no or A/B/C>
Why now: <what is blocked until it is made>
Read: repo HEAD <full sha> / upstream <sha, for vendored code> / patch or hash <h, for uncommitted
      code, never a branch>; the paths that matter
Person: <who decides, what they already know>
Options:
  A. <name>: <what it is>. Doing nothing is an option row too, or "= A" if the status quo is A.
     Gains: C1 ...
     Costs / breaks: C2 <mechanism>, <path:line>. Never empty, never "none"; a cost with no
       mechanism ("some work") is not a cost: write "unknown" instead.
     Evidence: <[tag] path:line | test | run>
  B. ...
If nobody decides: <what happens by default>. By when: <a source>, or "unknown", or "[stated] by me,
  unchecked".
My pick: <option> because <the reason, including what it trades away>
Not verified: <at least one assumption that matters to the pick, which I did not check, and how the
  person can check it>
```

## The bar

- **The decision is a question, not a topic.** "Which store for X, A or B?", not "storage".
- **Every option has both sides**, including the one you favour and doing nothing. If you cannot name
  a cost with a mechanism, you have not understood it yet; trace your favourite option hardest.
- **The pick is the working agent's**, labelled as yours, with its reason, so the person can see where
  they would differ. The video attributes it ("the agent working on this picks B").
- **Facts carry a tag and evidence** (`evidence-standard`). A "no X" claim has an `absent:` line over
  the whole tree, deployment and config files included. A date or an effort estimate needs a source,
  or is tagged `[stated] by the working agent, unchecked`.
- **A real unverified assumption is stated**, one the pick depends on. "None" is not an answer.
- **No script.** Do not write scenes, narration or what to show.

## Receiving one

If you are the explainer agent: open **Decision** and **Read** first, read the code at that pin, then
read the rest. You cannot ask the working agent; what you cannot settle goes in the hand-back.

1. **Check every numbered claim against the code** and put the result in `sources.md` under the same
   IDs: confirmed, contradicted or not checked, each with `path:line` or the command. Re-run each
   `absent:` search yourself over the whole pinned tree (including deployment, config, dependency and
   docs files); do not copy the brief's command (`evidence-standard`, *What you were handed is a lead*).
2. **Derive each option's costs from the code yourself**, with `path:line` for each. The brief's list
   is a floor. Trace the recommended option end to end (entry point, client, storage, failure) and
   every option's path far enough to name what it needs that the brief omits.
3. Options the brief omits but the code reveals are added: `added option: <name>, <path:line>, not in
   brief`. An option the code does not support is dropped: `dropped option: <name>, <path:line>`.
4. **Everything the code overruled, every cost or option you added, and every claim or assumption you
   could not check** (including a "by when") goes into the video, attributed ("the agent says Redis is
   provisioned; unchecked"), and into the hand-back.

Then `explain-concept` and `explainer-video`; `critic-decision` joins the critics.

## Hand-back

The MP4's path, the call as framed, the pick, the brief-versus-code result by claim ID, and what is
unchecked: `explain-handoff`.
