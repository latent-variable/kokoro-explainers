---
name: critic-loop
description: >
  Judge an explainer video with adversarial critics: a fresh agent per critic per round,
  never the agent that built it, each loading one critic skill and judging the video's
  review packet and frames. The video's critic plan (npm run critics) sets which critics,
  which models, how many rounds and to what severity; collect findings, fix, rebuild, and
  run fresh critics until the plan is met or its cap is reached. Load after a video's first
  draft, after any change to one, to change how much review a video gets, or to add a critic.
---

# Critic loop

> **Needs a clone of the ShipShow repo**, set up with `npm install` (this skill uses `bin/`, `npm run` and
> `AGENTS.md`). Outside one, say so and stop; the plugin alone ships the understanding skills
> (`code-context`, `change-context`, `evidence-standard`).

The agent that built a video is the worst judge of it: it knows what it meant, so it sees
its intent instead of the frames. Its bias is to get it done. A critic's only bias is to
find what is wrong. So the builder never reviews its own work, and every round uses fresh
critics that have never seen the video before.

## The plan: how much review a video gets

Review is where a video's time goes, so it has dials, and a cap always ends the loop.
`npm run critics -- <folder>` prints the plan for a video: which critics, on which model,
for at most how many rounds, until what severity, and a rough time and token estimate. Run
it first and follow it. **The person's word in the moment beats all of it** ("quick review",
"go thorough", "skip pacing"): pass it as flags (`--preset quick`, `--rounds 1`).

| Preset | Critics | Rounds | Until | Model | Frames | About | For |
|---|---|---|---|---|---|---|---|
| `quick` | accuracy, sync, visuals | 1 | blocking | sonnet | scenes | 1 min | a decision video mid-work (its default), a draft, a private video |
| `standard` | all seven | 2 | major | sonnet | cues | 1 to 2 min | the default |
| `thorough` | all seven | 4 | major | sonnet, Opus for the last round's taste critics | cues | up to 6 min | a video going public |

Times are critic time on a 70 second video; the builder's fixes between rounds come on top,
and are usually most of it. Each dial, and what it trades:

| Dial | Values | Turning it down saves | and costs |
|---|---|---|---|
| `critics` | any list of critic skills | a parallel agent's tokens | every kind of problem that critic would catch |
| `rounds` | 1 to 10 | a rebuild and a round each | fixes that go unchecked by a fresh critic |
| `until` | `blocking`, `major`, `minor` | rounds spent on majors (or minors) | a video with known, recorded flaws |
| `model` | `haiku`, `sonnet`, `opus`, or any your agent runs | time and tokens per critic | subtler problems missed |
| `final` | a model, or `none` | the last round's premium | the finest grading of taste |
| `frames` | `cues`, `scenes` | packet time and images to read | sync and cue timing judged on fewer stills |
| `rerun` | `failed`, `touched`, `all` | critics re-run after a fix | a fix breaking something an unrerun critic owned |

### How much review: the builder decides

The builder sets the dial, from how much the video matters, before the first round. It
writes `"importance"` (`low`, `normal`, `high`) and a one-line `"importance_reason"` into
`video.json`; `low` runs `quick`, `normal` runs `standard`, `high` runs `thorough`.

| Importance | When | Signals |
|---|---|---|
| `high` | A mistake would mislead many people or be costly to undo | Public or client-facing (a README, a release, a client); drives a decision that is expensive or hard to reverse; others will act on it without asking |
| `normal` | A mistake costs some confusion, caught soon | Shared with the team; explains how something works; drives a decision that can be revisited |
| `low` | One person, now, and the stakes are small | A decision video for the person waiting mid-work on a reversible call; a draft; a private video nobody else sees |

Judge it from the brief, `video.json` `"audience"`, `kind` and where the video is going, not
from how long it will take. Between two levels: the higher one if anyone outside the team
will see it, the lower one if it is one person waiting mid-work. **Raise it mid-loop** when a
round shows the stakes are higher than you thought (a blocking accuracy finding in a video
others will act on); **never lower it mid-loop** to get past a finding.

A person's word still wins over the builder's judgment: a preset they set on the video
(`"review": {"preset": ...}`) or a flag they ask for in the moment. Their general default in
`local/config.json` `"review"` gives way to the builder's call on a particular video. Dials
(`rounds`, `model` and the rest) still adjust whichever preset is chosen (`bin/lib.mjs`,
`reviewPlan`; `npm run critics` says where the preset came from). With no importance set, a
decision video defaults to `quick` and every other to `standard`; a decision video always
adds `critic-decision`.

**The floor no dial lowers.** Whatever the caps, a video never ships with an open blocking
finding from `critic-accuracy` (or, for a decision video, `critic-decision`, and for a video that shows
code, output or captures, `critic-grounding`: set `"shows_code"` in `video.json`, or a `<pre>` or `<code>`
in `scenes.html` sets it): fix it and run that one critic once more, past the cap if need be; if it
still fails, it goes to a person.
A `critics` list that leaves out a floor critic gets it added back (`npm run critics` says so).

## Who runs it

The builder runs the loop and fixes the findings. It does not judge them away. For each
critic in the plan it starts a **new** agent, on the plan's model:

- **Claude Code:** the Agent tool with a fresh agent, never a fork (a fork inherits the builder's
  context, and with it the builder's bias), with the plan's model. In the ShipShow plugin that is
  `subagent_type: "shipshow:critic"`, which has Read, Grep, Glob, Bash and Skill and is told not to write
  (not enforced); elsewhere a general-purpose agent. A judge from the builder's own model family shares
  its blind spots, so say which model judged.
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
| `critic-grounding` | For a video that shows code, output or captures: each is genuine, from the named commit |
| `critic-decision` | For a decision video: the call is stated, options priced, one recommended with why |

## The brief

Give each critic objectives and evidence, never a procedure. How it looks is its business.

```
You are a critic for an explainer video. Review it yourself; do not delegate.
Load and follow the critic skill (skills/<critic>/SKILL.md; `shipshow:<critic>` in the plugin). Judge only
what that skill covers.
Evidence, in <video dir> (videos/<name>/ or local/videos/<name>/):
  review/packet.md      the script with timings, pauses, cues, reading times
  review/frames/        stills after each cue and at each scene end (contact-sheet*.jpg)
  sources.md            the ground truth; a claim not supported here is a finding
  critics.md            this video's own bar, if present: it applies to you too
  video.json            who the video is for, its voice and speed
  brief.md              for a decision video: the decision as the working agent framed it
  code at pin: <path>   the code base at the pin <sha>, so a claim can be re-checked (a throwaway copy)
  local/preferences.md, local/critics.md (repo root)   the person's own taste and bar, if present
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
  ],
  "assets": [ { "asset": "...", "source": "...", "method": ["diff", "re-run", "static", "viewed"], "result": "genuine|trimmed|trimmed-misleading|unsupported|no-provenance" } ]
}
```

- **blocking:** wrong, misleading, unreadable or broken. A viewer is misinformed or lost.
- **major:** a viewer would notice and it makes the video clearly worse.
- **minor:** polish.
- **objective:** true when a measurement or a source settles it; false when it is taste.
- `verdict` is `fail` when any finding is blocking or major.
- `assets` is optional: a critic that checks shown evidence (`critic-grounding`) returns one row
  per asset it checked, so the loop can see what was verified and how.

Save each one as `<video dir>/review/round-<n>/<critic>.json`.

## The loop

0. Make the copy of the code at the pin a critic will check (`git archive <sha> <dir> | tar -x -C <tmp>`, or
   the faithful clone in `evidence-standard`) and give its path in the brief; a critic never creates it. If
   you cannot start critics, hand back not ready with each `not run` (`explain-handoff`).
1. Run the plan's critics. Read every finding.
2. Fix every finding at or above the plan's `until`: with `major`, every blocking finding
   and every objective major. A subjective major gets one pass: fix it or decline it with a
   reason, then do not re-litigate it. Anything below `until` is recorded, not chased.
3. Decline a finding that is wrong with evidence (the source line, the measurement), and
   record it. Never quietly "fix" a wrong finding.
4. If rounds remain, rebuild (`npm run make -- <folder> --draft`, `npm run review --
   <folder>`) and run **fresh** critics, chosen by the plan's `rerun`. When the cap is
   reached, stop: what is still open is recorded in `REVIEW.md` as accepted, with its
   severity, except the floor above.
5. **Look before you spend.** Before each new round, open the contact sheets yourself: a
   builder's glance catches overflow and mistimed cues for free (and `build` warns when a
   bare cue word occurs twice in its scene).
6. **Stop** when every critic passes or the cap is reached. **Escalate to a human** when the floor fails, the same finding survives
   three rounds, two critics contradict each other, or a round only finds problems in the
   previous round's fixes.

Then write `<video dir>/REVIEW.md`: each round, each critic's verdict, what was fixed,
what was declined and why. It is committed with the video when the video is in `videos/` (one in `local/` is not committed), so anyone can see the bar it
cleared.

## A new critic

When something about the videos keeps bothering you, make it a critic. Copy one of the
critic skills to `skills/critic-<what>/SKILL.md` and keep its shape:

- **Judges:** one thing, named in a sentence, and what it does not judge (another critic's).
- **Evidence:** which parts of the packet, frames or sources it uses.
- **Criteria:** each with the severity a failure carries, measurable wherever possible.
- **Done:** when it stops.

Add it to the table above, to the skills table in `AGENTS.md`, and to the README's
critics image (`docs/assets/critics.svg`). A bar that matters to one video only belongs
in that video's `critics.md` instead.
