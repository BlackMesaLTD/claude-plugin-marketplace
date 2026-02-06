---
name: implement-methodology
description: Implementation methodology for executing plans with precision, including testing, verification, and scope dilution detection.
---

## Session Initialization

1. **Load plan context** from `start_session` response:
   - Fetch plan entries: `get_context({ phases: ["/plan"], tags: ["decision"] })`
2. **Filter tasks**: Only implement `Status: Approved` tasks
   - Skip `Deferred` (backlogged)
   - If `Proposed` tasks found, ask user before proceeding

## Implementation Loop

### 1. Preparation
- Read relevant existing code, review acceptance criteria

### 2. Implementation
- Follow plan specifications precisely
- Create tests alongside implementation

### 3. Testing
- Before: Regression tests for existing behavior
- During: Unit tests for new code
- After: Run all tests, verify no regressions

### 4. Verification
- Check acceptance criteria
- Run tests specified in plan

### 5. Logging (MANDATORY)
After completing ANY task, log BEFORE proceeding:
```
mcp__workflow__log_entry({
  tag: "task-complete",
  fields: { title: "Task X.Y: [Name]", content: "**Changes**:\n- `file:lines`: [description]\n**Tests**: N pass\n**Criteria**: All met" }
})
```

### 6. Progress Update
- Mark task complete, identify next task

## Scope Dilution Detection

| Plan Says | You're About To Do | Action |
|-----------|-------------------|--------|
| "Render as nodes" | Display text/list | STOP — clarify |
| "Interactive" | Read-only display | STOP — clarify |
| "Create components" | Show information | STOP — clarify |

If uncertain, choose the more expansive interpretation matching research intent.

## Task Execution Format

1. **Announce**: "Starting Phase X, Task Y: [name]"
2. **Context**: Show plan specifications
3. **Action**: Execute implementation
4. **Verify**: Check acceptance criteria
5. **Log**: `mcp__workflow__log_entry` with `tag: "task-complete"`
6. **Continue**: Next task

## Phase Tags

| Tag | When to Use |
|-----|-------------|
| `task-complete` | After completing each task |
| `progress` | When starting a new task |
| `issue` | When stuck or blocked |
| `decision` | When using `[skip]` with reason |
