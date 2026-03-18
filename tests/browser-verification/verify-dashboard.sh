#!/bin/bash
# Sweep all dashboard pages and take screenshots.
# Requires: agent-browser session authenticated as a user.
#
# Usage: ./verify-dashboard.sh [base-url]

set -euo pipefail

BASE="${1:-http://localhost:3000}"
SCREENSHOT_DIR="$(dirname "$0")/../screenshots"
SCRIPT_DIR="$(dirname "$0")"

PAGES=(
  "/dashboard"
  "/dashboard/reviews"
  "/dashboard/analytics"
  "/dashboard/surveys"
  "/dashboard/widgets"
  "/dashboard/settings"
  "/dashboard/social-graphics"
  "/dashboard/reports"
  "/dashboard/insights"
  "/dashboard/geo"
  "/dashboard/help"
  "/dashboard/notifications"
)

echo "🏥 Dashboard verification sweep"
echo "================================"

PASS=0
FAIL=0

for PAGE in "${PAGES[@]}"; do
  NAME=$(echo "$PAGE" | sed 's|/|-|g' | sed 's/^-//')
  echo ""
  echo "📄 $PAGE"

  if "$SCRIPT_DIR/verify-page.sh" "${BASE}${PAGE}" "$NAME" 2>/dev/null; then
    ((PASS++))
    echo "  ✅ PASS"
  else
    ((FAIL++))
    echo "  ❌ FAIL"
  fi
done

echo ""
echo "================================"
echo "Results: $PASS passed, $FAIL failed out of ${#PAGES[@]} pages"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
