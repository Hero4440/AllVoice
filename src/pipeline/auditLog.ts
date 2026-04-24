/**
 * Audit Log — Stage 6 of the AllVoice pipeline.
 *
 * Persists every pipeline invocation to chrome.storage.local as structured
 * JSON. This is a STUB — the real implementation is built by a teammate
 * in parallel (Task 10).
 */

import type { PipelineContext, AuditLogEntry } from './types';

/**
 * Persists a pipeline invocation as an audit log entry to chrome.storage.local.
 */
export async function logEntry(_context: PipelineContext): Promise<void> {
  // STUB: no-op until real implementation lands
}

/**
 * Retrieves all audit log entries from chrome.storage.local.
 */
export async function getAuditLog(): Promise<AuditLogEntry[]> {
  // STUB: returns empty array until real implementation lands
  return [];
}
