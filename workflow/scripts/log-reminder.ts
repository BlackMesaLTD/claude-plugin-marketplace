#!/usr/bin/env npx tsx
/**
 * PostToolUse Hook: Log Reminder
 *
 * Called after Edit/Write operations. Always outputs a reminder to log
 * changes with mcp__workflow__log_entry.
 *
 * This script is 100% stateless — no disk reads or writes.
 * It always reminds because the cost of a redundant reminder is low,
 * while the cost of a missed log entry is high.
 *
 * Input (stdin): JSON with { tool_name, tool_response, cwd }
 * Output (stdout): JSON hook response with additionalContext
 */

import {
  type PostToolUseInput,
  readStdinJson,
  outputContext,
  outputNoop,
} from './lib/hook-io.js';

async function main(): Promise<void> {
  try {
    const input = await readStdinJson<PostToolUseInput>();
    if (!input) {
      outputNoop();
      return;
    }

    outputContext(
      'Log this change with `mcp__workflow__log_entry` (tag: "task-complete" or "finding")'
    );
  } catch (err) {
    process.stderr.write(`[log-reminder] Error: ${err}\n`);
    outputNoop();
  }
}

main();
