/**
 * Intent Parser — Stage 1 of the AllVoice pipeline.
 *
 * Keyword-based pattern matching that maps voice transcripts to structured
 * Intent objects. This is a STUB — the real implementation is built by a
 * teammate in parallel (Task 5).
 */

import type { Intent } from './types';

/**
 * Parses a raw voice transcript into a structured Intent object.
 * Uses keyword-based RegExp pattern matching (no ML).
 */
export function parseIntent(rawTranscript: string): Intent {
  // STUB: returns unrecognized intent until real implementation lands
  return {
    action: 'unrecognized',
    target: null,
    parameters: {},
    rawTranscript,
  };
}
