#!/bin/sh
# Is a vendored directory unmodified? Compares its committed tree (without SOURCE.md) with the upstream
# tree hash, and reports edits, untracked files, ignored files, and files hidden from git with
# --assume-unchanged or --skip-worktree. It creates no new object, ref or index entry in .git (git runs with
# --no-optional-locks, and its own objects go in a temporary directory, removed on exit); it may refresh the
# timestamp of an existing tree object. Repo-local settings that can hide edits are forced off for every git
# call: core.fsmonitor (whose hook it therefore never runs), core.fileMode=false, submodule ignore settings.
#   verify-vendored.sh <directory, relative to the repo root> <upstream tree hash, 40 or 64 hex>
# Works from any directory inside the repo. It checks the repo it runs in, so run it before deleting .git
# from a scratch copy; it does not verify an archive copy.
# Exit 0 MATCH, 1 MISMATCH or DIRTY, 2 bad usage, not a git repository, or git failed unexpectedly.
set -eu
[ "$#" -eq 2 ] || { echo "usage: verify-vendored.sh <directory> <upstream tree hash>" >&2; exit 2; }
dir=${1%/}; want=$(printf '%s' "$2" | tr 'A-F' 'a-f')
case "$dir" in ""|-*|:*) echo "verify-vendored: bad directory '$1'" >&2; exit 2 ;; esac
case "$want" in
  *[!0-9a-f]*) echo "verify-vendored: the hash must be hexadecimal" >&2; exit 2 ;;
esac
case "${#want}" in 40|64) ;; *) echo "verify-vendored: the hash must be 40 or 64 hex digits" >&2; exit 2 ;; esac
top=$(git rev-parse --show-toplevel 2>/dev/null) || { echo "verify-vendored: not inside a git repository" >&2; exit 2; }
cd "$top"
gitdir=$(cd "$(git rev-parse --git-common-dir)" && pwd -P)   # the common dir: a linked worktree has no objects of its own
g() { git -c core.fsmonitor=false -c core.untrackedCache=false -c core.fileMode=true -c diff.ignoreSubmodules=none -c core.hooksPath=/dev/null "$@"; }
tmp=$(mktemp -d)
# $tmp is left for the operating system's temp cleanup: this script never deletes (it is small: one index and the tree objects)
got=$(GIT_INDEX_FILE="$tmp/index" GIT_OBJECT_DIRECTORY="$tmp/objects" GIT_ALTERNATE_OBJECT_DIRECTORIES="$gitdir/objects" \
  sh -c 'mkdir -p "$GIT_OBJECT_DIRECTORY" && git -c core.fsmonitor=false read-tree "HEAD:$1" && git -c core.fsmonitor=false update-index --force-remove SOURCE.md && git -c core.fsmonitor=false write-tree' sh "$dir" 2>/dev/null) \
  || { echo "verify-vendored: cannot read $dir at HEAD" >&2; exit 2; }
dirty=$(g --no-optional-locks status --porcelain --ignored=matching --untracked-files=all --ignore-submodules=none -- ":(literal)$dir" ":(exclude,literal)$dir/SOURCE.md") || { echo "verify-vendored: git status failed" >&2; exit 2; }
hidden=$(g ls-files -v -- ":(literal)$dir" | grep -v '^H ' || true)
echo "committed tree: $got"
echo "upstream tree:  $want"
if [ "$got" != "$want" ]; then echo "MISMATCH: the committed tree differs from upstream"; exit 1; fi
if [ -n "$dirty" ]; then echo "DIRTY: uncommitted, untracked or ignored files in $dir:"; echo "$dirty"; exit 1; fi
if [ -n "$hidden" ]; then echo "DIRTY: files hidden from git (assume-unchanged or skip-worktree) in $dir:"; echo "$hidden"; exit 1; fi
echo "MATCH: unmodified"
