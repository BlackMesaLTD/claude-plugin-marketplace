---
name: review-framework
description: Review methodology for gap analysis across research, plan, and implementation phases with quality scoring and requirement fidelity checks.
---

## Session Initialization

Load artifacts based on `start_session` response:
```
get_phase_entries({ sessionId: "<research_id>", tags: ["requirement", "decision"] })
get_phase_entries({ sessionId: "<plan_id>", tags: ["decision"] })
get_phase_entries({ sessionId: "<implementation_id>", tags: ["task-complete", "issue"] })
```

**Priority**: Always fetch requirements first — these are non-negotiable checkpoints.

## Review Framework

### 1. Research-to-Plan Gap Analysis

| Check | What to Verify |
|-------|----------------|
| Coverage | All research findings addressed in plan? |
| Accuracy | Plan correctly interprets research? |
| Constraints | Research constraints reflected? |
| Risks | Research risks mitigated? |

### 2. User Requirement Fidelity (MANDATORY)

For each Non-Negotiable requirement (REQ-XXX):
- Is exact requirement preserved through all phases?
- Watch for scope dilution ("actual nodes" → "text preview" = CRITICAL gap)
- Check status progression (tasks should be `Approved`, not `Proposed`)

### 3. Plan-to-Implementation Gap Analysis

| Check | What to Verify |
|-------|----------------|
| Task Completion | All `Approved` tasks implemented? |
| Spec Fidelity | Implementation matches specs? |
| Acceptance Criteria | All criteria met? |
| Deviations | Documented and justified? |

### 4. End-to-End Coherence
Verify: Research goal → Plan approach → Implementation result

## Quality Assessment

Score each phase (1-5):
- Research: Thoroughness, reliability, actionability
- Plan: Completeness, feasibility, risk coverage
- Implementation: Adherence, quality, test coverage

## Logging Gaps

```
mcp__workflow__log_entry({
  tag: "gap",
  fields: { title: "GAP-PI-001: [Title]", content: "**Priority**: P0\n**Planned**: [spec]\n**Implemented**: [actual]\n**Recommendation**: [fix]" }
})
```

## Reviewing LLM-Generated Code

When reviewing code delegated to local LLM:
- Same quality bar as human code
- Look for: missing edge cases, incomplete error handling, security oversights, weak test assertions
- Verification: types meaningful (not `any`), error handling realistic, tests verify behavior

## Phase Tags

| Tag | When to Use |
|-----|-------------|
| `gap` | For each gap found |
| `finding` | Quality assessments, scoring |
| `summary` | Gap summaries |

## Handoff Decision

Critical/High gaps? → Run `/plan [TOPIC]` to address gaps
No gaps? → Cycle complete
