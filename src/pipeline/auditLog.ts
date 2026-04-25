/**
 * Audit Log — Stage 6 of the AllVoice pipeline.
 *
 * Persists every pipeline invocation to chrome.storage.local as structured
 * JSON. Entries are stored newest-first and pruned beyond the retention period.
 *
 * Storage key: allvoice_audit_log
 *
 * Requirements: 7.1, 7.2, 7.3, 4.10, 14.2
 */

import type { PipelineContext, AuditLogEntry } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Chrome storage key for the audit log */
const STORAGE_KEY = 'allvoice_audit_log';

/** Default retention period in days */
const RETENTION_DAYS = 30;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Creates an AuditLogEntry from a completed PipelineContext and persists it
 * to chrome.storage.local.
 *
 * - Generates a unique ID via crypto.randomUUID()
 * - Stores entries newest-first (unshift)
 * - Prunes entries older than 30 days on each write
 * - Includes privacy violation data when ethicsDecision.privacyViolation is true
 *
 * @param context - The completed PipelineContext from the pipeline run
 */
export async function logEntry(context: PipelineContext): Promise<void> {
  const entry: AuditLogEntry = {
    id: crypto.randomUUID(),
    timestamp: context.timestamp,
    rawTranscript: context.rawTranscript,
    intent: context.intent,
    browserStateSummary: context.browserState
      ? {
          url: context.browserState.url,
          title: context.browserState.title,
          contextFlags: [...context.browserState.contextFlags],
        }
      : null,
    ethicsDecision: context.ethicsDecision
      ? {
          decision: context.ethicsDecision.decision,
          reason: context.ethicsDecision.reason,
          ruleId: context.ethicsDecision.ruleId,
          privacyViolation: context.ethicsDecision.privacyViolation,
        }
      : null,
    executionResult: context.executionResult
      ? {
          status: context.executionResult.status,
          details: context.executionResult.details,
        }
      : null,
    response: context.response
      ? {
          text: context.response.text,
          type: context.response.type,
        }
      : null,
  };

  // Read existing log from storage
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const log: AuditLogEntry[] = (result[STORAGE_KEY] as AuditLogEntry[]) ?? [];

  // Insert newest-first
  log.unshift(entry);

  // Prune entries older than retention period
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const pruned = log.filter((e) => e.timestamp >= cutoff);

  // Persist
  await chrome.storage.local.set({ [STORAGE_KEY]: pruned });
}

/**
 * Retrieves all audit log entries from chrome.storage.local.
 *
 * @returns Array of AuditLogEntry objects, newest-first
 */
export async function getAuditLog(): Promise<AuditLogEntry[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return (result[STORAGE_KEY] as AuditLogEntry[]) ?? [];
}
