<p align="center">
  <img src="docs/assets/hero.svg" width="100%" alt="ShipShow. Turn a shit show into a ship show: narrated videos of what your agents did, and the calls they need from you. Beside the name, a 1:41 decision video asking: close the invoice leak? Three options, routes off, an ownership check and row-level security, with the ownership check recommended.">
</p>

Your agents work faster than you can follow. ShipShow turns what they did, and each call they need from you, into a short narrated video, so you decide knowing what you are deciding. It runs on your own machine.

<p align="center">
  <img src="docs/assets/demo.gif" width="720" alt="A scene from a ShipShow decision video: a request crosses four layers, firewall, load balancer, API and database; the firewall card says it never sees the owner, and a BUG LIVES HERE tag lands on the API as the voice says it, with each caption word lighting up as it is spoken.">
  <br>
  <sub>Each thing appears as the voice names it. From <a href="videos/invoice-leak">a decision video</a>: a coding agent found a security hole and needs your call.</sub>
</p>

https://github.com/user-attachments/assets/5421baa1-c54d-4151-8cf4-6e5e20be889e

<p align="center"><sub>The pitch, 57 seconds, made with ShipShow. <a href="videos/why-shipshow">Its script, scenes and review.</a></sub></p>

## How it works

<p align="center">
  <img src="docs/assets/how-it-works.svg" width="100%" alt="Five steps. Ask: a question, or a call your agent needs. Script and scenes: a fresh agent writes them from the code. Voice: Kokoro or OmniVoice, on your machine. Render: HyperFrames shows each thing on its word. Critics: fresh agents judge it until it passes; a failing round loops back to the script and scenes to be fixed and judged again. Then an MP4 you watch before you decide.">
  <br>
  <sub>Ask &rarr; Script + scenes &rarr; Voice &rarr; Render &rarr; Critics &rarr; MP4</sub>
</p>

[Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) or [OmniVoice](https://github.com/k2-fsa/OmniVoice) does the voice and [HyperFrames](https://hyperframes.heygen.com) draws and records the scenes. Your agent writes the script and the scenes, and a panel of critic agents decides when the video is done.

<p align="center">
  <img src="docs/assets/critics.svg" width="100%" alt="The critics: fresh agents, one question each; the agent that made the video never judges it. Nine numbered cards: accuracy, is every claim true? Clarity, will they follow it? Pacing, can they keep up? Sync, is it shown when it is said? Visuals, is every frame readable? Consistency, one name for one thing? Engagement, would they keep watching? Decision, can they make the call? Grounding, is the evidence real?">
  <br>
  <sub>Accuracy &middot; Clarity &middot; Pacing &middot; Sync &middot; Visuals &middot; Consistency &middot; Engagement &middot; Decision &middot; Grounding</sub>
</p>

## Install as a Claude Code plugin

```
claude plugin install shipshow --marketplace latent-variable/shipshow
```

Needs Claude Code 2.1.275 or later (tried from an empty config on 2.1.302, 2026-10-17: it installs, and a fresh session sees all 22 skills and the `shipshow:critic` agent). Three skills work in any repository: `code-context`, `change-context` and `evidence-standard`. The rest (briefs, plans, scripts, hand-backs, `explainer-video`, `critic-loop` and the critics) feed or judge the video pipeline, which needs this repo cloned and set up as below.

## Set it up

Node.js 22+, Python 3.10 to 3.13 (not newer: the pinned Kokoro does not support it) and ffmpeg (tested on macOS):

```
npm install
npm run setup
npm run doctor
npm run make -- videos/how-it-works
```

The first run downloads the voice model (about 340 MB) and, if needed, a headless Chrome (about 190 MB). Then ask your agent for one:

> Make me a ShipShow video on the retry logic you just wrote. I need to decide whether to ship it today.

## Make it yours

Tell your agent how you like your videos ("faster", "open with the decision", "always show the code") and it keeps that in `local/`, which never leaves your machine, along with videos about private code. Videos play at 1.25 times a relaxed pace by default; `npm run make -- <folder> --speed 1.5` tries another.

**A better voice, or your own.** On a Mac with Apple Silicon, `npm run setup:omnivoice` adds [OmniVoice](https://github.com/k2-fsa/OmniVoice): speech we find clearer and more natural, and it can clone a voice from a few seconds of recording. Put a clip at `local/voices/<name>.wav` (yours, or someone who agreed), and `npm run make -- <folder> --engine omnivoice --voice <name>` tries it. Kokoro stays the default and runs anywhere. Review effort is yours too: a `quick` review takes about a minute of critics, `thorough` up to six (`npm run critics -- <folder>` shows the plan).

Every video takes a theme: colours, fonts, layout and motion in one folder. Ship with `shipshow`, `paper`, `launch` or `buildday` (the look of [our pitch](videos/why-shipshow), from the LA AI Hackathon's page, with captions that light each word as it is spoken), or have your agent build one from a client's brand; `--theme paper` previews any theme on any video. A video can also carry a music bed, which drops under the voice while it speaks.

<p align="center">
  <img src="docs/assets/themes.jpg" width="100%" alt="The same moment of the same video in four themes: shipshow, dark navy with orange; paper, warm cream with serif headlines and deep red; launch, violet night with hot pink and cyan; buildday, deep space navy with ember and ice blue and a planet horizon.">
  <br>
  <sub>Same video, same frame: <code>shipshow</code>, <code>paper</code>, <code>launch</code> and <code>buildday</code>.</sub>
</p>

## How we work

- **Use it on your own work**, then turn whatever got in the way into a pull request.
- **A bar you keep wishing a video met becomes a critic.**
- **Every change is a pull request**, with CI and an automated review before it merges.

Everything about the code, the skills and the commands is in [AGENTS.md](AGENTS.md).

<sub>Made for a hackathon. MIT licensed. Kokoro-82M and HyperFrames are Apache 2.0, and so is OmniVoice's code (its weights have their own card); GSAP is under its free <a href="https://gsap.com/standard-license">standard license</a>.</sub>
