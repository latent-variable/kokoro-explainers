---
name: critic-loop
description: >
  Judge an explainer video with adversarial critics: a fresh agent per critic per round,
  never the agent that built it, each loading one critic skill and judging the video's
  review packet and frames. Collect structured findings, fix, rebuild, and run fresh
  critics until nothing blocking or major is left. Load after a video's first draft, after
  any change to one, or to add a new critic.
---

# Critic loop

The agent that built a video is the worst judge of it: it knows what it meant, so it sees
its intent instead of the frames. Its bias is to get it done. A critic's only bias is to
find what is wrong. So the builder never reviews its own work, and every round uses fresh
critics that have never seen the video before.

## Who runs it

The builder runs the loop and fixes the findings. It does not judge them away. For each
critic in `video.json` `"critics"` (default: all seven below), it starts a **new** agent:

- **Claude Code:** the Agent tool with a fresh general-purpose agent, never a fork (a fork
  inherits the builder's context, and with it the builder's bias). Sonnet is enough for most
  rounds; Opus for the final round of a video going public.
- **Codex:** `codex exec --sandbox read-only` from an empty folder, with the frames passed as
  `-i <absolute path>` and the brief on stdin.
- **Anything else:** any agent that starts with none of this conversation and can read files
  and images.

The critics are independent, so run them in parallel. **Never rebuild or regenerate the
packet while a round is running:** `review` replaces `review/frames/`, so a critic still
reading judges a mix of two versions and its verdict counts for neither. Collect every
finding first, then fix.

| Critic | Judges |
|---|---|
| `critic-accuracy` | Every claim, spoken or shown, against `sources.md` |
| `critic-clarity` | Whether the intended viewer understands it and knows what to do |
| `critic-pacing` | Speaking rate, pauses, scene length, time to read on-screen text |
| `critic-sync` | Whether what is shown matches what is being said, when it is said |
| `critic-visuals` | Legibility, contrast, layout, composition, every frame finished |
| `critic-consistency` | Same terms, names, look and conventions from start to end |
| `critic-engagement` | Whether the intended viewer would keep watching; design made for that persona |

## The brief

Give each critic objectives and evidence, never a procedure. How it looks is its business.

```
You are a critic for an explainer video. Review it yourself; do not delegate.
Load and follow skills/<critic>/SKILL.md. Judge only what that skill covers.
Evidence, in videos/<name>/:
  review/packet.md      the script with timings, pauses, cues, reading times
  review/frames/        stills after each cue and at each scene end (contact-sheet*.jpg)
  sources.md            the ground truth; a claim not supported here is a finding
  critics.md            this video's own bar, if present: it applies to you too
  video.json            who the video is for, its voice and speed
scenes.html and script/ are the source; read them only to point a fix at a line.
Return only the JSON below. Stop when your skill's criteria are covered.
```

## What a critic returns

```
{
  "critic": "critic-pacing",
  "round": 1,
  "verdict": "pass" | "fail",
  "findings": [
    {
      "id": "pacing-1",
      "severity": "blocking" | "major" | "minor",
      "objective": true,
      "where": "03-scenes, 32.9 s, frame-15",
      "what": "what is wrong, as a viewer meets it",
      "evidence": "the measurement, frame or source line that shows it",
      "fix": "the smallest change that fixes it"
    }
  ]
}
```

- **blocking:** wrong, misleading, unreadable or broken. A viewer is misinformed or lost.
- **major:** a viewer would notice and it makes the video clearly worse.
- **minor:** polish.
- **objective:** true when a measurement or a source settles it; false when it is taste.
- `verdict` is `fail` when any finding is blocking or major.

Save each one as `videos/<name>/review/round-<n>/<critic>.json`.

## The loop

1. Run the critics. Read every finding.
2. Fix every blocking finding, and every major one that is objective. A subjective major
   gets one pass: fix it or decline it with a reason, then do not re-litigate it.
3. Decline a finding that is wrong with evidence (the source line, the measurement), and
   record it. Never quietly "fix" a wrong finding.
4. Rebuild (`npm run make -- videos/<name> --draft`, `npm run review -- videos/<name>`),
   then run **fresh** critics. Only the critics whose ground the fixes touched need a new
   round; a failed critic always gets one.
5. **Look before you spend.** Before each new round, open the contact sheets yourself: a
   builder's glance catches overflow and mistimed cues for free (and `build` warns when a
   bare cue word occurs twice in its scene).
6. **Stop** when every critic passes. **Escalate to a human** when the same finding survives
   three rounds, two critics contradict each other, or a round only finds problems in the
   previous round's fixes.

Then write `videos/<name>/REVIEW.md`: each round, each critic's verdict, what was fixed,
what was declined and why. It is committed with the video, so anyone can see the bar it
cleared.

## A new critic

When something about the videos keeps bothering you, make it a critic. Copy one of the
critic skills to `skills/critic-<what>/SKILL.md` and keep its shape:

- **Judges:** one thing, named in a sentence, and what it does not judge (another critic's).
- **Evidence:** which parts of the packet, frames or sources it uses.
- **Criteria:** each with the severity a failure carries, measurable wherever possible.
- **Done:** when it stops.

Add it to the table above and to `README.md`. A bar that matters to one video only belongs
in that video's `critics.md` instead.
