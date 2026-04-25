/**
 * Browser Observer — Stage 2 of the AllVoice pipeline (content script).
 *
 * Captures the active tab's DOM state: URL, title, focused element,
 * interactive elements, and context flags. Runs inside the content script
 * context and sends the result back to the service worker.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 12.2
 */

import type { BrowserState, ElementSummary } from '../pipeline/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** CSS selector for all interactive elements we care about */
const INTERACTIVE_SELECTORS =
  'a, button, input, select, textarea, [role="button"], [role="link"], [tabindex]';

/** Maximum length of textContent we capture per element */
const MAX_TEXT_LENGTH = 100;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a unique CSS selector for the given element.
 * Prefers #id, then falls back to a parent-relative path with :nth-of-type.
 */
export function buildSelector(el: Element): string {
  if (el.id) return `#${el.id}`;

  const tag = el.tagName.toLowerCase();
  const parent = el.parentElement;
  if (!parent) return tag;

  const siblings = Array.from(parent.children).filter(
    (c) => c.tagName === el.tagName,
  );

  if (siblings.length === 1) {
    return `${buildSelector(parent)} > ${tag}`;
  }

  const index = siblings.indexOf(el) + 1;
  return `${buildSelector(parent)} > ${tag}:nth-of-type(${index})`;
}

/**
 * Determines whether an element has an accessible name via aria-label,
 * aria-labelledby, or visible text content.
 */
function hasAccessibleName(el: Element): boolean {
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim().length > 0) return true;

  const ariaLabelledBy = el.getAttribute('aria-labelledby');
  if (ariaLabelledBy && ariaLabelledBy.trim().length > 0) return true;

  const text = (el as HTMLElement).textContent ?? '';
  return text.trim().length > 0;
}

/**
 * Builds an ElementSummary for a single interactive DOM element.
 */
function summarizeElement(el: Element): ElementSummary {
  const htmlEl = el as HTMLElement;
  const inputEl = el as HTMLInputElement;

  return {
    tagName: el.tagName.toLowerCase(),
    role: el.getAttribute('role'),
    ariaLabel: el.getAttribute('aria-label'),
    textContent: (htmlEl.textContent ?? '').trim().slice(0, MAX_TEXT_LENGTH),
    id: el.id || null,
    selector: buildSelector(el),
    hasAccessibleName: hasAccessibleName(el),
    type: inputEl.type || undefined,
    autocomplete: el.getAttribute('autocomplete') || undefined,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Observes the current browser/page state and returns a BrowserState snapshot.
 *
 * Captures:
 *   - Active tab URL and page title
 *   - All interactive elements with accessibility metadata
 *   - Currently focused element (if any)
 *   - Context flags (restricted-context for chrome:// pages, inaccessible on error)
 *
 * @returns A BrowserState snapshot of the current page
 */
export function observeBrowser(): BrowserState {
  const url = window.location.href;
  const contextFlags: BrowserState['contextFlags'] = [];

  // Detect restricted contexts (chrome:// and chrome-extension:// pages)
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    contextFlags.push('restricted-context');
  }

  let interactiveElements: ElementSummary[] = [];

  try {
    const elements = Array.from(
      document.querySelectorAll(INTERACTIVE_SELECTORS),
    );
    interactiveElements = elements.map(summarizeElement);
  } catch {
    // DOM may be inaccessible (e.g., cross-origin iframe, sandboxed page)
    contextFlags.push('inaccessible');
  }

  // Find the currently focused element in our interactive elements list
  let focusedElement: ElementSummary | null = null;
  const focused = document.activeElement;
  if (focused && focused !== document.body && focused !== document.documentElement) {
    try {
      const focusedSelector = buildSelector(focused);
      focusedElement =
        interactiveElements.find((e) => e.selector === focusedSelector) ?? null;
    } catch {
      // If we can't build a selector for the focused element, skip it
    }
  }

  return {
    url,
    title: document.title,
    focusedElement,
    interactiveElements,
    contextFlags,
  };
}
