#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Restore exactly the merged lockfile without changing project dependencies.
npm ci --no-audit --no-fund
npm run media
npm run e2e:setup