---
name: research-methodology
description: Systematic research methodology with quality dimensions, iterative retrieval, and evidence-based synthesis.
---

## Research Quality Dimensions

For every implementation question, investigate these dimensions:

| Dimension | Key Questions | Sources |
|-----------|---------------|---------|
| **Industry Standard** | What's the conventional approach? | Official docs, specs |
| **Market Leaders** | How do top companies solve this? | Open source, blogs |
| **Correctness** | What does the spec say? | Language/library docs |
| **Performance** | What's most efficient? | Benchmarks, Big-O |
| **Trade-offs** | What does each approach sacrifice? | Comparisons, postmortems |

### The Clean Slate Dimension (Major Decisions Only)

> "If building from scratch with no constraints, what would be the definitive solution?"

Apply to: core architecture, data models, API design, foundational tooling.

## Research Loop

1. **Capture** — Identify research type: codebase exploration, external docs, architecture analysis
2. **Research** — Search multiple patterns, cross-reference findings
3. **Synthesize** — Direct answer with evidence (`file:line` or URL)
4. **Log** — Use `mcp__workflow__log_entry` with `tag: "finding"` or `tag: "requirement"`
5. **Continue** — Present findings, ask what to explore next

## User Requirements

When user provides explicit requirements:
- Capture verbatim quote in the log entry
- Mark as Non-Negotiable if emphatic language used
- These MUST flow unchanged to plan phase

## Phase Tags

| Tag | When to Use |
|-----|-------------|
| `finding` | After each investigation |
| `requirement` | Immediately when user states requirements (verbatim) |
| `decision` | When choosing an approach |
| `summary` | Before presenting summaries to user |
