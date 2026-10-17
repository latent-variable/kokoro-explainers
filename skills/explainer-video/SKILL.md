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

**Where it lives.** A video about this repo, or one we mean to publish as an example, goes in
`videos/`. A video about any other code base goes in `local/videos/<name>`, which is never
committed: this repo is public, and a private code base's details must not reach it.

### A decision video, handed off mid-work

The everyday case. The agent doing the work does not build the video itself: it hands off
to a fresh explainer agent, so the video is made by one that has not absorbed its reasoning.

1. **The working agent writes `brief.md`** in a new `local/videos/<name>/`: the decision in
   one sentence, each option it sees, what it would pick and why, the code paths that matter
   and the worktree or commit to read them at. It states what it knows; it does not script
   the video.
2. **It starts a fresh agent** with this skill and the brief. Facts come from the code at that
   worktree, never from the brief alone: the brief can be wrong, the code is the ground truth.
3. **The explainer agent builds the video**, quick size: one to two minutes, three to five
   scenes, ending on the options and a recommendation. With `"kind": "decision"` the review
   defaults to the `quick` preset, about a minute of critics, and `critic-decision` joins it:
   the person is waiting mid-work.
4. **It hands back the MP4's path.** The person watches, decides, and the working agent
   carries on.

## 1. Facts first: `sources.md`

Write `sources.md` in the video's folder before any script. It is the ground truth every critic
checks against, so a claim that is not in it does not go in the video.

- **The source of record**, linked: for a decision or feature video, file paths at the
  commit you read; for a release, the release page, the tag range, the changelog, the pull
  requests, the docs. For a GitHub release:
  `gh release view <tag> -R <owner>/<repo>`, `gh api repos/<owner>/<repo>/compare/<old>...<new>`,
  the project's `CHANGELOG.md` at the new tag.
- **The claims the video will make**, one line each, with the link that supports it.
- **What you left out and why**, so a critic can tell an omission from an oversight.

A release explainer picks what a developer must know, in this order: breaking changes and
what to do about each, then the new things worth using, then fixes they were waiting for.
Not everything in the changelog earns a scene.

## 2. Script

`npm run new -- <folder>`, then one file per scene in `script/`, read aloud in
file-name order.

- Spoken sentences, short. One idea per scene. The order a newcomer needs, not the order
  of the changelog.
- Speed is a multiplier on a comfortable base of about 160 words a minute: 1.25 by default,
  set per video in `video.json`, per person in `local/config.json`, or per run with
  `--speed`. Write for it: at 1.25, a 30 second scene holds about 100 words.
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
- 28 px is the smallest text that stays legible after video compression. Keep the bottom
  180 px for captions.

### Give it its own feel

Information is not enough; the viewer has to want to keep watching. Each video should feel
made for its subject, not stamped from a template.

- **Theme** for the client or audience (`skills/theme`); the shipped ones are `shipshow` and
  `paper`.
- **Flair** in `video.json` for this video's own motion: `"flair": {"transition": "wipe",
  "camera": "push", "ambient": "grid"}`. A section's `data-transition` changes one scene;
  varying them keeps the cuts alive.
- **Entrances that mean something**: `type` for a command or a name, `draw` for an arrow or a
  line between two ideas, `count` for a number that matters, `highlight` on the phrase the
  sentence turns on, `stagger` for a list, `pulse` for the one thing to remember. A screen
  where nothing moves for more than about eight seconds while the voice goes on is losing
  the viewer.
- **One memorable moment**: a picture that is the idea (a ship leaving a storm of pull
  requests), not a card that names it.

## 4. Make it, then the evidence

```
npm run make -- <folder> --draft
npm run review -- <folder>
```

`review` writes `review/packet.md` and `review/frames/`, the evidence the critics judge.
Look at `review/frames/contact-sheet*.jpg` yourself before spending a critic on something
you can see is broken.

## 5. The critic loop

Decide how much review it deserves: set `video.json` `"kind"` (`decision`, `feature`,
`release`), `"importance"` (`low`, `normal`, `high`) and a one-line `"importance_reason"`,
judged as `critic-loop` says (*How much review*). `npm run critics -- <folder>` prints the
plan that follows from it. Then run `skills/critic-loop` to that plan, with the
video's own `critics.md`. Fix what they find, rebuild, regenerate the packet, run fresh
critics, and stop at the cap.

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
