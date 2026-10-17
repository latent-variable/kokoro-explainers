#!/bin/sh
# Run a command with no network, file writes confined to one scratch directory, and HOME and TMPDIR inside it.
#   sandbox-run.sh <scratch dir> <command> [args...]
# macOS only (sandbox-exec, deprecated but present). Elsewhere it refuses: an unsandboxed run is not a
# substitute. The profile takes the paths as parameters, never by splicing them into text, so a directory
# name cannot add permissions. Denied: the network; writes outside the scratch directory; the clipboard and
# preference daemons (pbcopy, defaults write); reading credential folders and token files under the
# user's real home (from the user database, not $HOME); and the open, osascript, screencapture and say tools.
# NOT denied: other reads (it is not a defence against hostile code) and any daemon not listed.
# Environment: only PATH and LANG are passed through, with HOME and TMPDIR set inside the scratch directory.
# The scratch directory must not be a system root, $HOME or an ancestor of it, or hold a .git. It gains
# .sandbox-home and .sandbox-tmp, which are not part of any pin.
# Exit 2 bad usage or a refused directory; 3 no sandbox on this system; otherwise the command's own status.
set -eu
if [ "$#" -lt 2 ]; then echo "usage: sandbox-run.sh <scratch dir> <command> [args...]" >&2; exit 2; fi
dir=$1; shift
[ -d "$dir" ] || { echo "sandbox-run: $dir is not a directory" >&2; exit 2; }
if [ "$(uname -s)" != "Darwin" ] || ! command -v sandbox-exec >/dev/null 2>&1; then
  echo "sandbox-run: no tested sandbox on this system; not running. Linux: bwrap --unshare-net, untested here." >&2
  exit 3
fi
real=$(cd "$dir" && pwd -P)   # sandbox-exec matches physical paths: /var is a symlink to /private/var
home=$(dscl . -read "/Users/$(id -un)" NFSHomeDirectory 2>/dev/null | awk '{print $2}')
[ -n "$home" ] || home=${HOME:-/var/empty}
home=$(cd "$home" 2>/dev/null && pwd -P || echo "$home")
case "$real" in
  /|/tmp|/private|/private/tmp|/var|/private/var|/Users|/Volumes|/System|/Library|/Applications|/usr|/bin|/sbin|/etc|/private/etc|/opt|"$home")
    echo "sandbox-run: refusing $real as the scratch directory (a system root or the home directory)" >&2; exit 2 ;;
esac
case "$home/" in
  "$real"/*) echo "sandbox-run: refusing $real: it contains the home directory" >&2; exit 2 ;;
esac
[ -e "$real/.git" ] && { echo "sandbox-run: refusing a scratch directory that holds a .git (use git archive, or delete .git from the copy first)" >&2; exit 2; }
mkdir -p "$real/.sandbox-home" "$real/.sandbox-tmp"
profile='(version 1)
(allow default)
(deny network*)
(deny file-write*)
(allow file-write* (subpath (param "SCRATCH")) (literal "/dev/null") (literal "/dev/tty") (literal "/dev/dtracehelper") (regex #"^/dev/fd/"))
(deny file-read* (subpath (string-append (param "HOMEDIR") "/.ssh")) (subpath (string-append (param "HOMEDIR") "/.aws")) (subpath (string-append (param "HOMEDIR") "/.gnupg")) (subpath (string-append (param "HOMEDIR") "/.kube")) (subpath (string-append (param "HOMEDIR") "/.docker")) (subpath (string-append (param "HOMEDIR") "/.claude")) (subpath (string-append (param "HOMEDIR") "/.config")) (subpath (string-append (param "HOMEDIR") "/Library/Keychains")) (literal (string-append (param "HOMEDIR") "/.npmrc")) (literal (string-append (param "HOMEDIR") "/.netrc")) (literal (string-append (param "HOMEDIR") "/.git-credentials")) (literal (string-append (param "HOMEDIR") "/.gitconfig")))
(deny mach-lookup (global-name "com.apple.pasteboard.1") (global-name "com.apple.cfprefsd.daemon") (global-name "com.apple.cfprefsd.agent"))
(deny process-exec (literal "/usr/bin/open") (literal "/usr/bin/osascript") (literal "/usr/sbin/screencapture") (literal "/usr/bin/say"))'
cd "$real"
exec env -i PATH="${PATH:-/usr/bin:/bin}" HOME="$real/.sandbox-home" TMPDIR="$real/.sandbox-tmp" LANG="${LANG:-C}" \
  sandbox-exec -D "SCRATCH=$real" -D "HOMEDIR=$home" -p "$profile" "$@"
