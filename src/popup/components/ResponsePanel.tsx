/**
 * ResponsePanel — Displays response messages in a high-contrast, accessible panel.
 *
 * Requirements: 6.5, 6.6, 9.1, 9.3
 */

import React from 'react';
import type { ResponseMessage } from '../../pipeline/types';

interface ResponsePanelProps {
  messages: ResponseMessage[];
}

const TYPE_STYLES: Record<ResponseMessage['type'], string> = {
  success: 'border-hc-success text-hc-success',
  blocked: 'border-hc-blocked text-hc-blocked',
  error: 'border-hc-error text-hc-error',
  info: 'border-hc-info text-hc-info',
};

const TYPE_LABELS: Record<ResponseMessage['type'], string> = {
  success: 'Success',
  blocked: 'Blocked',
  error: 'Error',
  info: 'Info',
};

export function ResponsePanel({ messages }: ResponsePanelProps): React.ReactElement {
  const latest = messages[0] ?? null;
  const history = messages.slice(1);

  return (
    <section
      aria-label="Response messages"
      className="flex flex-col gap-3"
    >
      {/* ARIA live region — announces latest response to screen readers */}
      <div
        role="log"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {latest ? `${TYPE_LABELS[latest.type]}: ${latest.text}` : ''}
      </div>

      {/* Latest message — displayed prominently */}
      {latest ? (
        <div
          className={[
            'p-4 rounded-lg border-2 bg-hc-surface',
            TYPE_STYLES[latest.type],
          ].join(' ')}
          role="alert"
        >
          <span className="text-label font-semibold block mb-1">
            {TYPE_LABELS[latest.type]}
          </span>
          <p className="text-body text-hc-text">{latest.text}</p>
        </div>
      ) : (
        <p className="text-body text-hc-text-secondary p-4">
          No responses yet. Use a voice command to get started.
        </p>
      )}

      {/* Scrollable history */}
      {history.length > 0 && (
        <div
          className="max-h-[200px] overflow-y-auto flex flex-col gap-2"
          aria-label="Response history"
          role="log"
          tabIndex={0}
        >
          {history.map((msg, idx) => (
            <div
              key={`${msg.type}-${idx}`}
              className={[
                'p-3 rounded border bg-hc-surface',
                TYPE_STYLES[msg.type],
              ].join(' ')}
            >
              <span className="text-label font-semibold mr-2">
                {TYPE_LABELS[msg.type]}:
              </span>
              <span className="text-body text-hc-text">{msg.text}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
