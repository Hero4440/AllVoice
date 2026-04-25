import { describe, it, expect } from 'vitest';
import { evaluateEthics } from '../../src/pipeline/ethicsGate';
import { findTargetElement, DEFAULT_ETHICS_RULES } from '../../src/pipeline/ethicsRules';
import type { Intent, BrowserState, ElementSummary } from '../../src/pipeline/types';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeIntent(overrides: Partial<Intent> = {}): Intent {
  return {
    action: 'add_to_cart',
    target: null,
    parameters: {},
    rawTranscript: 'add to cart',
    ...overrides,
  };
}

function makeElement(overrides: Partial<ElementSummary> = {}): ElementSummary {
  return {
    tagName: 'button',
    role: 'button',
    ariaLabel: 'Add to Cart',
    textContent: 'Add to Cart',
    id: 'add-to-cart',
    selector: '#add-to-cart',
    hasAccessibleName: true,
    ...overrides,
  };
}

function makeBrowserState(overrides: Partial<BrowserState> = {}): BrowserState {
  return {
    url: 'https://example.com/product',
    title: 'Product Page',
    focusedElement: null,
    interactiveElements: [makeElement()],
    contextFlags: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('evaluateEthics', () => {
  it('should allow a safe add_to_cart intent', () => {
    const result = evaluateEthics(makeIntent(), makeBrowserState());
    expect(result.decision).toBe('allow');
    expect(result.privacyViolation).toBe(false);
    expect(result.ruleId).toBeNull();
  });

  it('should allow describe_screen on any page', () => {
    const intent = makeIntent({ action: 'describe_screen' });
    const result = evaluateEthics(intent, makeBrowserState());
    expect(result.decision).toBe('allow');
  });

  it('should be deterministic — same inputs produce same output', () => {
    const intent = makeIntent();
    const state = makeBrowserState();
    const r1 = evaluateEthics(intent, state);
    const r2 = evaluateEthics(intent, state);
    expect(r1).toEqual(r2);
  });

  it('should return allow when no rules are provided', () => {
    const result = evaluateEthics(makeIntent(), makeBrowserState(), []);
    expect(result.decision).toBe('allow');
  });
});

describe('PRIVACY_SENSITIVE_FIELD rule', () => {
  it('should block actions targeting a password field', () => {
    const intent = makeIntent({ target: '#pw' });
    const state = makeBrowserState({
      interactiveElements: [
        makeElement({ id: 'pw', selector: '#pw', type: 'password', textContent: '' }),
      ],
    });
    const result = evaluateEthics(intent, state);
    expect(result.decision).toBe('block');
    expect(result.ruleId).toBe('PRIVACY_SENSITIVE_FIELD');
    expect(result.privacyViolation).toBe(true);
    expect(result.reason).toContain('password');
  });

  it('should block actions targeting cc-number autocomplete field', () => {
    const intent = makeIntent({ target: '#cc' });
    const state = makeBrowserState({
      interactiveElements: [
        makeElement({ id: 'cc', selector: '#cc', autocomplete: 'cc-number', textContent: '' }),
      ],
    });
    const result = evaluateEthics(intent, state);
    expect(result.decision).toBe('block');
    expect(result.ruleId).toBe('PRIVACY_SENSITIVE_FIELD');
    expect(result.privacyViolation).toBe(true);
  });

  it('should block actions targeting cc-csc autocomplete field', () => {
    const intent = makeIntent({ target: '#csc' });
    const state = makeBrowserState({
      interactiveElements: [
        makeElement({ id: 'csc', selector: '#csc', autocomplete: 'cc-csc', textContent: '' }),
      ],
    });
    const result = evaluateEthics(intent, state);
    expect(result.decision).toBe('block');
    expect(result.privacyViolation).toBe(true);
  });

  it('should block actions targeting new-password autocomplete field', () => {
    const intent = makeIntent({ target: '#newpw' });
    const state = makeBrowserState({
      interactiveElements: [
        makeElement({ id: 'newpw', selector: '#newpw', autocomplete: 'new-password', textContent: '' }),
      ],
    });
    const result = evaluateEthics(intent, state);
    expect(result.decision).toBe('block');
    expect(result.privacyViolation).toBe(true);
  });

  it('should allow describe_screen even on sensitive fields', () => {
    const intent = makeIntent({ action: 'describe_screen', target: '#pw' });
    const state = makeBrowserState({
      interactiveElements: [
        makeElement({ id: 'pw', selector: '#pw', type: 'password', textContent: '' }),
      ],
    });
    const result = evaluateEthics(intent, state);
    expect(result.decision).toBe('allow');
  });
});

describe('PRIVACY_PII_SUBMISSION rule', () => {
  it('should block send_message with email in parameters', () => {
    const intent = makeIntent({
      action: 'send_message',
      parameters: { messageContent: 'my email is test.user@example.com' },
    });
    const result = evaluateEthics(intent, makeBrowserState());
    expect(result.decision).toBe('block');
    expect(result.ruleId).toBe('PRIVACY_PII_SUBMISSION');
    expect(result.privacyViolation).toBe(true);
  });

  it('should block send_message with phone number', () => {
    const intent = makeIntent({
      action: 'send_message',
      parameters: { messageContent: 'call me at 555-867-5309' },
    });
    const result = evaluateEthics(intent, makeBrowserState());
    expect(result.decision).toBe('block');
    expect(result.ruleId).toBe('PRIVACY_PII_SUBMISSION');
  });

  it('should block confirm_pending with SSN', () => {
    const intent = makeIntent({
      action: 'confirm_pending',
      parameters: { messageContent: 'SSN: 123-45-6789' },
    });
    const result = evaluateEthics(intent, makeBrowserState());
    expect(result.decision).toBe('block');
    expect(result.ruleId).toBe('PRIVACY_PII_SUBMISSION');
  });

  it('should allow send_message without PII', () => {
    const intent = makeIntent({
      action: 'send_message',
      parameters: { messageContent: 'hello world' },
    });
    const result = evaluateEthics(intent, makeBrowserState());
    expect(result.decision).toBe('allow');
  });

  it('should allow non-submission actions even with PII in params', () => {
    const intent = makeIntent({
      action: 'add_to_cart',
      parameters: { messageContent: '[email]' },
    });
    const result = evaluateEthics(intent, makeBrowserState());
    expect(result.decision).toBe('allow');
  });
});

describe('SAFETY_UNLABELED_CONTROL rule', () => {
  it('should block click_unlabeled actions', () => {
    const intent = makeIntent({ action: 'click_unlabeled' });
    const result = evaluateEthics(intent, makeBrowserState());
    expect(result.decision).toBe('block');
    expect(result.ruleId).toBe('SAFETY_UNLABELED_CONTROL');
    expect(result.privacyViolation).toBe(false);
    expect(result.reason).toContain('no accessible label');
  });

  it('should allow non-click_unlabeled actions', () => {
    const intent = makeIntent({ action: 'add_to_cart' });
    const result = evaluateEthics(intent, makeBrowserState());
    expect(result.decision).toBe('allow');
  });
});

describe('CONTEXT_RESTRICTED rule', () => {
  it('should block execution intents on chrome:// pages', () => {
    const intent = makeIntent({ action: 'add_to_cart' });
    const state = makeBrowserState({
      url: 'chrome://settings',
      contextFlags: ['restricted-context'],
    });
    const result = evaluateEthics(intent, state);
    expect(result.decision).toBe('block');
    expect(result.ruleId).toBe('CONTEXT_RESTRICTED');
    expect(result.privacyViolation).toBe(false);
  });

  it('should allow describe_screen on chrome:// pages', () => {
    const intent = makeIntent({ action: 'describe_screen' });
    const state = makeBrowserState({
      url: 'chrome://settings',
      contextFlags: ['restricted-context'],
    });
    const result = evaluateEthics(intent, state);
    expect(result.decision).toBe('allow');
  });

  it('should allow all actions on normal pages', () => {
    const intent = makeIntent({ action: 'purchase' });
    const state = makeBrowserState({ url: 'https://example.com' });
    const result = evaluateEthics(intent, state);
    expect(result.decision).toBe('allow');
  });
});

describe('findTargetElement', () => {
  it('should find element by exact selector match', () => {
    const intent = makeIntent({ target: '#add-to-cart' });
    const state = makeBrowserState();
    const el = findTargetElement(intent, state);
    expect(el).not.toBeNull();
    expect(el?.selector).toBe('#add-to-cart');
  });

  it('should find add_to_cart button by text heuristic', () => {
    const intent = makeIntent({ action: 'add_to_cart', target: null });
    const state = makeBrowserState();
    const el = findTargetElement(intent, state);
    expect(el).not.toBeNull();
    expect(el?.textContent).toBe('Add to Cart');
  });

  it('should return null when no match found', () => {
    const intent = makeIntent({ target: '#nonexistent' });
    const state = makeBrowserState();
    const el = findTargetElement(intent, state);
    expect(el).toBeNull();
  });
});

describe('Blocked decisions include reason and ruleId', () => {
  it('every block decision has a non-null reason', () => {
    const blockingIntents: Intent[] = [
      makeIntent({ action: 'click_unlabeled' }),
      makeIntent({ action: 'send_message', parameters: { messageContent: 'test.user@example.com' } }),
    ];

    for (const intent of blockingIntents) {
      const result = evaluateEthics(intent, makeBrowserState());
      expect(result.decision).toBe('block');
      expect(result.reason).not.toBeNull();
      expect(result.reason!.length).toBeGreaterThan(0);
      expect(result.ruleId).not.toBeNull();
    }
  });
});
