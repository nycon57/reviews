#!/bin/bash
# Run 3 passes for current story (multi-pass architecture)
# Usage: ./run-story.sh [story_id]
#
# This script runs Ralph 3 times for a single story to ensure:
# - Pass 1: Implementation
# - Pass 2: Quality Review (code-review, vercel-react-best-practices)
# - Pass 3: Polish & Finalize (code-simplifier, frontend-design)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PASSES=3
SLEEP_BETWEEN_PASSES=5

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Ralph Multi-Pass Story Runner${NC}"
echo -e "${BLUE}  Running $PASSES passes per story${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

for pass in $(seq 1 $PASSES); do
    echo -e "${YELLOW}=== Pass $pass of $PASSES ===${NC}"
    echo -e "Focus: $(
        case $pass in
            1) echo "Implementation" ;;
            2) echo "Quality Review" ;;
            3) echo "Polish & Finalize" ;;
        esac
    )"
    echo ""

    # Run ralph build for 1 iteration
    if command -v ralph &> /dev/null; then
        ralph build 1
    else
        echo -e "${RED}Error: ralph command not found${NC}"
        echo "Please ensure Ralph is installed and in your PATH"
        exit 1
    fi

    # Check exit status
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Pass $pass completed successfully${NC}"
    else
        echo -e "${RED}Pass $pass failed${NC}"
        exit 1
    fi

    # Sleep between passes (except after last pass)
    if [ $pass -lt $PASSES ]; then
        echo ""
        echo "Waiting ${SLEEP_BETWEEN_PASSES}s before next pass..."
        sleep $SLEEP_BETWEEN_PASSES
        echo ""
    fi
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  All $PASSES passes completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Story should now be marked as done if all verifications passed."
