/**
 * Message types and interfaces for communication between
 * popup ↔ service worker ↔ content script.
 *
 * Uses chrome.runtime.sendMessage (popup ↔ service worker)
 * and chrome.tabs.sendMessage (service worker ↔ content script).
 */

import type { BrowserState, Intent, ResponseMessage } from './pipeline/types';

// ---------------------------------------------------------------------------
// Message type discriminator
// ---------------------------------------------------------------------------

/** Union of all message type discriminators */
export type MessageType =
  | 'VOICE_TRANSCRIPT'
  | 'OBSERVE_BROWSER'
  | 'EXECUTE_ACTION'
  | 'RESPONSE_UPDATE';

// ---------------------------------------------------------------------------
// Individual message interfaces
// ---------------------------------------------------------------------------

/** Popup → Service Worker: raw voice transcript */
export interface VoiceTranscriptMessage {
  type: 'VOICE_TRANSCRIPT';
  transcript: string;
}

/** Service Worker → Content Script: request current browser state */
export interface ObserveBrowserMessage {
  type: 'OBSERVE_BROWSER';
}

/** Service Worker → Content Script: execute an approved action */
export interface ExecuteActionMessage {
  type: 'EXECUTE_ACTION';
  intent: Intent;
  browserState: BrowserState;
}

/** Service Worker → Popup: response feedback for display and TTS */
export interface ResponseUpdateMessage {
  type: 'RESPONSE_UPDATE';
  payload: ResponseMessage;
}

// ---------------------------------------------------------------------------
// Discriminated union of all messages
// ---------------------------------------------------------------------------

/** Discriminated union covering every message the extension sends */
export type ExtensionMessage =
  | VoiceTranscriptMessage
  | ObserveBrowserMessage
  | ExecuteActionMessage
  | ResponseUpdateMessage;
