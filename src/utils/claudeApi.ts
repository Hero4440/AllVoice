/**
 * Claude API utility for AllVoice.
 *
 * Provides a thin wrapper around the Anthropic Messages API
 * for intent parsing and natural response generation.
 *
 * The API key is read from chrome.storage.local (set during extension setup).
 * Falls back gracefully if the key is missing or the API is unreachable.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';
const STORAGE_KEY = 'allvoice_anthropic_key';

/**
 * Retrieves the Anthropic API key from chrome.storage.local.
 */
async function getApiKey(): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] ?? null;
  } catch {
    return null;
  }
}

/**
 * Sets the Anthropic API key in chrome.storage.local.
 */
export async function setApiKey(key: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: key });
}

/**
 * Sends a message to Claude and returns the text response.
 * Returns null if the API key is missing or the request fails.
 */
export async function askClaude(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 1024,
): Promise<string | null> {
  const apiKey = await getApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const textBlock = data.content?.find(
      (block: { type: string; text?: string }) => block.type === 'text',
    );
    return textBlock?.text ?? null;
  } catch {
    return null;
  }
}
