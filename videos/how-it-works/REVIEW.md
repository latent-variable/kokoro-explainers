# Review: how-it-works

The critic loop (`skills/critic-loop`) as run on this video, 2026-10-17. Every critic in every
round was a fresh agent that had not seen the build or an earlier round. Rounds 1 to 4 ran on
Sonnet; rounds 5 and 6 ran the subjective critics (clarity, visuals, engagement) on Opus.

| Critic | R1 | R2 | R3 | R4 | R5 | R6 |
|---|---|---|---|---|---|---|
| accuracy | pass | pass | fail | pass | pass | pass |
| clarity | fail | fail | fail | fail | fail | pass |
| pacing | fail | pass | pass | pass | pass | pass |
| sync | pass | pass | pass | pass | pass | pass |
| visuals | fail | fail (blocking) | pass | fail | not counted | pass |
| consistency | fail | fail | pass | fail | pass | pass |
| engagement | | | fail | pass | pass | |

`critic-engagement` was added after round 2, from the team's point that videos must be made
for a persona and be engaging.

## What the critics changed

- **Round 1.** Every scene was spoken at 176 to 209 words a minute: speed 1.0 became 0.85 and
  the busiest scene lost words. HyperFrames was never explained; now it is ("turns an HTML
  page into video"). The demo's code tagged "Kokoro" while the element appeared on "appears",
  contradicting the narration; the code now matches. "Take" and "sentence" named one thing;
  now only "sentence". An empty panel sat on screen for four seconds; layouts filled out.
- **Round 2.** Blocking: the command box overlapped the step cards. "Render" named both the
  scene and one step; the step became "record". The close said "copy the starter folder"
  while the screen showed `npm run new`; it now says what to run.
- **Round 3.** Accuracy caught a claim the build itself introduced: "clone it and run npm
  install" implied that was the whole setup, which also needs the Python environment. The
  close now points at the README's setup. Engagement asked to see a real script line next to
  the picture it makes; scene 3 now shows the line, its `data-cue` tag and the result.
- **Round 4.** The video promised "how to make your own" and stopped before `npm run make`;
  it now finishes the steps. Two critics independently asked to retitle the close "Make your
  own". The two takeaway lines were styled two ways; now one style.
- **Round 5.** Clarity on Opus found the closing recipe left out `scenes.html`, so a viewer
  following it would get the template's placeholder pictures; the close now names it. The
  visuals verdict is not counted: the packet was regenerated while that critic was reading,
  so it judged two versions at once. `critic-loop` now forbids rebuilding mid-round.
- **Round 6** ran only the critics whose ground the round 5 fixes touched; engagement's
  (the persona's reasons to watch) was not.

The builder's own look between rounds caught two more before any critic did: a code line
overflowing its box, and two cues landing on an earlier word than intended ("picture"
matching "pictures", "make" matching "make your own"). The second became a fix to the tool:
`bin/build.mjs` now warns when a bare cue word occurs more than once in its scene.

## Declined

- **Round 1, visuals:** the render scene opens on its heading alone for about 1.5 s. The
  voice is saying only the heading then; showing the cards before they are named would break
  sync. Declined.
- **Round 3, engagement:** real sentence text in the scene 2 timeline blocks. At that size
  the text would be unreadable; the real script line is shown in scene 3 instead.
- **Clarity, rounds 2 to 4:** each round's major came from the previous round's rewrite.
  Per the loop's stop rule, the last was fixed and the remaining minors are accepted.

## Accepted minors

The final rounds left minors only. Three critics noted the `data-cue` snippet in scene 3 lands
on "HTML", about four seconds before tagging is explained; moving it leaves the scene empty
under a full sentence, which an earlier visuals round flagged, so it stays. Card heading styles
differ between scenes 2 and 4, and pacing in scenes 1 and 2 sits at 168 and 171 words a minute,
inside the band. The close heading sits higher than the numbered headings, a timeline box
shows the axis through it for a few frames as it pops in, and some card text wraps a word
onto its own line. After round 6, one minor was taken without a new round: the last line
says "run npm run make on that folder" instead of an ambiguous "on it".
