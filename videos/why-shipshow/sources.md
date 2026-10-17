# Sources: why-shipshow

## Andrej Karpathy, on X, 2026-10-02

https://x.com/karpathy/status/2105819303471976479 (text read through the fxtwitter API, 2026-10-17).
Every Karpathy line on screen is quoted from it exactly; the narration paraphrases only where
it says so below.

- "As LLMs get better, they will do more and more of the legwork autonomously, and a lot more of our work will rise up the abstractions into oversight and understanding."
- "The output format I am most bullish on is fully custom / bespoke explainer videos generated on any arbitrary topic."
- "you can ask your LLM to find you decent free alternatives that use your local compute"
- "This is actually starting to work!"
- The post walks a ladder of formats, each "even better" than the last: writing, diagrams / images, web pages, explainer videos.

## Claims

| Claim | Source |
|---|---|
| Agents write code faster than you can read it; each pull request waits on you | The framing of this project (`README.md`, `AGENTS.md` *What this is*); a framing, not a measurement |
| The pull request chips (PR #812, +2,184 −967, merge conflict, CI: failing, 47 unread) | Illustrations of a busy queue, not real data |
| "Keeping up is a shit show" / "Turn the shit show into a ship show" | The project's own line (`README.md`) |
| ShipShow turns each change into a short video you can watch | `skills/explainer-video` (decision, feature and release videos); `videos/how-it-works` is one |
| Karpathy: as models get better, a lot more of our work will rise into oversight and understanding | The post, summary point 1. The narration keeps "as models get better" and shortens "rise up the abstractions into" to "rise into"; the card quotes it exactly from "our work" on |
| Karpathy: the format he is most bullish on is custom explainer videos, on any topic | The post, *Explainer videos* |
| The ladder: writing, then diagrams, web pages and explainer videos, each "even better", videos "most bullish" | The post's own order and words; no other label is his |
| ShipShow makes those videos on your own machine | `bin/voice.mjs` (Kokoro, local), `bin/render.mjs` (HyperFrames, local headless Chrome) |
| Your agent writes a short script and the scenes | `skills/explainer-video` |
| A small local voice called Kokoro reads it | Kokoro-82M, run by `hyperframes tts` on the CPU (`AGENTS.md`) |
| HyperFrames renders it to an MP4 | `hyperframes render` (`bin/render.mjs`); the frame shown is from `videos/how-it-works` |
| No API key for the voice or the render | No step in `bin/` takes a key; the models download once. The agent that writes the script is the person's own |
| Most days, you will use it when your agent needs your call | `AGENTS.md` *What this is*: "The everyday use is a decision video" |
| Mid-change, your agent asks: rewrite the retry logic, or patch it? | An illustrative decision, not a real one; the options, bars, "Patch it" and the frame labelled "the video you watch" are an example of the shape |
| It hands that question to a fresh explainer agent, one that did not write the code | `skills/explainer-video`, *A decision video, handed off mid-work*: a fresh agent, "so the video is made by one that has not absorbed its reasoning" |
| Soon after, you watch both options, what each costs, and a recommendation | Same section; `critic-decision`. Build time not measured, so "soon after", not a number |
| Other agents act as critics and check it, so you can trust a video you did not check yourself | `skills/critic-loop`: each critic is a fresh agent; the builder never judges its own video |
| The critic chips: seven, plus Decision marked "decision videos" | `bin/lib.mjs` `BASE_CRITICS` (seven) and `skills/critic-loop`: a decision video adds `critic-decision` |
| On our own explainer video, one caught a setup step we had left out; fixed before it shipped | `videos/how-it-works/REVIEW.md`, round 3: critic-accuracy found "clone the project ... and run npm install" left out the Python environment; fixed in that round, before the video merged |
| Speed it up to watch faster (shown: 1.5x, `--speed`), or pick a theme, even one built from a client's brand | `--speed` and `speed` (1.25 by default, 0.5 to 2), `themes/`, `skills/theme` |
| The "this video" tag on launch | `video.json` `"theme": "launch"` (`themes/launch`) |
| ShipShow is open source, on GitHub; clone it, follow the setup in its README, then ask your agent for a video of your last change | `LICENSE` (MIT); github.com/latent-variable/shipshow; `README.md` *Set it up*; `skills/explainer-video` |

## Left out

The writing (ASD-STE100), diagram and web-page advice in the post appear only as the ladder
of formats, not explained: the video is about the last rung.
