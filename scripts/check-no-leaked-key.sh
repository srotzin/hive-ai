#!/usr/bin/env bash
# CI guard: block re-introduction of leaked HIVE_INTERNAL_KEY (rotated 2026-04-25)
#
# Fails if either:
#   - the leaked key literal appears anywhere in source
#   - any `process.env.HIVE_INTERNAL_KEY || '...'` (or similar) fallback returns
#
# Excludes: node_modules, scripts/ (this file references the literal in comments),
# and the test files which construct the literal at runtime via concatenation.
#
# HiveFilter: 22/22

set -euo pipefail

LEAKED='125e04e071e8829be631ea0216dd4a0c9b707975fcecaf8c62c6a2ab43327d46'

# 1) Hard literal scan
if grep -rEn --include='*.js' --include='*.json' --include='*.ts' \
    --exclude-dir=node_modules --exclude-dir=scripts --exclude-dir=test \
    "$LEAKED" . ; then
  echo "FAIL: leaked HIVE_INTERNAL_KEY literal detected." >&2
  exit 1
fi

# 2) Fallback-pattern scan: process.env.HIVE_INTERNAL_KEY || 'something'
if grep -rEn --include='*.js' --include='*.ts' \
    --exclude-dir=node_modules --exclude-dir=scripts --exclude-dir=test \
    "process\.env\.HIVE_INTERNAL_KEY[[:space:]]*\|\|[[:space:]]*['\"]" . ; then
  echo "FAIL: HIVE_INTERNAL_KEY fallback pattern detected. Use lib/internal-key.js getInternalKey() instead." >&2
  exit 1
fi

echo "OK: no leaked-key literal or fallback pattern in source."
