/**
 * Shared I/O utilities for Claude Code hooks.
 *
 * Provides stdin reading and structured output helpers that match
 * the Claude Code hook contract. All operations fail-open.
 */

// ============================================================================
// Hook Stdin Types
// ============================================================================

export interface UserPromptSubmitInput {
  prompt: string;
  cwd: string;
  session_id?: string;
}

export interface PreToolUseInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
  cwd: string;
  session_id?: string;
  hook_event_name?: string;
}

export interface PostToolUseInput {
  tool_name: string;
  tool_response: string;
  cwd: string;
  session_id?: string;
}

export interface StopInput {
  stop_hook_active?: boolean;
  session_id?: string;
  cwd?: string;
}

// ============================================================================
// Stdin Reader
// ============================================================================

/**
 * Read and parse JSON from stdin.
 * Returns null on parse failure or empty input — never throws.
 */
export function readStdinJson<T>(): Promise<T | null> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data) as T);
      } catch {
        resolve(null);
      }
    });
    process.stdin.on('error', () => {
      resolve(null);
    });
  });
}

// ============================================================================
// Output Helpers
// ============================================================================

/**
 * Output a PreToolUse "allow" response, optionally with updated tool input.
 */
export function outputAllow(updatedInput?: Record<string, unknown>): void {
  if (updatedInput) {
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        updatedInput,
      },
    }));
  } else {
    console.log(JSON.stringify({}));
  }
}

/**
 * Output additionalContext for UserPromptSubmit or PostToolUse hooks.
 */
export function outputContext(additionalContext: string): void {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      additionalContext,
    },
  }));
}

/**
 * Output an empty response (no-op). The hook fires but changes nothing.
 */
export function outputNoop(): void {
  console.log(JSON.stringify({}));
}

/**
 * Output a system message for Stop hooks.
 */
export function outputSystemMessage(message: string): void {
  console.log(JSON.stringify({
    systemMessage: message,
  }));
}
