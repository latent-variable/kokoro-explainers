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

A **Terms** section at the end of the video's `sources.md`. It is ground truth like the rest of
the file, so `critic-accuracy` and `critic-consistency` check against it. Settling it before the
script is cheaper than finding a conflict in round three; revise it when the plan cuts a concept.

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
  source name, one concept. When the code overloads a name (`followers` is a table, a relationship
  and an alias inside one query), the entry labels each meaning and the scene shows which line is
  which, because a verbatim excerpt cannot be renamed. A spoken alias is followed, in a later scene,
  by the literal being said or tied to it on screen. Every file or function named aloud has an alias
  entry.
- **Aliases are for sound-alike or ambiguous names only**, not for every identifier. Each alias is tied to
  its literal by one spoken sentence ("the reader, which the code calls `follower_id`"), so the viewer
  who opens the editor finds the name. An alias is a second spoken name for a concept the screen shows,
  so the Terms entry lists it and a critic still checks that it means what the code means.
- **A word the source lacks is a decision.** If the brief's own word ("timeline") is absent
  from the code, the glossary says so, the video's title and `video.json` use the real mechanism, and
  the one corrective mention of the missing word is exempt from the ban list.
- **Define on first use**, in a short sentence the viewer hears ("A follower is someone who
  follows you."), not in a footnote.
- **Exact written forms**: capitalisation, hyphenation, product names. A video's `critics.md`
  may fix one.
- **Spoken form is separate from written**: record both; `narration-writing` covers `"say"`.
- **Jargon the viewer lacks is defined or replaced.** `explain-concept` names who the viewer
  is; a term they would not know either gets its definition or goes.

## Keep it honest

Before the script is final, each term's banned synonyms are absent from the script, scenes and
captions (a search is one way to know). When a critic finds a conflict, fix the glossary first, then every place the old
word appears. A term added late is added to the glossary in the same change.
