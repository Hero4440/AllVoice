/**
 * Response Generator — Stage 5 of the AllVoice pipeline.
 *
 * Produces accessible spoken and visual feedback. Every response is delivered
 * via Chrome TTS AND displayed in the popup panel simultaneously.
 *
 * Response types:
 *   - blocked: explains why the ethics gate stopped the action
 *   - error:   describes the failure and suggests retry
 *   - success: confirms the completed action with details
 *   - info:    general informational messages
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 14.3
 */

import type { PipelineContext, ResponseMessage } from './types';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a ResponseMessage based on the pipeline context.
 *
 * Decision logic:
 *   1. If ethics gate blocked → explain why (include the ethics reason)
 *   2. If execution errored → describe failure, suggest retry
 *   3. If execution timed out → explain timeout, suggest retry
 *   4. Otherwise → confirm the completed action
 *
 * @param context - The PipelineContext after stages 1–4 have run
 * @returns A ResponseMessage with text and type
 */
export function generateResponse(context: PipelineContext): ResponseMessage {
  const { ethicsDecision, executionResult } = context;

  // Blocked by ethics gate
  if (ethicsDecision?.decision === 'block') {
    return {
      text: ethicsDecision.reason ?? 'This action was blocked by the ethics gate.',
      type: 'blocked',
    };
  }

  // Execution error
  if (executionResult?.status === 'error') {
    return {
      text: `Something went wrong: ${executionResult.details}. Try again or use a different command.`,
      type: 'error',
    };
  }

  // Execution timeout
  if (executionResult?.status === 'timeout') {
    return {
      text: 'The action took too long and was stopped. Please try again.',
      type: 'error',
    };
  }

  // Success
  return {
    text: executionResult?.details ?? 'Action completed.',
    type: 'success',
  };
}

/**
 * Delivers a response via Chrome TTS (spoken) and sends it to the popup UI
 * (visual) simultaneously.
 *
 * @param response - The ResponseMessage to deliver
 */
export function deliverResponse(response: ResponseMessage): void {
  // Speak via Chrome TTS API
  chrome.tts.speak(response.text, {
    rate: 1.0,
    enqueue: false,
  });

  // Send to popup for visual display in the ResponsePanel
  chrome.runtime.sendMessage({
    type: 'RESPONSE_UPDATE',
    payload: response,
  });
}
