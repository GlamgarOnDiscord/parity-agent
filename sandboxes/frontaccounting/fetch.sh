#!/bin/sh
# FrontAccounting 2.4.20 (GPL-3.0-or-later), pinned to an upstream commit and hash-checked.
# Third-party source: downloaded next to the repo, never committed.
set -eu

COMMIT=9464a3ffef03c139d9396e697bce9a0a9f131a72
SHA256=7cd02a287a51ac621b0910f4ff2063a0f29877a9ef21bee80c7f2ba3066c6256
DEST=${1:-legacy-apps/frontaccounting}

mkdir -p "$DEST"
curl -fsSL -o "$DEST/fa.tar.gz" "https://codeload.github.com/FrontAccountingERP/FA/tar.gz/$COMMIT"
echo "$SHA256  $DEST/fa.tar.gz" | sha256sum -c -
rm -rf "$DEST/src"
tar -xzf "$DEST/fa.tar.gz" -C "$DEST"
mv "$DEST/FA-$COMMIT" "$DEST/src"
rm "$DEST/fa.tar.gz"
