#!/bin/sh
# Run a command with no network, writes confined to one scratch directory, and HOME/TMPDIR inside it.
#   sandbox-run.sh <scratch dir> <command> [args...]
# macOS only (sandbox-exec, deprecated but present). Elsewhere it refuses: an unsandboxed run is not a
# substitute. Reads are NOT confined except the credential folders listed below, and GUI launchers
# (open, osascript) are denied; do not treat this as a defence against hostile code.
set -eu
if [ "$#" -lt 2 ]; then echo "usage: sandbox-run.sh <scratch dir> <command> [args...]" >&2; exit 2; fi
dir=$1; shift
[ -d "$dir" ] || { echo "sandbox-run: $dir is not a directory" >&2; exit 2; }
if [ "$(uname -s)" != "Darwin" ] || ! command -v sandbox-exec >/dev/null 2>&1; then
  echo "sandbox-run: no tested sandbox on this system; not running. Linux: bwrap --unshare-net, untested here." >&2
  exit 3
fi
real=$(cd "$dir" && pwd -P)   # sandbox-exec matches physical paths: /var is a symlink to /private/var
home=${HOME:-/var/empty}
mkdir -p "$real/.sandbox-home" "$real/.sandbox-tmp"
profile="(version 1)
(allow default)
(deny network*)
(deny file-write*)
(allow file-write* (subpath \"$real\") (literal \"/dev/null\") (literal \"/dev/tty\") (literal \"/dev/dtracehelper\") (regex #\"^/dev/fd/\"))
(deny file-read* (subpath \"$home/.ssh\") (subpath \"$home/.aws\") (subpath \"$home/.gnupg\") (subpath \"$home/.config/gcloud\") (subpath \"$home/.kube\"))
(deny process-exec (literal \"/usr/bin/open\") (literal \"/usr/bin/osascript\"))"
cd "$real"
exec env -i PATH="${PATH:-/usr/bin:/bin}" HOME="$real/.sandbox-home" TMPDIR="$real/.sandbox-tmp" LANG="${LANG:-C}" \
  sandbox-exec -p "$profile" "$@"
