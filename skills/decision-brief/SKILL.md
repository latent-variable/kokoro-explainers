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

Write it to `brief.md` in a new `local/videos/<name>/` (create `local/`; it is gitignored). A
decision is about work in progress, so it goes there even when the code is this repo's or the
vendored sample. The video is not committed unless the person asks.

## What it contains

```
Decision: <one sentence the person could answer yes/no or A/B/C>
Why now: <what is blocked until it is made>
Read: <full SHA; for vendored code the repo HEAD and the upstream SHA; for uncommitted code a
       patch or hash (never a branch); and the paths that matter>
Person: <who decides, what they already know>
Options:
  A. <name>: <what it is>. Doing nothing is an option row too, or "= A" if the status quo is A.
     Gains: ...
     Costs / breaks: <never empty or "none"; each with path:line, or marked "my guess">
     Evidence: <[tag] path:line | test | run>
  B. ...
If nobody decides: <what happens by default; by when, or "unknown">
My pick: <option> because <the reason, including what it trades away>
Not verified: <at least one assumption I did not check, and how the person can check it>
```

## The bar

- **The decision is a question, not a topic.** "Which store for X, A or B?", not "storage".
- **Every option has both sides**, including the one you favour and doing nothing. If you cannot
  name a cost, you have not understood it yet.
- **The pick is the working agent's**, labelled as yours, with its reason, so the person can see
  where they would differ. The video attributes it ("the agent working on this picks B").
- **Facts carry a tag and evidence** (`evidence-standard`). A "no X" claim has an `absent:` line.
  A claim with neither is marked as a guess.
- **A real unverified assumption is stated.** "None" is not an answer.
- **No script.** Do not write scenes, narration or what to show.

## Receiving one

If you are the explainer agent: open **Decision** and **Read** first, read the code at that pin,
then read the rest.

1. **Check every brief claim against the code** and put the result in `sources.md`, by claim: confirmed,
   contradicted or not checked, each with `path:line` (`evidence-standard`, *What you were handed
   is a lead*).
2. **Derive each option's costs from the code yourself**, with `path:line` for each. The brief's
   list is a floor: a cost you find that it omits is a defect in the brief, whatever it said.
3. Options the brief omits but the code reveals are added. An option the code does not support is
   dropped, and `sources.md` records it as dropped with `path:line`.
4. **Everything the code overruled, every cost you added and every assumption you could not
   check** goes into the video and the hand-back.

Then `explain-concept` and `explainer-video`; `critic-decision` joins the critics.

## Hand-back

The MP4's path and the call as framed, the pick, the brief-versus-code result and what is
unchecked: `explain-handoff`.
