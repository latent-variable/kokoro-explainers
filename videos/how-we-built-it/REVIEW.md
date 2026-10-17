# Review: how-we-built-it

The critic loop (`skills/critic-loop`) as run on this video, 2026-10-17. Four critics were run
(accuracy, clarity, sync, visuals); pacing, consistency and engagement were not. Every critic in
every round was a fresh agent that had not seen the build or an earlier round, all on Sonnet. A
round 5 attempt to run clarity and visuals on Opus was rejected by the workspace rate limit
(HTTP 429, one input token a minute), so both were rerun on Sonnet.

**Status: not done.** Three of the four critics pass in round 6. Clarity still fails.

| Critic | R1 | R2 | R3 | R4 | R5 | R6 |
|---|---|---|---|---|---|---|
| accuracy | fail | fail | pass | fail | pass | pass |
| clarity | fail | fail | fail | fail | fail | **fail** |
| sync | fail | pass | fail | pass | pass | pass |
| visuals | fail | fail | pass | fail | fail | pass |

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
- **Round 6.** Accuracy, sync and visuals pass. Clarity fails (below).

The builder's own look between rounds caught the heading-only openings and the "start time" line
sitting against the chip box before any critic did.

## Open: clarity, round 6

Two majors, both subjective:

- **Loop scene.** The pipeline-warning sentence ("it now warns when a picture could land on the
  wrong word") leans on the idea that pictures are tied to words, which scene 2 only hints at;
  and "how it works" is easy to mishear as a phrase rather than a video title.
- **Traps scene.** The 160-character espeak-ng example is a detail this audience will not hit, and
  the scene does not say why a file agents read first helps.

Clarity has raised these two spots since round 2, in different wording, and has asked both for more
explanation of the trap and for it to be replaced. This is the escalation case in `critic-loop`
(the same finding surviving three rounds, and a critic pulling two ways), so it is left for a human.

## Declined

- **Round 4 and 5, clarity:** add "too fast" and a critic's name to the round-one finding ("the
  pacing critic found speech too fast to follow"). The other video's `REVIEW.md` records the
  measured speed and the change to it, not the reason or which critic found it. Accuracy rejected
  the same phrase in round 2. Declined.
- **Round 2, clarity:** cut the espeak and phonemizer detail to one example. Done (phonemizer cut,
  espeak kept as the one example); see the open item above.

## Accepted minors

Left after round 6, not re-run: all seven critic chips land at the start of the scene, before
"seven critics" is said, and only two are highlighted; the first trap row lands before it is
spoken; the "six rounds" line lands about 3 s after its sentence starts; the loop caption line is
centred while other elements are left-aligned; some cards are taller than their content; the
critics and traps scenes sit in the top half of the frame. Pacing was not run: most scenes read at
150 to 193 words a minute, above the 150 to 165 the `explainer-video` skill suggests, scene 6 highest.
