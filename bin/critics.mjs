// Print a video's critic plan: which critics run, on which model, for how many rounds, until
// what severity, and roughly what it costs. The critic loop (skills/critic-loop) follows it.
//   node bin/critics.mjs <folder> [--preset quick|standard|thorough] [--rounds 2] [--until major]
//                        [--model sonnet] [--final opus|none] [--frames cues|scenes]
//                        [--rerun failed|touched|all] [--critics a,b,c] [--json]
import { config, die, reviewPlan, videoDir } from "./lib.mjs";

const dir = videoDir(process.argv[2]);
const plan = reviewPlan(config(dir));
if (process.argv.includes("--json")) {
  console.log(JSON.stringify(plan, null, 2));
  process.exit(0);
}
const e = plan.estimate;
console.log(`Critic plan for ${plan.video} (${plan.kind} video, preset ${plan.preset}${plan.overrides.length ? `, changed: ${plan.overrides.join(", ")}` : ""})

  critics   ${plan.critics.join(", ")}${plan.floorAdded.length ? `  (${plan.floorAdded.join(", ")} added: the floor always runs)` : ""}
  model     ${plan.model}${plan.final ? `; ${plan.final} for the last round's ${plan.taste.join(", ")}` : ""}
  rounds    at most ${plan.rounds}
  until     ${plan.until === "blocking" ? "no blocking finding is left" : plan.until === "major" ? "no blocking or objective major finding is left" : "no finding at all is left"}
  rerun     ${plan.rerun === "failed" ? "only critics that failed" : plan.rerun === "touched" ? "critics that failed, and those whose ground a fix touched" : "every critic"}
  frames    ${plan.frames === "cues" ? "a still after every cue and at every scene end" : "a still at every scene end only"}

  about ${e.firstRound} min and ${e.firstRoundTokens}k tokens for the first round, at most ${e.worst} min and ${e.worstTokens}k in all
  (critic time only, rough: measured on how-it-works, 2026-10-17; a longer video costs
  more, and the builder's fixes between rounds come on top)

Whatever the caps, an open blocking ${plan.floor.join(" or ")} finding is never shipped: it goes to a person.`);
