// The eval suite's own shape, without calling a model: every case loads (the runner refuses a case with no grader or a bad
// front matter, and finds that out only after spending), names a real skill when it checks one, and is tagged.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { REPO } from "../bin/lib.mjs";

const dir = join(REPO, "evals");
const front = (text) => {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  assert.ok(m, "no front matter");
  return { raw: m[1], body: m[2], get: (k) => (m[1].match(new RegExp(`^${k}:\\s*(.*)$`, "m")) || [])[1] };
};
const skills = new Set(readdirSync(join(REPO, "skills")).filter((n) => existsSync(join(REPO, "skills", n, "SKILL.md"))));
const cases = readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== "results").map((d) => d.name);

test("evals: there are trigger and quality cases, each with a prompt, a tag and at least one grader of a known type", () => {
  assert.ok(cases.length >= 10, `only ${cases.length} cases`);
  let triggers = 0, qualities = 0;
  for (const c of cases) {
    const p = front(readFileSync(join(dir, c, "prompt.md"), "utf8"));
    assert.ok(p.body.trim().length > 40, `${c}: the prompt is empty`);
    const tags = (p.get("tags") || "").replace(/[\[\]\s]/g, "").split(",").filter(Boolean);
    assert.ok(tags.includes("trigger") || tags.includes("quality"), `${c}: tag it trigger or quality`);
    if (tags.includes("trigger")) triggers++; else qualities++;
    assert.match(p.get("description") || "", /^".*"$/, `${c}: quote the description, a colon in it breaks the YAML`);
    const graders = readdirSync(join(dir, c, "graders")).filter((f) => f.endsWith(".md"));
    assert.ok(graders.length >= 1, `${c}: no graders`);
    for (const g of graders) {
      const gf = front(readFileSync(join(dir, c, "graders", g), "utf8"));
      const type = gf.get("type");
      assert.ok(["regex", "tool_used", "tool_order", "file_exists", "llm", "baseline"].includes(type), `${c}/${g}: unknown grader type ${type}`);
      if (type === "llm") assert.match(gf.body, /PASS if/, `${c}/${g}: write the rubric as PASS and FAIL conditions`);
      if (type === "regex") assert.ok(gf.get("pattern"), `${c}/${g}: a regex grader needs a pattern`);
      if (type === "tool_used" && gf.get("tool") === "Skill") {
        const names = [...(gf.get("input_match") || "").matchAll(/[a-z][a-z-]{3,}/g)].map((m) => m[0]);
        assert.ok(names.some((n) => skills.has(n)), `${c}/${g}: input_match names no skill that exists`);
      }
    }
  }
  assert.ok(triggers >= 5 && qualities >= 5, `${triggers} trigger and ${qualities} quality cases`);
});

test("evals: a case that names a skill in its prompt names one that exists", () => {
  for (const c of cases) {
    const text = readFileSync(join(dir, c, "prompt.md"), "utf8");
    for (const m of text.matchAll(/shipshow:([a-z][a-z-]+)/g)) assert.ok(skills.has(m[1]), `${c}: shipshow:${m[1]} is not a skill`);
  }
});

test("evals: the results are gitignored and npm run evals never publishes", () => {
  assert.match(readFileSync(join(dir, ".gitignore"), "utf8"), /^results\/$/m);
  const pkg = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8"));
  assert.match(pkg.scripts.evals, /--no-publish/, "a report must not be published to claude.ai by default");
  assert.match(pkg.scripts.evals, /--max-cost-usd/, "the suite spends money: it needs a ceiling");
});
