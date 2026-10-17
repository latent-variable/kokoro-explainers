# Sources: how-we-built-it

The source of record is this repository's own history at commit `cada3b6`: the git log and
commit messages, `AGENTS.md`, `README.md`, and `videos/how-it-works/REVIEW.md`. Nothing here
comes from outside the repository.

- Repository: https://github.com/latent-variable/kokoro-explainers
- Commits: `9e3cde3` (pull request #1, the pipeline) and `cada3b6` (pull request #2, skills and critics)

## Claims

| Claim | Source |
|---|---|
| The project was built in two pull requests | `git log`: `9e3cde3 ... (#1)` and `cada3b6 ... (#2)`, after an initial commit |
| Claude assisted | Both commit messages end `Assisted-by: Claude claude-opus-5-5` |
| First came the pipeline, then the critics | #1 is "Kokoro and HyperFrames explainer pipeline"; #2 is "explainer and critic skills, review packet" |
| Script files and one HTML page become a narrated video | `README.md` intro and *Make your own*: `script/*.txt` plus `scenes.html` |
| Speech recognition timed out downloading its model after six minutes | `AGENTS.md`, Traps: "`hyperframes transcribe` built whisper.cpp and then timed out downloading its model after six minutes" |
| So the pipeline skips it and voices each sentence on its own | `AGENTS.md`, Traps, "No speech recognition, on purpose"; `bin/voice.mjs` |
| Every start time is then known exactly | `README.md`, *How it works*: "Where a sentence starts is known exactly because we put it there" |
| Each trap it hit was written into AGENTS.md | `AGENTS.md` has a *Traps* section: "Mechanics and traps for agents working here" (commit #1 version) |
| The next agent does not repeat it | `AGENTS.md` purpose: written for agents working in the repo; opens with "Start here" in #2 |
| One library version has to be pinned | `AGENTS.md`: "`requirements.txt` pins phonemizer"; `requirements.txt` pins `phonemizer==3.4.0` |
| The speech engine fails when its data path is 160 characters or longer | `AGENTS.md`: "espeak-ng fails when its data path is 160 characters or longer (measured 2026-10-17: 159 works, 160 fails)" |
| The agent that builds a video is the worst judge of it | `skills/critic-loop/SKILL.md`; `README.md`, *Skills and critics*: "the agent that made something is the worst judge of it" |
| Seven critic skills each judge one thing | `README.md` critics table: accuracy, clarity, pacing, sync, visuals, consistency, engagement |
| Every critic is a fresh agent that never saw the build | `AGENTS.md`, *What is expected*; `skills/critic-loop/SKILL.md` |
| The first video went through six rounds of critics | `videos/how-it-works/REVIEW.md`: rounds R1 to R6 |
| Round one found speech at up to 209 words a minute | `REVIEW.md`, Round 1: "Every scene was spoken at 176 to 209 words a minute" |
| The speed dropped from 1.0 to 0.85 | `REVIEW.md`, Round 1: "speed 1.0 became 0.85" |
| After round two, an engagement critic was added | `REVIEW.md`: "`critic-engagement` was added after round 2" |
| One finding fixed the tool itself: build warns when a cue word occurs twice in a scene | `REVIEW.md`: "`bin/build.mjs` now warns when a bare cue word occurs more than once in its scene". It came from the builder's own look between rounds, not a critic's finding; the narration says "finding" loosely |
| Every change goes through a pull request | `README.md`, *How we work*: "Every change goes through a pull request" |
| Friction becomes a fix; real use is what finds the gaps | `README.md`, *How we work*: "Friction becomes a pull request"; "Real use is what finds the gaps" |
| A video is done only when its critics pass | `AGENTS.md`, *What is expected*: "A video is done when its critics pass, not when it renders" |

## Left out

- Who wrote what: commits name one author, but the repository does not say how the work was
  divided, so the video does not either.
- The prompts and conversations behind each commit: not in the repository.
- The two critic-found bugs in round 3 and 5, the model split between Sonnet and Opus, and the
  review packet: details of the loop, not of how the codebase came to be.
