---
inclusion: always
---

# Coding Standards

## TypeScript

- Strict mode enabled (`"strict": true` in tsconfig)
- All pipeline data structures must conform to interfaces defined in `src/pipeline/types.ts`
- Use explicit return types on all exported functions
- No `any` types — use `unknown` and narrow with type guards when needed
- Prefer `const` over `let`; never use `var`

## Pipeline Rules

- The `PipelineContext` is the shared data object passed through all six stages — never mutate it outside the orchestrator
- The Ethics Logic Gate (`evaluateEthics`) must remain a **synchronous pure function** — no side effects, no async, no external state
- Ethics rules return `EthicsDecision | null`. Return `null` to indicate "no opinion" (pass to next rule)
- First blocking rule wins — iteration stops on the first "block" decision
- The Safe_Executor must NEVER be called when the ethics decision is "block"
- Action execution has a 3000ms timeout enforced via `Promise.race`

## Chrome Extension Patterns

- Service worker can be terminated at any time — checkpoint state to `chrome.storage.local`
- Content scripts are injected via `chrome.scripting.executeScript` with `activeTab` permission
- Use `chrome.runtime.sendMessage` for popup ↔ service worker communication
- Use `chrome.tabs.sendMessage` for service worker ↔ content script communication
- All storage keys are prefixed with `allvoice_` (e.g., `allvoice_audit_log`, `allvoice_preferences`, `allvoice_pipeline_state`)

## Accessibility Requirements

- High-contrast mode (7:1 ratio) is the DEFAULT — not opt-in
- All interactive elements must have ARIA attributes (`role`, `aria-label`, `aria-live` as appropriate)
- Minimum font sizes: 16px body text, 14px secondary labels
- Focus indicators: 3px outline, 4.5:1 contrast ratio minimum
- Logical tab order, no keyboard traps
- All responses delivered via Chrome TTS AND visual panel simultaneously
- ARIA live regions (`aria-live="assertive"`) for dynamic content updates

## React / UI

- Functional components with hooks only
- Tailwind CSS for styling — use the custom high-contrast theme tokens
- Keep popup components small and focused (VoiceButton, ResponsePanel, AuditLogViewer, EthicsRulesViewer)
- Load user preferences from `chrome.storage.sync` on mount
- Escape key in popup must close it and return focus to the page

## Naming Conventions

- Files: camelCase (e.g., `intentParser.ts`, `ethicsGate.ts`)
- React components: PascalCase (e.g., `VoiceButton.tsx`, `ResponsePanel.tsx`)
- Interfaces: PascalCase, no `I` prefix (e.g., `Intent`, `BrowserState`, `EthicsDecision`)
- Ethics rule IDs: SCREAMING_SNAKE_CASE (e.g., `PRIVACY_SENSITIVE_FIELD`, `SAFETY_UNLABELED_CONTROL`)
- Constants: SCREAMING_SNAKE_CASE
