---
name: decision-brief
description: >
  Write the brief that hands a decision to a fresh explainer agent: the decision in one
  sentence, every option with what it gains and costs, what happens if nobody decides, the
  working agent's recommendation and reason, and the code to read at an exact commit. Load
  when you are mid-work, need a person's call, and want a decision video made; or when you
  receive such a brief and must check it.
---

# Decision brief

A decision video is made by an agent that has *not* absorbed your reasoning, so it can see
the options as the person will. The brief is how you hand over the question. It states what
you know. It does not script the video, and it is not the ground truth: the code is. The
explainer reads the code at the commit you name, and `critic-decision` checks the finished
video against this brief.

Write it to `brief.md` in a new `local/videos/<name>/` (create `local/`; it is gitignored). A
decision is about work in progress, so it goes there even when the code is this repo's;
where things go is in `evidence-standard`. The video is not committed unless the person asks.

## What it contains

```
Decision: <one sentence the person could answer yes/no or A/B/C>
Why now: <what is blocked until it is made>
Options:
  A. <name>: <what it is>
     Gains: ...   Costs / breaks: <never empty, never "none">   Evidence: <path:line or test or run>
  B. ...
Doing nothing: <an option row, with its gains and costs>. If nobody decides: <what happens by default, and by when>
My pick: <option> because <the reason, including what it trades away>
What I may have wrong: <at least one assumption, or the claims I checked and where>
Read: <full SHA, or the patch or hash if uncommitted (`evidence-standard`); the paths that matter>
Person: <who decides, what they already know>
```

## The bar

- **The decision is a question, not a topic.** "Which store for X, A or B?", not "storage".
- **Every option has both sides**, including the one you favour. If you cannot name a cost,
  you have not understood it yet.
- **Doing nothing is an option** and is listed, with its consequence.
- **Your recommendation is labelled as yours**, with its reason, so the person can see where
  they would differ. Naming "what I may have wrong" is part of the recommendation.
- **Facts carry evidence and a tag** (`evidence-standard`). A claim with no path, test or run
  is marked as a guess.
- **Exact pin.** A full SHA, never "the latest" or a branch. Uncommitted code is committed to a
  local WIP branch or handed over as a patch or a content hash; do not push it.
- **No script.** Do not write scenes, narration or what to show; that is the explainer's job.

## Receiving one

If you are the explainer agent: read the code first, then the brief.

1. **Check every brief claim against the code** and write the result into `sources.md` before
   scripting: confirmed, contradicted or not checked, each with `path:line`. A claim is a lead,
   not evidence (`evidence-standard`).
2. **Derive each option's costs from the code yourself.** The brief's list is a floor. A blank
   or "none" cost is a defect: report it and fill it from the code.
3. Options the brief omits but the code reveals are added; options the code does not support
   are dropped.
4. Every contradiction, and every cost you added, goes into the video and the hand-back.

Then `explain-concept` and `explainer-video`; `critic-decision` joins the critics.

## Hand-back

The explainer returns the MP4's path and a few lines: the call as framed, the
recommendation, and anything where the code overruled the brief. See `explain-handoff`.
