#!/usr/bin/env bash
# CI staleness check: regenerate outputs and verify no diff
set -euo pipefail

echo "Regenerating all targets..."
bun run scripts/codegen.ts generate --target all
bun run scripts/codegen.ts docs

echo "Checking for uncommitted changes in generated files..."
if ! git diff --exit-code generated/; then
  echo "ERROR: Generated files are stale. Run 'bun run generate' and commit."
  exit 1
fi

echo "All generated files are up to date."
