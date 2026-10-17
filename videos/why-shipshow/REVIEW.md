# Review: why-shipshow

The critic loop (`skills/critic-loop`) as run on this video, 2026-10-17. Importance high, so
the `thorough` preset: seven critics, at most four rounds, fixed until `major`. Every critic
in every round was a fresh agent that had not seen the build or an earlier round. All four
rounds ran on Sonnet, the final one included, because the hackathon's event key was for Sonnet
agents only.

| Critic | R1 | R2 | R3 | R4 |
|---|---|---|---|---|
| accuracy | fail | fail | fail | pass |
| clarity | fail | fail | fail | pass |
| pacing | fail | fail | pass | pass |
| sync | fail | pass | pass | pass |
| visuals | fail | fail | fail | fail (declined) |
| consistency | fail | fail | pass | pass |
| engagement | fail | fail | fail | fail (declined) |

## What the critics changed

- **Rounds 1 and 2.** The first draft failed everywhere. Pacing measured scenes well above
  the target rate, which is how the pace check moved from words to syllables a minute (short
  words had made words a minute read high). Several cue words matched an earlier word
  ("ship" inside "ShipShow"), which is how the build gained its duplicate-cue warning.
- **Round 3.** Accuracy: the critics roster on screen did not match the critics that exist,
  and "most days", the local claim, the post's date (UTC) and the speed example overstated
  the sources. Clarity: the Karpathy section ran long and the close had no clear step.
  Engagement: the video never showed a real frame of what ShipShow makes. Visuals: the
  catch card overlapped the roster, and several labels were under 30 px. All fixed: a real
  frame from how-it-works, the full roster with Decision marked as decision-video only,
  quotes trimmed with ellipses (Karpathy's words unchanged), and a three-step close.
- **Round 4 (final).** Accuracy, clarity, pacing, sync and consistency passed with minors
  only. Fixed from those minors and the failing critics' cheap points: the 1.5x readout was
  the loudest thing in the themes scene and is now smaller; the script tile now shows
  "+ scenes", which the voice names; the explainer-videos underline draws when the voice
  says "explainer"; the closing steps are larger.

## Declined

- **visuals, blocking: "the struck 'shit show' is cut off at the bottom."** Wrong. A 2x crop
  of frame 45 shows every glyph whole; the flat edge is the bowls of s, h and o on the
  baseline, under the strike line.
- **visuals, three majors on composition** (Karpathy card top-left with empty space, the
  pipeline and the decision scenes filling from the top). Taste, given one pass: each scene
  builds downward as the voice names each piece, and its last frame is full. Not reworked in
  the capped final round, where no critic would check the rework.
- **engagement, major: "show a real decision video full-width."** No real decision video
  exists in the repo yet; drawing one as if it did would be a claim sources.md cannot back.
  The real frame from how-it-works stays. Revisit once a team decision video ships.
- **engagement, major: "four scenes share one template."** Taste: one title-and-build
  pattern is the house style consistency asks for. Recorded for the next pitch video.

## Recorded, not chased (minor)

The PR chips are illustrative (accuracy); "formats he ranks" says Diagrams where the post
says diagrams / images (accuracy); "No API key" could be read as fully offline, and the
close does not name prerequisites (clarity); the lowercase `shipshow` theme id beside the
product name, and the two closing takeaways styled differently (consistency); the theme
cards land together (sync); the embedded frame is a thumbnail, not readable (visuals).

Critic outputs: `review/round-4/` (gitignored, with the frames).
