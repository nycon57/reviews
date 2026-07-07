# Visual Workflow Builder - Feature Spec

**Status:** Future (post-MVP)
**Priority:** P3
**Estimate:** XL (6-8 weeks)
**Epic:** Campaign Automation

---

## 1. Overview

Drag-and-drop visual canvas for building multi-channel automation workflows (email, SMS, future channels). Users compose sequences by connecting trigger, action, condition, delay, and exit nodes on a graph editor — similar to Zapier, n8n, or Mailchimp's Customer Journey builder.

**Key insight:** The backend orchestration engine already exists at `src/lib/email/orchestration/` with full support for triggers, conditions, branching, delays, A/B tests, multi-channel routing, and queue management. This feature is purely a visual frontend that serializes/deserializes to the existing `SequenceDefinition` type.

---

## 2. Library Evaluation

### Option A: React Flow / xyflow (Recommended)

- **License:** MIT (fully open source)
- **React-native:** Built as React components, hooks-based API
- **Community:** 25k+ GitHub stars, active maintenance, largest React ecosystem
- **Workflow builder example:** Official example at reactflow.dev/examples/layout/workflow-builder
- **Pros:** Zero licensing cost, huge plugin ecosystem, works with Next.js SSR (client component), great TypeScript support, built-in minimap/controls/background
- **Cons:** Need to build all custom node UIs from scratch
- **Links:** [xyflow.com](https://xyflow.com), [reactflow.dev](https://reactflow.dev), [GitHub](https://github.com/xyflow/xyflow)

### Option B: JointJS

- **License:** Core is MPL 2.0 (open source), JointJS+ is $2,990/dev/year
- **Framework:** Framework-agnostic (SVG-based), React wrapper available
- **Pros:** 170+ pre-built demo apps, 40+ UI components in commercial version, built-in BPMN shapes
- **Cons:** Commercial features (stencil palette, keyboard shortcuts, clipboard, undo/redo, export) locked behind $2,990/dev license. React integration is a wrapper, not native. SVG rendering (not DOM) means harder to style with Tailwind/shadcn
- **Links:** [jointjs.com](https://www.jointjs.com), [Pricing](https://www.jointjs.com/pricing)

### Option C: JsPlumb Toolkit

- **License:** Commercial only ($2,500+/dev)
- **Pros:** Mature, enterprise-grade
- **Cons:** No open-source tier, smaller community
- **Links:** [jsplumbtoolkit.com](https://jsplumbtoolkit.com)

### Recommendation

**React Flow (xyflow)**. Zero cost, native React/TypeScript, largest community, and the official workflow builder example is 80% of what we need. JointJS's open-source core lacks the stencil/palette/undo features we'd need, pushing us to the $2,990 commercial license — and even then it's SVG-based which fights our Tailwind/shadcn design system.

---

## 3. Node Types

Each node maps to existing orchestration primitives in `src/lib/email/orchestration/types.ts`.

### 3.1 Trigger Nodes (entry points, exactly 1 per workflow)

| Node | Maps to | Config |
|---|---|---|
| Event Trigger | `SequenceTrigger.type: "event"` | Select from `TriggerEvent` enum (user_signup, review_received, loan_closed, etc.) |
| Time Trigger | `SequenceTrigger.type: "time"` | Cron schedule string, e.g., "Every Monday 9am" |
| Manual/API Trigger | `SequenceTrigger.type: "manual" \| "api"` | Webhook URL display, optional conditions |
| Condition Trigger | `SequenceTrigger.type: "condition"` | Field/operator/value matching `Condition` type |

**Visual:** Rounded rectangle, green accent, lightning bolt icon. Single output handle (bottom).

### 3.2 Action Nodes

| Node | Maps to | Config |
|---|---|---|
| Send Email | `SequenceStep` with `ChannelConfig.channel: "email"` | Template picker, subject override, A/B test toggle |
| Send SMS | `SequenceStep` with `ChannelConfig.channel: "sms"` | SMS template, fallback channel toggle |
| Smart Send | `SequenceStep` with `SmartChannelConfig` | Strategy selector (prefer_sms, prefer_email, best_available) |

**Visual:** Rounded rectangle, blue accent, channel-specific icon. Input handle (top), output handle (bottom).

### 3.3 Condition/Branch Nodes

| Node | Maps to | Config |
|---|---|---|
| If/Else | `ConditionalBranch` | Field path, operator (from `ConditionOperator`), value. Two output handles: Yes/No |
| Multi-Branch | Multiple `ConditionalBranch[]` | N conditions, each with its own output handle + default fallthrough |
| A/B Split | `ABTestConfig` | Variant weights (must sum to 100), winning metric |

**Visual:** Diamond shape, yellow accent. Input handle (top), 2+ output handles (bottom/sides) labeled with branch names.

### 3.4 Timing Nodes

| Node | Maps to | Config |
|---|---|---|
| Wait/Delay | `DelayConfig` | Value + unit (minutes, hours, days, weeks) |
| Wait Until | Custom extension | Specific date/time or "next business day 9am" |
| Wait for Event | Custom extension | Wait until a specific `TriggerEvent` fires (e.g., wait for review_received before sending thank-you) |

**Visual:** Rounded rectangle, orange accent, clock icon. Input (top), output (bottom).

### 3.5 Control Nodes

| Node | Maps to | Config |
|---|---|---|
| Exit | Exit condition with `ExitReason` | Reason selector, optional milestone |
| Go To Step | `ConditionalBranch.action: "goto_step"` | Target step picker (creates back-edge on canvas) |
| Tag/Update | Custom extension | Update user metadata, add tags (for downstream conditions) |

**Visual:** Exit = red octagon. GoTo = gray with arrow. Tag = purple rectangle.

---

## 4. Canvas UX

### 4.1 Layout

```
+--------------------------------------------------+
|  Toolbar: Save | Test | Activate | Undo/Redo     |
+--------+-----------------------------------------+
| Node   |                                         |
| Palette|        Canvas (React Flow)              |
|        |                                         |
| [Trigs]|    [Trigger] ──> [Delay] ──> [Email]   |
| [Acts] |                      |                  |
| [Conds]|              [Condition]                |
| [Time] |              /        \                 |
| [Ctrl] |        [SMS]          [Exit]            |
|        |                                         |
+--------+-----------------------------------------+
|  Properties Panel (selected node config)          |
+--------------------------------------------------+
```

### 4.2 Interactions

- **Drag from palette** to canvas to add nodes
- **Click node** to open properties panel (right side or bottom drawer)
- **Drag between handles** to create edges (validate: trigger can only connect to action/delay/condition, etc.)
- **Delete** via keyboard (Backspace/Delete) or right-click context menu
- **Undo/Redo** via Ctrl+Z / Ctrl+Shift+Z (React Flow has no built-in undo — need custom history stack)
- **Minimap** in bottom-right for navigation on large workflows
- **Auto-layout** via dagre or elkjs for "tidy up" button
- **Zoom** via scroll wheel, pinch, or toolbar buttons
- **Pan** via middle-click drag or spacebar+drag

### 4.3 Validation Rules

- Exactly 1 trigger node (entry point)
- All nodes must be connected (no orphans)
- No cycles unless via explicit "Go To Step" node
- Condition branches must have at least a Yes path
- A/B split weights must sum to 100
- Delay values must be > 0
- Template must be selected on action nodes before activation

Validation runs on save and on activate. Errors highlight offending nodes with red border + tooltip.

### 4.4 Mobile / Responsive

The canvas is **desktop-only** (min-width: 1024px). On smaller screens, show a read-only timeline/list view of the workflow with a prompt to use desktop for editing. This mirrors how Zapier/n8n handle mobile.

---

## 5. Serialization: Canvas <-> SequenceDefinition

The critical piece. The canvas graph must round-trip to/from the existing `SequenceDefinition` type without data loss.

### 5.1 Graph -> SequenceDefinition

```
Canvas nodes/edges
  -> topological sort (BFS from trigger node)
  -> assign step numbers by traversal order
  -> trigger node -> SequenceTrigger
  -> action nodes -> SequenceStep[] (with step index)
  -> delay nodes -> merged into the *next* action's SequenceStep.delay
  -> condition nodes -> ConditionalBranch[] on the *preceding* step's .branches
  -> exit nodes -> ExitCondition on the sequence or step level
  -> A/B split -> ABTestConfig on the preceding step
```

### 5.2 SequenceDefinition -> Graph

```
SequenceDefinition
  -> create trigger node from .triggers[0]
  -> iterate .steps[] in order
  -> for each step: create delay node (from step.delay) + action node
  -> for each step.branches: create condition node with edges to branch targets
  -> for each step.exitConditions: create exit node
  -> for A/B tests: create split node before the action
  -> auto-layout via dagre
```

### 5.3 Canvas Metadata (non-orchestration)

Store canvas-only data (node positions, zoom level, viewport, palette state) in a separate JSON column (`canvas_metadata`) on the sequence definition DB row. This keeps the orchestration engine clean — it never sees canvas data.

```ts
interface CanvasMetadata {
  nodes: { id: string; position: { x: number; y: number } }[];
  viewport: { x: number; y: number; zoom: number };
  version: number; // for migration
}
```

---

## 6. Data Model Changes

### 6.1 New DB columns on `email_sequence_definitions` (or new table)

```sql
-- Option A: Add to existing table
ALTER TABLE email_sequence_definitions ADD COLUMN
  canvas_metadata jsonb DEFAULT NULL;

-- Option B: Separate table (preferred for separation of concerns)
CREATE TABLE workflow_canvases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_definition_id uuid REFERENCES email_sequence_definitions(id),
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  canvas_metadata jsonb NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_workflow_canvases_seq ON workflow_canvases(sequence_definition_id);
```

### 6.2 New table: workflow_templates (pre-built templates)

```sql
CREATE TABLE workflow_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL, -- 'review_collection', 'onboarding', 'retention', 'win_back'
  sequence_definition jsonb NOT NULL,
  canvas_metadata jsonb NOT NULL,
  is_system boolean DEFAULT true, -- system templates vs user-created
  popularity int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

---

## 7. Component Architecture

```
src/components/workflow-builder/
  workflow-builder.tsx          # Main container (React Flow provider + panels)
  canvas.tsx                    # React Flow canvas with node/edge types registered
  toolbar.tsx                   # Save, test, activate, undo/redo, zoom controls
  node-palette.tsx              # Draggable node type list (left sidebar)
  properties-panel.tsx          # Selected node configuration (right panel)
  nodes/
    trigger-node.tsx            # Custom React Flow node
    action-node.tsx
    condition-node.tsx
    delay-node.tsx
    exit-node.tsx
    ab-split-node.tsx
    goto-node.tsx
  edges/
    workflow-edge.tsx           # Custom animated edge with label
    branch-edge.tsx             # Condition branch edge (Yes/No labels)
  hooks/
    use-workflow-state.ts       # Zustand store: nodes, edges, undo history
    use-serializer.ts           # Graph <-> SequenceDefinition conversion
    use-validation.ts           # Real-time validation of graph
    use-auto-layout.ts          # dagre/elkjs layout
    use-workflow-actions.ts     # CRUD operations (save, load, activate, duplicate)
  lib/
    serializer.ts               # Pure functions: toSequenceDefinition(), fromSequenceDefinition()
    validator.ts                # Pure validation: validateGraph() -> ValidationError[]
    node-registry.ts            # Node type metadata (icons, colors, handle configs)
    templates.ts                # Pre-built workflow templates
```

---

## 8. Pre-Built Workflow Templates

Ship with 6-8 templates users can start from:

| Template | Trigger | Steps |
|---|---|---|
| Review Request | loan_closed event | Wait 3d -> Email request -> Wait 5d -> If no review -> SMS reminder -> Wait 7d -> Final email |
| Welcome Onboarding | user_signup | Immediate email -> Wait 1d -> If profile incomplete -> Reminder -> Wait 3d -> Feature tour |
| Re-engagement | user_inactive (30d) | Email "we miss you" -> Wait 7d -> If no login -> SMS -> Wait 14d -> Exit |
| Video Testimonial | review_received (5-star) | Wait 1d -> Email video request -> Wait 3d -> Reminder -> Wait 7d -> Final ask |
| Trial Ending | trial_ending (7d before) | Email heads-up -> Wait 3d -> If not converted -> Upgrade CTA -> Wait 2d -> Final offer |
| Payment Failed (Dunning) | payment_failed | Immediate email -> Wait 3d -> Retry reminder -> Wait 5d -> Final warning -> Exit |

---

## 9. Permissions & Access Control

- **Admin/Owner:** Full CRUD on all workflows, can activate/deactivate
- **Manager:** Can create/edit workflows, cannot activate org-wide (needs admin approval)
- **Loan Officer:** Read-only view of active workflows, can see which workflows they're enrolled in
- **Viewer:** No access to workflow builder

Map to existing `src/lib/permissions/` role system.

---

## 10. Testing Strategy

### Unit Tests
- `serializer.ts`: Round-trip tests (graph -> definition -> graph identity)
- `validator.ts`: Every validation rule (orphan nodes, missing templates, cycle detection, weight sums)
- Node components: Render with various configs, handle interactions

### Integration Tests
- Save workflow -> reload -> verify graph matches
- Activate workflow -> verify orchestration engine picks it up
- Template instantiation -> verify all nodes/edges created

### E2E Tests (Playwright)
- Drag node from palette to canvas
- Connect two nodes via handles
- Configure a node via properties panel
- Save and reload workflow
- Activate a workflow and verify campaign starts

---

## 11. Implementation Phases

### Phase 1: Core Canvas (2 weeks)
- React Flow setup with custom node components
- Node palette with drag-to-canvas
- Edge creation between compatible handles
- Properties panel for node configuration
- Zustand state management + undo/redo

### Phase 2: Serialization (1 week)
- `toSequenceDefinition()` and `fromSequenceDefinition()`
- Round-trip tests
- Canvas metadata persistence
- Load existing `SequenceDefinition` records into canvas

### Phase 3: Validation & Polish (1 week)
- Real-time validation with error highlighting
- Auto-layout (dagre)
- Minimap, zoom controls, keyboard shortcuts
- Mobile read-only view

### Phase 4: Templates & Activation (1 week)
- Pre-built workflow templates
- Template gallery UI
- "Activate" flow: validate -> confirm -> write to orchestration engine
- "Test" mode: dry-run with a test user

### Phase 5: Advanced Features (1-2 weeks)
- A/B split node with live variant performance
- Wait-for-event node
- Workflow versioning (draft vs published)
- Workflow duplication
- Analytics overlay (show send counts, open rates on each node)

---

## 12. Dependencies

| Dependency | Version | Purpose | License |
|---|---|---|---|
| `@xyflow/react` | ^12.x | Core canvas library | MIT |
| `dagre` or `@dagrejs/dagre` | ^1.x | Auto-layout algorithm | MIT |
| `zustand` | (already in project) | Canvas state management | MIT |
| `zod` | (already in project) | Validation schemas | MIT |

No new paid dependencies required.

---

## 13. Open Questions (to resolve before implementation)

1. **Collaboration:** Do multiple users need to edit the same workflow simultaneously? (If yes, need CRDT/operational transform — massive scope increase. Recommend: no, use simple optimistic locking.)
2. **Versioning:** Should workflows have draft/published states, or is it simpler to just have active/inactive? (Recommend: draft/published with version history.)
3. **Approval flow:** Should manager-created workflows require admin approval before activation? (Likely yes for enterprise tier.)
4. **Analytics overlay:** Show per-node metrics (emails sent, open rate, branch distribution) directly on the canvas? (High value but adds complexity. Phase 5.)
5. **Custom code nodes:** Allow advanced users to write custom JS conditions/actions? (Recommend: no for v1, use the existing `customEvaluator` system via config instead.)
6. **Import/export:** Allow JSON export of workflows for backup or sharing between orgs? (Low effort, high value. Include in Phase 4.)
