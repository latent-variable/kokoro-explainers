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

Write it to `brief.md` in a new `local/videos/<name>/` (a decision is about someone's work
in progress, and this repo is public).

## What it contains

```
Decision: <one sentence the person could answer yes/no or A/B/C>
Why now: <what is blocked until it is made>
Options:
  A. <name>: <what it is>
     Gains: ...   Costs / breaks: ...   Evidence: <path:line or test or run>
  B. ...
If nobody decides: <what happens by default, and how soon>
My pick: <option> because <the reason, including what it trades away>
What I may have wrong: <assumptions the person should check; where their call might differ>
Read: <worktree or commit, and the code paths that matter>
Person: <who decides, what they already know>
```

## The bar

- **The decision is a question, not a topic.** "Which store for X, A or B?", not "storage".
- **Every option has both sides**, including the one you favour. If you cannot name a cost,
  you have not understood it yet.
- **Doing nothing is an option** and is listed, with its consequence.
- **Your recommendation is labelled as yours**, with its reason, so the person can see where
  they would differ. Naming "what I may have wrong" is part of the recommendation.
- **Facts carry evidence.** A claim with no path, test or run is marked as a guess.
- **Exact commit.** "Read the code at `<sha>` on `<branch>`", never "the latest".
- **No script.** Do not write scenes, narration or what to show; that is the explainer's job.

## Receiving one

If you are the explainer agent: read the code first, then the brief. Where they disagree the
code wins, and the disagreement goes into the video and your hand-back, not into silence.
Options the brief omits but the code reveals are added; options the code does not support
are dropped. Then `explain-concept` and `explainer-video`; `critic-decision` joins the
critics.

## Hand-back

The explainer returns the MP4's path and a few lines: the call as framed, the
recommendation, and anything where the code overruled the brief. See `explain-handoff`.
