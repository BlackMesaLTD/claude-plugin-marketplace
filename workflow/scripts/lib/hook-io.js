/**
 * Shared I/O utilities for Claude Code hooks.
 *
 * Provides stdin reading and structured output helpers that match
 * the Claude Code hook contract. All operations fail-open.
 */

// ============================================================================
// Stdin Reader
// ============================================================================

/**
 * Read and parse JSON from stdin.
 * Returns null on parse failure or empty input — never throws.
 */
function readStdinJson() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data));
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
function outputAllow(updatedInput) {
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
function outputContext(additionalContext) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      additionalContext,
    },
  }));
}

/**
 * Output an empty response (no-op). The hook fires but changes nothing.
 */
function outputNoop() {
  console.log(JSON.stringify({}));
}

/**
 * Output a system message for Stop hooks.
 */
function outputSystemMessage(message) {
  console.log(JSON.stringify({
    systemMessage: message,
  }));
}

module.exports = { readStdinJson, outputAllow, outputContext, outputNoop, outputSystemMessage };
