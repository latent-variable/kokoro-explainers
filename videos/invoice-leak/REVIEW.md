# Review: invoice-leak

## Round 1

Critics ran on the first cut (66.9 s, firewall as option A). All six returned `fail`. While the
fixes were under way the brief changed: the firewall is no longer an option (A is now "switch
the two routes off"), so findings about the old firewall option were closed by the redesign,
not patched. Speed is now 1.1; the new cut runs 97.9 s.

### accuracy: fail
- accuracy-1 (major, C card "stops the next forgotten check"): **fixed.** Now "a forgotten check can't leak" / "the next forgotten check can't leak" (the sources' wording: the check can still be forgotten; the leak is what stops).
- accuracy-2 (UTC): **fixed.** Tag reads "02:14 UTC"; sources.md says why.
- accuracy-3 (elevation of privilege dropped): **fixed.** Narration and tiles name information disclosure, tampering and elevation of privilege; each tile lights as it is said. sources.md lists S, R, D as not F-1.
- accuracy-4 (banner too broad): **fixed.** Now "readable and changeable by other customers", with "reads only" kept in the last scene.
- accuracy-5 (estimates caveat late): **fixed.** "Times are the agent's estimates" is spoken and on screen when the options open, and each time badge says "est."

### clarity: fail
- clarity-1 (two routes never named): **fixed.** Both routes are spoken as "opening an invoice" and "changing its status" and shown as `GET /invoices/:id` and `PATCH /invoices/:id/status`.
- clarity-2 (STRIDE with no stakes): **fixed.** Stakes line ("reads others' emails + amounts, can change a status") comes before STRIDE; STRIDE is one short line, lit letter by letter.
- clarity-3 (row-level security unexplained): **fixed.** "the database itself returns only your company's rows".
- clarity-4 (what the firewall rule does): **closed by the brief.** No firewall option; the firewall is explained only as why it cannot catch this.
- clarity-5 (firewall and load balancer glosses): **fixed.** Firewall: "sees addresses, never who owns an invoice, so it cannot catch this"; load balancer "spreads traffic" and the API "decides who sees what" are on the layer cards. Limit: the load balancer and database glosses are on screen, not spoken, to hold the length.
- clarity-6 (ends on a caveat): **fixed.** Ends on the recommendation, its reason and its assumption.
- clarity-7 (hard-to-follow sentences): **fixed.** Both rewritten shorter; the option A sentence no longer exists.

### decision: fail
- decision-1 (reason lacks B's cost): **fixed.** B's cost (the hole stays open for the hour; every future route must remember) is spoken and on its card, and the pick says why C follows.
- decision-2 (names no hinge): **fixed**, helped by the new brief. "This assumes an hour more exposure is acceptable... If not, switch the routes off first."
- decision-3 (estimates late): **fixed**, as accuracy-5.
- decision-4 (doing nothing omits already-used and status change): **fixed in part.** "readable and changeable by other customers" is stated; the "already used" fact is carried by the opening scene and the last-scene note "log: reads only so far", not repeated in the do-nothing line, to keep the video honest that only reads are shown.
- decision-5 (A's limit unstated): **closed by the brief**; A is now routes-off, whose cost is stated.

### engagement: fail
- engagement-1 (mechanism not shown, subjective): **fixed in part.** The routes are shown as request lines. **Declined:** a before-and-after code diff of the query, for the length cap (about 95 s); the options already say what B adds.
- engagement-2 (STRIDE jargon, subjective): **fixed.** See clarity-2.
- engagement-3 (text too small, subjective): **fixed.** Gains and costs and layer subs are 36 px display type, three to eight words each; all other text is 28 px or more.
- engagement-4 (template sameness, subjective): **declined.** Each scene already has its own form (log chips, a travelling request dot, a gate pair, lit STRIDE tiles, side-by-side cost cards, a lifted pick); further reinvention would not fit the length cap.
- engagement-5 (ending on a caveat): **fixed.** The last frame keeps all three options, the reasons and the do-nothing line.
- engagement-6 (stakes in the opening): **fixed in part.** The opening shows "6 invoices, 4 other companies" and "200 OK x 7"; the emails and amounts are named in the next scene, where the routes are, to save time in the hook.

### sync: fail
- sync-1 (C card late): **fixed.** C lands on "security", with its layer tag.
- sync-2 (B gain before it is said): **fixed.** B's gain appears on "lose" ("customers lose nothing").
- sync-3 (second sentence unshown): **fixed.** "6 invoices, 4 other companies" lands on "Six"; "200 OK x 7" on "through".
- sync-4 (STRIDE lit early): **fixed.** Tiles start unlit; each lights on its word.
- sync-5 (firewall sentence static): **fixed.** "never the owner" is highlighted on "owns"; the API card lights on "bug".
- sync-6 (empty frame on "Three options"): **fixed.** Three empty option slots appear on "Three".
- sync-7 (why strip early): **fixed.** Each line lands on its own words.
- sync-8 (disclaimer small and late): **fixed.** Caveat moved to the options' header and badges.
- sync-9 (routes not shown): **fixed**, as clarity-1.

### visuals: fail
- visuals-1 (blocking, costs overflow cards): **fixed.** Cards have no fixed height and the grid stretches them, so every box sits inside its card; checked in the contact sheets.
- visuals-2 (disclaimer small and dim): **fixed.** The caveat is a 28 px header and "est." badges on dark cards, not on the planet.
- visuals-3 and visuals-4 (empty frames, lopsided columns, subjective): **fixed.** Cards are outlined slots from the scene's start, so the layout does not shift.
- visuals-5 (small layer text): **fixed.** 36 px, light colour, same on all four.
- visuals-6 (STRIDE legend): **fixed.** The "log: reads only" pill is gone from that row (it is in the last scene), and the legend is 30 px.
- visuals-7 (ghost badge): **fixed.** The badge fades in place.
- visuals-8 (final frame balance): **fixed in part.** Three equal cards in a grid, B marked by colour and a stamp; the WHY lines are left-aligned (declined: centring).

### Left for the person
- Length 97.9 s is a few seconds over the 80 to 95 aim. Cutting "each a trust boundary" and the last sentence of scene 4 would get under.
- Nobody has heard the voice back; listen for "Option B" and "eighty-eight".
- The firewall's own rules (600 requests a minute, managed rules) were dropped from sources as unused.

## Round 2

Critics ran on the 97.9 s cut. Accuracy and decision passed (minors only); clarity, engagement, sync and visuals failed on the items below. The sync critic's blank caption at 63.83 s was a pipeline bug (since fixed in the kit) and is ignored. The cut after these fixes runs about 101.5 s.

### accuracy: pass
- accuracy-1 (narration "the log" reads as the whole log): **fixed.** Narration now says "this log excerpt shows only reads" (opening) and "the log excerpt shows only reads" (pick); on screen "log excerpt: reads only so far".
- accuracy-2 ("addresses" understates the firewall): **fixed.** "sees requests and addresses".

### decision: pass
- decision-r2-1 (excerpt): **fixed**, as accuracy-1.
- decision-r2-2 (A's price at the choice): **fixed.** A's card in the pick scene carries "customers locked out of both routes meanwhile", lit on "switch".
- decision-r2-3 (why C waits): **fixed.** "too big to rush tonight" is spoken and on the why box.

### clarity: fail
- clarity-1 (STRIDE, major): **fixed.** "Security teams check threats against a list called STRIDE. This hole hits three: reading what you should not, changing it, and doing more than your role allows." Each tile lights, with its plain-stake line (others' emails + amounts; an invoice's status; more than your role allows), on its words.
- clarity-2 (B in plain words, major): **fixed.** "Add the missing check, so each route returns an invoice only to its own company"; B's card says the same, and the cost is now "every future route must add the check".
- clarity-3 ("trust boundary", API gloss): **fixed in part.** "Each a trust boundary" is cut from the narration and the tag. **Declined:** the spoken API gloss ("the layer that decides who may see what"), to hold the length; the API card says it.
- clarity-4 (hinge by ear): **fixed in part.** "This assumes an hour more exposure is acceptable, since the log excerpt shows only reads. If not, switch the routes off first." with A's card lit and its price shown. **Declined:** "then ship B" and "Approve B", for length; B stays marked RECOMMENDED.
- clarity-5 (who is speaking): **declined.** The tag says "ledgerly access log" and the opening is the decision; naming the product in the narration costs words and the viewer is not confused about the topic.

### engagement: fail
- engagement-1 (STRIDE, major): **fixed**, as clarity-1.
- engagement-2 (reads only, major): **fixed.** The opening says "This log excerpt shows only reads."; the pick keeps the assumption line.
- engagement-3 (hinge small and late): **fixed.** A's card is on screen, dimmed, from the scene's start and lights with its cost when the fallback is spoken; the evidence line is display type in the why box.

### sync: fail
- sync-r2-1 (blank caption at 63.83 s): **ignored**, kit bug, since fixed.
- sync-r2-2 (glosses ahead of voice): **fixed in part.** The firewall gloss lands on "addresses". **Declined:** the other three glosses stay with their cards: they are labels, not claims the voice makes.
- sync-r2-3 (B card all at once): **fixed.** B lands on "Pick", "closes this hole" on "closes", the hour on "hour", the why line on "takes".
- sync-r2-4 (stakes line early): **fixed.** The line is gone; the three plain-stake lines each land on their word.
- sync-r2-5 (40 seconds unshown): **fixed.** A "40 SECONDS" pill lands on "forty".

### visuals: fail
- visuals-1 (empty slots in the recommendation, major): **fixed.** A and C sit dimmed with their content from the first frame and light on their words; the why box shows its four lines dimmed and lights each as it is spoken.
- visuals-2 (A's eyebrow wraps): **fixed.** "if an hour is too long" fits on one line.
- visuals-3 (rows do not align across option cards): **fixed in part.** A's title is "Routes off" and titles fit one line, so times line up better; the gain and cost rows still start where their content does.
- visuals-4 (layers diagram small): **fixed in part.** Cards are taller. **Declined:** shrinking the title.
- visuals-5 (decision question small): **fixed in part.** Enlarged to 100 px. **Declined:** receding the chips.
- visuals-6 (STRIDE legend): **fixed.** Unlit tiles are dimmer; the legend is replaced by the plain-stake lines.
- visuals-7 (reads-only line on the planet): **fixed.** It is the fourth line of the why box.

### Left for the person
- Length is about 101.5 s, at the edge of "about 100".
- The pick scene no longer carries a do-nothing line; the options scene does.
- Nobody has heard the voice back.
