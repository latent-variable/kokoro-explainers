# Review: how-we-built-it

The critic loop (`skills/critic-loop`) as run on this video, 2026-10-17. Four critics were run
(accuracy, clarity, sync, visuals); pacing, consistency and engagement were not. Every critic in
every round was a fresh agent that had not seen the build or an earlier round, all on Sonnet. A
round 5 attempt to run clarity and visuals on Opus was rejected by the workspace rate limit
(HTTP 429, one input token a minute), so both were rerun on Sonnet.

**Status: the five critics run all pass in round 10.** Consistency and engagement were not run.

| Critic | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | R10 |
|---|---|---|---|---|---|---|---|---|---|---|
| accuracy | fail | fail | pass | fail | pass | pass | pass | pass | pass | pass |
| clarity | fail | fail | fail | fail | fail | fail | pass | fail | fail | pass |
| sync | fail | pass | fail | pass | pass | pass | pass | pass | fail | pass |
| visuals | fail | fail | pass | fail | fail | pass | pass | fail | fail | pass |
| pacing | | | | | | | fail | pass | fail | pass |

## What the critics changed

- **Round 1.** Accuracy: the video said timing was "the hard choice", that traps are "made once",
  and that there is "no second model"; none is in `sources.md`, so all were cut. "One finding fixed
  the tool" became "fix", because the build warning came from the builder's own look, not a critic.
  Visuals (blocking): the "Tried" card's last line overflowed its box. Sync: the heading said
  "3. The critics" while the voice said "second"; the numbers were dropped. Clarity: the video never
  said what a team could take from it; a closing list of takeaways was added.
- **Round 2.** Accuracy: "they found the narration too fast" gave a reason `REVIEW.md` of the other
  video does not state; removed. "Twice" became "more than once". Visuals: two scenes opened on a
  bare heading for 3 s, and the R1 to R6 chips carried no content; replaced with a diagram of one
  round (critics judge, builder fixes, fresh critics judge). Clarity: the loop was never explained.
- **Round 3.** Sync: the espeak row landed after "160" was said, and two scenes had sentences
  with nothing on screen; cues moved and a "start time" line added. Clarity: scene 2 needed a bridge
  from "needs start times" to "speech recognition", and the loop's last sentence was jargon.
- **Round 4.** Accuracy: the card said the warning means a picture "cannot land on the wrong one",
  but a warning prevents nothing; and the espeak error does show a path (a missing `phontab` file),
  it just does not say the path is the cause. Both corrected to the source. Visuals: the loop
  caption floated alone; restacked.
- **Round 5.** Visuals (blocking, introduced by the round 4 restack): the loop caption overlapped the
  chip row. Fixed. Clarity: the "first video" in the loop scene was never named; it is now "the
  project's first video, how it works".
- **Round 6.** Accuracy, sync and visuals pass. Clarity fails on two majors (below).
- **Round 7.** After the clarity rewrite below, accuracy, clarity, sync and visuals pass. Pacing, run for the first time, fails: scenes 5 and 6 read above 175 words a minute. Fixed by trimming both scripts and slowing the voice from 0.85 to 0.80 (0.78 was tried and was too slow).
- **Round 8.** Pacing, accuracy and sync pass. Clarity (two majors: the loop's warning sentence, and a pull-request takeaway with no setup) and visuals (captions ending on "a"/"to") fail. The caption splitter in `bin/build.mjs` now carries a trailing function word to the next line; the loop sentence, takeaway, example-video name and the `AGENTS.md` wording were rewritten.
- **Round 9.** Accuracy passes. Pacing fails on one objective major, the new "Also caught" card (24 words, up 6.0 s, needs 7.3 s). Visuals fails on two majors from the round 8 highlight on the traps card (no padding; still on the wrong line). Sync fails on two majors: the Tried card and the traps line each land several seconds after the voice names them. Clarity fails on a new major: scene 2 never says the pipeline generates the voice from the text.

The builder's own look between rounds caught the heading-only openings and the "start time" line
sitting against the chip box before any critic did.

## Clarity, round 6, and how it closed

Two subjective majors, raised in different wording since round 2: the loop scene's warning sentence
leaned on an idea (pictures tied to words) the video had not set up, and "how it works" was easy to
mishear as a phrase; the traps scene spent its time on a 160-character espeak-ng detail this
audience will not hit, without saying why a file agents read first helps. Clarity had asked both
for more explanation of that detail and for it to be replaced, so it went to a human, who chose a
rewrite. The espeak example was dropped; the traps scene now says what AGENTS.md is for; scene 2 says
a picture appears when its words are spoken; the loop scene calls the other video "the example
video, called how it works" and states what the warning is for. Round 7 passes.

## Declined

- **Round 4 and 5, clarity:** add "too fast" and a critic's name to the round-one finding ("the
  pacing critic found speech too fast to follow"). The other video's `REVIEW.md` records the
  measured speed and the change to it, not the reason or which critic found it. Accuracy rejected
  the same phrase in round 2. Declined.
- **Round 2, clarity:** cut the espeak and phonemizer detail to one example. Done (phonemizer cut,
  espeak kept as the one example); see the open item above.

## Why the loop paused at round 9

Two escalation cases from `critic-loop`: a round finding mostly problems in the previous round's
fixes (the pacing and visuals majors are the round 8 card and highlight), and critics pulling
against each other. Round 8 sync asked for the Tried card to wait until "tried"; round 9 sync asks
for it to land on "recognition". Clarity has raised a different major in each round since round 7.
A human chose one more fix pass and a final round. The fix pass followed the narration order for
the Tried card (it lands on "recognition", and a strike line draws on "tried"), added the missing
mechanism to scene 2 (the pipeline generates the voice one sentence at a time and places each one),
reordered the traps scene, shortened the "Also caught" card, and replaced the pull-request
takeaway with "turn each mistake into a warning or a written trap". Round 10 passes all five.

## Accepted minors

Left after round 10, not re-run. Accuracy: the AGENTS.md card shows paraphrases that read like
quotes; "the usual way" to get start times is the narration's framing, not the repo's; "its critics
passed" holds for the critics run in R6 (engagement was not re-run). Clarity: "the builder" and "the
repo" are used as roles the viewer was not introduced to; the last takeaway is about this video, not
an instruction; scene 2 spends more time on the speech-recognition timeout than on what a critic is.
Sync: the Round 1 card shows 209 about 2 s before it is said; "six rounds" is highlighted before it
is spoken; the seven chips appear before "seven critics"; the two pull-request chips land 0.6 s
apart. Visuals: the title chip row sits off-centre while chips arrive; the loop scene is top-heavy
before its cards arrive; some cards have empty space at the bottom. Pacing: none.

Tool change made during this review: `bin/build.mjs` now carries a trailing function word ("a",
"to", "the"...) to the next caption line. The repo's tests pass; it was not re-checked by rebuilding
`videos/how-it-works`, whose generated files are stale.
