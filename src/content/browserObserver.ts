/**
 * Browser Observer — captures DOM state from the active tab.
 *
 * STUB: This is a minimal placeholder so the content script compiles.
 * Full implementation is in Task 6.
 */

import type { BrowserState } from '../pipeline/types';

/**
 * Observes the current browser/page state and returns a BrowserState snapshot.
 * Stub returns a minimal valid BrowserState.
 */
export function observeBrowser(): BrowserState {
  return {
    url: window.location.href,
    title: document.title,
    focusedElement: null,
    interactiveElements: [],
    contextFlags: [],
  };
}
