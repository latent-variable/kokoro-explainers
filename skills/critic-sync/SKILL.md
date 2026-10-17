---
name: critic-sync
description: >
  Use when the critic loop assigns you this critic. Critic for whether an explainer video's
  picture matches its voice: each thing appears when it is named, what is shown is what is being
  said, and captions match the speech.
---

# Critic: sync

**Judges:** the alignment of sound and picture. Not whether the picture looks good
(`critic-visuals`) or the words are true (`critic-accuracy`).

**Evidence:** the cue table in `review/packet.md` (what lands, when, and what is being said
at that moment) and the frames, each listed with the sentence being spoken in it.

## Criteria

- **blocking:** something shown contradicts what is being said at that moment.
- **major:** an element lands well before or after the words that name it: the viewer sees
  "82M" while hearing about something else, or hears about a thing that is not yet on screen.
  The cue table shows both.
- **major:** the voice talks about something for a whole sentence or more and nothing on
  screen shows it.
- **major:** the screen shows something the voice never mentions, competing for attention.
- **major:** a caption in a frame that does not match the sentence being spoken in that frame.
- **minor:** several elements landing at once where they are named one after another.

A **spoken alias** recorded in `sources.md` *Terms*, with its literal on screen at the same cue
(`glossary`; for a name the viewer must find in the code, also tied to it by a spoken sentence), is not a
naming, caption or sync mismatch. Its meaning is still checked: an alias that does not mean what the code means
is a finding. The one corrective mention of a word the code lacks (`glossary`, *A word the source
lacks*) is not a naming conflict either.

**Done:** when every cue row and every frame has been checked against its words.
