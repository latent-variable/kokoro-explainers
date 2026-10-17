# Review: how-we-built-it

The critic loop (`skills/critic-loop`) as run on this video, 2026-10-17. Four critics were run
(accuracy, clarity, sync, visuals); pacing, consistency and engagement were not. Every critic in
every round was a fresh agent that had not seen the build or an earlier round, all on Sonnet. A
round 5 attempt to run clarity and visuals on Opus was rejected by the workspace rate limit
(HTTP 429, one input token a minute), so both were rerun on Sonnet.

**Status: the four critics run all pass in round 7.** Pacing, consistency and engagement were not run.

| Critic | R1 | R2 | R3 | R4 | R5 | R6 | R7 |
|---|---|---|---|---|---|---|---|
| accuracy | fail | fail | pass | fail | pass | pass | pass |
| clarity | fail | fail | fail | fail | fail | fail | pass |
| sync | fail | pass | fail | pass | pass | pass | pass |
| visuals | fail | fail | pass | fail | fail | pass | pass |

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
- **Round 7.** After the clarity rewrite below, all four pass.

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

## Accepted minors

Left after round 7, not re-run. Clarity: the loop's last sentence puts its point at the end; scene 2
does not say why voicing sentences separately gives exact start times (the README's "because we put
it there"); "traps" is not defined and the example repeats scene 2. Sync: only accuracy and pacing
are outlined in the critics scene while three more are named; the example-video line lands about 3 s
after its sentence starts; the traps card shows lines the voice does not read and "on purpose" is
not spoken. Visuals: the pipeline scene is a single small row for about 15 s before the cards; the
Round 1 card sits alone on the left for a while; the caption chunk ends on "a". Accuracy: "sound and
picture line up" paraphrases the sync critic's README line. Pacing was not run: scenes read at 163
to 193 words a minute, above the 150 to 165 the `explainer-video` skill suggests, scene 6 highest.
