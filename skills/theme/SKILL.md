---
name: theme
description: >
  Make or change a theme: the look every video picks up (colours, fonts, spacing, card shapes,
  captions, and the default motion), most often from a client's brand. Load when asked to
  style videos for a client or brand, to match a site or a deck, to change how the videos
  look in general, or to add a font or a logo.
---

# Theme

A theme is one folder: `theme.css` (a `:root` of tokens) plus any fonts and images it uses.
Every video draws its colours, type, spacing, shapes, captions and default motion from it,
so one theme restyles every video without touching a scene. `themes/shipshow/theme.css`
lists every token with a comment; start from a copy of it.

**Where it lives.** A client's brand is theirs: their theme goes in `local/themes/<client>/`,
which is never committed. A theme meant for everyone goes in `themes/<name>/` through a pull
request. A local theme with the same name as a shared one wins on that machine.

**Who uses it.** A video names it in `video.json` (`"theme": "acme"`); a person's default is
`local/config.json` (`"theme"`); `--theme acme` on `make` or `build` previews any theme on
any video without editing it.

## From a brand to a theme

1. **Gather the brand from its source**, not from memory: the client's site, style guide or
   deck. Colours as hex values, the typefaces, the logo, and anything they never do.
2. **Map it onto the tokens.** `--accent` is the one colour the eye should go to; `--accent-2`
   a second voice; `--bg`, `--card` and `--line` set the room; `--font-display` the headlines.
   Spacing and shape tokens (`--pad`, `--radius`, `--border`, `--shadow`, `--heading-align`)
   carry most of a brand's feel after colour.
3. **Fonts as files, never links.** A render runs offline: put the `.woff2` files in the
   theme folder and point `@font-face` at them with a relative `url()`; the build copies them
   next to the video. Only use a typeface whose licence allows embedding (most Google Fonts
   are OFL and do). Name a system fallback after it.
4. **Motion is part of the brand.** A calm brand gets `fade` and no camera; a playful one
   `rise` or `zoom`, a drifting `glow`. The motion tokens are the defaults; a video's flair
   can still change them.
5. **Check it on a real video.** `npm run make -- videos/how-it-works --theme <name> --draft`,
   then `npm run review -- videos/how-it-works` and look at the contact sheets.
   `npm run check -- videos/how-it-works` must pass every contrast check; a brand colour
   that fails on its background stays for accents and borders, never for body text.

**Done** when the demo video in the new theme passes `npm run check -- videos/how-it-works`,
the contact sheets look like the brand to someone who knows it, and `critic-visuals` finds
nothing blocking.
