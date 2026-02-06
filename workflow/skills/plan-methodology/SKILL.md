---
name: plan-methodology
description: Planning methodology for translating research into actionable implementation plans with decomposition, hazard analysis, and approval workflow.
---

## Session Initialization

1. **Load context** from `start_session` response:
   - Fetch research entries: `get_context({ phases: ["/research"], tags: ["requirement", "decision", "blocker"] })`
2. **Analyze research**: Key findings, actionable items, open questions
3. **Check existing patterns**: Scan for reusable utilities

## Planning Phases

### 1. Analysis
- Core requirements, technical constraints, dependencies, risks

### 2. Decomposition
For each task identify:
- **Type**: Implementation | Process
- **Description**, **Files** to modify, **Test files**
- **Dependencies**, **Acceptance criteria** (must include tests)

### 3. Process Task Injection (Mandatory)
- Phase 0.1: Initialize implementation log
- After every 3-4 tasks: Context sync checkpoint
- End of each phase: Phase summary

### 4. Hazard Analysis
Check for: config overrides, CSS specificity conflicts, state management conflicts, build exclusions, route/middleware order.

### 5. Task Status Assignment
- `Proposed` — Recommended, awaiting user approval
- `Deferred` — Backlogged, not this cycle

### 6. Plan Presentation & Approval (REQUIRED)
Present summary → request explicit approval → on approval change Proposed → Approved and call `end_session`. Do NOT end session until user approves.

## Task Format

```markdown
#### Task X.Y: [Name]
- **Status**: Proposed | Approved | Deferred
- **Type**: Implementation | Process
- **Description**: [Details]
- **Files**: [Files to modify]
- **Test files**: [Test files]
- **Dependencies**: [Prerequisites]
- **Acceptance criteria**:
  - [ ] [Criterion]
  - [ ] Tests pass
```

## Scope Change Detection

For Non-Negotiable requirements (REQ-XXX):
- Verify exact requirement preserved in acceptance criteria
- If simplified, STOP and get user approval

## UI Component Checklist

For UI tasks, specify: parent component, import location, render trigger, props/data source, state connections.

## Phase Tags

| Tag | When to Use |
|-----|-------------|
| `decision` | When defining tasks, making choices |
| `summary` | Before presenting plan to user |
| `question` | When asking user for critical input |
