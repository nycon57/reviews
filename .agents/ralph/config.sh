#!/bin/bash
# Ralph Configuration for ReviewHub Project
# This file configures the Ralph agent loop for autonomous development

# Agent command - using Claude with Opus 4.5
AGENT_CMD="claude -p --dangerously-skip-permissions \"\$(cat {prompt})\""

# Alternative agents (uncomment to use)
# AGENT_CMD="codex exec --yolo -"
# AGENT_CMD="droid exec --skip-permissions-unsafe -f {prompt}"
# AGENT_CMD="opencode run \"$(cat {prompt})\""

# Project configuration
PROJECT_NAME="ReviewHub"
PROJECT_ROOT="/home/user/reviews"

# PRD location
PRD_PATH=".agents/tasks/prd-reviews.json"

# State directory
STATE_DIR=".ralph"

# Stale story timeout (seconds) - reopen stuck stories after this time
STALE_SECONDS=3600

# Max retries for failed stories
MAX_RETRIES=3

# Commit strategy: "each" commits after each story, "batch" commits at end
COMMIT_STRATEGY="each"

# Branch naming
BRANCH_PREFIX="claude/"

# Test commands to run as gates
TEST_CMD="npm run build && npm run lint"

# Skip certain file patterns from analysis
IGNORE_PATTERNS="node_modules,dist,.next,.expo,coverage"
