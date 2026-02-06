#!/usr/bin/env node
/**
 * Session Hook Script (Stateless)
 *
 * Handles automatic session lifecycle via Claude Code hooks:
 * - start: Called by UserPromptSubmit hook when /command is detected
 *          Outputs persona context — does NOT create sessions or files
 * - check-end: Called by Stop hook to remind about session finalization
 *
 * This script is 100% stateless — no disk reads or writes.
 */

const { readStdinJson, outputContext, outputNoop, outputSystemMessage } = require('./lib/hook-io.js');

// ============================================================================
// Configuration
// ============================================================================

const DPS_LABELS = {
  0: 'Off (strict role adherence)',
  1: 'Minimal (clarifications only)',
  2: 'Light (minor fixes allowed)',
  3: 'Moderate (can propose alternatives)',
  4: 'Significant (can redesign)',
  5: 'Full (maximum flexibility)',
};

const COMMAND_CONFIGS = {
  '/research': {
    defaultDps: 4,
    nextCommand: '/workflow:plan',
    contextMessage: `Use mcp__workflow__log_entry for all findings with tag "finding".
Use mcp__workflow__log_entry with tag "requirement" for user requirements.
Use tag "blocker" if you encounter something preventing progress.
When done, use mcp__workflow__end_session.`,
  },
  '/plan': {
    defaultDps: 1,
    nextCommand: '/workflow:implement',
    contextMessage: `Use mcp__workflow__log_entry for decisions with tag "decision".
Use tag "blocker" if you encounter something preventing progress.
When done, use mcp__workflow__end_session.`,
  },
  '/implement': {
    defaultDps: 1,
    nextCommand: '/workflow:review',
    contextMessage: `Use mcp__workflow__log_entry with tag "task-complete" after each task.
Use tag "issue" for problems encountered.
Use tag "blocker" if you encounter something preventing progress.
When done, use mcp__workflow__end_session.`,
  },
  '/review': {
    defaultDps: 3,
    nextCommand: '/workflow:plan',
    contextMessage: `Use mcp__workflow__log_entry with tag "gap" for identified gaps.
Use tag "blocker" if you encounter something preventing progress.
When done, use mcp__workflow__end_session.`,
  },
  '/debug': {
    defaultDps: 4,
    contextMessage: `Use mcp__workflow__log_entry with tag "fault" for issues found.
Use tag "fix" for fixes applied.
Use tag "blocker" if you encounter something preventing progress.
When done, use mcp__workflow__end_session.`,
  },
  '/refactor': {
    defaultDps: 3,
    nextCommand: '/workflow:plan',
    contextMessage: `Use mcp__workflow__log_entry for analysis entries.
Use tag "blocker" if you encounter something preventing progress.
When done, use mcp__workflow__end_session.`,
  },
  '/archive': {
    defaultDps: 0,
    contextMessage: `Use mcp__workflow__log_entry for archive operations.
When done, use mcp__workflow__end_session.`,
  },
};

// ============================================================================
// Prompt Parsing
// ============================================================================

function parsePrompt(prompt) {
  const match = prompt.match(
    /^\s*\/(?:workflow:)?(research|plan|implement|review|debug|refactor|archive)\s+(\S+)(?:\s+(.+))?/i
  );
  if (!match) return null;

  const command = `/${match[1].toLowerCase()}`;
  const topic = match[2];
  let extraContext = match[3]?.trim() || undefined;
  let dps;
  let localLLM;

  // Extract dps=N
  if (extraContext) {
    const dpsMatch = extraContext.match(/\bdps=(\d)\b/i);
    if (dpsMatch) {
      dps = parseInt(dpsMatch[1], 10);
      extraContext = extraContext.replace(/\s*\bdps=\d\b\s*/gi, ' ').trim() || undefined;
    }
  }

  // Extract llm=...
  if (extraContext) {
    const llmMatch = extraContext.match(/\bllm=(\S+)\b/i);
    if (llmMatch) {
      const value = llmMatch[1].toLowerCase();
      if (value === 'true' || value === '1') {
        localLLM = { enabled: true, model: 'deepseek-coder:33b', autoStop: true };
      } else if (value === 'false' || value === '0') {
        localLLM = { enabled: false, model: '', autoStop: true };
      } else if (value.endsWith(':persist')) {
        const model = value.slice(0, -8);
        localLLM = { enabled: true, model: model || 'deepseek-coder:33b', autoStop: false };
      } else {
        localLLM = { enabled: true, model: value, autoStop: true };
      }
      extraContext = extraContext.replace(/\s*\bllm=\S+\b\s*/gi, ' ').trim() || undefined;
    }
  }

  return { command, topic, extraContext, dps, localLLM };
}

// ============================================================================
// Hook Handlers
// ============================================================================

async function handleStart() {
  const input = await readStdinJson();
  if (!input) {
    outputNoop();
    return;
  }

  const parsed = parsePrompt(input.prompt || '');
  if (!parsed) {
    outputNoop();
    return;
  }

  const { command, topic, extraContext, dps, localLLM } = parsed;
  const config = COMMAND_CONFIGS[command];
  const effectiveDps = dps !== undefined ? Math.max(0, Math.min(5, dps)) : config.defaultDps;

  const llmNote = localLLM?.enabled
    ? `\n**Local LLM**: Enabled (${localLLM.model}, autoStop=${localLLM.autoStop})`
    : '';

  const additionalContext = `> Session auto-started by hook. Log file created. Use \`mcp__workflow__log_entry\` for all task completions.

**Command**: ${command}
**Topic**: ${topic}
**DPS**: ${effectiveDps} - ${DPS_LABELS[effectiveDps]}${dps !== undefined ? ' (override)' : ' (default)'}${llmNote}
${extraContext ? `**Context**: ${extraContext}\n` : ''}
**Instructions**:
${config.contextMessage}

Use tag "blocker" with dpsOptions and researchTopics for any blockers encountered.`;

  outputContext(additionalContext);
}

async function handleCheckEnd() {
  const input = await readStdinJson();

  // Prevent infinite loops if stop_hook_active
  if (input?.stop_hook_active) {
    outputNoop();
    return;
  }

  outputSystemMessage(
    'If you have an active workflow session, call mcp__workflow__end_session to finalize.'
  );
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  try {
    const action = process.argv[2];
    switch (action) {
      case 'start':
        await handleStart();
        break;
      case 'check-end':
        await handleCheckEnd();
        break;
      default:
        process.stderr.write(`[session-hook] Unknown action: ${action}\n`);
        outputNoop();
    }
  } catch (err) {
    process.stderr.write(`[session-hook] Error: ${err}\n`);
    outputNoop();
  }
}

main();
