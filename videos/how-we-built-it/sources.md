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
| The pipeline turns plain text into narrated explainer videos | `README.md` intro: "Narrated explainer videos made from plain text"; `script/*.txt` plus `scenes.html` in *Make your own* |
| "A very meta explainer" (on-screen label): this video is about the project that makes it | Rests on the next row |
| This video is made by it | `videos/how-we-built-it/` is built with `npm run make`; same folder layout as `how-it-works` |
| It needs each sentence's start time so each picture can appear when its words are spoken | `README.md`, *How it works*: "enough for a card to land on the word that names it"; *Making things appear on a word*: an element "arrives when the voice reaches that word" |
| The usual way to get start times is speech recognition; it timed out downloading its model after six minutes | `README.md`, *How it works*: "speech recognition to find out would add a second, larger model"; `AGENTS.md`, Traps: "`hyperframes transcribe` built whisper.cpp and then timed out downloading its model after six minutes". "The usual way" is the narration's framing: the README names speech recognition as the alternative |
| So the pipeline generates the voice one sentence at a time and places each one on the track itself | `README.md`, *How it works*: "every sentence is voiced on its own and placed on the track by `bin/voice.mjs`"; `AGENTS.md`, Traps: "Timing comes from voicing each sentence separately (`bin/voice.mjs`)" |
| Then it knows every start time exactly | `README.md`, *How it works*: "Where a sentence starts is known exactly because we put it there" |
| AGENTS.md lists the traps this project hit, pitfalls to avoid, such as adding speech recognition | `AGENTS.md` has a *Traps* section; Traps: "No speech recognition, on purpose ... Do not add an ASR step" |
| What is written in AGENTS.md is in front of the next agent from the start (it opens "Start here") | `AGENTS.md` (commit #2), as above |
| A file called AGENTS.md tells coding agents where to start | `AGENTS.md` (commit #2): "Start here. This file says what the project is, where everything lives, which skill to load, and what is expected of you". Rests on the file's own wording; the repository does not say which agents read it |
| "No speech recognition, on purpose" is a line in AGENTS.md (skipping speech recognition is one of its traps) | `AGENTS.md`, Traps |
| The agent that builds a video is the worst judge of it | `README.md`, *Skills and critics*: "the agent that made something is the worst judge of it" |
| There are seven critics, each judging one thing (accuracy, pacing, clarity, visuals, sync, consistency, engagement); accuracy checks every claim against the sources; pacing checks the speaking rate; sync is "whether sound and picture line up" (a paraphrase of the README's "whether what is shown matches what is being said, when it is said") | `README.md` critics table: accuracy "every claim, spoken or shown, against the video's `sources.md`"; pacing "speaking rate, pauses, scene length, time to read on-screen text"; sync "whether what is shown matches what is being said, when it is said" |
| The critics are agents that review each video; each is a fresh agent that never saw the build | `AGENTS.md`, *What is expected*; `skills/critic-loop/SKILL.md` |
| The builder makes the video and never judges it | `AGENTS.md`: "The agent that builds a video never judges it" |
| The repo's example video, called how it works, went through six rounds before its critics passed | `videos/how-it-works/REVIEW.md`: rounds R1 to R6; the R6 column is all pass for the critics run (engagement passed in R5 and was not re-run in R6, by design). `how-it-works` is the repo's example video (`README.md`, *Make the example*) |
| Round one found speech at up to 209 words a minute, so the voice was slowed | `REVIEW.md`, Round 1: "Every scene was spoken at 176 to 209 words a minute: speed 1.0 became 0.85" |
| The speed went from 1.0 to 0.85 | `REVIEW.md`, Round 1 |
| Each round: the critics judge, the builder fixes what they find, and fresh critics judge again | `skills/critic-loop/SKILL.md`, *The loop*: fix, rebuild, "run fresh critics"; `README.md`: "the builder fixes them and runs fresh critics until none is blocking or major" |
| The builder also caught two pictures landing on the wrong word, so the pipeline now warns when a picture's (cue) word appears more than once in a scene | `REVIEW.md`: "two cues landing on an earlier word than intended ... `bin/build.mjs` now warns when a bare cue word occurs more than once in its scene"; `cada3b6` message: "silently mistimed two cues". Found by the builder's own look, not a critic |
| The warning stops a picture silently landing on the wrong word | `REVIEW.md`: "two cues landing on an earlier word than intended"; `cada3b6` message: "which silently mistimed two cues" |
| Turn each mistake into a warning or a written trap (a takeaway drawn from what the video showed: the build warning from `REVIEW.md` and the traps in `AGENTS.md`) | `videos/how-it-works/REVIEW.md` (the builder's catch became a warning in `bin/build.mjs`); `AGENTS.md`, *Traps* |
| Every change goes through a pull request | `README.md`, *How we work*: "Every change goes through a pull request" |
| A video counts as finished only when its critics pass | `AGENTS.md`, *What is expected*: "A video is done when its critics pass, not when it renders" |
| The takeaways (write traps in a file agents read first; never let the builder judge its own work; turn friction into a fix) | Practices of this repository as recorded in `AGENTS.md` and `README.md`; the video offers them as what a team could take, not as claims about outcomes |

## Left out

- Who wrote what: commits name one author, but the repository does not say how the work was
  divided, so the video does not either.
- The prompts and conversations behind each commit: not in the repository.
- The two critic-found bugs in round 3 and 5, the model split between Sonnet and Opus, and the
  review packet: details of the loop, not of how the codebase came to be.
