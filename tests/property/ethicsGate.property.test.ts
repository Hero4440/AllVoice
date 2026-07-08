/**
 * Property-based tests for Ethics Logic Gate
 *
 * These tests verify universal properties that must hold for ALL inputs:
 * - Determinism: same inputs always produce same outputs
 * - Strict halt: privacy violations always produce "block", never "allow" or "modify"
 *
 * Requirements: 4.9, 14.5
 */

import { describe, it, expect } from 'vitest';
import { evaluateEthics } from '../../src/pipeline/ethicsGate';
import type { Intent, BrowserState, ElementSummary, ActionType } from '../../src/pipeline/types';

// ---------------------------------------------------------------------------
// Test Data Generators
// ---------------------------------------------------------------------------

const ACTION_TYPES: ActionType[] = [
  'describe_screen',
  'add_to_cart',
  'purchase',
  'draft_message',
  'send_message',
  'confirm_pending',
  'click_unlabeled',
  'unrecognized',
];

function generateRandomIntent(): Intent {
  const action = ACTION_TYPES[Math.floor(Math.random() * ACTION_TYPES.length)];
  return {
    action,
    target: Math.random() > 0.5 ? `#element-${Math.floor(Math.random() * 100)}` : null,
    parameters:
      action === 'draft_message' || action === 'send_message'
        ? { messageContent: `Random message ${Math.random()}` }
        : {},
    rawTranscript: `Random transcript ${Math.random()}`,
  };
}

function generateRandomElement(): ElementSummary {
  const tagNames = ['button', 'input', 'a', 'select', 'textarea'];
  const types = ['text', 'password', 'email', 'submit', undefined];
  const autocompletes = ['off', 'cc-number', 'cc-csc', 'new-password', undefined];

  return {
    tagName: tagNames[Math.floor(Math.random() * tagNames.length)],
    role: Math.random() > 0.5 ? 'button' : null,
    ariaLabel: Math.random() > 0.5 ? `Label ${Math.random()}` : null,
    textContent: Math.random() > 0.5 ? `Text ${Math.random()}` : '',
    id: Math.random() > 0.5 ? `id-${Math.floor(Math.random() * 100)}` : null,
    selector: `#element-${Math.floor(Math.random() * 100)}`,
    hasAccessibleName: Math.random() > 0.5,
    type: types[Math.floor(Math.random() * types.length)],
    autocomplete: autocompletes[Math.floor(Math.random() * autocompletes.length)],
  };
}

function generateRandomBrowserState(): BrowserState {
  const elementCount = Math.floor(Math.random() * 10);
  const elements = Array.from({ length: elementCount }, generateRandomElement);

  return {
    url: `https://example.com/page-${Math.floor(Math.random() * 100)}`,
    title: `Page ${Math.random()}`,
    focusedElement: elements.length > 0 && Math.random() > 0.5 ? elements[0] : null,
    interactiveElements: elements,
    contextFlags: Math.random() > 0.8 ? ['restricted-context'] : [],
  };
}

function generateSensitiveFieldIntent(): Intent {
  const actions: ActionType[] = ['draft_message', 'add_to_cart', 'purchase', 'send_message'];
  return {
    action: actions[Math.floor(Math.random() * actions.length)],
    target: '#sensitive-field',
    parameters: {},
    rawTranscript: 'interact with sensitive field',
  };
}

function generateSensitiveFieldBrowserState(): BrowserState {
  const sensitiveTypes = ['password', 'text', 'text'];
  const sensitiveAutocompletes = [undefined, 'cc-number', 'cc-csc', 'new-password'];

  const randomIndex = Math.floor(Math.random() * sensitiveTypes.length);

  const sensitiveField: ElementSummary = {
    tagName: 'input',
    role: null,
    ariaLabel: 'Sensitive Field',
    textContent: '',
    id: 'sensitive-field',
    selector: '#sensitive-field',
    hasAccessibleName: true,
    type: sensitiveTypes[randomIndex],
    autocomplete:
      randomIndex === 0 ? undefined : sensitiveAutocompletes[Math.floor(Math.random() * 3) + 1],
  };

  // Ensure at least one sensitive field exists
  if (sensitiveField.type === 'password') {
    // password type is always sensitive
  } else {
    // Ensure autocomplete is one of the sensitive values
    sensitiveField.autocomplete = sensitiveAutocompletes[Math.floor(Math.random() * 3) + 1];
  }

  return {
    url: 'https://example.com/form',
    title: 'Form Page',
    focusedElement: null,
    interactiveElements: [sensitiveField],
    contextFlags: [],
  };
}

function generatePIIIntent(): Intent {
  const piiExamples = [
    'test@example.com',
    'user@domain.org',
    '555-123-4567',
    '123-45-6789',
    'Call me at 555.867.5309',
    'My email is john.doe@company.com',
  ];

  return {
    action: Math.random() > 0.5 ? 'send_message' : 'confirm_pending',
    target: null,
    parameters: {
      messageContent: piiExamples[Math.floor(Math.random() * piiExamples.length)],
    },
    rawTranscript: 'send message with PII',
  };
}

// ---------------------------------------------------------------------------
// Property Test: Determinism (Requirement 4.9)
// ---------------------------------------------------------------------------

describe('Property Test - Ethics Gate Determinism', () => {
  it('should produce identical decisions for identical inputs (100 random cases)', () => {
    for (let i = 0; i < 100; i++) {
      const intent = generateRandomIntent();
      const browserState = generateRandomBrowserState();

      const decision1 = evaluateEthics(intent, browserState);
      const decision2 = evaluateEthics(intent, browserState);
      const decision3 = evaluateEthics(intent, browserState);

      expect(decision1).toEqual(decision2);
      expect(decision2).toEqual(decision3);
    }
  });

  it('should produce identical decisions when called multiple times with same intent', () => {
    const intent: Intent = {
      action: 'add_to_cart',
      target: '#button',
      parameters: {},
      rawTranscript: 'add to cart',
    };

    const browserState: BrowserState = {
      url: 'https://example.com',
      title: 'Test',
      focusedElement: null,
      interactiveElements: [],
      contextFlags: [],
    };

    const decisions = Array.from({ length: 50 }, () => evaluateEthics(intent, browserState));

    // All decisions should be identical
    const firstDecision = decisions[0];
    decisions.forEach((decision) => {
      expect(decision).toEqual(firstDecision);
    });
  });
});

// ---------------------------------------------------------------------------
// Property Test: Strict Halt on Privacy Violation (Requirement 14.5)
// ---------------------------------------------------------------------------

describe('Property Test - Privacy Violation Strict Halt', () => {
  it('should always block sensitive field access, never allow or modify (50 random cases)', () => {
    for (let i = 0; i < 50; i++) {
      const intent = generateSensitiveFieldIntent();
      const browserState = generateSensitiveFieldBrowserState();

      // Skip describe_screen since it's read-only and allowed
      if (intent.action === 'describe_screen') continue;

      const decision = evaluateEthics(intent, browserState);

      // MUST be block, never allow or modify
      expect(decision.decision).toBe('block');
      expect(decision.decision).not.toBe('allow');
      expect(decision.decision).not.toBe('modify');
      expect(decision.privacyViolation).toBe(true);
    }
  });

  it('should always block PII submission, never allow or modify (50 random cases)', () => {
    const browserState: BrowserState = {
      url: 'https://example.com',
      title: 'Test',
      focusedElement: null,
      interactiveElements: [],
      contextFlags: [],
    };

    for (let i = 0; i < 50; i++) {
      const intent = generatePIIIntent();
      const decision = evaluateEthics(intent, browserState);

      // MUST be block, never allow or modify
      expect(decision.decision).toBe('block');
      expect(decision.decision).not.toBe('allow');
      expect(decision.decision).not.toBe('modify');
      expect(decision.privacyViolation).toBe(true);
    }
  });

  it('should always set privacyViolation=true for password field blocks', () => {
    const intent: Intent = {
      action: 'draft_message',
      target: '#password',
      parameters: {},
      rawTranscript: 'type password',
    };

    const passwordField: ElementSummary = {
      tagName: 'input',
      role: null,
      ariaLabel: 'Password',
      textContent: '',
      id: 'password',
      selector: '#password',
      hasAccessibleName: true,
      type: 'password',
    };

    const browserState: BrowserState = {
      url: 'https://example.com',
      title: 'Test',
      focusedElement: null,
      interactiveElements: [passwordField],
      contextFlags: [],
    };

    for (let i = 0; i < 20; i++) {
      const decision = evaluateEthics(intent, browserState);
      expect(decision.privacyViolation).toBe(true);
      expect(decision.decision).toBe('block');
    }
  });

  it('should always set privacyViolation=true for cc-number field blocks', () => {
    const intent: Intent = {
      action: 'draft_message',
      target: '#cc-number',
      parameters: {},
      rawTranscript: 'enter credit card',
    };

    const ccField: ElementSummary = {
      tagName: 'input',
      role: null,
      ariaLabel: 'Credit Card',
      textContent: '',
      id: 'cc-number',
      selector: '#cc-number',
      hasAccessibleName: true,
      type: 'text',
      autocomplete: 'cc-number',
    };

    const browserState: BrowserState = {
      url: 'https://example.com',
      title: 'Test',
      focusedElement: null,
      interactiveElements: [ccField],
      contextFlags: [],
    };

    for (let i = 0; i < 20; i++) {
      const decision = evaluateEthics(intent, browserState);
      expect(decision.privacyViolation).toBe(true);
      expect(decision.decision).toBe('block');
    }
  });

  it('should always set privacyViolation=true for cc-csc field blocks', () => {
    const intent: Intent = {
      action: 'draft_message',
      target: '#csc',
      parameters: {},
      rawTranscript: 'enter security code',
    };

    const cscField: ElementSummary = {
      tagName: 'input',
      role: null,
      ariaLabel: 'Security Code',
      textContent: '',
      id: 'csc',
      selector: '#csc',
      hasAccessibleName: true,
      type: 'text',
      autocomplete: 'cc-csc',
    };

    const browserState: BrowserState = {
      url: 'https://example.com',
      title: 'Test',
      focusedElement: null,
      interactiveElements: [cscField],
      contextFlags: [],
    };

    for (let i = 0; i < 20; i++) {
      const decision = evaluateEthics(intent, browserState);
      expect(decision.privacyViolation).toBe(true);
      expect(decision.decision).toBe('block');
    }
  });

  it('should always set privacyViolation=true for new-password field blocks', () => {
    const intent: Intent = {
      action: 'draft_message',
      target: '#new-password',
      parameters: {},
      rawTranscript: 'enter new password',
    };

    const newPasswordField: ElementSummary = {
      tagName: 'input',
      role: null,
      ariaLabel: 'New Password',
      textContent: '',
      id: 'new-password',
      selector: '#new-password',
      hasAccessibleName: true,
      type: 'password',
      autocomplete: 'new-password',
    };

    const browserState: BrowserState = {
      url: 'https://example.com',
      title: 'Test',
      focusedElement: null,
      interactiveElements: [newPasswordField],
      contextFlags: [],
    };

    for (let i = 0; i < 20; i++) {
      const decision = evaluateEthics(intent, browserState);
      expect(decision.privacyViolation).toBe(true);
      expect(decision.decision).toBe('block');
    }
  });
});

// ---------------------------------------------------------------------------
// Property Test: Non-Privacy Blocks Should Not Set privacyViolation
// ---------------------------------------------------------------------------

describe('Property Test - Non-Privacy Blocks', () => {
  it('should set privacyViolation=false for safety blocks (unlabeled control)', () => {
    const intent: Intent = {
      action: 'click_unlabeled',
      target: null,
      parameters: {},
      rawTranscript: 'click unlabeled',
    };

    const browserState: BrowserState = {
      url: 'https://example.com',
      title: 'Test',
      focusedElement: null,
      interactiveElements: [],
      contextFlags: [],
    };

    for (let i = 0; i < 20; i++) {
      const decision = evaluateEthics(intent, browserState);
      expect(decision.decision).toBe('block');
      expect(decision.privacyViolation).toBe(false);
    }
  });

  it('should set privacyViolation=false for context blocks (restricted pages)', () => {
    const intent: Intent = {
      action: 'add_to_cart',
      target: null,
      parameters: {},
      rawTranscript: 'add to cart',
    };

    const browserState: BrowserState = {
      url: 'chrome://settings',
      title: 'Settings',
      focusedElement: null,
      interactiveElements: [],
      contextFlags: ['restricted-context'],
    };

    for (let i = 0; i < 20; i++) {
      const decision = evaluateEthics(intent, browserState);
      expect(decision.decision).toBe('block');
      expect(decision.privacyViolation).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Property Test: Allow Decisions Should Never Have privacyViolation=true
// ---------------------------------------------------------------------------

describe('Property Test - Allow Decisions', () => {
  it('should never set privacyViolation=true for allow decisions (100 random cases)', () => {
    for (let i = 0; i < 100; i++) {
      const intent = generateRandomIntent();
      const browserState = generateRandomBrowserState();

      const decision = evaluateEthics(intent, browserState);

      if (decision.decision === 'allow') {
        expect(decision.privacyViolation).toBe(false);
      }
    }
  });
});
