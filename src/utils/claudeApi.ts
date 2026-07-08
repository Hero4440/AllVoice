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

/**
 * Hardcoded API key for development / demo use.
 * Replace with your own Anthropic API key.
 * TODO: Move to secure storage before any public release.
 */
const API_KEY = 'api key';

/**
 * Sends a message to Claude and returns the text response.
 * Returns null if the API key is missing or the request fails.
 */
export async function askClaude(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 1024,
): Promise<string | null> {
  const apiKey = API_KEY;
  if (!apiKey) {
    console.warn('[AllVoice] No API key configured.');
    return null;
  }

  try {
    console.log('[AllVoice] Sending request to Claude API...');
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    console.log('[AllVoice] Claude API response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AllVoice] Claude API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const textBlock = data.content?.find(
      (block: { type: string; text?: string }) => block.type === 'text',
    );
    console.log('[AllVoice] Claude response received:', textBlock?.text?.slice(0, 100));
    return textBlock?.text ?? null;
  } catch (err) {
    console.error('[AllVoice] Claude API fetch error:', err);
    return null;
  }
}
