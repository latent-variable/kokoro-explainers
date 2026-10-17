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

> **Needs a clone of the ShipShow repo**, set up with `npm install` (this skill uses `bin/`, `npm run` and
> `AGENTS.md`). Outside one, say so and stop; the plugin alone ships the understanding skills
> (`code-context`, `change-context`, `evidence-standard`).

The step between "we know the facts" and "we write the script". `code-context` says what is
true; this decides what a particular person needs of it, and in what shape. A video that
states every true thing teaches nothing. A `plan.md` in the video's folder is an optional aid; the
bars below are judged on the video itself (`critic-clarity`, `critic-engagement`). The headings and
the plan template are suggestions, not a required method.

## 1. The viewer and the outcome

The video names its viewer and what they can do after, and `video.json` `"audience"` says
the first. Two sentences you can write before anything else:

- **Who watches**: their role, what they already know, what they will not know.
- **What they can do afterwards** that they could not before: make a call, review a change,
  use the feature, change the code. If you cannot name it, the video has no point yet.

`critic-clarity` and `critic-engagement` judge against exactly these. A plan that serves
"everyone" serves nobody.

## 2. What goes in, what stays out

From `sources.md`, keep only what the outcome needs. Order the rest by what the viewer must
know first, not by how the code is laid out or how the work happened. Each cut claim goes in
`sources.md` under "left out and why" (marked as not claims), so a critic can tell an
omission from an oversight.

- One idea per scene. A scene that needs "and also" is two.
- **The first scene poses the question the viewer has, and the last scene answers it in a sentence**: the
  question in the title or the brief. A video that is true on every line and never answers it has failed. A
  claim of cause ("because", "the cause is") is `[ran]` where removing the cause changes the result, or it is
  `[inferred]` and the open question is said: a hidden false premise ("the tests passed, so each change is
  right") is a premise to test, not to repeat.
- The first scene says what the video is about and why the viewer cares. A decision video
  states the call in a sentence they could answer.
- **A worked example with concrete values comes before any general statement**, including in
  scene 1 when the framing is wrong.
- **If the code contradicts the framing** (the brief asks how a post is delivered; nothing
  delivers it), the correction is for a viewer who holds that framing; a viewer who never assumed it
  gets the real mechanism with a stake line first. Where it applies, scene 1 corrects it as a
  concrete example ("Ben posts; nothing is sent to Ana"), and the title uses the real mechanism.
  Say "the word is not in the code" when that is what the search found, not "there is no such thing":
  the concept may exist under another name (the home page is functionally the timeline). Before any
  scene says "nothing else happens", list the write path's listeners, events, signals and hooks (a post
  that is also indexed for search is still a post that is not sent to a follower), and cite each as
  `absent:`, `present:` or `present, conditional on <config>` in `sources.md`. The person is told in the plan's first line
  and in the hand-back.
- The last scene says what to do next, and makes the outcome reachable: for a feature or change
  video it names the entry points the viewer would open (a feature has a write path and a read path),
  with their literals on screen, and the video shows at least one real excerpt, the part the
  narration explained. A spoken alias (`glossary`) always has its literal on screen.
- **The scene that carries the central mechanism shows the real lines doing the work**, each cued as
  it is named, and says in a clause what each construct the viewer would need to change the code does
  (what `isouter` or `group_by` is for). A script that is true but could be written without reading the
  code teaches nothing. Say how the viewer can check the claim themselves (the test that exercises it is
  the runnable example); that may sit in the last scene.
- **State a cost or a limit** of the design, or that none was found (`sources.md` says so).
- Keep something changing on screen while the voice goes on: split a scene or add a thing worth naming
  rather than a filler cue. The packet's *Stillness* table shows each scene's longest still stretch;
  `critic-pacing` holds the limit.
- A newcomer's order often runs: the problem, the idea, one worked example, how it goes
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

Real code, commands and output beat a paraphrase of them, but only the lines being named:
narrow shown code to them, as whole contiguous lines with a `…` line for each gap and the file and line
numbers on screen, and cue each as it is spoken, so the voice points at the screen. Anything shown must
be in `sources.md`, copied from the pin it names, never retyped (`explainer-video`, step 1; the critic
checks it with a script).

**What the kit renders natively:** entrances on a cue (`up`, `fade`, `pop`, `left`, `right`, `grow`, `zoom`,
`blur`, `type`, `draw`, `count`, `highlight`, `stagger`, `pulse`; `AGENTS.md`). An exit, a swap and a connector
between two boxes need a custom `<script>` in `scenes.html`; choose a picture the kit can make or plan the script.

## 4. Fit it to the format

The numbers (reading speed, scene length, text size, caption area) live in the critics that
judge them: `critic-pacing`, `critic-visuals`. Plan to them; do not copy them here. A quick
decision video is one to two minutes and three to five scenes; a feature or release video
runs as long as its idea needs.

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
