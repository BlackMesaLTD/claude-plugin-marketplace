#!/usr/bin/env node
/**
 * PreToolUse Hook: Resolve Project Hints
 *
 * Intercepts `start_session` tool calls to ALWAYS inject resolved
 * project identification hints (gitRemote, directory) into the tool input.
 *
 * Input (stdin): JSON with { tool_name, tool_input, cwd, session_id, ... }
 * Output (stdout): JSON with updatedInput containing resolved hints
 *
 * Fails open: any error allows the tool call through unchanged.
 */

const { readStdinJson, outputAllow, outputNoop } = require('./lib/hook-io.js');
const { looksLikeUrl, resolveGitRemote, resolveProjectDir, mergeHints } = require('./lib/resolve-hints.js');

async function main() {
  try {
    const input = await readStdinJson();
    if (!input) {
      outputNoop();
      return;
    }

    const { tool_input, cwd, session_id } = input;
    const projectDir = resolveProjectDir(cwd);

    process.stderr.write(`[resolve-project] Hook fired, cwd: ${projectDir}\n`);

    // Parse any existing hints from tool_input
    const hintsStr = tool_input.hints;
    let existingHints = {};

    if (hintsStr && typeof hintsStr === 'string') {
      try {
        existingHints = JSON.parse(hintsStr);
      } catch {
        existingHints = {};
      }
    }

    // If the LLM passed a git remote name (not URL), resolve it first
    if (existingHints.gitRemote && !looksLikeUrl(existingHints.gitRemote)) {
      const resolved = resolveGitRemote(existingHints.gitRemote, projectDir);
      if (resolved) {
        process.stderr.write(`[resolve-project] Resolved remote "${existingHints.gitRemote}" -> ${resolved}\n`);
        existingHints.gitRemote = resolved;
      }
    }

    // Merge: existing hints (from LLM) > empty secondary > fresh resolution
    const finalHints = mergeHints(existingHints, {}, projectDir);

    process.stderr.write(`[resolve-project] Final hints: ${JSON.stringify(finalHints)}\n`);

    // Build updatedInput — ALWAYS return hints (deterministic injection)
    const updatedInput = {
      ...tool_input,
      hints: JSON.stringify(finalHints),
    };

    // Inject clientSessionId from hook session_id if available
    if (session_id) {
      updatedInput.clientSessionId = session_id;
    }

    outputAllow(updatedInput);
  } catch (err) {
    // Fail open — log to stderr, allow tool call through unchanged
    process.stderr.write(`[resolve-project] Error: ${err}\n`);
    outputNoop();
  }
}

main();
