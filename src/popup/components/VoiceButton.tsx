/**
 * VoiceButton — Microphone toggle with high-contrast styling and ARIA live region.
 *
 * Requirements: 1.1, 1.3, 1.4, 8.2, 8.3
 */

import React, { useId } from 'react';

interface VoiceButtonProps {
  isListening: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function VoiceButton({
  isListening,
  onToggle,
  disabled = false,
}: VoiceButtonProps): React.ReactElement {
  const statusId = useId();

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-label={isListening ? 'Stop listening' : 'Start listening'}
        aria-pressed={isListening}
        aria-describedby={statusId}
        className={[
          'flex items-center justify-center gap-2',
          'min-w-[160px] px-6 py-3 rounded-lg',
          'text-body font-semibold',
          'transition-colors duration-150',
          'focus-visible:outline-focus focus-visible:outline-offset-focus',
          isListening
            ? 'bg-hc-error text-hc-bg'
            : 'bg-hc-accent text-hc-bg',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        {/* Mic icon placeholder */}
        <span aria-hidden="true">{isListening ? '⏹' : '🎤'}</span>
        <span>{isListening ? 'Stop' : 'Listen'}</span>
        {isListening && (
          <span
            aria-hidden="true"
            className="inline-block w-3 h-3 rounded-full bg-hc-bg animate-pulse"
          />
        )}
      </button>

      {/* ARIA live region — announces state changes to screen readers */}
      <div
        id={statusId}
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        className="text-label text-hc-text-secondary"
      >
        {isListening ? 'Listening…' : 'Microphone off'}
      </div>
    </div>
  );
}
