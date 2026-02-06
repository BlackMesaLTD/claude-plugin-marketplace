/**
 * Shared utility for resolving project identification hints.
 *
 * Used by PreToolUse and UserPromptSubmit hooks to deterministically
 * resolve git remote URLs and project directories for stable
 * project_base_name derivation by the MCP server.
 *
 * All operations fail-open (return defaults rather than throwing).
 */

import { execSync } from 'child_process';

export interface TopicHints {
  gitRemote?: string;
  directory?: string;
}

/**
 * Check if a string looks like a git URL (not just a remote name like "origin").
 */
export function looksLikeUrl(value: string): boolean {
  return /[/:@.]/.test(value);
}

/**
 * Resolve a git remote name (e.g. "origin") to its URL.
 * Returns null if the remote doesn't exist or git isn't available.
 */
export function resolveGitRemote(nameOrUrl: string, cwd: string): string | null {
  // Validate remote name to prevent shell injection
  if (!/^[a-zA-Z0-9_\-\/]+$/.test(nameOrUrl)) {
    return null;
  }

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
 * Find the git repository root from a starting directory.
 * Returns null if the directory is not inside a git repo.
 */
export function findGitRoot(startDir: string): string | null {
  try {
    const result = execSync('git rev-parse --show-toplevel', {
      cwd: startDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Resolve the effective project directory.
 * Priority: hookCwd > CLAUDE_PROJECT_DIR env > process.cwd()
 */
export function resolveProjectDir(hookCwd?: string): string {
  return hookCwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
}

/**
 * Resolve complete project hints from a directory.
 * Finds the git root, gets the origin remote URL, and sets the directory.
 * Never throws — returns partial hints on failure.
 */
export function resolveHints(projectDir: string): TopicHints {
  const hints: TopicHints = { directory: projectDir };

  try {
    const gitRoot = findGitRoot(projectDir);
    const gitDir = gitRoot || projectDir;

    // Use git root as directory if found (more stable than subdirectory)
    if (gitRoot) {
      hints.directory = gitRoot;
    }

    const originUrl = resolveGitRemote('origin', gitDir);
    if (originUrl) {
      hints.gitRemote = originUrl;
    }
  } catch {
    // Fail-open: return whatever we have
  }

  return hints;
}

/**
 * Merge hint sources with priority: primary > secondary > fresh resolution.
 *
 * @param primary   - Highest priority hints (e.g. from tool_input.hints)
 * @param secondary - Middle priority hints (e.g. from session state)
 * @param projectDir - Directory for fresh resolution as fallback
 */
export function mergeHints(
  primary: TopicHints,
  secondary: TopicHints,
  projectDir: string
): TopicHints {
  const fresh = resolveHints(projectDir);

  return {
    gitRemote: primary.gitRemote || secondary.gitRemote || fresh.gitRemote,
    directory: primary.directory || secondary.directory || fresh.directory || projectDir,
  };
}
