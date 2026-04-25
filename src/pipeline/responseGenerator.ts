/**
 * Response Generator — Stage 5 of the AllVoice pipeline.
 *
 * Two modes:
 *   1. Fast static responses (no network, instant)
 *   2. Claude-enhanced natural responses (conversational, human-sounding)
 *
 * Falls back to static responses if Claude is unavailable.
 * Every response is delivered via Chrome TTS AND displayed in the popup panel.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 14.3
 */

import type { PipelineContext, ResponseMessage } from './types';
import { askClaude } from '../utils/claudeApi';

// ---------------------------------------------------------------------------
// Static response generation (fast path)
// ---------------------------------------------------------------------------

/**
 * Generates a static ResponseMessage based on the pipeline context.
 * Used as the fast path and fallback when Claude is unavailable.
 */
export function generateResponse(context: PipelineContext): ResponseMessage {
  const { ethicsDecision, executionResult } = context;

  if (ethicsDecision?.decision === 'block') {
    return {
      text: ethicsDecision.reason ?? 'This action was blocked by the ethics gate.',
      type: 'blocked',
    };
  }

  if (executionResult?.status === 'error') {
    return {
      text: `Something went wrong: ${executionResult.details}. Try again or use a different command.`,
      type: 'error',
    };
  }

  if (executionResult?.status === 'timeout') {
    return {
      text: 'The action took too long and was stopped. Please try again.',
      type: 'error',
    };
  }

  return {
    text: executionResult?.details ?? 'Action completed.',
    type: 'success',
  };
}

// ---------------------------------------------------------------------------
// Claude-enhanced natural response generation
// ---------------------------------------------------------------------------

const RESPONSE_SYSTEM_PROMPT = `You are AllVoice, a friendly browser copilot helping a blind or low-vision user navigate the web.

Your job is to take a pipeline result and turn it into a natural, human-sounding spoken response.

Rules:
- Speak directly to the user in second person ("I found...", "You have...")
- Be concise but warm — this is read aloud via text-to-speech
- Use natural pauses by adding commas and periods strategically
- For page descriptions: summarize what matters, mention key buttons and controls by name, flag any unlabeled elements as potential concerns
- For blocked actions: explain WHY clearly and kindly, suggest what they can do instead
- For errors: be reassuring, suggest alternatives
- For successful actions: confirm what happened briefly
- Never use markdown, bullet points, or formatting — this is spoken aloud
- Keep responses under 3 sentences for actions, up to 5 for page descriptions
- Sound like a helpful friend, not a robot reading a log file`;

/**
 * Generates a natural, conversational response using Claude AI.
 * Falls back to static response if Claude is unavailable.
 */
export async function generateResponseWithAI(
  context: PipelineContext,
): Promise<ResponseMessage> {
  // Get the static response first (used as fallback and for type)
  const staticResponse = generateResponse(context);

  // Build a summary of the pipeline result for Claude
  const summary = buildContextSummary(context);

  const naturalText = await askClaude(
    RESPONSE_SYSTEM_PROMPT,
    summary,
    300,
  );

  if (naturalText) {
    return {
      text: naturalText,
      type: staticResponse.type,
    };
  }

  return staticResponse;
}

/**
 * Builds a plain-text summary of the pipeline context for Claude.
 */
function buildContextSummary(context: PipelineContext): string {
  const parts: string[] = [];

  parts.push(`User said: "${context.rawTranscript}"`);

  if (context.intent) {
    parts.push(`Parsed action: ${context.intent.action}`);
  }

  if (context.browserState) {
    parts.push(`Page: ${context.browserState.title} (${context.browserState.url})`);
    const labeled = context.browserState.interactiveElements.filter(e => e.hasAccessibleName);
    const unlabeled = context.browserState.interactiveElements.filter(e => !e.hasAccessibleName);
    parts.push(`Found ${labeled.length} labeled controls and ${unlabeled.length} unlabeled controls.`);

    if (unlabeled.length > 0) {
      const unlabeledList = unlabeled
        .slice(0, 5)
        .map(e => `${e.tagName}${e.id ? '#' + e.id : ''}`)
        .join(', ');
      parts.push(`Unlabeled elements: ${unlabeledList}`);
    }

    if (labeled.length > 0) {
      const labeledList = labeled
        .slice(0, 10)
        .map(e => {
          const name = e.ariaLabel || e.textContent || e.tagName;
          return `${e.tagName}: "${name}"`;
        })
        .join(', ');
      parts.push(`Key controls: ${labeledList}`);
    }
  }

  if (context.ethicsDecision) {
    parts.push(`Ethics decision: ${context.ethicsDecision.decision}`);
    if (context.ethicsDecision.reason) {
      parts.push(`Reason: ${context.ethicsDecision.reason}`);
    }
    if (context.ethicsDecision.privacyViolation) {
      parts.push('This was a privacy violation.');
    }
  }

  if (context.executionResult) {
    parts.push(`Execution: ${context.executionResult.status} — ${context.executionResult.details}`);
  }

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

/**
 * Delivers a response via Chrome TTS (spoken) and sends it to the popup UI.
 */
export function deliverResponse(response: ResponseMessage): void {
  chrome.tts.speak(response.text, {
    rate: 0.95,
    enqueue: false,
  });

  chrome.runtime.sendMessage({
    type: 'RESPONSE_UPDATE',
    payload: response,
  });
}
