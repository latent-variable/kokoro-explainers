#!/bin/sh
# Run a command with no network, file writes confined to one scratch directory, HOME and TMPDIR inside it,
# and no controlling terminal.
#   sandbox-run.sh <scratch dir> <command> [args...]
# macOS only (sandbox-exec, deprecated but present). Elsewhere it refuses: an unsandboxed run is not a
# substitute. The profile takes paths as parameters, never by splicing them into text, so a directory name
# cannot add permissions.
#
# WHAT IT DOES: denies the network; writes outside the scratch directory; the clipboard and preference
# daemons (pbcopy, defaults write); signals to, and inspecting the arguments of, other processes; the window
# server, keychain and LaunchServices daemons; reading a list of credential, history and shell-startup files
# under the user's real home (from the user database, not $HOME); and the open, osascript, screencapture and
# say tools. The command runs in a new session with stdin from /dev/null, so it has no controlling terminal
# and cannot type into the caller's shell (TIOCSTI). Only PATH and LANG are passed through, with HOME and
# TMPDIR set inside the scratch directory.
#
# WHAT IT IS NOT: a confidentiality boundary or a defence against hostile code. Reads outside the denied list
# are open, so treat everything a sandboxed command can read as disclosed to it; any daemon not listed is
# reachable. Denying a tool by name does not deny the capability behind it.
#
# The scratch directory must not be a system root, the home directory or an ancestor of it, a dot-directory or
# ~/Library under home, /Users/Shared, or hold a .git. It gains .sandbox-home and .sandbox-tmp (not part of
# any pin), created only after every check passes.
# Exit 2 bad usage or a refused directory or command; 3 no sandbox on this system; otherwise the command's status.
set -eu
if [ "$#" -lt 2 ]; then echo "usage: sandbox-run.sh <scratch dir> <command> [args...]" >&2; exit 2; fi
dir=$1; shift
case "$dir" in -*) dir="./$dir" ;; esac
case "$1" in -*) echo "sandbox-run: the command $1 starts with a dash; nothing was run" >&2; exit 2 ;; esac
[ -d "$dir" ] || { echo "sandbox-run: $dir is not a directory" >&2; exit 2; }
if [ "$(uname -s)" != "Darwin" ] || ! command -v sandbox-exec >/dev/null 2>&1; then
  echo "sandbox-run: no tested sandbox on this system; not running. Linux: bwrap --unshare-net, untested here." >&2
  exit 3
fi
real=$(cd -- "$dir" && pwd -P)   # sandbox-exec matches physical paths: /var is a symlink to /private/var
real=${real#/System/Volumes/Data}  # the firmlink alias of the same directory
[ -n "$real" ] || real=/
home=$(dscl . -read "/Users/$(id -un)" NFSHomeDirectory 2>/dev/null | awk '{print $2}')
[ -n "$home" ] || home=${HOME:-/var/empty}
home=$(cd -- "$home" 2>/dev/null && pwd -P || echo "$home")
home=${home#/System/Volumes/Data}
refuse() { echo "sandbox-run: refusing $real as the scratch directory ($1)" >&2; exit 2; }
case "$real" in
  /|/tmp|/private|/private/tmp|/var|/private/var|/Users|/Users/Shared|/Users/Shared/*|/Volumes|/System|/System/*|/Library|/Applications|/usr|/bin|/sbin|/etc|/private/etc|/opt|"$home")
    refuse "a system root, a shared folder or the home directory" ;;
  "$home"/.*|"$home"/Library|"$home"/Library/*) refuse "a dot-directory or ~/Library under the home directory: credentials and persistence live there" ;;
esac
case "$home/" in "$real"/*) refuse "it contains the home directory" ;; esac
[ -e "$real/.git" ] && { echo "sandbox-run: refusing a scratch directory that holds a .git (use git archive, or delete .git from the copy first)" >&2; exit 2; }
mkdir -p "$real/.sandbox-home" "$real/.sandbox-tmp"
profile='(version 1)
(allow default)
(deny network*)
(deny file-write*)
(allow file-write* (subpath (param "SCRATCH")) (literal "/dev/null") (literal "/dev/dtracehelper") (regex #"^/dev/fd/"))
(deny file-read* (subpath (string-append (param "HOMEDIR") "/.ssh")) (subpath (string-append (param "HOMEDIR") "/.aws")) (subpath (string-append (param "HOMEDIR") "/.gnupg")) (subpath (string-append (param "HOMEDIR") "/.kube")) (subpath (string-append (param "HOMEDIR") "/.docker")) (subpath (string-append (param "HOMEDIR") "/.claude")) (subpath (string-append (param "HOMEDIR") "/.codex")) (subpath (string-append (param "HOMEDIR") "/.supabase")) (subpath (string-append (param "HOMEDIR") "/.config")) (subpath (string-append (param "HOMEDIR") "/.local")) (subpath (string-append (param "HOMEDIR") "/.cache")) (subpath (string-append (param "HOMEDIR") "/.npm")) (subpath (string-append (param "HOMEDIR") "/Library/Keychains")) (subpath (string-append (param "HOMEDIR") "/Library/Cookies")) (subpath (string-append (param "HOMEDIR") "/Library/Application Support")) (subpath (string-append (param "HOMEDIR") "/Library/Safari")) (literal (string-append (param "HOMEDIR") "/.npmrc")) (literal (string-append (param "HOMEDIR") "/.yarnrc")) (literal (string-append (param "HOMEDIR") "/.netrc")) (literal (string-append (param "HOMEDIR") "/.git-credentials")) (literal (string-append (param "HOMEDIR") "/.gitconfig")) (regex (string-append "^" (param "HOMEDIR") "/[.](zsh|bash)[a-z_]*$")) (literal (string-append (param "HOMEDIR") "/.zprofile")) (literal (string-append (param "HOMEDIR") "/.python_history")))
(deny mach-lookup (global-name "com.apple.pasteboard.1") (global-name "com.apple.cfprefsd.daemon") (global-name "com.apple.cfprefsd.agent") (global-name "com.apple.windowserver.active") (global-name "com.apple.SecurityServer") (global-name "com.apple.coreservices.launchservicesd"))
(deny signal (target others))
(deny process-info* (target others))
(deny process-exec (literal "/usr/bin/open") (literal "/usr/bin/osascript") (literal "/usr/sbin/screencapture") (literal "/usr/bin/say") (literal "/usr/bin/shortcuts"))'
cd -- "$real"
# A new session, no controlling terminal, stdin from /dev/null: the command cannot reach the caller's tty.
exec env -i PATH="${PATH:-/usr/bin:/bin}" HOME="$real/.sandbox-home" TMPDIR="$real/.sandbox-tmp" LANG="${LANG:-C}" \
  sandbox-exec -D "SCRATCH=$real" -D "HOMEDIR=$home" -p "$profile" \
  /usr/bin/perl -MPOSIX -e 'POSIX::setsid(); exec { $ARGV[0] } @ARGV or exit 127;' -- "$@" </dev/null
