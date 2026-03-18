#!/bin/bash
# Verify a single page loads correctly using agent-browser.
# Usage: ./verify-page.sh <url> [screenshot-name]
#
# Example: ./verify-page.sh http://localhost:3000/dashboard dashboard-home

set -euo pipefail

URL="${1:?Usage: verify-page.sh <url> [screenshot-name]}"
NAME="${2:-$(echo "$URL" | sed 's|.*/||' | sed 's/[^a-zA-Z0-9]/-/g' | sed 's/-\{2,\}/-/g' | sed 's/^-//;s/-$//')}"
# Fallback if NAME is empty (e.g. URL ends with /)
NAME="${NAME:-index}"
SCREENSHOT_DIR="$(dirname "$0")/../screenshots"

echo "🔍 Verifying: $URL"

# Open page in persistent session
agent-browser open "$URL" --session-name repwell

# Take annotated screenshot
agent-browser screenshot --annotate "$SCREENSHOT_DIR/${NAME}.png"
echo "📸 Screenshot saved: $SCREENSHOT_DIR/${NAME}.png"

# Check for console errors
echo "🔎 Checking console..."
ERRORS=$(agent-browser console 2>&1 || true)
if echo "$ERRORS" | grep -qi "error"; then
  echo "⚠️  Console errors detected:"
  echo "$ERRORS" | grep -i "error"
else
  echo "✅ No console errors"
fi

# Snapshot interactive elements
echo "🎯 Interactive elements:"
agent-browser snapshot -i

echo "✅ Done verifying: $URL"
