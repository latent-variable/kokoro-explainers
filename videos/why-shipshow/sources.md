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
| Agents write code faster than you can read it; every pull request waits on you to understand it | The framing of this project (`README.md`, `AGENTS.md` *What this is*); a framing, not a measurement |
| "Keeping up is a shit show" / "Turn the shit show into a ship show" | The project's own line (`README.md`) |
| Karpathy: as models do more of the legwork, more of our work rises into oversight and understanding | The post, summary point 1 (narration shortens "rise up the abstractions into" to "rise into") |
| Karpathy: the format he is most bullish on is custom explainer videos on any topic | The post, *Explainer videos* |
| ShipShow makes those videos on your own machine | `bin/voice.mjs` (Kokoro, local), `bin/render.mjs` (HyperFrames, local headless Chrome) |
| Your agent writes a short script and the scenes | `skills/explainer-video` |
| Kokoro, a small local voice, reads it | Kokoro-82M, run by `hyperframes tts` on the CPU (`AGENTS.md`) |
| HyperFrames draws it, frame by frame | `hyperframes render` (`AGENTS.md`, *How the timing works*) |
| No API key needed | No step in `bin/` takes a key; the model downloads once |
| Your agent hands the question to a fresh explainer agent | `skills/explainer-video`, *A decision video, handed off mid-work* |
| Minutes later, you watch the options, their costs, and a recommendation | Same section; `critic-decision`. "Minutes": a quick review is about a minute of critics (`npm run critics`), plus voicing and rendering |
| A panel of critics checks it; each is a fresh agent with one question | `skills/critic-loop`, the eight critic skills, `docs/assets/critics.svg` |
| The agent decides how hard they look, by how much the video matters | `skills/critic-loop`, *How much review*: `importance` sets the preset |
| Speed it up, pick a theme, or build one from a client's brand | `--speed` and `speed`, `themes/`, `skills/theme` |
| This video has its own theme | `video.json` `"theme": "launch"` (`themes/launch`) |
| ShipShow is open source, on GitHub | `LICENSE` (MIT); github.com/latent-variable/shipshow |

## Left out

The writing (ASD-STE100), diagram and web-page advice in the post appear only as the ladder
of formats, not explained: the video is about the last rung.
