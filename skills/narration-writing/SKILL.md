---
name: narration-writing
description: >
  Write a script meant to be heard: short spoken sentences, one idea per scene, numbers and
  names as they are said, pronunciation fixes for the Kokoro voice, and nothing a listener
  would have to see to follow. Load when writing or revising `script/*.txt`, or when a
  critic finds pacing, clarity or pronunciation problems in narration.
---

# Narration writing

The script is read aloud once, at a fixed pace, with no rewind. A sentence that reads well
can be hard to hear. Write for the ear, then check it against the clock.

## The bar

- **One idea per scene**, in short sentences. The sentence is also the unit of timing: each
  one is voiced on its own, so a long sentence puts its cues at an estimate.
- **Pace**: 150 to 165 words a minute is comfortable for technical content; under 130 or
  over 175 fails `critic-pacing`. Kokoro at speed 1.0 reads near 190, so most videos want a
  `"speed"` around 0.85 to 0.9 in `video.json`. Fix a fast scene with fewer words before
  slowing the voice.
- **A scene under 40 seconds.** Past that it holds two ideas.
- **What is said matches what is shown**, when it is shown. Name a thing as it appears, and
  put its `data-cue` on that word. If the sentence has the word twice, say `word#2` or split
  the sentence.
- **Say what the viewer needs, not what the code says.** Do not read symbols, paths, flags or
  long identifiers aloud; say what they mean, and show the literal on screen.
- **One name per thing, throughout** (`glossary`). Do not vary words for style.

## For the ear

- Subject, verb, object. Break a sentence at every "which", "and then" and parenthesis.
- Put the point first; qualifications after.
- Numbers as they are said: "version two point four", "about two hundred milliseconds",
  "three of the five". Round to what a listener can hold; the exact figure goes on screen.
- Avoid homophones and look-alikes that can mislead by ear, and long strings of nouns.
- A pause is a comma or a sentence end. `lead`, `gap` and `tail` in `video.json` set the
  silences; do not pad text to make them.
- Do not announce structure ("in this section we will see"). Open on the point.

## Pronunciation

Kokoro mispronounces names and acronyms. Put the spoken form in `video.json` `"say"` and
keep the written form in captions:

```
"say": { "HyperFrames": "Hyper Frames", "MP4": "M P 4", "npm": "N P M" }
```

Listen to the first take of any new term before moving on. Do not add speech recognition to
check it (`AGENTS.md`).

## Check it

`npm run review -- <folder>` writes `review/packet.md`: words a minute, every pause, every
cue time. Read your own scenes against `critic-pacing`'s numbers before any critic is spent.
