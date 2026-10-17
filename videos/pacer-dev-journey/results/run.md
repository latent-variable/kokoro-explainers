# Run record: pacer-dev-journey

Written 2026-10-17 by hand from the files beside it; `docs/PLAN.md` step 0.2 would produce this from the transcript.

## What was made
A 170 s narrated explainer (7 scenes, 44 sentences, Kokoro `af_heart`, speed 1.25) of a developer going from the Tokyo 181% dashboard to
both causes in `sample_application/` and a fix verified in a scratch copy (all three campaigns at 100%).
Every number on screen is in `sources.md` with a recorded run (`captures/`, each with a SHA-256) or a line at the pin.

## Cost (`usage-delta.json`: `npm run usage` at the start minus at the end)
| | Calls | Output tokens | Cache write | Cache read |
|---|---|---|---|---|
| The builder (this session) | 71 | 105,432 | 563,754 | 21,640,050 |
| 15 critics (8 in round 1, 7 in round 2) | 80 | 15,146 | 915,193 | 3,214,836 |
| 1 research agent (for `docs/PLAN.md`, not the video) | 9 | 53 | 140,473 | 807,100 |

The builder's row covers the video, the plan in `docs/PLAN.md`, the critic loop and the fixes, so the video alone cost less than it
shows; the snapshot was taken only at the start and the end. Input tokens were negligible (338 in all); the cost is cache.
Output tokens may undercount a call that was still streaming when logged.

## Critic loop against the plan (`critic-rounds.json`)
- Plan: `standard`, 8 critics, at most 2 rounds; estimate 520k tokens and about 1 minute for round 1, at most 1,040k and 2.2 minutes.
- Actual: round 1 used 487k tokens in 71 s of wall time (the slowest critic, run in parallel); both rounds used 947k in 139 s.
  Tokens came in 6% (round 1) and 9% (both) under the estimate; wall time was 18% over for round 1 (71 s against "about 1 minute") and 139 s against 132 s for both.
- Round 1: 36 findings (1 blocking, 13 major, 22 minor); six of eight critics failed. Round 2: 19 findings (1 blocking, 2 major, 16
  minor); three of seven failed. Some of what they found was introduced by round 1's fixes (the orange line over a row, a 53% count mid-word); some had been there in round 1 and was missed (the close's "each note was true", the unshown $100).
- The cheap critics (pacing 7 to 10 s, engagement 21 s) found the fewest real problems; the slow ones (grounding 69 to 71 s, 19 to 20 tool
  calls each) re-ran every capture and found the least visible, most checkable defects (an uncaptured claim, a helper not in the repo).

## Time and tools
- Voice: 134.6 s for 39 sentences first time; 66.3 s for the 28 re-voiced after round 1 (takes are cached by text); the later script edits re-voiced a few more.
- About eleven draft renders of 205 to 242 s each (every change to a scene or the script rebuilds the whole video), then the final render.
- Node 22.17, Claude Code 2.1.302, Kokoro via `.venv` (Python 3.13), ffmpeg from Homebrew (compiled from source on this machine).
- Builder and judges: `claude-sonnet-5-5`.

## What this run suggests recording next time
The round-by-round token cost per critic, which finding classes each critic found that no other did, how many of a round's findings
were caused by the previous round's fixes, and whether the person agreed with the critic. None of that is joined automatically yet.
