---
name: critic-decision
description: >
  Critic for a decision video: one made so a person can make a call mid-work. Judges whether
  the decision is stated, every option is laid out with what it gains and costs, one is
  recommended with the reason, and doing nothing is accounted for. Load when the critic
  loop assigns you this critic.
---

# Critic: decision

**Judges:** whether a person who watches once can make the call. Not whether the facts are
true (`critic-accuracy`) or the video is clear in general (`critic-clarity`).

**Evidence:** the brief in `brief.md` (the decision, as the agent that asked for the video
framed it), the script and cues in `review/packet.md`, the frames, and `sources.md`.

## Criteria

- **blocking:** the decision is not stated in the first scene, in a sentence the viewer
  could answer.
- **blocking:** no recommendation, or a recommendation with no reason. Lay out, recommend,
  say why: "the agent working on this picks B, because it gives us X at the cost of Y".
- **blocking:** an option from `brief.md` missing, unless `sources.md` records it as dropped with
  `path:line`; or one the video presents that the brief and sources do not support.
- **major:** an option without both sides: what it gains and what it costs or breaks. Costs in
  the video that are only the brief's, with none derived from the code in `sources.md`, fail this.
- **major:** what happens if nobody decides is not said.
- **major:** the recommendation rests on something the viewer may not have weighed, and the
  video does not name it, so they cannot see where their own call would differ. This includes
  the brief's "Not verified" assumption, and every contradiction and added cost in `sources.md`'s
  brief-versus-code list: each is spoken in the video.
- **major:** the pick is voiced as the explainer's own ("I would pick B"). It is the working
  agent's, and the video says so.
- **minor:** options not shown side by side at the moment of choosing.

**Done:** when you could say, from the video alone, what is being decided, each option's
price, and which one is recommended and why.
