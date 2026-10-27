#!/usr/bin/env bash
# Run inside `unshare --net` as root: bring up loopback only, check the network is gone, then prove and report
# as the normal user. Usage: sudo unshare --net -- bash scripts/ci-offline.sh <bun path> <user>
set -euo pipefail
BUN="$1"
RUN_AS="$2"
ip link set lo up
if curl -s -m 3 -o /dev/null https://github.com; then
  echo "The network is still reachable; this check would prove nothing." >&2
  exit 1
fi
echo "Network cut: loopback only."
sudo -u "$RUN_AS" env PATH="$PATH" HOME="$HOME" bash -s "$BUN" <<'INNER'
set -euo pipefail
BUN="$1"
"$BUN" scripts/serve-static.ts examples/invoice --port 4173 &
for i in $(seq 1 30); do curl -fsS -o /dev/null http://127.0.0.1:4173/ && break; sleep 1; done
"$BUN" bin/parity.ts report --proof examples/invoice/parity.proof.json --url http://127.0.0.1:4173/ \
  --out offline-report.html --summary offline-summary.md
cat offline-summary.md
"$BUN" bin/parity.ts prove --fixed
INNER
