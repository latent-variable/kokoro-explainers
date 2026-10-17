# Sample application: microblog

Vendored, unmodified, as the target for the explainer skills (`code-context`,
`change-context`, `explain-concept`).

- Upstream: https://github.com/miguelgrinberg/microblog
- Commit: a975ef64864354867c88e0ed3a17ba7d17dca752 (2025-04-06)
- License: MIT (see `LICENSE`)
- What it is: a Twitter-like microblogging web app (Flask Mega-Tutorial, 2024 edition).

## Verify it is unmodified, offline

The upstream commit's tree hash is `2c6e850f2babd3e23d75154a6b0c64cd5d19aa20` (from
`gh api repos/miguelgrinberg/microblog/git/commits/<commit>`, checked 2026-10-17). This directory,
without this file, hashes to the same tree:

```
export GIT_INDEX_FILE=$(mktemp -u)
git read-tree HEAD:sample_application && git update-index --force-remove SOURCE.md
git write-tree          # must print 2c6e850f2babd3e23d75154a6b0c64cd5d19aa20
unset GIT_INDEX_FILE
```

Cite lines against this repo's HEAD (what `git show HEAD:sample_application/<path>` resolves);
the upstream commit above is what the code is.
