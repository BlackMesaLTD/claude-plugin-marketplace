#!/usr/bin/env node
/**
 * PostToolUse Hook: Log Reminder
 *
 * Called after Edit/Write operations. Always outputs a reminder to log
 * changes with mcp__workflow__log_entry.
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

    outputContext(
      'Log this change with `mcp__workflow__log_entry` (tag: "task-complete" or "finding")'
    );
  } catch (err) {
    process.stderr.write(`[log-reminder] Error: ${err}\n`);
    outputNoop();
  }
}

main();
