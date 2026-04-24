/**
 * Popup — Root React component for the AllVoice Browser Copilot popup.
 *
 * Manages listening state, response messages, high-contrast mode,
 * view navigation (main / audit-log / ethics-rules), and voice capture
 * integration via createVoiceCapture.
 *
 * Requirements: 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ResponseMessage, UserPreferences } from '../pipeline/types';
import { VoiceButton } from './components/VoiceButton';
import { ResponsePanel } from './components/ResponsePanel';
import { AuditLogViewer } from './components/AuditLogViewer';
import { EthicsRulesViewer } from './components/EthicsRulesViewer';
import {
  createVoiceCapture,
  type VoiceCaptureControls,
} from './voiceCapture';

type ViewState = 'main' | 'audit-log' | 'ethics-rules';

const PREFERENCES_KEY = 'allvoice_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  highContrastMode: true,
  microphoneShortcut: 'Alt+Shift+V',
  auditLogRetentionDays: 30,
};

export function Popup(): React.ReactElement {
  const [view, setView] = useState<ViewState>('main');
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<ResponseMessage[]>([]);
  const [highContrast, setHighContrast] = useState(true);

  const voiceCaptureRef = useRef<VoiceCaptureControls | null>(null);

  // -----------------------------------------------------------------------
  // Initialize voice capture on mount
  // -----------------------------------------------------------------------
  useEffect(() => {
    const controls = createVoiceCapture({
      onTranscript: (transcript: string): void => {
        // Send transcript to service worker via chrome.runtime.sendMessage
        chrome.runtime.sendMessage({
          type: 'VOICE_TRANSCRIPT' as const,
          transcript,
        }).catch(() => {
          // Service worker may not be ready — ignore
        });
      },
      onError: (error: string): void => {
        setMessages((prev) => [
          { text: error, type: 'error' as const },
          ...prev,
        ]);
      },
      onStateChange: (listening: boolean): void => {
        setIsListening(listening);
      },
    });

    voiceCaptureRef.current = controls;
  }, []);

  // -----------------------------------------------------------------------
  // Load preferences from chrome.storage.sync on mount
  // -----------------------------------------------------------------------
  useEffect(() => {
    chrome.storage.sync
      .get(PREFERENCES_KEY)
      .then((result: { [key: string]: UserPreferences | undefined }) => {
        const prefs = result[PREFERENCES_KEY] ?? DEFAULT_PREFERENCES;
        setHighContrast(prefs.highContrastMode);
      })
      .catch(() => {
        // Fallback to default (high contrast on)
      });
  }, []);

  // -----------------------------------------------------------------------
  // Listen for messages from service worker
  // -----------------------------------------------------------------------
  useEffect(() => {
    const listener = (
      message: { type: string; payload?: ResponseMessage },
    ): void => {
      if (message.type === 'RESPONSE_UPDATE' && message.payload) {
        setMessages((prev) => [message.payload as ResponseMessage, ...prev]);
      }
      if (message.type === 'TOGGLE_MICROPHONE') {
        // Toggle mic via keyboard shortcut from service worker
        const controls = voiceCaptureRef.current;
        if (controls) {
          setIsListening((prev) => {
            if (prev) {
              controls.stop();
            } else {
              controls.start();
            }
            return !prev;
          });
        }
      }
      if (message.type === 'OPEN_AUDIT_LOG') {
        setView('audit-log');
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, []);

  // -----------------------------------------------------------------------
  // Listen for storage changes (contrast toggle from keyboard shortcut)
  // -----------------------------------------------------------------------
  useEffect(() => {
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ): void => {
      if (area === 'sync' && changes[PREFERENCES_KEY]?.newValue) {
        const prefs = changes[PREFERENCES_KEY].newValue as UserPreferences;
        setHighContrast(prefs.highContrastMode);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  // -----------------------------------------------------------------------
  // Escape key closes popup and returns focus to page
  // -----------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        window.close();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // -----------------------------------------------------------------------
  // Mic toggle handler — wired to voiceCapture start/stop
  // -----------------------------------------------------------------------
  const handleMicToggle = useCallback((): void => {
    const controls = voiceCaptureRef.current;
    if (!controls) {
      setMessages((prev) => [
        {
          text: 'Web Speech API is not available in this browser.',
          type: 'error' as const,
        },
        ...prev,
      ]);
      return;
    }

    if (isListening) {
      controls.stop();
    } else {
      controls.start();
    }
  }, [isListening]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div
      className={[
        'min-w-[360px] min-h-[480px] p-4 flex flex-col gap-4',
        'bg-hc-bg text-hc-text',
        highContrast ? '' : 'standard-contrast',
      ].join(' ')}
      role="application"
      aria-label="AllVoice Browser Copilot"
    >
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-heading text-hc-accent">AllVoice</h1>
        {view === 'main' && (
          <nav aria-label="Views" className="flex gap-2">
            <button
              type="button"
              onClick={() => setView('audit-log')}
              aria-label="View audit log"
              className={[
                'px-3 py-1 rounded text-label',
                'bg-hc-surface text-hc-text border border-hc-border',
                'focus-visible:outline-focus focus-visible:outline-offset-focus',
                'cursor-pointer',
              ].join(' ')}
            >
              Audit Log
            </button>
            <button
              type="button"
              onClick={() => setView('ethics-rules')}
              aria-label="View ethics rules"
              className={[
                'px-3 py-1 rounded text-label',
                'bg-hc-surface text-hc-text border border-hc-border',
                'focus-visible:outline-focus focus-visible:outline-offset-focus',
                'cursor-pointer',
              ].join(' ')}
            >
              Ethics Rules
            </button>
          </nav>
        )}
      </header>

      {/* Main view */}
      {view === 'main' && (
        <>
          <VoiceButton
            isListening={isListening}
            onToggle={handleMicToggle}
          />
          <ResponsePanel messages={messages} />
        </>
      )}

      {/* Audit log view */}
      {view === 'audit-log' && (
        <AuditLogViewer onBack={() => setView('main')} />
      )}

      {/* Ethics rules view */}
      {view === 'ethics-rules' && (
        <EthicsRulesViewer onBack={() => setView('main')} />
      )}
    </div>
  );
}
