# Lessons Learned

<!-- Update this file after ANY correction from the user -->
<!-- Format: pattern observed → rule to follow -->

## Rules

- **Grill sessions: don't reduce decisions to binary forks.** (2026-07-07) Jarrett flagged that grill questions were framed as A/B when the real option space was wider. Rule: enumerate the genuinely distinct options (3–5 when they exist), still lead with one recommendation. Use AskUserQuestion so options render selectable with an "Other" escape hatch.
- **Verify tool-fit before recommending infra reuse.** (2026-07-07) Recommended "PDF via existing Remotion infra" — Remotion renders video, not documents; Jarrett caught it. Rule: before claiming existing infrastructure covers a new job, check what the tool actually does, not what category it feels adjacent to.
- **Design reversals mid-flight: freeze the worker before compensating.** (2026-07-07) Reversed a schema decision while a worker was mid-task, then made my own compensating doc edit; crossed messages produced three rounds of restore/revert churn and a zombie migration in a commit. Rule: when reversing a decision a worker is executing, first message the worker and get an explicit ack of its current state; make NO compensating edits of my own until it confirms; state the end-state as a single authoritative list of files-present/files-absent.
