---
name: glossary
description: >
  Fix one name for each concept a video uses, and keep it the same in the script, captions,
  scenes, commands and any source it quotes: define each term once, ban the synonyms, and
  settle spellings before they reach the screen. Load when writing `sources.md` or a script
  for a video that names things a viewer must tell apart, or when `critic-consistency` or
  `critic-clarity` finds a term used two ways.
---

# Glossary

A viewer who hears "take" in one scene and "clip" in another assumes two things. The cost is
real: `how-it-works` was caught calling one thing "take" and "sentence", and "render" for
both a scene and a step. One name per concept is cheaper to settle before the script than
to find in round three.

## Where it lives

A **Terms** section at the end of the video's `sources.md`, written with it and before the
plan, so scene names use the settled words. It is ground truth like the rest
of the file, so `critic-accuracy` and `critic-consistency` check against it.

```
## Terms
- <term>: <one-line meaning, in the viewer's words>. Source: <path:line> at <pin>.
  Not: <synonyms never used for it>.
- <Name as written>: spelled <exactly>; said <spoken form> (`video.json` "say").
```

## The bar

- **One name per concept**, in narration, captions, on-screen labels, commands and file
  names. Listing the synonyms you will *not* use is what stops drift.
- **One concept per name.** If a word names two things (a scene and a step), rename one.
- **Use the source's name** for what the viewer will meet for real: a flag, a type, an endpoint.
  Where that name cannot be heard unambiguously or means two things, record a **spoken alias**
  in the entry and show the literal beside it on the same cue (`narration-writing`). One
  source name, one concept; if the code overloads a name, say which meaning each scene uses.
- **A word the source lacks is a decision.** If the brief's own word ("timeline") is absent
  from the code, the glossary says so and the plan states the real mechanism.
- **Define on first use**, in a short sentence the viewer hears ("A follower is someone who
  follows you."), not in a footnote.
- **Exact written forms**: capitalisation, hyphenation, product names. A video's `critics.md`
  may fix one.
- **Spoken form is separate from written**: record both; `narration-writing` covers `"say"`.
- **Jargon the viewer lacks is defined or replaced.** `explain-concept` names who the viewer
  is; a term they would not know either gets its definition or goes.

## Keep it honest

Before the script is final, search the script, scenes and captions for each term's banned
synonyms. When a critic finds a conflict, fix the glossary first, then every place the old
word appears. A term added late is added to the glossary in the same change.
