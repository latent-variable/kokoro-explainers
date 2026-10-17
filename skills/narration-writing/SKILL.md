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
- **Write for the person's speed.** `video.json`, `local/config.json` or `--speed` sets it (1.25 by
  default, a multiplier on a base of about 160 words a minute), and `critic-pacing` judges each scene
  against about 160 times the speed. At 1.25 a 30 second scene holds about 100 words. The packet's rate is
  speech-only and the speed is not yours to change, so a scene that is off target is fixed with fewer or
  plainer words: digits, identifiers and long clauses read slowly; short plain sentences read at the target.
  Do not pad to slow a scene or cram to speed one up.
- **Length is set by words.** A scene `critic-pacing` calls too long holds two ideas: cut words
  or split it.
- **What is said matches what is shown**, when it is shown. Name a thing as it appears, and
  put its `data-cue` on that word. If the sentence has the word twice, say `word#2` or split
  the sentence.
- **Say what the viewer needs, not what the code says.** Do not read symbols, paths, flags or long
  identifiers aloud; say what they mean and show the literal on screen. Whatever you say that differs from a code
  name is an alias, recorded in the glossary with its literal on screen at the same cue ("the budget check"
  for `withinBudget`; where the viewer must find it, tie the two in one sentence; "the models file" is
  ambiguous when two folders each have a `routes.py`: say which). When two names sound alike (`follower_id`, `followed_id`) or one
  name covers two things, write the alias **in the script itself**, so voice, captions and cue timing
  agree, and show the literal on screen at the same cue. Captions are built from the script, so a
  caption shows the alias and the screen shows the literal: that is expected, and the critics are
  told it is not a mismatch.
- **`say` is for pronunciation only.** `video.json` `"say"` swaps a word wherever a non-word
  character borders it, so `{"models.py": "the models file"}` also turns `app/models.py` into
  `app/the models file`. It changes the voiced text but not the caption, and the cue arithmetic and
  the packet's word count use the written text. Use it for one-meaning words, never for a name that
  appears inside a path or that begins a longer phrase in the same script (`index` also rewrites
  `the index route` and `index.html`).
- **A cue is placed on a word.** `data-cue` matches the start of a spoken word across the whole
  scene, not one sentence, so `follow` also matches `follower` and `followed`. Use `word#n` or a
  distinctive word; the build warns when a bare word occurs twice in its scene. Cue a literal on a
  word its alias contains ("posts" for `following_posts`), never on the identifier itself: it
  matches no spoken word and the build stops.
- **One name per thing, throughout** (`glossary`). Do not vary words for style.

## For the ear

- Short sentences, subject first, none that needs a second hearing. A sentence that holds a
  "which", an "and then" and a parenthesis is two or three.
- Put the point first; qualifications after.
- Numbers as they are said: "version two point four", "about two hundred milliseconds",
  "three of the five". Round to what a listener can hold; the exact figure goes on screen.
- Avoid homophones and look-alikes that can mislead by ear, and long strings of nouns. Avoid
  abbreviations with a full stop ("e.g.", "i.e.", "a.k.a."): a sentence ends at a full stop and a
  space, so they split the sentence. A closing quote after a full stop blocks the split (one long take
  with estimated cues), and an ellipsis splits mid-thought.
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
