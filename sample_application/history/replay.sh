#!/bin/sh
# Rebuild this app's git history in a temporary repository (base, then each agent's change, then the
# reviewer's scenario) and print its path. Nothing in this repo is touched.
#   sh history/replay.sh
set -eu
here=$(cd "$(dirname "$0")" && pwd -P)
dir=$(mktemp -d "${TMPDIR:-/tmp}/replay.XXXXXX")   # an explicit template: BSD mktemp ignores TMPDIR without one
cd "$dir"
git init -q .
for p in "$here"/0*.patch; do
  GIT_COMMITTER_NAME=replay GIT_COMMITTER_EMAIL=replay@example.invalid git am -q "$p"
done
echo "$dir"
