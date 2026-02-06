---
name: refactor-analysis
description: Code analysis methodology for identifying improvement opportunities with metrics, impact analysis, and prioritized recommendations.
---

## Core Principles

1. **No Band-Aid Solutions** — Identify root causes, not symptoms
2. **Prove It Works** — Define measurable criteria
3. **Scalability First** — Solutions must accommodate growth
4. **Quantify Everything** — Measure baseline for comparison

## Phase 1: Code Assessment

Log each issue found:
```
mcp__workflow__log_entry({
  tag: "finding",
  fields: { title: "Code Issue: [Title]", content: "**Type**: Code smell | Anti-pattern | Tech debt\n**Location**: `file:lines`\n**Severity**: Critical | High | Medium\n**Root Cause**: [problem]\n**Impact**: [why it matters]" }
})
```

Capture baseline metrics: cyclomatic complexity, lines of code, test coverage, bundle size impact.

## Phase 2: Research Solutions

For each issue, evaluate patterns:
```
mcp__workflow__log_entry({
  tag: "finding",
  fields: { title: "Research: [Issue]", content: "**Patterns Evaluated**:\n- [Pattern 1]: Pros/Cons\n- [Pattern 2]: Pros/Cons\n**Recommended**: [choice]\n**Rationale**: [why]\n**Scalability**: [consideration]" }
})
```

## Phase 3: Impact Analysis

Map scope of changes: files affected, breaking changes, migration needs, rollback considerations.

## Phase 4: Test Gap Analysis

- Tests needed BEFORE refactoring (lock current behavior)
- Tests needed AFTER refactoring (prove improvements)

## Phase 5: Recommendations

```
mcp__workflow__log_entry({
  tag: "finding",
  fields: { title: "Recommendation: [Task]", content: "**Priority**: P0 | P1 | P2\n**Root Cause Solved**: [problem]\n**Approach**: [pattern]\n**How to Prove Success**:\n- [Metric]: [baseline] → [target]" }
})
```

## Phase Tags

| Tag | When to Use |
|-----|-------------|
| `finding` | Issues, metrics, recommendations |
| `summary` | Issue/metrics summaries |
