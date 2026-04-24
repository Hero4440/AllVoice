/**
 * Content Script entry point — injected into every tab.
 *
 * Listens for messages from the service worker and dispatches to:
 *  - Browser Observer  (OBSERVE_BROWSER)
 *  - Safe Executor     (EXECUTE_ACTION)
 *
 * Returns `true` from the onMessage listener to signal an async
 * sendResponse when the handler needs it.
 */

import type { ExtensionMessage } from '../messages';
import type { BrowserState, ExecutionResult } from '../pipeline/types';
import { observeBrowser } from './browserObserver';
import { executeAction } from './safeExecutor';

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: BrowserState | ExecutionResult) => void,
  ): boolean => {
    switch (message.type) {
      case 'OBSERVE_BROWSER': {
        const browserState: BrowserState = observeBrowser();
        sendResponse(browserState);
        return false; // synchronous response
      }

      case 'EXECUTE_ACTION': {
        const result: ExecutionResult = executeAction(
          message.intent,
          message.browserState,
        );
        sendResponse(result);
        return false; // synchronous response
      }

      default:
        // Message not handled by this content script — ignore.
        return false;
    }
  },
);
