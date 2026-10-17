---
name: glossary
description: >
  Fix one name for each concept a video uses, and keep it the same in the script, captions,
  scenes, commands and any source it quotes: define each term once, ban the synonyms, and
  settle spellings before they reach the screen. Load when writing `sources.md` or a script
  for a video with more than a few named things, or when `critic-consistency` or
  `critic-clarity` finds a term used two ways.
---

# Glossary

A viewer who hears "take" in one scene and "clip" in another assumes two things. The cost is
real: `how-it-works` was caught calling one thing "take" and "sentence", and "render" for
both a scene and a step. One name per concept is cheaper to settle before the script than
to find in round three.

## Where it lives

A **Terms** section at the end of the video's `sources.md`. It is ground truth like the rest
of the file, so `critic-accuracy` and `critic-consistency` check against it.

```
## Terms
- <term>: <one-line meaning, in the viewer's words>. Source: <path or link>.
  Not: <synonyms never used for it>.
- <Name as written>: spelled <exactly>; said <spoken form> (`video.json` "say").
```

## The bar

- **One name per concept**, in narration, captions, on-screen labels, commands and file
  names. Listing the synonyms you will *not* use is what stops drift.
- **One concept per name.** If a word names two things (a scene and a step), rename one.
- **Use the source's name.** A term the code or the docs already use is the term, even when
  you would have chosen another. Do not invent a friendlier label for a flag, a type or an
  endpoint the viewer will meet for real.
- **Define on first use**, in a clause the viewer hears, not in a footnote.
- **Exact written forms**: capitalisation, hyphenation and the repo or product name. A
  video's `critics.md` may fix one ("always `kokoro-explainers`, lower case, hyphen"); this
  repo's name is a placeholder, so do not spread it.
- **Spoken form is separate from written**: record both, and put the spoken one in `"say"`.
- **Jargon the viewer lacks is defined or replaced.** `explain-concept` names who the viewer
  is; a term they would not know either gets its definition or goes.

## Keep it honest

Before the script is final, search the script, scenes and captions for each term's banned
synonyms. When a critic finds a conflict, fix the glossary first, then every place the old
word appears. A term added late is added to the glossary in the same change.
