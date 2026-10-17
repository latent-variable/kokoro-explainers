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
framed it, with numbered claims), the script and cues in `review/packet.md`, the frames,
`sources.md`, and **the code at the pin**, whose path and SHA the brief and `sources.md` give (the critic
brief repeats them). `sources.md`'s brief-versus-code list is a claim to check, not ground truth: re-run
every `confirmed` absence claim, and every `confirmed` claim about the recommended option, over the whole
pinned tree, and sample the `contradicted` and `not checked` entries too: flag any that a read of the
pinned tree settles.

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
  video does not name it, so they cannot see where their own call would differ. What the brief's
  `Pick rests on` lists, the "Not verified" assumption, every claim left "not checked" that the pick
  rests on (a "by when", an effort estimate), and every contradiction and added cost in `sources.md`'s
  brief-versus-code list must be **spoken** in the video, attributed as unverified where they are. The
  rest of that list may be a row of an on-screen table, and the full list goes in the hand-back.
- **major:** the recommended option's costs stop at the first mechanism: they do not trace its path
  (entry point, client, storage, failure) with `path:line`.
- **major:** the pick is voiced as the explainer's own ("I would pick B"). It is the working
  agent's, and the video says so.
- **minor:** options not shown side by side at the moment of choosing.

**Done:** when you could say, from the video alone, what is being decided, each option's
price, and which one is recommended and why.
