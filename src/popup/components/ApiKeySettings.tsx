/**
 * ApiKeySettings — Component for entering the Anthropic API key.
 *
 * Stores the key in chrome.storage.local (never synced, never committed).
 * Shows a simple input + save button with status feedback.
 */

import React, { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'allvoice_anthropic_key';

interface ApiKeySettingsProps {
  onBack: () => void;
}

export function ApiKeySettings({ onBack }: ApiKeySettingsProps): React.ReactElement {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY).then((result) => {
      if (result[STORAGE_KEY]) {
        setHasKey(true);
        // Show masked version
        const key = result[STORAGE_KEY] as string;
        setApiKey(key.slice(0, 10) + '...' + key.slice(-4));
      }
    }).catch(() => {
      // ignore
    });
  }, []);

  const handleSave = useCallback(() => {
    // Don't save the masked version
    if (apiKey.includes('...')) return;

    chrome.storage.local.set({ [STORAGE_KEY]: apiKey.trim() }).then(() => {
      setSaved(true);
      setHasKey(true);
      setTimeout(() => setSaved(false), 2000);
    }).catch(() => {
      // ignore
    });
  }, [apiKey]);

  const handleClear = useCallback(() => {
    chrome.storage.local.remove(STORAGE_KEY).then(() => {
      setApiKey('');
      setHasKey(false);
    }).catch(() => {
      // ignore
    });
  }, []);

  return (
    <div className="flex flex-col gap-4" role="region" aria-label="API Key Settings">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to main view"
        className="self-start px-3 py-1 rounded text-label bg-hc-surface text-hc-text border border-hc-border focus-visible:outline-focus focus-visible:outline-offset-focus cursor-pointer"
      >
        ← Back
      </button>

      <h2 className="text-body text-hc-accent">Claude AI Settings</h2>

      <p className="text-label text-hc-text">
        {hasKey
          ? 'Claude AI is enabled. AllVoice will understand natural language commands and give conversational responses.'
          : 'Add your Anthropic API key to enable natural language understanding. Without it, AllVoice uses keyword matching only.'}
      </p>

      <label htmlFor="api-key-input" className="text-label text-hc-text">
        Anthropic API Key
      </label>
      <input
        id="api-key-input"
        type="password"
        value={apiKey}
        onChange={(e) => {
          setApiKey(e.target.value);
          setSaved(false);
        }}
        placeholder="sk-ant-..."
        className="px-3 py-2 rounded text-body bg-hc-surface text-hc-text border border-hc-border focus-visible:outline-focus focus-visible:outline-offset-focus"
        aria-describedby="api-key-help"
      />
      <span id="api-key-help" className="text-label text-hc-text">
        Get your key at console.anthropic.com
      </span>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 rounded text-body bg-hc-accent text-hc-bg focus-visible:outline-focus focus-visible:outline-offset-focus cursor-pointer"
          aria-label="Save API key"
        >
          {saved ? '✓ Saved' : 'Save Key'}
        </button>
        {hasKey && (
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 rounded text-body bg-hc-surface text-hc-text border border-hc-border focus-visible:outline-focus focus-visible:outline-offset-focus cursor-pointer"
            aria-label="Remove API key"
          >
            Remove Key
          </button>
        )}
      </div>

      <div role="status" aria-live="polite" className="text-label">
        {saved && <span className="text-green-400">API key saved successfully.</span>}
      </div>
    </div>
  );
}
