#!/usr/bin/env node
/**
 * PostToolUse Hook: Log Reminder
 *
 * Called after Edit/Write/Task operations. Outputs a reminder to log
 * changes or agent output with mcp__workflow__log_entry.
 *
 * This script is 100% stateless — no disk reads or writes.
 */

const { readStdinJson, outputContext, outputNoop } = require('./lib/hook-io.js');

async function main() {
  try {
    const input = await readStdinJson();
    if (!input) {
      outputNoop();
      return;
    }

    const toolName = input.tool_name || '';

    if (toolName === 'Task') {
      outputContext(
        'Log this agent\'s output with `mcp__workflow__log_entry`. Use the appropriate tag based on the findings (finding, gap, decision, etc).'
      );
    } else {
      outputContext(
        'Log this change with `mcp__workflow__log_entry` (tag: "task-complete" or "finding")'
      );
    }
  } catch (err) {
    process.stderr.write(`[log-reminder] Error: ${err}\n`);
    outputNoop();
  }
}

main();
