/**
 * Shared utility for resolving project identification hints.
 *
 * Used by PreToolUse hook to deterministically resolve git remote URLs
 * and project directories for stable project_base_name derivation.
 *
 * All operations fail-open (return defaults rather than throwing).
 */

const { execSync } = require('child_process');

/**
 * Check if a string looks like a git URL (not just a remote name like "origin").
 */
function looksLikeUrl(value) {
  return /[/:@.]/.test(value);
}

/**
 * Resolve a git remote name (e.g. "origin") to its URL.
 * Returns null if the remote doesn't exist or git isn't available.
 */
function resolveGitRemote(nameOrUrl, cwd) {
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
function findGitRoot(startDir) {
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
function resolveProjectDir(hookCwd) {
  return hookCwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
}

/**
 * Resolve complete project hints from a directory.
 * Finds the git root, gets the origin remote URL, and sets the directory.
 * Never throws — returns partial hints on failure.
 */
function resolveHints(projectDir) {
  const hints = { directory: projectDir };

  try {
    const gitRoot = findGitRoot(projectDir);
    const gitDir = gitRoot || projectDir;

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
 */
function mergeHints(primary, secondary, projectDir) {
  const fresh = resolveHints(projectDir);

  return {
    gitRemote: primary.gitRemote || secondary.gitRemote || fresh.gitRemote,
    directory: primary.directory || secondary.directory || fresh.directory || projectDir,
  };
}

module.exports = { looksLikeUrl, resolveGitRemote, findGitRoot, resolveProjectDir, resolveHints, mergeHints };
