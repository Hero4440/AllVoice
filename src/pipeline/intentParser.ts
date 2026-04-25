/**
 * Intent Parser — Stage 1 of the AllVoice pipeline.
 *
 * Keyword-based pattern matching that maps voice transcripts to structured
 * Intent objects. Uses RegExp rules — no ML/NLP for hackathon scope.
 *
 * Supported action types:
 *   describe_screen, add_to_cart, purchase, draft_message,
 *   send_message, confirm_pending, click_unlabeled
 *
 * Unrecognized transcripts produce { action: 'unrecognized' }.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 12.1
 */

import type { Intent, ActionType } from './types';

// ---------------------------------------------------------------------------
// Pattern rules
// ---------------------------------------------------------------------------

interface PatternRule {
  pattern: RegExp;
  action: ActionType;
  extractTarget?: (match: RegExpMatchArray) => string | null;
  extractParams?: (match: RegExpMatchArray) => Record<string, string>;
}

/**
 * Rules are evaluated in order — first match wins.
 * More specific patterns come before broader ones.
 */
const PATTERN_RULES: PatternRule[] = [
  // "describe the screen", "what's on the page", "read the page"
  {
    pattern: /\b(describe|what'?s on|read)\b.*\b(screen|page)\b/i,
    action: 'describe_screen',
  },

  // "add to cart", "add this to my cart"
  {
    pattern: /\badd\b.*\b(to\s+cart|cart)\b/i,
    action: 'add_to_cart',
  },

  // "buy now", "purchase this"
  {
    pattern: /\b(buy|purchase)\b/i,
    action: 'purchase',
  },

  // "draft a message hello world", "write a text hi there", "compose a chat hey"
  // Extracts everything after the keyword phrase as messageContent
  {
    pattern: /\b(draft|write|compose|type)\b.*\b(message|text|chat)\b(.*)/i,
    action: 'draft_message',
    extractParams: (match: RegExpMatchArray): Record<string, string> => {
      const trailing = (match[3] ?? '').trim();
      // Remove leading filler words like "saying", "that says"
      const content = trailing.replace(/^(saying|that\s+says?)\s+/i, '').trim();
      return content ? { messageContent: content } : {};
    },
  },

  // "send the message", "send text", "send chat"
  {
    pattern: /\bsend\b.*\b(message|text|chat)\b/i,
    action: 'send_message',
  },

  // "confirm", "yes", "proceed"
  {
    pattern: /\b(confirm|yes|proceed)\b/i,
    action: 'confirm_pending',
  },

  // "click the unlabeled button", "click the unknown control", "click mystery"
  {
    pattern: /\bclick\b.*\b(unlabeled|unknown|mystery)\b/i,
    action: 'click_unlabeled',
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parses a raw voice transcript into a structured Intent object.
 *
 * Iterates PATTERN_RULES in order. The first matching pattern determines
 * the action type. If no pattern matches, returns an 'unrecognized' intent.
 *
 * @param rawTranscript - The raw text from the Web Speech API
 * @returns A structured Intent object
 */
export function parseIntent(rawTranscript: string): Intent {
  for (const rule of PATTERN_RULES) {
    const match = rawTranscript.match(rule.pattern);
    if (match) {
      return {
        action: rule.action,
        target: rule.extractTarget?.(match) ?? null,
        parameters: rule.extractParams?.(match) ?? {},
        rawTranscript,
      };
    }
  }

  return {
    action: 'unrecognized',
    target: null,
    parameters: {},
    rawTranscript,
  };
}
