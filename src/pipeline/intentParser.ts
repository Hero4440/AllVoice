/**
 * Intent Parser — Stage 1 of the AllVoice pipeline.
 *
 * Two-tier parsing:
 *   1. Fast keyword-based pattern matching (instant, no network)
 *   2. Claude AI fallback for natural language understanding
 *
 * If keyword matching fails and Claude is available, the transcript
 * is sent to Claude for intent classification. If Claude is unavailable
 * or returns an invalid result, falls back to 'unrecognized'.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 12.1
 */

import type { Intent, ActionType } from './types';
import { askClaude } from '../utils/claudeApi';

// ---------------------------------------------------------------------------
// Valid action types for validation
// ---------------------------------------------------------------------------

const VALID_ACTIONS: readonly ActionType[] = [
  'describe_screen',
  'add_to_cart',
  'purchase',
  'draft_message',
  'send_message',
  'confirm_pending',
  'click_unlabeled',
  'navigate',
  'checkout',
  'go_back',
  'unrecognized',
] as const;

// ---------------------------------------------------------------------------
// Pattern rules (fast path)
// ---------------------------------------------------------------------------

interface PatternRule {
  pattern: RegExp;
  action: ActionType;
  extractTarget?: (match: RegExpMatchArray) => string | null;
  extractParams?: (match: RegExpMatchArray) => Record<string, string>;
}

const PATTERN_RULES: PatternRule[] = [
  {
    pattern: /\b(describe|what'?s on|read|what do you see|what is this)\b.*\b(screen|page)\b/i,
    action: 'describe_screen',
  },
  {
    pattern: /\b(go\s+back|back|previous\s+page|go\s+home|home\s+page)\b/i,
    action: 'go_back',
  },
  {
    pattern: /\b(checkout|check\s+out|proceed\s+to\s+checkout|pay|payment)\b/i,
    action: 'checkout',
  },
  {
    pattern: /\badd\b.*\b(to\s+cart|cart)\b/i,
    action: 'add_to_cart',
  },
  {
    pattern: /\b(tell\s+me\s+about|show\s+me|open|view|details|more\s+about)\b.*\b(headset|headphone)/i,
    action: 'navigate',
    extractParams: (): Record<string, string> => ({ targetPage: 'product-headset' }),
  },
  {
    pattern: /\b(tell\s+me\s+about|show\s+me|open|view|details|more\s+about)\b.*\b(keyboard|braille)/i,
    action: 'navigate',
    extractParams: (): Record<string, string> => ({ targetPage: 'product-keyboard' }),
  },
  {
    pattern: /\b(tell\s+me\s+about|show\s+me|open|view|details)\b.*\b(first|1st|one)\b/i,
    action: 'navigate',
    extractParams: (): Record<string, string> => ({ targetPage: 'product-headset' }),
  },
  {
    pattern: /\b(tell\s+me\s+about|show\s+me|open|view|details)\b.*\b(second|2nd|two)\b/i,
    action: 'navigate',
    extractParams: (): Record<string, string> => ({ targetPage: 'product-keyboard' }),
  },
  {
    pattern: /\b(go\s+to|open|view|show)\b.*\b(cart)\b/i,
    action: 'navigate',
    extractParams: (): Record<string, string> => ({ targetPage: 'cart' }),
  },
  {
    pattern: /\b(describe|what'?s on|what do you see|what is this|tell me about this)\b/i,
    action: 'describe_screen',
  },
  {
    pattern: /\b(buy|purchase)\b/i,
    action: 'purchase',
  },
  {
    pattern: /\b(draft|write|compose|type)\b.*\b(message|text|chat)\b(.*)/i,
    action: 'draft_message',
    extractParams: (match: RegExpMatchArray): Record<string, string> => {
      const trailing = (match[3] ?? '').trim();
      const content = trailing.replace(/^(saying|that\s+says?)\s+/i, '').trim();
      return content ? { messageContent: content } : {};
    },
  },
  {
    pattern: /\bsend\b.*\b(message|text|chat)\b/i,
    action: 'send_message',
  },
  {
    pattern: /\b(confirm|yes|proceed)\b/i,
    action: 'confirm_pending',
  },
  {
    pattern: /\bclick\b.*\b(unlabeled|unknown|mystery)\b/i,
    action: 'click_unlabeled',
  },
];

// ---------------------------------------------------------------------------
// Claude AI intent parsing
// ---------------------------------------------------------------------------

const INTENT_SYSTEM_PROMPT = `You are the intent parser for AllVoice, a browser copilot for blind users.
Given a voice transcript, classify it into one of these actions:
- describe_screen: user wants to know what's on the page
- add_to_cart: user wants to add something to their cart
- purchase: user wants to buy something
- navigate: user wants to go to a specific product or page (extract targetPage: "product-headset", "product-keyboard", or "cart")
- checkout: user wants to proceed to checkout or payment
- go_back: user wants to go back or go to the home page
- draft_message: user wants to type/compose a message (extract the message content)
- send_message: user wants to send a message
- confirm_pending: user is confirming or saying yes
- click_unlabeled: user wants to click a button that has no label
- unrecognized: you genuinely cannot determine the intent

Respond with ONLY valid JSON, no markdown, no explanation:
{"action":"action_type","target":null,"parameters":{}}

For navigate, include: {"action":"navigate","target":null,"parameters":{"targetPage":"product-headset"}}
For draft_message, include: {"action":"draft_message","target":null,"parameters":{"messageContent":"the message text"}}

Be generous in interpretation — if the user's intent is close to an action, pick the best match.
Examples: "what can I see here" → describe_screen, "put it in my bag" → add_to_cart, "I want to get this" → purchase, "tell me about the headset" → navigate with targetPage "product-headset", "checkout" → checkout, "go back" → go_back`;

/**
 * Attempts to parse the transcript using Claude AI.
 * Returns null if Claude is unavailable or returns invalid data.
 */
async function parseWithClaude(rawTranscript: string): Promise<Intent | null> {
  const response = await askClaude(
    INTENT_SYSTEM_PROMPT,
    rawTranscript,
    256,
  );

  if (!response) return null;

  try {
    const parsed = JSON.parse(response) as {
      action?: string;
      target?: string | null;
      parameters?: Record<string, string>;
    };

    if (!parsed.action || !VALID_ACTIONS.includes(parsed.action as ActionType)) {
      return null;
    }

    return {
      action: parsed.action as ActionType,
      target: parsed.target ?? null,
      parameters: parsed.parameters ?? {},
      rawTranscript,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Synchronous keyword-based parser. Used as the fast path
 * and as the fallback when Claude is unavailable.
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

/**
 * Enhanced intent parser that tries keyword matching first,
 * then falls back to Claude AI for natural language understanding.
 *
 * @param rawTranscript - The raw text from the Web Speech API
 * @returns A structured Intent object
 */
export async function parseIntentWithAI(rawTranscript: string): Promise<Intent> {
  console.log('[AllVoice] Parsing transcript:', JSON.stringify(rawTranscript));

  // Fast path: keyword matching
  const keywordResult = parseIntent(rawTranscript);
  if (keywordResult.action !== 'unrecognized') {
    console.log('[AllVoice] Keyword match:', keywordResult.action);
    return keywordResult;
  }

  console.log('[AllVoice] No keyword match, trying Claude...');
  // Slow path: Claude AI fallback
  const claudeResult = await parseWithClaude(rawTranscript);
  if (claudeResult) {
    console.log('[AllVoice] Claude parsed:', claudeResult.action);
    return claudeResult;
  }

  console.log('[AllVoice] Claude also returned unrecognized');
  // Final fallback: unrecognized
  return keywordResult;
}
