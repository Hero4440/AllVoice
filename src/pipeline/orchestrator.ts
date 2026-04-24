/**
 * Pipeline Orchestrator — Central coordinator for the AllVoice six-stage pipeline.
 *
 * Receives a voice transcript and drives each pipeline stage in order:
 *   1. Intent_Parser    → parse the transcript into a structured Intent
 *   2. Browser_Observer → capture the active tab's DOM state (via callback)
 *   3. Ethics_Logic_Gate → evaluate the intent against ethics rules (MANDATORY)
 *   4. Safe_Executor    → execute the action if ethics allows (via callback)
 *   5. Response_Generator → produce spoken + visual feedback
 *   6. Audit_Log        → persist the pipeline invocation
 *
 * The Ethics Logic Gate is the mandatory Kiro Spark Challenge constraint.
 * When it returns "block", the Safe_Executor is NEVER called.
 *
 * Requirements: 2.4, 3.2, 4.8, 5.1, 5.2, 5.3, 5.6, 6.7, 7.1, 14.1
 */

import type {
  PipelineContext,
  Intent,
  BrowserState,
  ExecutionResult,
} from './types';
import { parseIntent } from './intentParser';
import { evaluateEthics } from './ethicsGate';
import { generateResponse } from './responseGenerator';
import { logEntry } from './auditLog';

/** Timeout duration for action execution (ms) — Requirement 5.6 */
const ACTION_TIMEOUT_MS = 3000;

/**
 * Creates a promise that rejects after the specified duration.
 * Used with Promise.race to enforce the action execution timeout.
 */
function createTimeout(ms: number): Promise<never> {
  return new Promise<never>((_resolve, reject) => {
    setTimeout(() => {
      reject(new Error(`Action execution timed out after ${ms}ms`));
    }, ms);
  });
}

/**
 * Runs the full six-stage pipeline. The Ethics Logic Gate is mandatory —
 * if it returns "block", the Safe Executor is never called.
 *
 * @param transcript      - Raw voice transcript from the Web Speech API
 * @param observeBrowser  - Callback that captures the active tab's DOM state
 *                          (runs in the content script via message passing)
 * @param executeAction   - Callback that executes an approved action on the page
 *                          (runs in the content script via message passing)
 * @returns The completed PipelineContext with all six stages populated
 */
export async function runPipeline(
  transcript: string,
  observeBrowser: () => Promise<BrowserState>,
  executeAction: (intent: Intent, browserState: BrowserState) => Promise<ExecutionResult>
): Promise<PipelineContext> {
  // Initialize the shared context object
  const context: PipelineContext = {
    timestamp: Date.now(),
    rawTranscript: transcript,
    intent: null,
    browserState: null,
    ethicsDecision: null,
    executionResult: null,
    response: null,
  };

  // Stage 1: Parse intent from transcript
  context.intent = parseIntent(transcript);

  // Stage 2: Observe browser state (runs in content script via messaging)
  context.browserState = await observeBrowser();

  // Stage 3: Ethics Logic Gate — MANDATORY, cannot be skipped
  context.ethicsDecision = evaluateEthics(context.intent, context.browserState);

  // Stage 4: Safe Executor — ONLY if ethics decision is NOT "block"
  if (context.ethicsDecision.decision === 'block') {
    // Pipeline halted by ethics gate — Safe_Executor is NEVER called (Req 14.1)
    context.executionResult = {
      status: 'blocked',
      details: context.ethicsDecision.reason ?? 'Blocked by ethics gate.',
    };
  } else {
    // Determine which intent to execute: modified or original
    const intentToExecute =
      context.ethicsDecision.decision === 'modify' && context.ethicsDecision.modifiedIntent !== null
        ? context.ethicsDecision.modifiedIntent
        : context.intent;

    try {
      // Enforce 3000ms timeout via Promise.race (Req 5.6)
      context.executionResult = await Promise.race([
        executeAction(intentToExecute, context.browserState),
        createTimeout(ACTION_TIMEOUT_MS),
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const isTimeout = message.includes('timed out');
      context.executionResult = {
        status: isTimeout ? 'timeout' : 'error',
        details: message,
      };
    }
  }

  // Stage 5: Generate response (spoken + visual feedback)
  context.response = generateResponse(context);

  // Stage 6: Audit log (persist pipeline invocation)
  await logEntry(context);

  return context;
}
