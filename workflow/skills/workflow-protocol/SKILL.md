---
name: workflow-protocol
description: Shared session management protocol for all workflow phases. DPS system, logging tags, blocker format, and session commands.
---

## Dynamic Problem Solving (DPS)

DPS controls how much flexibility you have beyond your core role. The session hook injects the current DPS level.

| Level | Label | Behavior |
|-------|-------|----------|
| **0** | Off | Strict role adherence. No deviation from instructions. |
| **1** | Minimal | Can ask clarifying questions, minor gap-filling. |
| **2** | Light | Can make small fixes/improvements within scope. |
| **3** | Moderate | Can propose alternatives, expand recommendations. |
| **4** | Significant | Can redesign approaches based on evidence. |
| **5** | Full | Maximum flexibility — can pivot direction entirely. |

## Output Protocol

> **Log before you respond.** Your conversation is ephemeral; the log is the permanent record visible on the portal.

Before outputting anything substantive to the user:
1. **Log it** with `mcp__workflow__log_entry` using the appropriate tag
2. **Then** output to user

### What Does NOT Get Logged

- Tool narration ("Let me read that file...")
- Simple acknowledgments ("Got it", "Sure")
- Greetings and pleasantries
- Error recovery conversation

## Tag Vocabulary

| Tag | When to Use |
|-----|-------------|
| `finding` | Research discoveries, code analysis, investigation results |
| `requirement` | User requirements (include verbatim quote) |
| `decision` | Planning decisions, approach choices |
| `task-complete` | After completing implementation tasks |
| `gap` | Review gaps identified between phases |
| `fault` | Bug reports, user-reported issues |
| `fix` | Fixes applied during debug sessions |
| `blocker` | Something preventing progress (see format below) |
| `progress` | Status updates (before responding to `[status]`) |
| `summary` | Synthesis for user (before presenting summaries) |
| `issue` | Problems encountered during work |
| `user-feedback` | When user provides direction or approval |
| `question` | When asking user for critical input |

## Blocker Format

When you encounter something preventing progress:

```
mcp__workflow__log_entry({
  tag: "blocker",
  fields: {
    type: "technical",  // scope | clarity | technical | dependency | knowledge
    title: "Description of the blocker",
    impact: "What this prevents",
    dpsOptions: "- Option 1\n- Option 2",
    researchTopics: "- /research topic-1\n- /research topic-2"
  }
})
```

## Session Commands

These commands are available in all phases. Log first, then display:

- `[status]` — Log with `tag: "progress"`, then display to user
- `[end]` — Finalize session (calls `mcp__workflow__end_session`)

Phase-specific commands (e.g., `[show gaps]`, `[show plan]`) are defined in each phase's command file.

## Session Lifecycle

- `mcp__workflow__start_session` — Creates session (called automatically by hook)
- `mcp__workflow__log_entry` — Log findings, decisions, completions
- `mcp__workflow__get_status` — Check session state and entry count
- `mcp__workflow__get_context` — Retrieve entries by topic, phase, tags, or entry IDs
- `mcp__workflow__get_project_context` — Lightweight overview of all sessions and entries for a topic
- `mcp__workflow__end_session` — Finalize and generate handoff

## Local LLM Delegation

If the session has `localLLM.enabled = true`, you can delegate mechanical tasks:

**Good candidates**: CRUD endpoints, boilerplate, type definitions, test generation, rename operations
**Keep with Claude**: Architecture decisions, security code, complex debugging, system integration

Use `local_llm(action="analyze")` to score tasks, then `local_llm(action="delegate")` for suitable ones.
