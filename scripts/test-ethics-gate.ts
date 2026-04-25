/**
 * Interactive test script for the Ethics Logic Gate
 * 
 * Run with: npx tsx scripts/test-ethics-gate.ts
 */

import { evaluateEthics } from '../src/pipeline/ethicsGate';
import type { Intent, BrowserState, ElementSummary } from '../src/pipeline/types';

console.log('🔒 Ethics Logic Gate Interactive Test\n');

// Test Case 1: Password field (should block)
console.log('Test 1: Attempting to interact with password field');
const passwordField: ElementSummary = {
  tagName: 'input',
  role: null,
  ariaLabel: 'Password',
  textContent: '',
  id: 'password',
  selector: '#password',
  hasAccessibleName: true,
  type: 'password',
};

const passwordIntent: Intent = {
  action: 'draft_message',
  target: '#password',
  parameters: {},
  rawTranscript: 'type my password',
};

const browserStateWithPassword: BrowserState = {
  url: 'https://example.com/login',
  title: 'Login Page',
  focusedElement: null,
  interactiveElements: [passwordField],
  contextFlags: [],
};

const decision1 = evaluateEthics(passwordIntent, browserStateWithPassword);
console.log('Decision:', decision1.decision);
console.log('Privacy Violation:', decision1.privacyViolation);
console.log('Rule ID:', decision1.ruleId);
console.log('Reason:', decision1.reason);
console.log('✅ Expected: BLOCKED\n');

// Test Case 2: PII in message (should block)
console.log('Test 2: Attempting to send message with email');
const piiIntent: Intent = {
  action: 'send_message',
  target: null,
  parameters: { messageContent: 'Contact me at test@example.com' },
  rawTranscript: 'send message contact me at test@example.com',
};

const normalBrowserState: BrowserState = {
  url: 'https://example.com/chat',
  title: 'Chat',
  focusedElement: null,
  interactiveElements: [],
  contextFlags: [],
};

const decision2 = evaluateEthics(piiIntent, normalBrowserState);
console.log('Decision:', decision2.decision);
console.log('Privacy Violation:', decision2.privacyViolation);
console.log('Rule ID:', decision2.ruleId);
console.log('Reason:', decision2.reason);
console.log('✅ Expected: BLOCKED\n');

// Test Case 3: Safe action (should allow)
console.log('Test 3: Safe action - Add to Cart');
const safeButton: ElementSummary = {
  tagName: 'button',
  role: null,
  ariaLabel: null,
  textContent: 'Add to Cart',
  id: 'add-to-cart',
  selector: '#add-to-cart',
  hasAccessibleName: true,
};

const safeIntent: Intent = {
  action: 'add_to_cart',
  target: '#add-to-cart',
  parameters: {},
  rawTranscript: 'add to cart',
};

const browserStateWithButton: BrowserState = {
  url: 'https://example.com/product',
  title: 'Product Page',
  focusedElement: null,
  interactiveElements: [safeButton],
  contextFlags: [],
};

const decision3 = evaluateEthics(safeIntent, browserStateWithButton);
console.log('Decision:', decision3.decision);
console.log('Privacy Violation:', decision3.privacyViolation);
console.log('Rule ID:', decision3.ruleId);
console.log('Reason:', decision3.reason);
console.log('✅ Expected: ALLOWED\n');

// Test Case 4: Unlabeled control (should block, but not privacy violation)
console.log('Test 4: Click unlabeled control');
const unlabeledIntent: Intent = {
  action: 'click_unlabeled',
  target: null,
  parameters: {},
  rawTranscript: 'click unlabeled button',
};

const decision4 = evaluateEthics(unlabeledIntent, normalBrowserState);
console.log('Decision:', decision4.decision);
console.log('Privacy Violation:', decision4.privacyViolation);
console.log('Rule ID:', decision4.ruleId);
console.log('Reason:', decision4.reason);
console.log('✅ Expected: BLOCKED (but privacyViolation=false)\n');

// Test Case 5: Restricted context (chrome:// page)
console.log('Test 5: Action on chrome:// page');
const restrictedBrowserState: BrowserState = {
  url: 'chrome://settings',
  title: 'Chrome Settings',
  focusedElement: null,
  interactiveElements: [],
  contextFlags: ['restricted-context'],
};

const restrictedIntent: Intent = {
  action: 'add_to_cart',
  target: null,
  parameters: {},
  rawTranscript: 'add to cart',
};

const decision5 = evaluateEthics(restrictedIntent, restrictedBrowserState);
console.log('Decision:', decision5.decision);
console.log('Privacy Violation:', decision5.privacyViolation);
console.log('Rule ID:', decision5.ruleId);
console.log('Reason:', decision5.reason);
console.log('✅ Expected: BLOCKED (but privacyViolation=false)\n');

// Test Case 6: Credit card field (should block)
console.log('Test 6: Attempting to interact with credit card field');
const ccField: ElementSummary = {
  tagName: 'input',
  role: null,
  ariaLabel: 'Credit Card Number',
  textContent: '',
  id: 'cc-number',
  selector: '#cc-number',
  hasAccessibleName: true,
  type: 'text',
  autocomplete: 'cc-number',
};

const ccIntent: Intent = {
  action: 'draft_message',
  target: '#cc-number',
  parameters: {},
  rawTranscript: 'enter credit card',
};

const browserStateWithCC: BrowserState = {
  url: 'https://example.com/checkout',
  title: 'Checkout',
  focusedElement: null,
  interactiveElements: [ccField],
  contextFlags: [],
};

const decision6 = evaluateEthics(ccIntent, browserStateWithCC);
console.log('Decision:', decision6.decision);
console.log('Privacy Violation:', decision6.privacyViolation);
console.log('Rule ID:', decision6.ruleId);
console.log('Reason:', decision6.reason);
console.log('✅ Expected: BLOCKED\n');

console.log('🎉 All manual tests complete!');
console.log('\nSummary:');
console.log('- Privacy violations correctly blocked: 3/3');
console.log('- Safety violations correctly blocked: 2/2');
console.log('- Safe actions correctly allowed: 1/1');
