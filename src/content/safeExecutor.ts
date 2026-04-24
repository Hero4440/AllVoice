/**
 * Safe Executor — executes approved actions on the page DOM.
 *
 * STUB: This is a minimal placeholder so the content script compiles.
 * Full implementation is in Task 8.
 */

import type { BrowserState, ExecutionResult, Intent } from '../pipeline/types';

/**
 * Executes the given intent against the current browser state.
 * Stub returns a success result.
 */
export function executeAction(
  _intent: Intent,
  _browserState: BrowserState,
): ExecutionResult {
  return {
    status: 'success',
    details: 'Stub executor — no action performed.',
  };
}
