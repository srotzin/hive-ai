#!/usr/bin/env bash
# CI guard: block re-introduction of drained treasury address fallback.
# Old treasury (DRAINED 2026-04-25): 0xE5588c407b6AdD3E83ce34190C77De20eaC1BeFe
#
# Fails if:
#   - the old treasury address appears anywhere in source (excluding the helper
#     file which references it in a comment, plus scripts/test directories)
#   - any `process.env.HOUSE_WALLET || '0x...'` (or TREASURY_WALLET) fallback returns
#
# HiveFilter: 22/22

set -euo pipefail

OLD_TREASURY='0xE5588c407b6AdD3E83ce34190C77De20eaC1BeFe'

# 1) Hard literal scan (case-insensitive — addresses are checksum-cased)
if grep -rEni --include='*.js' --include='*.json' --include='*.ts' \
    --exclude-dir=node_modules --exclude-dir=scripts --exclude-dir=test \
    --exclude='treasury.js' \
    "$OLD_TREASURY" . ; then
  echo "FAIL: drained treasury literal detected." >&2
  exit 1
fi

# 2) Fallback-pattern scan
if grep -rEn --include='*.js' --include='*.ts' \
    --exclude-dir=node_modules --exclude-dir=scripts --exclude-dir=test \
    --exclude='treasury.js' \
    "process\.env\.(HOUSE_WALLET|TREASURY_WALLET)[[:space:]]*\|\|[[:space:]]*['\"]" . ; then
  echo "FAIL: HOUSE_WALLET/TREASURY_WALLET fallback pattern detected. Use lib/treasury.js getTreasuryAddress() instead." >&2
  exit 1
fi

echo "OK: no drained-treasury literal or fallback pattern in source."
