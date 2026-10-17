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
- **Pace is set by `speed` alone.** The packet's words a minute is speech-only: Kokoro reads
  about 190 at speed 1.0, so words a minute is about 190 times `speed`, whatever a scene's word
  count. `critic-pacing` holds the target and the limits; pick `speed` to land inside them (near
  0.85) and read the packet to confirm. The template's `speed` of 1.0 is too fast to pass.
- **Length is set by words.** A scene `critic-pacing` calls too long holds two ideas: cut words
  or split it.
- **What is said matches what is shown**, when it is shown. Name a thing as it appears, and
  put its `data-cue` on that word. If the sentence has the word twice, say `word#2` or split
  the sentence.
- **Say what the viewer needs, not what the code says.** Do not read symbols, paths, flags or
  long identifiers aloud; say what they mean and show the literal on screen. When two names
  sound alike (`follower_id`, `followed_id`) or one name covers two things, use the glossary's
  spoken alias and put the literal beside it on the same cue. `data-cue` matches the start of a
  spoken word, never an identifier.
- **One name per thing, throughout** (`glossary`). Do not vary words for style.

## For the ear

- Subject, verb, object. Break a sentence at every "which", "and then" and parenthesis.
- Put the point first; qualifications after.
- Numbers as they are said: "version two point four", "about two hundred milliseconds",
  "three of the five". Round to what a listener can hold; the exact figure goes on screen.
- Avoid homophones and look-alikes that can mislead by ear, and long strings of nouns.
- A pause is a comma or a sentence end. `lead`, `gap` and `tail` in `video.json` set the
  silences; do not pad text to make them.
- Do not announce structure ("in this section we will see"). Open on the point, and say why it
  matters to the viewer.

## Pronunciation

Kokoro mispronounces names and acronyms. Put the spoken form in `video.json` `"say"` and
keep the written form in captions:

```
"say": { "HyperFrames": "Hyper Frames", "MP4": "M P 4", "npm": "N P M" }
```

Agents cannot hear the voice and there is no speech recognition here (`AGENTS.md`). Give every
acronym, product name and odd identifier a spoken form up front; when a person reports a word
said wrongly, add it to `"say"`.
