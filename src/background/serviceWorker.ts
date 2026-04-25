/**
 * Service Worker — Background script for AllVoice Browser Copilot.
 *
 * Orchestrates the six-stage pipeline by:
 *  - Receiving VOICE_TRANSCRIPT messages from the popup
 *  - Sending OBSERVE_BROWSER / EXECUTE_ACTION to the active tab content script
 *  - Forwarding RESPONSE_UPDATE messages back to the popup
 *  - Handling keyboard shortcuts via chrome.commands
 *  - Initializing default settings on install
 *  - Checkpointing pipeline state for service worker restart recovery
 *
 * Requirements: 10.2, 10.3, 10.4, 8.1, 12.4
 */

import { runPipeline } from '../pipeline/orchestrator';
import { deliverResponse } from '../pipeline/responseGenerator';
import type {
  ExtensionMessage,
  VoiceTranscriptMessage,
} from '../messages';
import type {
  BrowserState,
  ExecutionResult,
  Intent,
  PipelineContext,
  UserPreferences,
} from '../pipeline/types';

// ---------------------------------------------------------------------------
// Storage keys (all prefixed with allvoice_)
// ---------------------------------------------------------------------------

const PREFERENCES_KEY = 'allvoice_preferences';
const PIPELINE_STATE_KEY = 'allvoice_pipeline_state';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the currently active tab in the focused window.
 * Throws if no active tab is found.
 */
async function getActiveTab(): Promise<chrome.tabs.Tab> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error('No active tab found');
  }
  return tab;
}

/**
 * Sends a message to the content script in the active tab and returns the response.
 */
async function sendToContentScript<T>(
  tabId: number,
  message: ExtensionMessage,
): Promise<T> {
  return chrome.tabs.sendMessage(tabId, message) as Promise<T>;
}

/**
 * Checkpoints the current pipeline state to chrome.storage.local
 * so it can be recovered if the service worker is terminated mid-pipeline.
 */
async function checkpointPipelineState(
  state: PipelineContext | null,
): Promise<void> {
  await chrome.storage.local.set({ [PIPELINE_STATE_KEY]: state });
}

// ---------------------------------------------------------------------------
// Content-script callback factories
// ---------------------------------------------------------------------------

/**
 * Creates an observeBrowser callback that sends OBSERVE_BROWSER
 * to the active tab's content script and returns the BrowserState.
 */
function createObserveBrowserCallback(
  tabId: number,
): () => Promise<BrowserState> {
  return async (): Promise<BrowserState> => {
    const browserState = await sendToContentScript<BrowserState>(tabId, {
      type: 'OBSERVE_BROWSER',
    });
    return browserState;
  };
}

/**
 * Creates an executeAction callback that sends EXECUTE_ACTION
 * to the active tab's content script and returns the ExecutionResult.
 */
function createExecuteActionCallback(
  tabId: number,
): (intent: Intent, browserState: BrowserState) => Promise<ExecutionResult> {
  return async (
    intent: Intent,
    browserState: BrowserState,
  ): Promise<ExecutionResult> => {
    const result = await sendToContentScript<ExecutionResult>(tabId, {
      type: 'EXECUTE_ACTION',
      intent,
      browserState,
    });
    return result;
  };
}

// ---------------------------------------------------------------------------
// Pipeline execution
// ---------------------------------------------------------------------------

/**
 * Handles a voice transcript by running the full pipeline and
 * delivering the response to the popup.
 */
async function handleVoiceTranscript(transcript: string): Promise<void> {
  console.log('[AllVoice] handleVoiceTranscript called:', transcript);
  const tab = await getActiveTab();
  const tabId = tab.id as number;
  console.log('[AllVoice] Active tab:', tabId, tab.url);

  // Checkpoint: pipeline starting
  const initialState: PipelineContext = {
    timestamp: Date.now(),
    rawTranscript: transcript,
    intent: null,
    browserState: null,
    ethicsDecision: null,
    executionResult: null,
    response: null,
  };
  await checkpointPipelineState(initialState);

  const context = await runPipeline(
    transcript,
    createObserveBrowserCallback(tabId),
    createExecuteActionCallback(tabId),
  );

  // Checkpoint: pipeline complete
  await checkpointPipelineState(context);

  // Deliver response to popup via TTS + message
  if (context.response) {
    console.log('[AllVoice] Delivering response:', context.response.type, context.response.text.slice(0, 80));
    deliverResponse(context.response);
  } else {
    console.warn('[AllVoice] No response generated!');
  }

  // Clear checkpoint after successful delivery
  await checkpointPipelineState(null);
}

// ---------------------------------------------------------------------------
// Message listener (popup → service worker)
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ): boolean => {
    if (message.type === 'VOICE_TRANSCRIPT') {
      const voiceMessage = message as VoiceTranscriptMessage;
      handleVoiceTranscript(voiceMessage.transcript)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((err: unknown) => {
          const errorMessage =
            err instanceof Error ? err.message : String(err);
          console.error('[AllVoice] Pipeline error:', errorMessage);
          sendResponse({ success: false, error: errorMessage });
        });
      // Return true to indicate async sendResponse
      return true;
    }

    // Not handled by service worker
    return false;
  },
);

// ---------------------------------------------------------------------------
// Keyboard shortcuts (chrome.commands)
// ---------------------------------------------------------------------------

chrome.commands.onCommand.addListener((command: string): void => {
  switch (command) {
    case 'toggle-microphone': {
      // Send message to popup to toggle mic state
      chrome.runtime.sendMessage({
        type: 'TOGGLE_MICROPHONE' as const,
      }).catch(() => {
        // Popup may not be open — ignore
      });
      break;
    }

    case 'open-audit-log': {
      // Send message to popup to show audit log view
      chrome.runtime.sendMessage({
        type: 'OPEN_AUDIT_LOG' as const,
      }).catch(() => {
        // Popup may not be open — ignore
      });
      break;
    }

    case 'toggle-contrast': {
      // Toggle high-contrast mode preference in chrome.storage.sync
      chrome.storage.sync
        .get(PREFERENCES_KEY)
        .then(
          (result: { [key: string]: UserPreferences | undefined }) => {
            const prefs: UserPreferences = result[PREFERENCES_KEY] ?? {
              highContrastMode: true,
              microphoneShortcut: 'Alt+Shift+V',
              auditLogRetentionDays: 30,
            };
            const updated: UserPreferences = {
              ...prefs,
              highContrastMode: !prefs.highContrastMode,
            };
            return chrome.storage.sync.set({
              [PREFERENCES_KEY]: updated,
            });
          },
        )
        .catch(() => {
          // Storage error — ignore gracefully
        });
      break;
    }

    default:
      break;
  }
});

// ---------------------------------------------------------------------------
// Extension install / update — initialize default settings
// ---------------------------------------------------------------------------

chrome.runtime.onInstalled.addListener(
  (details: chrome.runtime.InstalledDetails): void => {
    if (
      details.reason === 'install' ||
      details.reason === 'update'
    ) {
      const defaultPreferences: UserPreferences = {
        highContrastMode: true,
        microphoneShortcut: 'Alt+Shift+V',
        auditLogRetentionDays: 30,
      };

      chrome.storage.sync
        .set({ [PREFERENCES_KEY]: defaultPreferences })
        .catch(() => {
          // Storage error on install — ignore gracefully
        });
    }
  },
);
