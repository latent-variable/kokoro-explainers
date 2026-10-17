// Is a code excerpt shown in a video genuine? The command line for excerpt.mjs (read its header for what
// is and is not checked).
//   node check-excerpt.mjs <source file> <excerpt file> --ranges 4-6,10-12 [--marker "<text>"] [--ascii-markers]
// Read the source from the pin (`git show <sha>:<path> > <tmp>`), not from a working tree.
// Marker: a line that is only `…` (U+2026), optionally behind a comment mark; a literal `...` line is source
// text unless --ascii-markers; --marker "<text>" picks another when the source itself contains `…` lines.
// Prints JSON { ok, segments, gaps, problems, warnings }.
// Exit 0: every segment matches (read the gaps yourself). Exit 1: a segment does not match, or nothing was
// checked. Exit 2: bad usage or input. This file always runs main(), so it cannot exit 0 without output.
import { readFileSync, writeSync } from "node:fs";
import { checkExcerpt, parseRanges } from "./excerpt.mjs";

function main(argv) {
  const args = [], opts = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--ranges" || argv[i] === "--marker") {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) { console.error(`${argv[i]} needs a value`); return 2; }
      if (opts[argv[i].slice(2)] !== undefined) { console.error(`${argv[i]} was given twice`); return 2; }
      opts[argv[i].slice(2)] = value;
      i++;
    }
    else if (argv[i] === "--ascii-markers") opts.asciiMarkers = true;
    else if (argv[i].startsWith("--")) { console.error(`unknown option ${argv[i]}`); return 2; }
    else args.push(argv[i]);
  }
  if (args.length !== 2 || opts.ranges === undefined || (opts.marker !== undefined && !opts.marker)) {
    console.error('usage: check-excerpt.mjs <source file> <excerpt file> --ranges 4-6,10-12 [--marker "<text>"] [--ascii-markers]');
    return 2;
  }
  let r;
  try {
    r = checkExcerpt(readFileSync(args[0], "utf8"), readFileSync(args[1], "utf8"), parseRanges(opts.ranges), opts);
  } catch (e) {
    console.error(`error: ${e.message}`);
    return 2;
  }
  try {
    writeSync(1, JSON.stringify(r, null, 2) + "\n");
  } catch (e) {
    console.error(`error: could not write the result (${e.code || e.message})`); // for example stdout closed
    return 2;
  }
  return r.ok ? 0 : 1;
}

process.exit(main(process.argv.slice(2)));
