---
name: explainer-video
description: >
  Make or update a narrated explainer video in this repo: facts from a source of record,
  a script, scenes, a Kokoro voice, a HyperFrames render, then the critic loop until the
  video's critics pass. Three kinds: a decision video an agent makes mid-work so a person
  can make a call, a feature explainer (how something in a code base works), and a release
  explainer. Load when asked for an explainer, a release video, a "video of how X works",
  or a video to decide something, or to update one.
---

# Explainer video

You are the builder. You make the video; you never judge it. Judging is the critics' job
(`skills/critic-loop`), run by agents that did not build it. A video is done when its
critics pass and `REVIEW.md` says so, not when it renders.

**Read `local/` first** when it exists: the person's own preferences and bar (`tailor`
skill). They tailor taste, never the truth bar.

## Kinds of video

| Kind | Made when | Ground truth | Its own critic |
|---|---|---|---|
| **Decision** | An agent working on a feature needs a person's call and wants them confident making it | The code base and the brief | `critic-decision` |
| **Feature** | Someone wants to know how a feature or system in a code base works | The code base | |
| **Release** | A project ships and its developers need to know what changed | The release, changelog and pull requests | |

**Where it lives** (`evidence-standard`). A video about this repo, a public sample vendored
here, or one we mean to publish goes in `videos/`. A decision video, a private code base or
someone's work in progress goes in `local/videos/<name>`, which is never committed: this repo
is public.

### A decision video, handed off mid-work

The everyday case. The agent doing the work does not build the video itself: it hands off
to a fresh explainer agent, so the video is made by one that has not absorbed its reasoning.

1. **The working agent writes `brief.md`** in a new `local/videos/<name>/` (`decision-brief`): the
   decision in one sentence, numbered claims, each option with its gains and costs, what it would
   pick and why, one assumption it has not verified, and the pin to read the code at. It states what
   it knows; it does not script the video.
2. **It starts a fresh agent** with this skill and the brief. Facts come from the code at that
   worktree, never from the brief alone: the brief can be wrong, the code is the ground truth.
3. **The explainer agent builds the video**, quick size: one to two minutes and three to five scenes
   for a simple call, ending on the options and a recommendation. `critic-decision` joins the
   critics. When the must-speak list (every option's gains and costs, each contradiction and added
   cost, the unverified assumptions, the default if nobody decides, the pick and its reason) will not
   fit, run to three minutes, or show the options in an on-screen table with a spoken summary and put
   the full list in the hand-back; `critic-pacing`'s scene-length limit still holds.
4. **It hands back** with `explain-handoff`: status, the MP4's path, the pick, and what the code
   overruled or could not settle. The person watches, decides, and the working agent carries on.

## 1. Facts first: `sources.md`

Write `sources.md` in the video's folder before any script. It is the ground truth every critic
checks against, so a claim that is not in it does not go in the video.

- **The source of record**, linked: for a decision or feature video, file paths at the
  commit you read; for a release, the release page, the tag range, the changelog, the pull
  requests, the docs. For a GitHub release:
  `gh release view <tag> -R <owner>/<repo>`, `gh api repos/<owner>/<repo>/compare/<old>...<new>`,
  the project's `CHANGELOG.md` at the new tag.
- **The claims the video will make**, one line each, with the link that supports it.
- **Where each shown asset came from**: for every code excerpt, command, output or capture
  on screen, the commit and the command or file it was taken from (`critic-grounding` checks
  it). Copy it from the source; never retype it.
- **Brief vs code** (decision video): each claim of the brief checked against the code, result
  and `path:line` (`decision-brief`).
- **What you left out and why**, so a critic can tell an omission from an oversight.

A release explainer picks what a developer must know, in this order: breaking changes and
what to do about each, then the new things worth using, then fixes they were waiting for.
Not everything in the changelog earns a scene.

## 2. Script

A workable order, not a required one: `sources.md` with its Terms (`glossary`), the plan
(`explain-concept`), then the script (`narration-writing`). Revise the Terms when the plan cuts
a concept.

`npm run new -- <folder>`, then one file per scene in `script/`, read aloud in
file-name order.

- Spoken sentences, short. One idea per scene. The order a newcomer needs, not the order
  of the changelog.
- Pace: choose `"speed"` in `video.json` from the packet (`narration-writing`); the numbers
  live in `critic-pacing`.
- Numbers and versions as they are said: "version two point four". Names Kokoro gets
  wrong go in `video.json` `"say"`; captions keep the written form.
- A release explainer: what this release is, then breaking changes with before and after,
  then what is new, then the upgrade steps, then where to read more.

## 3. Scenes

`scenes.html`: one `<section data-scene="<script file name>">` per scene and a `<style>`
that gives this video its look. Each element arrives on the word that introduces it with
`data-cue="word"` (`AGENTS.md`, *A video's files*).

- What is on screen is what is being said. Show real code from the release, not a
  paraphrase of it.
- Text a viewer must read stays up long enough to read while listening; the packet
  measures it.
- Text size and the caption area are `critic-visuals`' numbers; the packet and frames show
  whether you meet them.

## 4. Make it, then the evidence

```
npm run make -- <folder> --draft
npm run review -- <folder>
```

`review` writes `review/packet.md` and `review/frames/`, the evidence the critics judge.
Look at `review/frames/contact-sheet*.jpg` yourself before spending a critic on something
you can see is broken.

## 5. The critic loop

Run `skills/critic-loop` with the critics named in `video.json` `"critics"` and the video's
own `critics.md`. Fix what they find, rebuild, regenerate the packet, run fresh critics.

**A video gets its own critics for its content.** When this video has a bar the shared
critics do not cover ("every breaking change shows before and after code", "the version
number is on screen in every scene"), write it in the video's `critics.md`. When the same
bar keeps coming back across videos, it becomes a new critic skill (`critic-loop`, *A new
critic*).

## 6. Land it

`npm run render -- <folder>` for the final MP4. For a video in `videos/`, commit
`sources.md`, `script/`, `scenes.html`, `video.json`, `critics.md` and `REVIEW.md`; never
audio, frames or renders. A video in `local/videos/` is never committed.

## Updating one

When the source changes (a point release, a correction): edit the scenes it touches, re-run
`make` (only changed sentences are voiced again), regenerate the packet, and run the critics
whose ground it touched. A stale explainer teaches developers the wrong thing.
