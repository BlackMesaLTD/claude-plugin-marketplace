#!/usr/bin/env npx tsx
/**
 * PreToolUse Hook: Resolve Project Hints
 *
 * Intercepts `start_session` tool calls to resolve git remote names
 * (like "origin") into actual URLs before they reach the MCP server.
 *
 * Input (stdin): JSON with { tool_name, tool_input, cwd, ... }
 * Output (stdout): JSON with updatedInput containing resolved hints
 *
 * Fails open: any error allows the tool call through unchanged.
 */

import { execSync } from 'child_process';

interface HookInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
  cwd: string;
  session_id?: string;
  hook_event_name?: string;
}

interface TopicHints {
  gitRemote?: string;
  directory?: string;
}

/**
 * Check if a string looks like a git URL (not just a remote name like "origin")
 */
function looksLikeUrl(value: string): boolean {
  return /[/:@.]/.test(value);
}

/**
 * Resolve a git remote name to its URL
 */
function resolveGitRemote(nameOrUrl: string, cwd: string): string | null {
  try {
    const result = execSync(`git remote get-url ${nameOrUrl}`, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result.trim() || null;
  } catch {
    return null;
  }
}

function main(): void {
  let input = '';

  process.stdin.setEncoding('utf-8');
  process.stdin.on('data', (chunk) => {
    input += chunk;
  });

  process.stdin.on('end', () => {
    try {
      const hookInput: HookInput = JSON.parse(input);
      const { tool_input, cwd } = hookInput;
      const workDir = cwd || process.cwd();

      // Debug to stderr (visible in verbose mode, won't corrupt stdout)
      process.stderr.write(`[resolve-project] Hook fired for tool: ${hookInput.tool_name}, cwd: ${workDir}\n`);

      // Parse hints from tool_input
      const hintsStr = tool_input.hints as string | undefined;

      let hints: TopicHints;
      if (hintsStr && typeof hintsStr === 'string') {
        try {
          hints = JSON.parse(hintsStr);
        } catch {
          // Invalid JSON hints - build from scratch
          hints = {};
        }
      } else {
        hints = {};
      }

      let modified = false;

      // If gitRemote doesn't look like a URL, resolve it
      if (hints.gitRemote && !looksLikeUrl(hints.gitRemote)) {
        process.stderr.write(`[resolve-project] Resolving remote name "${hints.gitRemote}" in ${workDir}\n`);
        const resolved = resolveGitRemote(hints.gitRemote, workDir);
        if (resolved) {
          process.stderr.write(`[resolve-project] Resolved to: ${resolved}\n`);
          hints.gitRemote = resolved;
          modified = true;
        }
      }

      // If no gitRemote at all, try origin
      if (!hints.gitRemote) {
        const originUrl = resolveGitRemote('origin', workDir);
        if (originUrl) {
          process.stderr.write(`[resolve-project] Injected origin: ${originUrl}\n`);
          hints.gitRemote = originUrl;
          modified = true;
        }
      }

      // If no directory, set from cwd
      if (!hints.directory) {
        hints.directory = workDir;
        modified = true;
      }

      if (modified) {
        process.stderr.write(`[resolve-project] Returning updated hints: ${JSON.stringify(hints)}\n`);
        console.log(JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'allow',
            updatedInput: {
              hints: JSON.stringify(hints),
            },
          },
        }));
      } else {
        process.stderr.write(`[resolve-project] No changes needed\n`);
        console.log(JSON.stringify({}));
      }
    } catch (err) {
      // Fail open - log to stderr, allow tool call through unchanged
      process.stderr.write(`[resolve-project] Error: ${err}\n`);
      console.log(JSON.stringify({}));
    }
  });
}

main();
