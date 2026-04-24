/**
 * AuditLogViewer — Accessible list of audit log entries, newest-first.
 *
 * Requirements: 7.4, 8.3
 */

import React, { useEffect, useState } from 'react';
import { getAuditLog } from '../../pipeline/auditLog';
import type { AuditLogEntry } from '../../pipeline/types';

interface AuditLogViewerProps {
  onBack: () => void;
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'medium',
  });
}

export function AuditLogViewer({ onBack }: AuditLogViewerProps): React.ReactElement {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAuditLog()
      .then((log) => {
        if (!cancelled) {
          setEntries(log);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section aria-label="Audit log viewer" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-heading text-hc-accent">Audit Log</h2>
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to main view"
          className={[
            'px-4 py-2 rounded-lg text-label font-semibold',
            'bg-hc-surface text-hc-text border border-hc-border',
            'focus-visible:outline-focus focus-visible:outline-offset-focus',
            'cursor-pointer',
          ].join(' ')}
        >
          ← Back
        </button>
      </div>

      {loading && (
        <p className="text-body text-hc-text-secondary" role="status">
          Loading audit log…
        </p>
      )}

      {!loading && entries.length === 0 && (
        <p className="text-body text-hc-text-secondary">
          No audit log entries yet.
        </p>
      )}

      {!loading && entries.length > 0 && (
        <ul
          role="list"
          aria-label="Audit log entries"
          className="flex flex-col gap-2 max-h-[360px] overflow-y-auto"
          tabIndex={0}
        >
          {entries.map((entry) => {
            const isPrivacyViolation = entry.ethicsDecision?.privacyViolation === true;
            return (
              <li
                key={entry.id}
                role="listitem"
                className={[
                  'p-3 rounded-lg border bg-hc-surface',
                  isPrivacyViolation
                    ? 'border-hc-error text-hc-error'
                    : 'border-hc-border',
                ].join(' ')}
              >
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-label">
                  <span className="text-hc-text-secondary">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                  {entry.intent && (
                    <span className="text-hc-accent font-semibold">
                      {entry.intent.action}
                    </span>
                  )}
                  {entry.ethicsDecision && (
                    <span
                      className={
                        entry.ethicsDecision.decision === 'block'
                          ? 'text-hc-blocked font-semibold'
                          : 'text-hc-success'
                      }
                    >
                      {entry.ethicsDecision.decision}
                    </span>
                  )}
                </div>
                {entry.response && (
                  <p className="text-body text-hc-text mt-1 truncate">
                    {entry.response.text}
                  </p>
                )}
                {isPrivacyViolation && (
                  <p className="text-label text-hc-error mt-1 font-semibold">
                    ⚠ Privacy violation — {entry.ethicsDecision?.ruleId}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
