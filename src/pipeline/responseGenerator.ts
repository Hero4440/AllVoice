/**
 * Response Generator — Stage 5 of the AllVoice pipeline.
 *
 * Produces accessible spoken and visual feedback. This is a STUB — the real
 * implementation is built by a teammate in parallel (Task 9).
 */

import type { PipelineContext, ResponseMessage } from './types';

/**
 * Generates a ResponseMessage based on the pipeline context
 * (ethics decision + execution result).
 */
export function generateResponse(context: PipelineContext): ResponseMessage {
  // STUB: returns a generic message until real implementation lands
  if (context.ethicsDecision?.decision === 'block') {
    return {
      text: context.ethicsDecision.reason ?? 'Action blocked by ethics gate.',
      type: 'blocked',
    };
  }

  if (context.executionResult?.status === 'error' || context.executionResult?.status === 'timeout') {
    return {
      text: context.executionResult.details,
      type: 'error',
    };
  }

  return {
    text: context.executionResult?.details ?? 'Action completed.',
    type: 'success',
  };
}

/**
 * Delivers a response via Chrome TTS and sends it to the popup UI.
 */
export async function deliverResponse(_response: ResponseMessage): Promise<void> {
  // STUB: no-op until real implementation lands
}
