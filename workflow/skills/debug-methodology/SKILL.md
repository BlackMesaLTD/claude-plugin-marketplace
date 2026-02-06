---
name: debug-methodology
description: Hypothesis-driven debugging methodology with systematic fault capture, investigation, and fix documentation.
---

## Investigation Loop

### 1. Fault Capture

When user reports an issue:
```
mcp__workflow__log_entry({
  tag: "fault",
  fields: { title: "Fault Report", content: "**Verbatim**: \"[exact user quote]\"\n**Symptom**: [observed]\n**Expected**: [expected]" }
})
```

### 2. Investigation

For each hypothesis:
```
mcp__workflow__log_entry({
  tag: "finding",
  fields: { title: "Investigation: [what]", content: "**Hypothesis**: [theory]\n**Actions**: Read `file:lines`, searched for...\n**Findings**: [results]\n**Status**: Confirmed/Rejected" }
})
```

### 3. Root Cause

When identified:
```
mcp__workflow__log_entry({
  tag: "finding",
  fields: { title: "Root Cause", content: "**Cause**: [description]\n**Evidence**: `file:line` - [snippet]\n**Category**: Code bug | Logic error | Config issue | etc." }
})
```

### 4. Fix Implementation

```
mcp__workflow__log_entry({
  tag: "fix",
  fields: { title: "Fix Applied", content: "**Approach**: [what/why]\n**Changes**: `file:lines` - [description]\n**Before**: [code]\n**After**: [code]" }
})
```

### 5. Verification
- Test fix works, verify no regressions, get user confirmation

## User Input Capture

**CRITICAL**: Log every user message verbatim — additional context, corrections, reproduction steps, confirmation/feedback.

## Artifact Updates

When session ends, update:
- Implementation log (if related)
- Plan (if gaps revealed)
- Recommend CLAUDE.md updates for patterns

## Phase Tags

| Tag | When to Use |
|-----|-------------|
| `fault` | User-reported issues |
| `finding` | Hypotheses tested, root cause |
| `fix` | Fixes applied |
| `summary` | Hypothesis/fix summaries |
