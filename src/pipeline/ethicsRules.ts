/**
 * Default Ethics Rules for the AllVoice Ethics Logic Gate.
 *
 * Each rule is a declarative EthicsRule that evaluates an intent + browser
 * state and returns an EthicsDecision or null ("no opinion").
 *
 * Rules are evaluated in order by evaluateEthics(). First "block" wins.
 *
 * Requirements: 4.4, 4.5, 4.6, 4.7, 11.1, 14.1
 */

import type { EthicsRule, EthicsDecision, Intent, BrowserState, ElementSummary, ActionType } from './types';
import { containsPII } from '../utils/piiDetector';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Finds the target element for an intent in the browser state.
 * First tries an exact selector match, then falls back to heuristics
 * based on the action type.
 */
export function findTargetElement(
  intent: Intent,
  browserState: BrowserState,
): ElementSummary | null {
  if (intent.target) {
    return browserState.interactiveElements.find(e => e.selector === intent.target) ?? null;
  }

  // Heuristic matching by action type
  switch (intent.action) {
    case 'add_to_cart':
      return (
        browserState.interactiveElements.find(e =>
          /add\s+to\s+cart/i.test(e.textContent) ||
          /add[\s_-]to[\s_-]cart/i.test(e.ariaLabel ?? ''),
        ) ?? null
      );
    case 'purchase':
      return (
        browserState.interactiveElements.find(e =>
          /buy\s+now|purchase/i.test(e.textContent),
        ) ?? null
      );
    case 'send_message':
      return (
        browserState.interactiveElements.find(
          e => /send/i.test(e.textContent) && e.tagName === 'button',
        ) ?? null
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Rule: PRIVACY_SENSITIVE_FIELD
// Blocks actions targeting password, payment, or sensitive autocomplete fields.
// Requirements: 4.4, 14.1
// ---------------------------------------------------------------------------

const SENSITIVE_AUTOCOMPLETE_VALUES = ['cc-number', 'cc-csc', 'new-password'];

export const sensitiveFieldRule: EthicsRule = {
  id: 'PRIVACY_SENSITIVE_FIELD',
  name: 'Sensitive Field Protection',
  description:
    'Blocks actions targeting password, payment, or sensitive autocomplete fields (cc-number, cc-csc, new-password).',
  evaluate: (intent: Intent, browserState: BrowserState): EthicsDecision | null => {
    // Read-only actions are always safe — never block describe_screen
    if (intent.action === 'describe_screen') return null;

    const target = findTargetElement(intent, browserState);
    if (!target) return null;

    const isSensitive =
      target.type === 'password' ||
      SENSITIVE_AUTOCOMPLETE_VALUES.includes(target.autocomplete ?? '');

    if (!isSensitive) return null;

    const fieldDescription = target.type === 'password' ? 'password' : target.autocomplete;
    return {
      decision: 'block',
      reason: `Action blocked: the target is a sensitive field (${fieldDescription}). AllVoice cannot interact with password or payment fields to protect your privacy.`,
      ruleId: 'PRIVACY_SENSITIVE_FIELD',
      modifiedIntent: null,
      privacyViolation: true,
    };
  },
};

// ---------------------------------------------------------------------------
// Rule: PRIVACY_PII_SUBMISSION
// Blocks send_message / confirm_pending when message content contains PII.
// Requirements: 4.6, 14.1
// ---------------------------------------------------------------------------

export const piiSubmissionRule: EthicsRule = {
  id: 'PRIVACY_PII_SUBMISSION',
  name: 'PII Submission Prevention',
  description:
    'Blocks form submissions or messages that contain personally identifiable information (email, phone, SSN).',
  evaluate: (intent: Intent, _browserState: BrowserState): EthicsDecision | null => {
    if (intent.action !== 'send_message' && intent.action !== 'confirm_pending') return null;

    const messageContent = intent.parameters['messageContent'] ?? '';
    if (!containsPII(messageContent)) return null;

    return {
      decision: 'block',
      reason:
        'Action blocked: the message appears to contain personally identifiable information (email address, phone number, or SSN). Please remove PII before sending.',
      ruleId: 'PRIVACY_PII_SUBMISSION',
      modifiedIntent: null,
      privacyViolation: true,
    };
  },
};

// ---------------------------------------------------------------------------
// Rule: SAFETY_UNLABELED_CONTROL
// Blocks click_unlabeled actions — clicking unknown controls is unsafe.
// Requirements: 4.7
// ---------------------------------------------------------------------------

export const unlabeledControlRule: EthicsRule = {
  id: 'SAFETY_UNLABELED_CONTROL',
  name: 'Unlabeled Control Protection',
  description:
    'Blocks clicks on controls that have no accessible name, because their purpose cannot be determined.',
  evaluate: (intent: Intent, _browserState: BrowserState): EthicsDecision | null => {
    if (intent.action !== 'click_unlabeled') return null;

    return {
      decision: 'block',
      reason:
        'Action blocked: this control has no accessible label. AllVoice cannot safely click an unlabeled element because its purpose is unknown.',
      ruleId: 'SAFETY_UNLABELED_CONTROL',
      modifiedIntent: null,
      privacyViolation: false,
    };
  },
};

// ---------------------------------------------------------------------------
// Rule: CONTEXT_RESTRICTED
// Blocks execution intents on chrome:// and chrome-extension:// pages.
// Read-only intents (describe_screen) are still allowed.
// Requirements: 4.5
// ---------------------------------------------------------------------------

const READ_ONLY_ACTIONS: ActionType[] = ['describe_screen'];

export const restrictedContextRule: EthicsRule = {
  id: 'CONTEXT_RESTRICTED',
  name: 'Restricted Context Enforcement',
  description:
    'Blocks execution intents on chrome:// and extension:// pages. Read-only commands like "describe screen" are still allowed.',
  evaluate: (intent: Intent, browserState: BrowserState): EthicsDecision | null => {
    if (!browserState.contextFlags.includes('restricted-context')) return null;
    if (READ_ONLY_ACTIONS.includes(intent.action)) return null;

    return {
      decision: 'block',
      reason:
        'Action blocked: this is a restricted browser page (chrome:// or extension://). Only read-type commands like "describe screen" are allowed here.',
      ruleId: 'CONTEXT_RESTRICTED',
      modifiedIntent: null,
      privacyViolation: false,
    };
  },
};

// ---------------------------------------------------------------------------
// Default rule set — evaluated in this order by evaluateEthics()
// ---------------------------------------------------------------------------

export const DEFAULT_ETHICS_RULES: EthicsRule[] = [
  sensitiveFieldRule,
  piiSubmissionRule,
  unlabeledControlRule,
  restrictedContextRule,
];
