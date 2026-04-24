/**
 * Voice Capture — Web Speech API wrapper for the AllVoice popup.
 *
 * Factory function that initializes webkitSpeechRecognition and provides
 * start/stop controls with callbacks for transcript, error, and state changes.
 *
 * Requirements: 1.1, 1.2, 1.4, 1.5
 */

/** Callbacks provided by the consumer to handle voice capture events */
export interface VoiceCaptureCallbacks {
  /** Called with the final transcript text */
  onTranscript: (transcript: string) => void;
  /** Called when a speech recognition error occurs */
  onError: (error: string) => void;
  /** Called when listening state changes (true = listening, false = stopped) */
  onStateChange: (listening: boolean) => void;
}

/** Controls returned by createVoiceCapture */
export interface VoiceCaptureControls {
  start: () => void;
  stop: () => void;
}

/**
 * Creates a voice capture instance using the Web Speech API.
 *
 * Returns `{ start, stop }` controls, or `null` if the Web Speech API
 * is unavailable in the current browser.
 */
export function createVoiceCapture(
  callbacks: VoiceCaptureCallbacks,
): VoiceCaptureControls | null {
  const SpeechRecognitionCtor =
    window.webkitSpeechRecognition ?? window.SpeechRecognition;

  if (!SpeechRecognitionCtor) {
    callbacks.onError('Web Speech API is not available in this browser.');
    return null;
  }

  const recognition = new SpeechRecognitionCtor();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = (event: SpeechRecognitionEvent): void => {
    const transcript = event.results[0][0].transcript;
    callbacks.onTranscript(transcript);
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent): void => {
    const errorMsg = `Speech recognition error: ${event.error}`;
    callbacks.onError(errorMsg);

    // Announce error via Chrome TTS if available
    if (typeof chrome !== 'undefined' && chrome.tts) {
      chrome.tts.speak(errorMsg, { rate: 1.0, enqueue: false });
    }
  };

  recognition.onstart = (): void => {
    callbacks.onStateChange(true);
  };

  recognition.onend = (): void => {
    callbacks.onStateChange(false);
  };

  return {
    start: (): void => {
      try {
        recognition.start();
      } catch {
        callbacks.onError('Failed to start speech recognition.');
      }
    },
    stop: (): void => {
      try {
        recognition.stop();
      } catch {
        // Already stopped — ignore
      }
    },
  };
}
