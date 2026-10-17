---
name: explain-concept
description: >
  Turn evidenced facts into a plan a viewer can follow: who the video is for and what they
  must be able to do afterwards, the one idea per scene, the order a newcomer needs, the
  analogy or example for each, what to cut, and the picture that shows each idea best.
  Load after the facts exist (`sources.md`) and before the script and scenes, for a feature,
  decision or release video.
---

# Explain a concept

The step between "we know the facts" and "we write the script". `code-context` says what is
true; this decides what a particular person needs of it, and in what shape. A video that
states every true thing teaches nothing. Write the result as `plan.md` in the video's
folder. It is the builder's to write and the critics never see it, only the video.

## 1. The viewer and the outcome

Two sentences, before anything else, and `video.json` `"audience"` repeats the first:

- **Who watches**: their role, what they already know, what they will not know.
- **What they can do afterwards** that they could not before: make a call, review a change,
  use the feature, change the code. If you cannot name it, the video has no point yet.

`critic-clarity` and `critic-engagement` judge against exactly these. A plan that serves
"everyone" serves nobody.

## 2. What goes in, what stays out

From `sources.md`, keep only what the outcome needs. Order the rest by what the viewer must
know first, not by how the code is laid out or how the work happened. Each cut claim goes in
`sources.md` under "left out and why", so a critic can tell an omission from an oversight.

- One idea per scene. A scene that needs "and also" is two.
- The first scene says what the video is about and why the viewer cares. A decision video
  states the call in a sentence they could answer.
- The last scene says what to do next.
- A newcomer's order usually runs: the problem, the idea, one worked example, how it goes
  wrong or what it costs, then what to do.

## 3. Idea to picture

For each scene, name its idea in one sentence and choose what the viewer sees. Pick the
picture by what the idea *is*, not by what is easy to draw:

| The idea is | Show |
|---|---|
| A sequence or pipeline | Steps appearing in order, on the words that name them |
| A choice between options | Options side by side, each with its gain and its cost |
| A change | Before and after, the same thing in the same place |
| A structure or boundary | A few labelled boxes and the arrows that matter, no more |
| Behaviour of code or an API | The real input and the real output, from a captured run |
| A number or comparison | The number large, one comparison, nothing else on screen |
| Something abstract | One concrete example before the general statement |

Real code, commands and output beat a paraphrase of them. Anything shown must be in
`sources.md`, copied from the commit it names, never retyped from memory.

## 4. Fit it to the format

- A quick decision video: one to two minutes, three to five scenes.
- Text stays at or above 28 px and out of the bottom 180 px (captions).
- A scene past 40 seconds is two ideas. A screen with no change for 12 seconds while the
  voice goes on is a gap in the plan.

## The plan

```
Viewer: <who, what they know>
Outcome: <what they can do afterwards>
Scenes:
  01-<name>  idea: <one sentence>   show: <picture>   evidence: <sources.md line>
  02-...
Left out: <claim> because <reason>
```

Then `narration-writing` for the script and `explainer-video` for the build. When the plan
changes the audience, tell the person before spending a render.
