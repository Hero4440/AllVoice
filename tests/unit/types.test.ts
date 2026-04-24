import { describe, it, expect } from 'vitest';
import type {
  PipelineContext,
  Intent,
  ActionType,
  BrowserState,
  ElementSummary,
  EthicsDecision,
  EthicsRule,
  ExecutionResult,
  ResponseMessage,
  AuditLogEntry,
  UserPreferences,
} from '../../src/pipeline/types';

describe('Pipeline Types', () => {
  describe('Intent', () => {
    it('should create a valid Intent object', () => {
      const intent: Intent = {
        action: 'describe_screen',
        target: null,
        parameters: {},
        rawTranscript: 'describe the screen',
      };
      expect(intent.action).toBe('describe_screen');
      expect(intent.target).toBeNull();
      expect(intent.rawTranscript).toBe('describe the screen');
    });

    it('should support all ActionType values', () => {
      const actions: ActionType[] = [
        'describe_screen',
        'add_to_cart',
        'purchase',
        'draft_message',
        'send_message',
        'confirm_pending',
        'click_unlabeled',
        'unrecognized',
      ];
      expect(actions).toHaveLength(8);
    });

    it('should allow parameters on draft_message intent', () => {
      const intent: Intent = {
        action: 'draft_message',
        target: '#chat-composer',
        parameters: { messageContent: 'Hello world' },
        rawTranscript: 'draft message hello world',
      };
      expect(intent.parameters.messageContent).toBe('Hello world');
    });
  });

  describe('BrowserState', () => {
    it('should create a valid BrowserState with no context flags', () => {
      const state: BrowserState = {
        url: 'https://example.com',
        title: 'Example',
        focusedElement: null,
        interactiveElements: [],
        contextFlags: [],
      };
      expect(state.contextFlags).toHaveLength(0);
    });

    it('should support restricted-context flag', () => {
      const state: BrowserState = {
        url: 'chrome://settings',
        title: 'Settings',
        focusedElement: null,
        interactiveElements: [],
        contextFlags: ['restricted-context'],
      };
      expect(state.contextFlags).toContain('restricted-context');
    });
  });

  describe('ElementSummary', () => {
    it('should represent a labeled button', () => {
      const el: ElementSummary = {
        tagName: 'BUTTON',
        role: 'button',
        ariaLabel: 'Add to Cart',
        textContent: 'Add to Cart',
        id: 'add-to-cart',
        selector: '#add-to-cart',
        hasAccessibleName: true,
      };
      expect(el.hasAccessibleName).toBe(true);
    });

    it('should represent an unlabeled mystery button', () => {
      const el: ElementSummary = {
        tagName: 'BUTTON',
        role: null,
        ariaLabel: null,
        textContent: '',
        id: 'mystery-btn',
        selector: '#mystery-btn',
        hasAccessibleName: false,
      };
      expect(el.hasAccessibleName).toBe(false);
      expect(el.ariaLabel).toBeNull();
    });

    it('should support optional type and autocomplete fields', () => {
      const el: ElementSummary = {
        tagName: 'INPUT',
        role: null,
        ariaLabel: null,
        textContent: '',
        id: 'cc-field',
        selector: '#cc-field',
        hasAccessibleName: false,
        type: 'text',
        autocomplete: 'cc-number',
      };
      expect(el.autocomplete).toBe('cc-number');
    });
  });

  describe('EthicsDecision', () => {
    it('should represent an allow decision', () => {
      const decision: EthicsDecision = {
        decision: 'allow',
        reason: null,
        ruleId: null,
        modifiedIntent: null,
        privacyViolation: false,
      };
      expect(decision.decision).toBe('allow');
      expect(decision.privacyViolation).toBe(false);
    });

    it('should represent a block decision with privacy violation', () => {
      const decision: EthicsDecision = {
        decision: 'block',
        reason: 'Targets a password field',
        ruleId: 'PRIVACY_SENSITIVE_FIELD',
        modifiedIntent: null,
        privacyViolation: true,
      };
      expect(decision.decision).toBe('block');
      expect(decision.privacyViolation).toBe(true);
      expect(decision.ruleId).toBe('PRIVACY_SENSITIVE_FIELD');
    });
  });

  describe('PipelineContext', () => {
    it('should create an initial context with only timestamp and transcript', () => {
      const ctx: PipelineContext = {
        timestamp: Date.now(),
        rawTranscript: 'add to cart',
        intent: null,
        browserState: null,
        ethicsDecision: null,
        executionResult: null,
        response: null,
      };
      expect(ctx.rawTranscript).toBe('add to cart');
      expect(ctx.intent).toBeNull();
    });

    it('should be JSON serializable and deserializable (round-trip)', () => {
      const ctx: PipelineContext = {
        timestamp: 1714000000000,
        rawTranscript: 'describe the screen',
        intent: {
          action: 'describe_screen',
          target: null,
          parameters: {},
          rawTranscript: 'describe the screen',
        },
        browserState: {
          url: 'https://example.com',
          title: 'Example',
          focusedElement: null,
          interactiveElements: [],
          contextFlags: [],
        },
        ethicsDecision: {
          decision: 'allow',
          reason: null,
          ruleId: null,
          modifiedIntent: null,
          privacyViolation: false,
        },
        executionResult: {
          status: 'success',
          details: 'Screen described',
        },
        response: {
          text: 'Found 3 interactive elements',
          type: 'success',
        },
      };
      const serialized = JSON.stringify(ctx);
      const deserialized: PipelineContext = JSON.parse(serialized);
      expect(deserialized).toEqual(ctx);
    });
  });

  describe('AuditLogEntry', () => {
    it('should create a valid audit log entry', () => {
      const entry: AuditLogEntry = {
        id: 'test-uuid',
        timestamp: Date.now(),
        rawTranscript: 'click unlabeled',
        intent: {
          action: 'click_unlabeled',
          target: '#mystery-btn',
          parameters: {},
          rawTranscript: 'click unlabeled',
        },
        browserStateSummary: {
          url: 'https://example.com/product',
          title: 'Product Page',
          contextFlags: [],
        },
        ethicsDecision: {
          decision: 'block',
          reason: 'Unlabeled control',
          ruleId: 'SAFETY_UNLABELED_CONTROL',
          privacyViolation: false,
        },
        executionResult: {
          status: 'blocked',
          details: 'Action blocked by ethics gate',
        },
        response: {
          text: 'Action blocked: unlabeled control',
          type: 'blocked',
        },
      };
      expect(entry.ethicsDecision?.decision).toBe('block');
    });
  });

  describe('UserPreferences', () => {
    it('should have high contrast enabled by default', () => {
      const prefs: UserPreferences = {
        highContrastMode: true,
        microphoneShortcut: 'Alt+Shift+V',
        auditLogRetentionDays: 30,
      };
      expect(prefs.highContrastMode).toBe(true);
      expect(prefs.auditLogRetentionDays).toBe(30);
    });
  });
});
