# Implementation Plan: AllVoice Browser Copilot

## Overview

Hackathon build of a Chrome Extension (Manifest V3) inclusive browser copilot for blind and low-vision users. Six-stage pipeline: Intent_Parser → Browser_Observer → Ethics_Logic_Gate → Safe_Executor → Response_Generator → Audit_Log. Built with TypeScript, React 18, Tailwind CSS, and Vite. The Ethics Logic Gate is the mandatory challenge constraint — it stops the pipeline on privacy violations.

## Tasks

- [x] 1. Project scaffolding and build setup
  - [x] 1.1 Initialize project with package.json, tsconfig.json, Vite config, and Tailwind CSS
    - Create `package.json` with dependencies: react, react-dom, tailwindcss, vite, @crxjs/vite-plugin (or vite-plugin-chrome-extension), typescript
    - Create `tsconfig.json` with strict mode, JSX support, Chrome extension type declarations
    - Create `vite.config.ts` configured for Chrome extension build (CRXJS plugin)
    - Create `tailwind.config.ts` with custom high-contrast theme (7:1 ratio colors)
    - Create `src/styles/globals.css` with Tailwind directives and high-contrast CSS custom properties
    - _Requirements: 10.1, 10.2, 9.1_

  - [x] 1.2 Create manifest.json for Manifest V3
    - Declare permissions: `activeTab`, `tts`, `storage`, `scripting`
    - Configure service worker background script at `src/background/serviceWorker.ts`
    - Configure content script at `src/content/contentScript.ts` matching `<all_urls>`
    - Configure popup at `popup.html`
    - Define keyboard commands: `Alt+Shift+V` (mic toggle), `Alt+Shift+L` (audit log), `Alt+Shift+C` (contrast toggle)
    - Add placeholder icon references (16, 48, 128)
    - _Requirements: 10.1, 10.2, 8.1_

  - [x] 1.3 Create popup.html entry point and placeholder icon files
    - Create `popup.html` that loads the React popup app
    - Create placeholder SVG/PNG icons at `icons/allvoice-16.png`, `icons/allvoice-48.png`, `icons/allvoice-128.png`
    - _Requirements: 10.1_

- [x] 2. Core TypeScript interfaces and types
  - [x] 2.1 Define all shared pipeline interfaces in `src/pipeline/types.ts`
    - `PipelineContext` interface with all six stage fields (timestamp, rawTranscript, intent, browserState, ethicsDecision, executionResult, response)
    - `Intent` interface with action, target, parameters, rawTranscript
    - `ActionType` union type with all 8 action types (describe_screen, add_to_cart, purchase, draft_message, send_message, confirm_pending, click_unlabeled, unrecognized)
    - `BrowserState` interface with url, title, focusedElement, interactiveElements, contextFlags
    - `ElementSummary` interface with tagName, role, ariaLabel, textContent, id, selector, hasAccessibleName, type, autocomplete
    - `EthicsDecision` interface with decision, reason, ruleId, modifiedIntent, privacyViolation
    - `EthicsRule` interface with id, name, description, evaluate function
    - `ExecutionResult` interface with status, details, elementsAffected
    - `ResponseMessage` interface with text, type
    - `AuditLogEntry` interface with id, timestamp, and summaries of each pipeline stage
    - `UserPreferences` interface with highContrastMode, microphoneShortcut, auditLogRetentionDays
    - _Requirements: 12.1, 12.2, 12.3, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_

- [ ] 3. Checkpoint - Verify build and types
  - Ensure the project builds with `npm run build` (or equivalent), all types compile cleanly. Ask the user if questions arise.

- [ ] 4. Ethics Logic Gate — the challenge constraint
  - [ ] 4.1 Implement default ethics rules in `src/pipeline/ethicsRules.ts`
    - `PRIVACY_SENSITIVE_FIELD` rule: blocks actions targeting password fields, payment fields, or fields with autocomplete `cc-number`, `cc-csc`, `new-password`
    - `PRIVACY_PII_SUBMISSION` rule: blocks send_message/confirm_pending when message content matches PII patterns (email, phone, SSN)
    - `SAFETY_UNLABELED_CONTROL` rule: blocks click_unlabeled actions
    - `CONTEXT_RESTRICTED` rule: blocks execution intents on chrome:// and extension:// pages, allows read-only intents
    - Each rule returns `EthicsDecision` with `privacyViolation: true` for privacy rules
    - _Requirements: 4.4, 4.5, 4.6, 4.7, 11.1, 14.1_

  - [ ] 4.2 Implement PII detector utility in `src/utils/piiDetector.ts`
    - `containsPII(text: string): boolean` — checks for email, phone, SSN patterns
    - Export for use by ethics rules and tests
    - _Requirements: 4.6, 14.1_

  - [ ] 4.3 Implement `evaluateEthics()` pure function in `src/pipeline/ethicsGate.ts`
    - Synchronous pure function: `evaluateEthics(intent, browserState, rules?) => EthicsDecision`
    - First blocking rule wins — iterate rules, return first "block" decision
    - Then check for "modify" decisions
    - Default to "allow" if no rules trigger
    - Must complete within 100ms (synchronous, so inherently fast)
    - Attach human-readable reason and ruleId on block/modify
    - Set `privacyViolation: true` when a privacy rule triggers the block
    - Include `findTargetElement` helper for matching intent targets to browser state elements
    - _Requirements: 4.1, 4.2, 4.3, 4.8, 4.9, 4.10, 14.1, 14.2, 14.5_

  - [ ]* 4.4 Write property test: Ethics Gate determinism
    - **Property: Same intent + same browser state + same rules → same decision (determinism)**
    - Generate random Intent and BrowserState objects, verify `evaluateEthics` produces identical output on repeated calls
    - **Validates: Requirements 4.9**

  - [ ]* 4.5 Write property test: Ethics Gate strict halt on privacy violation
    - **Property: Any intent triggering a privacy rule always produces "block" decision, never "allow" or "modify"**
    - Generate intents targeting sensitive fields (password, cc-number, cc-csc, new-password) and verify decision is always "block" with `privacyViolation: true`
    - **Validates: Requirements 14.5, 4.4**

  - [ ]* 4.6 Write unit tests for Ethics Logic Gate
    - Test each default rule individually: sensitive field, PII submission, unlabeled control, restricted context
    - Test that blocked decisions include human-readable reason and ruleId
    - Test that allowed intents pass through cleanly
    - Test privacy_violation_stopped event data structure
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.10, 14.1, 14.2, 14.5_

- [ ] 5. Intent Parser
  - [ ] 5.1 Implement `parseIntent()` in `src/pipeline/intentParser.ts`
    - Keyword-based pattern matching using RegExp rules
    - Support all 7 action types: describe_screen, add_to_cart, purchase, draft_message, send_message, confirm_pending, click_unlabeled
    - Unrecognized transcripts produce `{ action: 'unrecognized', rawTranscript }` intent
    - Extract parameters where applicable (e.g., messageContent for draft_message)
    - Return structured `Intent` object conforming to the TypeScript interface
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 12.1_

  - [ ]* 5.2 Write property test: Intent Parser round-trip consistency
    - **Property: Parsing then serializing then parsing an intent produces an equivalent intent**
    - Generate random transcript strings, parse to intent, serialize to JSON, deserialize, verify equivalence
    - **Validates: Requirements 2.5**

  - [ ]* 5.3 Write unit tests for Intent Parser
    - Test each action type keyword pattern with sample transcripts
    - Test unrecognized transcript handling
    - Test parameter extraction for draft_message
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 6. Browser Observer (content script)
  - [ ] 6.1 Implement `observeBrowser()` in `src/content/browserObserver.ts`
    - Capture active tab URL, page title, focused element, and interactive elements summary
    - Query DOM for interactive elements: `a, button, input, select, textarea, [role="button"], [role="link"], [tabindex]`
    - Build `ElementSummary` for each element (tagName, role, ariaLabel, textContent, id, selector, hasAccessibleName, type, autocomplete)
    - Detect restricted context (chrome://, chrome-extension:// URLs) and set contextFlags
    - Handle inaccessible DOM gracefully (set contextFlags to "inaccessible" with reason)
    - Implement `buildSelector()` helper for generating unique CSS selectors
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 12.2_

- [ ] 7. Pipeline Orchestrator
  - [ ] 7.1 Implement `runPipeline()` in `src/pipeline/orchestrator.ts`
    - Accept transcript, observeBrowser callback, executeAction callback
    - Create initial `PipelineContext` with timestamp and rawTranscript
    - Execute stages in order: parseIntent → observeBrowser → evaluateEthics → (conditional) executeAction → generateResponse → logEntry
    - When ethics decision is "block": skip Safe_Executor, set executionResult to blocked, proceed to response and audit
    - When ethics decision is "modify": pass modifiedIntent to Safe_Executor
    - Enforce 3000ms timeout on action execution using `Promise.race`
    - Return completed PipelineContext
    - _Requirements: 2.4, 3.2, 4.8, 5.1, 5.2, 5.3, 5.6, 6.7, 7.1, 14.1_

- [ ] 8. Safe Executor (content script)
  - [ ] 8.1 Implement `executeAction()` in `src/content/safeExecutor.ts`
    - Switch on intent action type to dispatch to specific handlers
    - `describeScreen`: summarize labeled and unlabeled interactive elements from browserState
    - `clickButton` (add_to_cart, purchase, send_message): find target element by selector or heuristic, call `.click()`
    - `draftMessage`: find text input/textarea, set value, dispatch input event, focus
    - `confirmPending`: placeholder for confirming pending actions
    - Return `ExecutionResult` with status and details for each handler
    - Handle missing elements gracefully with error status
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 13.5, 13.6_

- [ ] 9. Response Generator
  - [ ] 9.1 Implement `generateResponse()` and `deliverResponse()` in `src/pipeline/responseGenerator.ts`
    - `generateResponse(context)`: produce `ResponseMessage` based on ethics decision and execution result
    - Blocked: explain why action was blocked (include ethics reason)
    - Error/timeout: describe failure, suggest retry
    - Success: confirm completed action with details
    - `deliverResponse(response)`: speak via `chrome.tts.speak()` and send to popup via `chrome.runtime.sendMessage`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 14.3_

- [ ] 10. Audit Log
  - [ ] 10.1 Implement `logEntry()` and `getAuditLog()` in `src/pipeline/auditLog.ts`
    - `logEntry(context)`: create `AuditLogEntry` from PipelineContext, persist to `chrome.storage.local` under `allvoice_audit_log` key
    - Store entries newest-first (unshift)
    - Prune entries older than 30 days on each write
    - `getAuditLog()`: retrieve all entries from storage
    - Generate unique ID per entry via `crypto.randomUUID()`
    - Include privacy violation data (ruleId, blocked intent, timestamp) when ethics decision has `privacyViolation: true`
    - _Requirements: 7.1, 7.2, 7.3, 4.10, 14.2_

  - [ ]* 10.2 Write property test: Audit Log round-trip serialization
    - **Property: Serializing an AuditLogEntry to JSON then deserializing produces an equivalent entry**
    - Generate random AuditLogEntry objects, serialize/deserialize, verify equivalence
    - **Validates: Requirements 7.5**

- [ ] 11. Checkpoint - Core pipeline complete
  - Ensure all pipeline stages compile and unit tests pass. Verify the Ethics Logic Gate blocks privacy-violating intents. Ask the user if questions arise.

- [ ] 12. Content Script entry point and message handling
  - [ ] 12.1 Implement `src/content/contentScript.ts`
    - Listen for messages from service worker via `chrome.runtime.onMessage`
    - Handle `OBSERVE_BROWSER` message: call `observeBrowser()`, send response
    - Handle `EXECUTE_ACTION` message: call `executeAction()`, send response
    - _Requirements: 3.1, 5.1, 10.1_

- [ ] 13. Service Worker entry point and message routing
  - [ ] 13.1 Implement `src/background/serviceWorker.ts`
    - Listen for `VOICE_TRANSCRIPT` messages from popup
    - On transcript received: call `runPipeline()` with content script callbacks
    - Implement `observeBrowser` callback: send `OBSERVE_BROWSER` to active tab content script via `chrome.tabs.sendMessage`, return response
    - Implement `executeAction` callback: send `EXECUTE_ACTION` to active tab content script, return response
    - Forward `RESPONSE_UPDATE` messages to popup
    - Handle `chrome.commands.onCommand` for keyboard shortcuts (toggle-microphone, open-audit-log, toggle-contrast)
    - Initialize default settings on install (`chrome.runtime.onInstalled`): high contrast enabled, mic shortcut, 30-day retention
    - Checkpoint pipeline state to `chrome.storage.local` for service worker restart recovery
    - _Requirements: 10.2, 10.3, 10.4, 8.1, 12.4_

- [ ] 14. Voice Capture
  - [ ] 14.1 Implement `createVoiceCapture()` in `src/popup/voiceCapture.ts`
    - Initialize `webkitSpeechRecognition` with `continuous: false`, `interimResults: false`, `lang: 'en-US'`
    - Provide `start()` and `stop()` methods
    - Callbacks: `onTranscript` (sends transcript to service worker), `onError` (announces via TTS, logs to audit), `onStateChange` (updates listening indicator)
    - Handle Web Speech API unavailability gracefully
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [ ] 15. React Popup UI
  - [ ] 15.1 Implement main `Popup.tsx` component
    - Root React component that renders VoiceButton, ResponsePanel, and navigation to AuditLogViewer and EthicsRulesViewer
    - Manage listening state, response messages, and high-contrast mode preference
    - Load preferences from `chrome.storage.sync` on mount
    - Listen for `RESPONSE_UPDATE` messages from service worker
    - Apply high-contrast Tailwind theme classes by default (7:1 ratio)
    - All elements have ARIA attributes, logical tab order, visible focus indicators (3px outline, 4.5:1 contrast)
    - Escape key closes popup and returns focus to page
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4_

  - [ ] 15.2 Implement `VoiceButton.tsx` component
    - Toggle microphone on/off button with high-contrast styling
    - Display visible listening indicator when mic is active
    - Update ARIA live region to announce "listening" / "stopped listening" to screen readers
    - Minimum 16px font, 7:1 contrast ratio
    - _Requirements: 1.1, 1.3, 1.4, 8.2, 8.3_

  - [ ] 15.3 Implement `ResponsePanel.tsx` component
    - Display response messages in high-contrast panel (min 16px font, 7:1 contrast)
    - Color-code by response type: success (green), blocked (red/orange), error (red), info (blue) — all meeting contrast requirements
    - Update ARIA live region (`aria-live="assertive"`) so screen readers announce responses without focus change
    - _Requirements: 6.5, 6.6, 9.1, 9.3_

  - [ ] 15.4 Implement `AuditLogViewer.tsx` component
    - Fetch audit log entries via `getAuditLog()`
    - Display as accessible list sorted newest-first
    - Each entry shows: timestamp, action, ethics decision, result summary
    - Highlight privacy violation entries
    - Screen-reader compatible with ARIA attributes (role="list", role="listitem")
    - _Requirements: 7.4, 8.3_

  - [ ] 15.5 Create `src/styles/globals.css` with Tailwind high-contrast theme
    - Define high-contrast color palette (foreground/background 7:1+ ratio)
    - Define standard theme (4.5:1 minimum ratio) for when high contrast is toggled off
    - Minimum font sizes: 16px body, 14px secondary labels
    - Focus indicator styles: 3px outline, 4.5:1 contrast
    - _Requirements: 9.1, 9.2, 9.3, 8.2_

- [ ] 16. Demo Pages
  - [ ] 16.1 Create `demo/product.html`
    - Include "Add to Cart" button (`id="add-to-cart"`)
    - Include "Buy Now" button (`id="buy-now"`)
    - Include mystery button (`id="mystery-btn"`) with no text, no aria-label, no title — the unlabeled control
    - Include a password field to demonstrate sensitive field blocking
    - Basic page styling for demo presentation
    - _Requirements: 13.1, 13.3, 13.4_

  - [ ] 16.2 Create `demo/chat.html`
    - Include chat composer input field (`id="chat-composer"`, `type="text"`)
    - Include "Send" button (`id="send-btn"`)
    - Basic page styling for demo presentation
    - _Requirements: 13.2, 13.5, 13.6_

- [ ] 17. Checkpoint - Full extension functional
  - Ensure the extension builds, loads in Chrome, and the demo pages work with voice commands. Verify the Ethics Logic Gate blocks privacy-violating intents on demo pages and the audit log records violations. Ask the user if questions arise.

- [ ] 18. Ethics Rules Viewer
  - [ ] 18.1 Implement `EthicsRulesViewer.tsx` component
    - Display all active ethics rules in an accessible list
    - Each rule shows: name, description, status (active)
    - Screen-reader compatible with ARIA attributes
    - Accessible via keyboard shortcut or voice command "show ethics rules"
    - _Requirements: 11.1, 11.2, 11.3_

- [ ] 19. Pipeline Context serialization validation
  - [ ]* 19.1 Write property test: PipelineContext round-trip serialization
    - **Property: Serializing PipelineContext to JSON then deserializing produces an equivalent object**
    - Generate random PipelineContext objects with all fields populated, serialize/deserialize, verify deep equality
    - **Validates: Requirements 12.3**

  - [ ] 19.2 Implement malformed PipelineContext rejection
    - Each pipeline stage validates incoming PipelineContext structure
    - Reject malformed context with descriptive error and log rejection to Audit_Log
    - _Requirements: 12.4_

- [ ] 20. Keyboard shortcuts and accessibility polish
  - [ ] 20.1 Wire keyboard shortcuts in service worker
    - `Alt+Shift+V`: toggle microphone (send message to popup)
    - `Alt+Shift+L`: open audit log view
    - `Alt+Shift+C`: toggle high-contrast mode (persist to `chrome.storage.sync`)
    - Escape key handling in popup (close and return focus)
    - _Requirements: 8.1, 8.4, 8.5, 9.4_

  - [ ] 20.2 Accessibility audit pass on all UI components
    - Verify all interactive elements have visible focus indicators (3px outline, 4.5:1 contrast)
    - Verify all elements have appropriate ARIA attributes (role, label, live region)
    - Verify logical tab order with no keyboard traps
    - Verify minimum font sizes (16px body, 14px labels)
    - _Requirements: 8.2, 8.3, 8.4, 9.1, 9.2, 9.3_

- [ ]* 21. Real-world page support architecture
  - [ ]* 21.1 Ensure pipeline works on real-world pages beyond demo pages
    - Verify content script injection works on standard HTML pages with common frameworks
    - Test Browser Observer on pages with ARIA attributes and standard interactive elements
    - _Requirements: 15.1, 15.2_

  - [ ]* 21.2 Architect pipeline for future contextual assistance capabilities
    - Ensure Browser Observer can detect multiple unlabeled controls and report positions
    - Ensure pipeline architecture supports future additions: contextual suggestions, multi-step tasks, page summaries
    - Document extension points in code comments
    - _Requirements: 15.3, 15.4, 15.5_

- [ ] 22. Final checkpoint - Complete build verification
  - Ensure all tests pass, the extension loads in Chrome, demo pages demonstrate the Ethics Logic Gate privacy stop, audit log records all pipeline invocations, and all UI is accessible. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The Ethics Logic Gate (task 4) is prioritized immediately after scaffolding — it's the mandatory challenge constraint
- Property tests validate round-trip serialization and ethics gate determinism from the requirements
- Demo pages (task 16) are placed after core pipeline to enable end-to-end testing
- Task 21 covers Requirement 15's "designed for / architected to support" items — these are stretch goals for the hackathon
- Each task references specific requirements for traceability
