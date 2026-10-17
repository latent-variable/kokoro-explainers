#!/bin/sh
# Is a vendored directory unmodified? Compares its committed tree (without SOURCE.md) with the upstream
# tree hash, and reports edits and untracked files in it. Read-only: it writes no object into .git.
#   verify-vendored.sh <directory, relative to the repo root> <upstream tree hash>
# Works from any directory inside the repo. It checks the repo it runs in, so run it before deleting
# .git from a scratch copy; it does not verify an archive copy.
# Exit 0 MATCH, 1 MISMATCH or DIRTY, 2 bad usage or not a git repository.
set -eu
[ "$#" -eq 2 ] || { echo "usage: verify-vendored.sh <directory> <upstream tree hash>" >&2; exit 2; }
dir=${1%/}; want=$2
top=$(git rev-parse --show-toplevel 2>/dev/null) || { echo "verify-vendored: not inside a git repository" >&2; exit 2; }
cd "$top"
gitdir=$(git rev-parse --absolute-git-dir)
export GIT_INDEX_FILE=$(mktemp -u) GIT_OBJECT_DIRECTORY=$(mktemp -d) GIT_ALTERNATE_OBJECT_DIRECTORIES="$gitdir/objects"
got=$({ git read-tree "HEAD:$dir" && git update-index --force-remove SOURCE.md && git write-tree; } 2>/dev/null) || { echo "verify-vendored: cannot read $dir at HEAD" >&2; exit 2; }
unset GIT_INDEX_FILE GIT_OBJECT_DIRECTORY GIT_ALTERNATE_OBJECT_DIRECTORIES
dirty=$(git status --porcelain --untracked-files=all -- "$dir" ":!$dir/SOURCE.md")
echo "committed tree: $got"
echo "upstream tree:  $want"
if [ "$got" != "$want" ]; then echo "MISMATCH: the committed tree differs from upstream"; exit 1; fi
if [ -n "$dirty" ]; then echo "DIRTY: uncommitted or untracked changes in $dir:"; echo "$dirty"; exit 1; fi
echo "MATCH: unmodified"
