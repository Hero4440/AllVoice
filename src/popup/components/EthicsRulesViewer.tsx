/**
 * EthicsRulesViewer — Accessible list of active ethics rules.
 *
 * Displays each rule's name, description, and status. Screen-reader
 * compatible with ARIA attributes (role="list", role="listitem").
 *
 * Requirements: 11.1, 11.2, 11.3
 */

import React from 'react';

interface EthicsRulesViewerProps {
  onBack: () => void;
}

/** Metadata for an ethics rule displayed in the viewer */
interface EthicsRuleDisplay {
  id: string;
  name: string;
  description: string;
  status: 'active';
}

/**
 * Default ethics rules shipped with AllVoice.
 * Mirrors the rules defined in the Ethics Logic Gate (ethicsGate.ts / ethicsRules.ts).
 */
const DEFAULT_ETHICS_RULES: EthicsRuleDisplay[] = [
  {
    id: 'PRIVACY_SENSITIVE_FIELD',
    name: 'Sensitive Field Protection',
    description:
      'Blocks actions targeting password fields, payment fields, or fields with autocomplete cc-number, cc-csc, or new-password.',
    status: 'active',
  },
  {
    id: 'PRIVACY_PII_SUBMISSION',
    name: 'PII Submission Prevention',
    description:
      'Blocks send or confirm actions when message content matches personally identifiable information patterns (email, phone, SSN).',
    status: 'active',
  },
  {
    id: 'SAFETY_UNLABELED_CONTROL',
    name: 'Unlabeled Control Protection',
    description:
      'Blocks click actions on controls that have no accessible name, text content, or ARIA label.',
    status: 'active',
  },
  {
    id: 'CONTEXT_RESTRICTED',
    name: 'Restricted Context Enforcement',
    description:
      'Blocks execution intents on chrome:// and extension:// pages. Only read-type commands like describe screen are allowed.',
    status: 'active',
  },
];

export function EthicsRulesViewer({
  onBack,
}: EthicsRulesViewerProps): React.ReactElement {
  return (
    <section
      aria-label="Ethics rules viewer"
      className="flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-heading text-hc-accent">Ethics Rules</h2>
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

      <p className="text-body text-hc-text-secondary">
        AllVoice evaluates every voice command against these ethics rules
        before executing any action.
      </p>

      <ul
        role="list"
        aria-label="Active ethics rules"
        className="flex flex-col gap-2 max-h-[360px] overflow-y-auto"
        tabIndex={0}
      >
        {DEFAULT_ETHICS_RULES.map((rule) => (
          <li
            key={rule.id}
            role="listitem"
            className={[
              'p-3 rounded-lg border bg-hc-surface border-hc-border',
            ].join(' ')}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-label font-semibold text-hc-accent">
                {rule.name}
              </span>
              <span
                className="text-label text-hc-success font-semibold"
                aria-label={`Status: ${rule.status}`}
              >
                ● {rule.status}
              </span>
            </div>
            <p className="text-body text-hc-text">{rule.description}</p>
            <p className="text-label text-hc-text-secondary mt-1">
              Rule ID: {rule.id}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
