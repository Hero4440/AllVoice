import { describe, it, expect } from 'vitest';
import { validatePipelineContext, assertValidContext } from '../../src/pipeline/contextValidator';

describe('validatePipelineContext', () => {
  it('should accept a valid minimal context', () => {
    const ctx = {
      timestamp: Date.now(),
      rawTranscript: 'hello',
      intent: null,
      browserState: null,
      ethicsDecision: null,
      executionResult: null,
      response: null,
    };
    expect(validatePipelineContext(ctx)).toBeNull();
  });

  it('should reject null', () => {
    expect(validatePipelineContext(null)).toContain('null or undefined');
  });

  it('should reject undefined', () => {
    expect(validatePipelineContext(undefined)).toContain('null or undefined');
  });

  it('should reject non-object', () => {
    expect(validatePipelineContext('string')).toContain('must be an object');
  });

  it('should reject missing timestamp', () => {
    const ctx = { rawTranscript: 'hello' };
    expect(validatePipelineContext(ctx)).toContain('timestamp');
  });

  it('should reject zero timestamp', () => {
    const ctx = { timestamp: 0, rawTranscript: 'hello' };
    expect(validatePipelineContext(ctx)).toContain('timestamp');
  });

  it('should reject missing rawTranscript', () => {
    const ctx = { timestamp: Date.now() };
    expect(validatePipelineContext(ctx)).toContain('rawTranscript');
  });

  it('should reject malformed intent', () => {
    const ctx = {
      timestamp: Date.now(),
      rawTranscript: 'hello',
      intent: { action: 123 },
    };
    expect(validatePipelineContext(ctx)).toContain('intent.action');
  });

  it('should reject malformed browserState', () => {
    const ctx = {
      timestamp: Date.now(),
      rawTranscript: 'hello',
      intent: null,
      browserState: { url: 123 },
    };
    expect(validatePipelineContext(ctx)).toContain('browserState.url');
  });

  it('should reject invalid ethicsDecision.decision', () => {
    const ctx = {
      timestamp: Date.now(),
      rawTranscript: 'hello',
      intent: null,
      browserState: null,
      ethicsDecision: { decision: 'invalid' },
    };
    expect(validatePipelineContext(ctx)).toContain('ethicsDecision.decision');
  });

  it('should accept valid ethicsDecision', () => {
    const ctx = {
      timestamp: Date.now(),
      rawTranscript: 'hello',
      intent: null,
      browserState: null,
      ethicsDecision: {
        decision: 'allow',
        reason: null,
        ruleId: null,
        modifiedIntent: null,
        privacyViolation: false,
      },
      executionResult: null,
      response: null,
    };
    expect(validatePipelineContext(ctx)).toBeNull();
  });
});

describe('assertValidContext', () => {
  it('should not throw for valid context', () => {
    const ctx = {
      timestamp: Date.now(),
      rawTranscript: 'hello',
      intent: null,
      browserState: null,
      ethicsDecision: null,
      executionResult: null,
      response: null,
    };
    expect(() => assertValidContext(ctx, 'test')).not.toThrow();
  });

  it('should throw for invalid context with stage name', () => {
    expect(() => assertValidContext(null, 'TestStage')).toThrow('[TestStage]');
  });
});
