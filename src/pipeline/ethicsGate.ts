/**
 * Ethics Logic Gate — Stage 3 of the AllVoice pipeline.
 *
 * Synchronous pure function that evaluates an intent + browser state against
 * ethics rules. MANDATORY — cannot be bypassed. This is a STUB — the real
 * implementation is built by a teammate in parallel (Task 4).
 */

import type { Intent, BrowserState, EthicsDecision, EthicsRule } from './types';

/**
 * Evaluates an intent against all configured ethics rules.
 * Returns "allow", "block", or "modify". First blocking rule wins.
 *
 * This is a PURE FUNCTION: same inputs always produce the same output.
 */
export function evaluateEthics(
  intent: Intent,
  browserState: BrowserState,
  _rules?: EthicsRule[]
): EthicsDecision {
  // STUB: allows all intents until real implementation lands
  void intent;
  void browserState;
  return {
    decision: 'allow',
    reason: null,
    ruleId: null,
    modifiedIntent: null,
    privacyViolation: false,
  };
}
