/**
 * PipelineContext Validator — validates the structure of PipelineContext
 * at each pipeline stage to reject malformed data early.
 *
 * Requirements: 12.4
 */

import type { PipelineContext } from './types';

/**
 * Validates that the given value is a well-formed PipelineContext.
 * Returns null if valid, or a descriptive error string if malformed.
 *
 * @param context - The value to validate
 * @returns null if valid, error message string if malformed
 */
export function validatePipelineContext(context: unknown): string | null {
  if (context === null || context === undefined) {
    return 'PipelineContext is null or undefined.';
  }

  if (typeof context !== 'object') {
    return `PipelineContext must be an object, got ${typeof context}.`;
  }

  const ctx = context as Record<string, unknown>;

  // timestamp is required and must be a positive number
  if (typeof ctx['timestamp'] !== 'number' || ctx['timestamp'] <= 0) {
    return 'PipelineContext.timestamp must be a positive number.';
  }

  // rawTranscript is required and must be a string
  if (typeof ctx['rawTranscript'] !== 'string') {
    return 'PipelineContext.rawTranscript must be a string.';
  }

  // intent, if present, must have an action string
  if (ctx['intent'] !== null && ctx['intent'] !== undefined) {
    const intent = ctx['intent'] as Record<string, unknown>;
    if (typeof intent !== 'object') {
      return 'PipelineContext.intent must be an object or null.';
    }
    if (typeof intent['action'] !== 'string') {
      return 'PipelineContext.intent.action must be a string.';
    }
    if (typeof intent['rawTranscript'] !== 'string') {
      return 'PipelineContext.intent.rawTranscript must be a string.';
    }
  }

  // browserState, if present, must have url and title
  if (ctx['browserState'] !== null && ctx['browserState'] !== undefined) {
    const bs = ctx['browserState'] as Record<string, unknown>;
    if (typeof bs !== 'object') {
      return 'PipelineContext.browserState must be an object or null.';
    }
    if (typeof bs['url'] !== 'string') {
      return 'PipelineContext.browserState.url must be a string.';
    }
    if (typeof bs['title'] !== 'string') {
      return 'PipelineContext.browserState.title must be a string.';
    }
    if (!Array.isArray(bs['interactiveElements'])) {
      return 'PipelineContext.browserState.interactiveElements must be an array.';
    }
    if (!Array.isArray(bs['contextFlags'])) {
      return 'PipelineContext.browserState.contextFlags must be an array.';
    }
  }

  // ethicsDecision, if present, must have a decision string
  if (ctx['ethicsDecision'] !== null && ctx['ethicsDecision'] !== undefined) {
    const ed = ctx['ethicsDecision'] as Record<string, unknown>;
    if (typeof ed !== 'object') {
      return 'PipelineContext.ethicsDecision must be an object or null.';
    }
    if (ed['decision'] !== 'allow' && ed['decision'] !== 'block' && ed['decision'] !== 'modify') {
      return 'PipelineContext.ethicsDecision.decision must be "allow", "block", or "modify".';
    }
  }

  return null;
}

/**
 * Asserts that the given value is a valid PipelineContext.
 * Throws an error with a descriptive message if malformed.
 *
 * @param context - The value to validate
 * @param stage   - Name of the pipeline stage (for error messages)
 * @throws Error if the context is malformed
 */
export function assertValidContext(
  context: unknown,
  stage: string,
): asserts context is PipelineContext {
  const error = validatePipelineContext(context);
  if (error !== null) {
    throw new Error(`[${stage}] Malformed PipelineContext: ${error}`);
  }
}
