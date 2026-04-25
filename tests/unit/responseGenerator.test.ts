import { describe, it, expect } from 'vitest';
import { generateResponse } from '../../src/pipeline/responseGenerator';
import type { PipelineContext } from '../../src/pipeline/types';

function makeContext(overrides: Partial<PipelineContext> = {}): PipelineContext {
  return {
    timestamp: Date.now(),
    rawTranscript: 'test',
    intent: null,
    browserState: null,
    ethicsDecision: null,
    executionResult: null,
    response: null,
    ...overrides,
  };
}

describe('generateResponse', () => {
  it('should return blocked response when ethics gate blocks', () => {
    const ctx = makeContext({
      ethicsDecision: {
        decision: 'block',
        reason: 'Targets a password field',
        ruleId: 'PRIVACY_SENSITIVE_FIELD',
        modifiedIntent: null,
        privacyViolation: true,
      },
    });
    const response = generateResponse(ctx);
    expect(response.type).toBe('blocked');
    expect(response.text).toContain('password');
  });

  it('should return blocked with default message when reason is null', () => {
    const ctx = makeContext({
      ethicsDecision: {
        decision: 'block',
        reason: null,
        ruleId: null,
        modifiedIntent: null,
        privacyViolation: false,
      },
    });
    const response = generateResponse(ctx);
    expect(response.type).toBe('blocked');
    expect(response.text).toContain('blocked by the ethics gate');
  });

  it('should return error response on execution error', () => {
    const ctx = makeContext({
      ethicsDecision: {
        decision: 'allow',
        reason: null,
        ruleId: null,
        modifiedIntent: null,
        privacyViolation: false,
      },
      executionResult: {
        status: 'error',
        details: 'Element not found in DOM',
      },
    });
    const response = generateResponse(ctx);
    expect(response.type).toBe('error');
    expect(response.text).toContain('Element not found');
    expect(response.text).toContain('Try again');
  });

  it('should return error response on timeout', () => {
    const ctx = makeContext({
      ethicsDecision: {
        decision: 'allow',
        reason: null,
        ruleId: null,
        modifiedIntent: null,
        privacyViolation: false,
      },
      executionResult: {
        status: 'timeout',
        details: 'Timed out after 3000ms',
      },
    });
    const response = generateResponse(ctx);
    expect(response.type).toBe('error');
    expect(response.text).toContain('too long');
  });

  it('should return success response on successful execution', () => {
    const ctx = makeContext({
      ethicsDecision: {
        decision: 'allow',
        reason: null,
        ruleId: null,
        modifiedIntent: null,
        privacyViolation: false,
      },
      executionResult: {
        status: 'success',
        details: 'Clicked Add to Cart button',
      },
    });
    const response = generateResponse(ctx);
    expect(response.type).toBe('success');
    expect(response.text).toContain('Clicked Add to Cart');
  });

  it('should return default success message when no execution details', () => {
    const ctx = makeContext({
      ethicsDecision: {
        decision: 'allow',
        reason: null,
        ruleId: null,
        modifiedIntent: null,
        privacyViolation: false,
      },
    });
    const response = generateResponse(ctx);
    expect(response.type).toBe('success');
    expect(response.text).toBe('Action completed.');
  });
});
