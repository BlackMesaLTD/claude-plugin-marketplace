#!/usr/bin/env npx tsx
/**
 * PreToolUse Hook: Resolve Project Hints
 *
 * Intercepts `start_session` tool calls to resolve git remote names
 * (like "origin") into actual URLs before they reach the MCP server.
 *
 * Input (stdin): JSON with { tool_name, tool_input }
 * Output (stdout): JSON with updatedInput containing resolved hints
 *
 * Fails open: any error allows the tool call through unchanged.
 */

import { execSync } from 'child_process';

interface HookInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
}

interface TopicHints {
  gitRemote?: string;
  directory?: string;
}

interface HookOutput {
  hookSpecificOutput?: {
    hookEventName: string;
    permissionDecision: 'allow';
    updatedInput?: Record<string, unknown>;
  };
}

/**
 * Check if a string looks like a git URL (not just a remote name like "origin")
 */
function looksLikeUrl(value: string): boolean {
  // URLs contain at least one of: / : @ .
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

/**
 * Get the default origin URL
 */
function getOriginUrl(cwd: string): string | null {
  return resolveGitRemote('origin', cwd);
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
      const { tool_input } = hookInput;

      // Parse hints from tool_input
      let hintsStr = tool_input.hints as string | undefined;
      if (!hintsStr || typeof hintsStr !== 'string') {
        // No hints string - try to inject git remote + directory
        const cwd = process.env.CLAUDE_WORKING_DIRECTORY || process.cwd();
        const hints: TopicHints = {};

        const gitUrl = getOriginUrl(cwd);
        if (gitUrl) {
          hints.gitRemote = gitUrl;
        }
        hints.directory = cwd;

        // Return with injected hints
        const output: HookOutput = {
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'allow',
            updatedInput: {
              ...tool_input,
              hints: JSON.stringify(hints),
            },
          },
        };
        console.log(JSON.stringify(output));
        return;
      }

      // Parse existing hints
      let hints: TopicHints;
      try {
        hints = JSON.parse(hintsStr);
      } catch {
        // Invalid JSON - allow through unchanged
        console.log(JSON.stringify({}));
        return;
      }

      const cwd = process.env.CLAUDE_WORKING_DIRECTORY || process.cwd();
      let modified = false;

      // If gitRemote doesn't look like a URL, resolve it as a remote name
      if (hints.gitRemote) {
        if (!looksLikeUrl(hints.gitRemote)) {
          const resolved = resolveGitRemote(hints.gitRemote, cwd);
          if (resolved) {
            hints.gitRemote = resolved;
            modified = true;
          }
        }
      } else {
        // No gitRemote at all - try to resolve origin
        const originUrl = getOriginUrl(cwd);
        if (originUrl) {
          hints.gitRemote = originUrl;
          modified = true;
        }
      }

      // If no directory, set from cwd
      if (!hints.directory) {
        hints.directory = cwd;
        modified = true;
      }

      if (modified) {
        const output: HookOutput = {
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'allow',
            updatedInput: {
              ...tool_input,
              hints: JSON.stringify(hints),
            },
          },
        };
        console.log(JSON.stringify(output));
      } else {
        // No changes needed - allow through
        console.log(JSON.stringify({}));
      }
    } catch {
      // Fail open - allow the tool call through unchanged
      console.log(JSON.stringify({}));
    }
  });
}

main();
