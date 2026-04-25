/**
 * Ethics Logic Gate — Stage 3 of the AllVoice pipeline.
 *
 * THE MANDATORY CHALLENGE CONSTRAINT.
 *
 * Synchronous pure function that evaluates an intent + browser state against
 * a set of ethics rules. If a privacy rule is violated it returns "block"
 * and the pipeline halts — the Safe Executor is NEVER called.
 *
 * Guarantees:
 *   - Pure function: same inputs always produce the same output (Req 4.9)
 *   - First blocking rule wins (Req 4.2)
 *   - Completes synchronously — no async, no side effects (Req 4.3)
 *   - Human-readable reason and ruleId on every block/modify (Req 4.10)
 *   - privacyViolation flag set when a privacy rule triggers (Req 14.5)
 *
 * Requirements: 4.1, 4.2, 4.3, 4.8, 4.9, 4.10, 14.1, 14.2, 14.5
 */

import type { Intent, BrowserState, EthicsDecision, EthicsRule } from './types';
import { DEFAULT_ETHICS_RULES } from './ethicsRules';

// Re-export findTargetElement so consumers can use it from this module
export { findTargetElement } from './ethicsRules';

/**
 * THE ETHICS LOGIC GATE — Mandatory pipeline stage.
 *
 * Evaluates the given intent against all rules. Processing order:
 *   1. Iterate rules looking for the first "block" decision → return it
 *   2. Iterate rules looking for the first "modify" decision → return it
 *   3. If no rule triggers → return "allow"
 *
 * This is a PURE FUNCTION: same inputs always produce the same output.
 *
 * @param intent       - The structured intent from the Intent Parser
 * @param browserState - The captured DOM state from the Browser Observer
 * @param rules        - Optional custom rule set (defaults to DEFAULT_ETHICS_RULES)
 * @returns An EthicsDecision: "allow", "block", or "modify"
 */
export function evaluateEthics(
  intent: Intent,
  browserState: BrowserState,
  rules: EthicsRule[] = DEFAULT_ETHICS_RULES,
): EthicsDecision {
  // Pass 1: check for blocking rules — first block wins
  for (const rule of rules) {
    const result = rule.evaluate(intent, browserState);
    if (result !== null && result.decision === 'block') {
      return result;
    }
  }

  // Pass 2: check for modify rules — first modify wins
  for (const rule of rules) {
    const result = rule.evaluate(intent, browserState);
    if (result !== null && result.decision === 'modify') {
      return result;
    }
  }

  // No rule triggered — allow the intent
  return {
    decision: 'allow',
    reason: null,
    ruleId: null,
    modifiedIntent: null,
    privacyViolation: false,
  };
}
