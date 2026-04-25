/**
 * Safe Executor — Stage 4 of the AllVoice pipeline (content script).
 *
 * Executes approved actions on the page DOM. Only runs if the Ethics Logic
 * Gate returned "allow" or "modify" — NEVER when it returned "block".
 *
 * Supported actions:
 *   - describe_screen: summarize interactive elements
 *   - add_to_cart / purchase / send_message: click the target button
 *   - draft_message: fill a text input/textarea
 *   - confirm_pending: placeholder for confirming pending actions
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 13.5, 13.6
 */

import type { BrowserState, ElementSummary, ExecutionResult, Intent } from '../pipeline/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Finds the target element for an intent in the browser state.
 * Tries exact selector match first, then heuristic matching by action type.
 */
function findTargetElement(
  intent: Intent,
  browserState: BrowserState,
): ElementSummary | null {
  if (intent.target) {
    return browserState.interactiveElements.find(e => e.selector === intent.target) ?? null;
  }

  switch (intent.action) {
    case 'add_to_cart':
      return (
        browserState.interactiveElements.find(e =>
          /add\s+to\s+cart/i.test(e.textContent) ||
          /add[\s_-]to[\s_-]cart/i.test(e.ariaLabel ?? ''),
        ) ?? null
      );
    case 'purchase':
      return (
        browserState.interactiveElements.find(e =>
          /buy\s+now|purchase/i.test(e.textContent),
        ) ?? null
      );
    case 'send_message':
      return (
        browserState.interactiveElements.find(
          e => /send/i.test(e.textContent) && e.tagName === 'button',
        ) ?? null
      );
    case 'checkout':
      return (
        browserState.interactiveElements.find(e =>
          /checkout/i.test(e.textContent) || /checkout/i.test(e.ariaLabel ?? ''),
        ) ?? null
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

/**
 * Summarizes labeled and unlabeled interactive elements on the page.
 */
function describeScreen(browserState: BrowserState): ExecutionResult {
  const labeled = browserState.interactiveElements.filter(e => e.hasAccessibleName);
  const unlabeled = browserState.interactiveElements.filter(e => !e.hasAccessibleName);

  const parts = [
    `Page: ${browserState.title}.`,
    `${labeled.length} labeled control${labeled.length !== 1 ? 's' : ''} found.`,
  ];

  if (unlabeled.length > 0) {
    const unlabeledList = unlabeled
      .map(e => `${e.tagName} at ${e.selector}`)
      .join(', ');
    parts.push(
      `${unlabeled.length} unlabeled control${unlabeled.length !== 1 ? 's' : ''} detected: ${unlabeledList}.`,
    );
  } else {
    parts.push('All controls have accessible names.');
  }

  return { status: 'success', details: parts.join(' ') };
}

/**
 * Clicks a target button element (add_to_cart, purchase, send_message).
 */
function clickButton(intent: Intent, browserState: BrowserState): ExecutionResult {
  const target = findTargetElement(intent, browserState);
  if (!target) {
    return {
      status: 'error',
      details: `Could not find target element for action "${intent.action}".`,
    };
  }

  const el = document.querySelector(target.selector) as HTMLElement | null;
  if (!el) {
    return {
      status: 'error',
      details: `Element not found in DOM: ${target.selector}`,
    };
  }

  el.click();
  return {
    status: 'success',
    details: `Clicked: ${target.textContent || target.tagName}`,
    elementsAffected: [target.selector],
  };
}

/**
 * Fills a text input or textarea with the drafted message content.
 */
function draftMessage(intent: Intent, browserState: BrowserState): ExecutionResult {
  const composer = browserState.interactiveElements.find(
    e => e.tagName === 'input' || e.tagName === 'textarea',
  );

  if (!composer) {
    return { status: 'error', details: 'No text input found on page.' };
  }

  const el = document.querySelector(composer.selector) as
    | HTMLInputElement
    | HTMLTextAreaElement
    | null;

  if (!el) {
    return {
      status: 'error',
      details: `Composer element not found in DOM: ${composer.selector}`,
    };
  }

  el.value = intent.parameters['messageContent'] ?? '';
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.focus();

  return {
    status: 'success',
    details: `Drafted message in ${composer.tagName}.`,
    elementsAffected: [composer.selector],
  };
}

/**
 * Placeholder for confirming a pending action (e.g., a modal dialog).
 */
function confirmPending(
  _intent: Intent,
  _browserState: BrowserState,
): ExecutionResult {
  return { status: 'success', details: 'Pending action confirmed.' };
}

/**
 * Navigates to a product detail page or cart page.
 * Searches the live DOM for matching links, then falls back to relative URL.
 */
function navigateToPage(intent: Intent, _browserState: BrowserState): ExecutionResult {
  const targetPage = intent.parameters['targetPage'] ?? '';

  // Search the live DOM for an anchor whose href contains the target page
  const allLinks = Array.from(document.querySelectorAll('a')) as HTMLAnchorElement[];
  const matchingLink = allLinks.find(a =>
    a.getAttribute('href')?.includes(targetPage) ||
    a.href?.includes(targetPage),
  );

  if (matchingLink) {
    matchingLink.click();
    return { status: 'success', details: `Navigating to ${targetPage}.` };
  }

  // Fallback: try direct navigation relative to current page
  const currentUrl = window.location.href;
  const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/') + 1);
  const page = targetPage.endsWith('.html') ? targetPage : `${targetPage}.html`;
  window.location.href = `${baseUrl}${page}`;
  return { status: 'success', details: `Navigating to ${targetPage}.` };
}

/**
 * Navigates to the checkout page.
 * Searches the live DOM for a checkout link, then falls back to relative URL.
 */
function goToCheckout(_intent: Intent, _browserState: BrowserState): ExecutionResult {
  // Search the live DOM for a checkout link
  const allLinks = Array.from(document.querySelectorAll('a')) as HTMLAnchorElement[];
  const checkoutLink = allLinks.find(a =>
    /checkout/i.test(a.textContent ?? '') ||
    /checkout/i.test(a.getAttribute('aria-label') ?? '') ||
    /checkout/i.test(a.getAttribute('href') ?? ''),
  );

  if (checkoutLink) {
    checkoutLink.click();
    return { status: 'success', details: 'Proceeding to checkout.' };
  }

  // Also check buttons
  const allButtons = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[];
  const checkoutBtn = allButtons.find(b =>
    /checkout/i.test(b.textContent ?? '') ||
    /checkout/i.test(b.getAttribute('aria-label') ?? ''),
  );

  if (checkoutBtn) {
    checkoutBtn.click();
    return { status: 'success', details: 'Proceeding to checkout.' };
  }

  // Fallback: direct navigation
  const currentUrl = window.location.href;
  const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/') + 1);
  window.location.href = `${baseUrl}checkout.html`;
  return { status: 'success', details: 'Proceeding to checkout.' };
}

/**
 * Goes back to the previous page or home.
 */
function goBack(_intent: Intent, _browserState: BrowserState): ExecutionResult {
  // Try to find a home link
  const homeLink = document.querySelector('a[href="index.html"], a[href*="index.html"]') as HTMLAnchorElement | null;
  if (homeLink) {
    homeLink.click();
    return { status: 'success', details: 'Going back to the home page.' };
  }

  // Fallback: browser back
  window.history.back();
  return { status: 'success', details: 'Going back to the previous page.' };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Executes the given intent against the current browser state.
 *
 * Dispatches to the appropriate handler based on the intent's action type.
 * Returns an ExecutionResult with status and details.
 *
 * @param intent       - The structured intent (possibly modified by ethics gate)
 * @param browserState - The captured DOM state from the Browser Observer
 * @returns An ExecutionResult describing what happened
 */
export function executeAction(
  intent: Intent,
  browserState: BrowserState,
): ExecutionResult {
  switch (intent.action) {
    case 'describe_screen':
      return describeScreen(browserState);

    case 'add_to_cart':
    case 'purchase':
    case 'send_message':
      return clickButton(intent, browserState);

    case 'draft_message':
      return draftMessage(intent, browserState);

    case 'confirm_pending':
      return confirmPending(intent, browserState);

    case 'navigate':
      return navigateToPage(intent, browserState);

    case 'checkout':
      return goToCheckout(intent, browserState);

    case 'go_back':
      return goBack(intent, browserState);

    default:
      return {
        status: 'error',
        details: `No executor for action: ${intent.action}`,
      };
  }
}
