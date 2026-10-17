# Sources: why-shipshow

## Andrej Karpathy, on X, 2026-10-02

https://x.com/karpathy/status/2105819303471976479 (text read through the fxtwitter API, 2026-10-17).
The date is the post's UTC timestamp (2026-10-02 00:37 UTC; the evening of Oct 1 in US time zones). Every Karpathy line on screen is quoted from it exactly; the narration paraphrases only where
it says so below.

- "As LLMs get better, they will do more and more of the legwork autonomously, and a lot more of our work will rise up the abstractions into oversight and understanding."
- "The output format I am most bullish on is fully custom / bespoke explainer videos generated on any arbitrary topic."
- "you can ask your LLM to find you decent free alternatives that use your local compute"
- "This is actually starting to work!"
- The post walks a ladder of formats, each "even better" than the last: writing, diagrams / images, web pages, explainer videos.

## Claims

| Claim | Source |
|---|---|
| Agents work overnight; by morning they need many decisions; you barely know what they did | The project's thesis (`AGENTS.md` *What this is*; the team, 2026-10-17): managing many agents means deciding on work you have not read. A framing, not a measurement |
| Overnight they wrote code, drafted a contract, screened four hundred applicants; "twelve decisions" | Illustrative, not real data |
| So you guess; approve and hope; the knot in your stomach is the hidden cost of agents: deciding without knowing | The team's framing of the problem (2026-10-17): deciding uninformed is anxiety |
| ShipShow turns every call your agents need into a short video | `skills/explainer-video`, *A decision video, handed off mid-work*: the working agent writes `brief.md` and a fresh explainer agent makes the video. Nothing in `bin/` reads code: the pipeline voices and renders any script, so the call need not be about code |
| A decision video shows what happened, the options, what each costs, and what the agent recommends | `skills/explainer-video` (a decision video ends "on the options and a recommendation"); `skills/critic-decision` (every option with what it gains and costs, one recommended with the reason) |
| A hiring agent (400 to 12), a finance agent (a refund), a coding agent (rewrite the retry logic) each hand you a video | Illustrative examples of the same handoff, labelled as examples on screen; the coding one is the example in `videos/how-it-works` and the earlier pitch |
| Not a wall of logs | A framing: the alternative to watching is reading the agent's raw output |
| Critic agents check every claim against its sources before it reaches you | `skills/critic-loop` (fresh agents; the builder never judges its own video) and `skills/critic-accuracy` (every claim, spoken or shown, against `sources.md`) |
| Karpathy calls custom explainer videos the format he is most bullish on | The post: "The output format I am most bullish on is fully custom / bespoke explainer videos" |
| Less anxiety, better calls | The project's promise (the team, 2026-10-17); a framing |
| ShipShow is open source, on GitHub | `LICENSE` (MIT); github.com/latent-variable/shipshow |
| This video was made by ShipShow | This folder: its script, scenes and review run through `bin/` (voiced by OmniVoice, rendered by HyperFrames) |
