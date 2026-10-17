---
name: explainer-video
description: >
  Make or update a narrated explainer video in this repo: facts from a source of record,
  a script, scenes, a Kokoro voice, a HyperFrames render, then the critic loop until the
  video's critics pass. The first use is a release explainer that keeps developers current
  on what changed in a project's release and what they need to do. Load when asked for an
  explainer, a release video, or a "video of how X works", or to update one.
---

# Explainer video

You are the builder. You make the video; you never judge it. Judging is the critics' job
(`skills/critic-loop`), run by agents that did not build it. A video is done when its
critics pass and `REVIEW.md` says so, not when it renders.

## 1. Facts first: `sources.md`

Write `videos/<name>/sources.md` before any script. It is the ground truth every critic
checks against, so a claim that is not in it does not go in the video.

- **The source of record**, linked: the release page, the tag range, the changelog, the
  pull requests, the docs. For a GitHub release:
  `gh release view <tag> -R <owner>/<repo>`, `gh api repos/<owner>/<repo>/compare/<old>...<new>`,
  the project's `CHANGELOG.md` at the new tag.
- **The claims the video will make**, one line each, with the link that supports it.
- **What you left out and why**, so a critic can tell an omission from an oversight.

A release explainer picks what a developer must know, in this order: breaking changes and
what to do about each, then the new things worth using, then fixes they were waiting for.
Not everything in the changelog earns a scene.

## 2. Script

`npm run new -- videos/<name>`, then one file per scene in `script/`, read aloud in
file-name order.

- Spoken sentences, short. One idea per scene. The order a newcomer needs, not the order
  of the changelog.
- About 150 to 165 words a minute is comfortable. Kokoro at speed 1.0 reads near 190, so
  most videos want `"speed"` around 0.9 in `video.json`. The pacing critic measures it.
- Numbers and versions as they are said: "version two point four". Names Kokoro gets
  wrong go in `video.json` `"say"`; captions keep the written form.
- A release explainer: what this release is, then breaking changes with before and after,
  then what is new, then the upgrade steps, then where to read more.

## 3. Scenes

`scenes.html`: one `<section data-scene="<script file name>">` per scene and a `<style>`
that gives this video its look. Each element arrives on the word that introduces it with
`data-cue="word"` (`README.md`, *Making things appear on a word*).

- What is on screen is what is being said. Show real code from the release, not a
  paraphrase of it.
- Text a viewer must read stays up long enough to read while listening; the packet
  measures it.
- 28 px is the smallest text that stays legible after video compression. Keep the bottom
  180 px for captions.

## 4. Make it, then the evidence

```
npm run make -- videos/<name> --draft
npm run review -- videos/<name>
```

`review` writes `review/packet.md` and `review/frames/`, the evidence the critics judge.
Look at `review/frames/contact-sheet*.jpg` yourself before spending a critic on something
you can see is broken.

## 5. The critic loop

Run `skills/critic-loop` with the critics named in `video.json` `"critics"` and the video's
own `critics.md`. Fix what they find, rebuild, regenerate the packet, run fresh critics.

**A video gets its own critics for its content.** When this video has a bar the shared
critics do not cover ("every breaking change shows before and after code", "the version
number is on screen in every scene"), write it in `videos/<name>/critics.md`. When the same
bar keeps coming back across videos, it becomes a new critic skill (`critic-loop`, *A new
critic*).

## 6. Land it

`npm run render -- videos/<name>` for the final MP4. Commit `sources.md`, `script/`,
`scenes.html`, `video.json`, `critics.md` and `REVIEW.md`. Never audio, frames or renders;
they are generated and gitignored.

## Updating one

When the source changes (a point release, a correction): edit the scenes it touches, re-run
`make` (only changed sentences are voiced again), regenerate the packet, and run the critics
whose ground it touched. A stale explainer teaches developers the wrong thing.
