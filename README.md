# 🎙️ AllVoice Browser Copilot

**An inclusive voice-controlled browser assistant for blind and low-vision users — with a mandatory ethics gate that stops privacy violations before they happen.**

Built for the [Kiro Spark Challenge](https://asuevents.asu.edu/event/plan-build-win-kiro-spark-challenge-april-24) · Ethics Frame · Arizona State University

![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![Tests](https://img.shields.io/badge/tests-103%20passing-brightgreen)
![Chrome MV3](https://img.shields.io/badge/Chrome-Manifest%20V3-yellow)
![Contrast](https://img.shields.io/badge/contrast-7%3A1%20WCAG%20AAA-purple)

---

## The Problem

2.2 billion people worldwide live with vision impairments. For them, the web is a maze of unlabeled buttons, hidden forms, and invisible privacy traps. Voice assistants that interact with pages can accidentally expose passwords, payment data, and personal information — with no safeguard to stop unsafe actions before they execute.

## The Solution

AllVoice is a Chrome Extension voice copilot where every command flows through a **six-stage pipeline** with a **mandatory Ethics Logic Gate** — a pure, deterministic function that evaluates every action against five privacy and safety rules before anything touches the page. If it's unsafe, the action never happens.

---

## Architecture

```
Voice Command → Intent Parser → Browser Observer → Ethics Logic Gate → Safe Executor → Response Generator → Audit Log
                                                          │
                                                    ❌ BLOCK
                                              (pipeline halts)
```

| Context | Runs | Responsibilities |
|---|---|---|
| **Popup** | Extension popup | Voice capture (Web Speech API), React UI, response display |
| **Service Worker** | Background | Pipeline orchestration, ethics gate, response generation, audit log |
| **Content Script** | Active tab | DOM observation, safe action execution |

## Six Pipeline Stages

| # | Stage | Description |
|---|---|---|
| 1 | **Intent Parser** | Keyword pattern matching + Claude AI fallback → structured Intent |
| 2 | **Browser Observer** | Captures DOM state, interactive elements, accessibility info |
| 3 | **🛡️ Ethics Logic Gate** | **MANDATORY** — pure synchronous function, evaluates 5 rules, blocks privacy violations |
| 4 | **Safe Executor** | Clicks buttons, fills forms, navigates — only runs if ethics gate allows |
| 5 | **Response Generator** | Chrome TTS (spoken) + high-contrast visual panel, Claude AI for natural responses |
| 6 | **Audit Log** | Every invocation persisted to chrome.storage.local as structured JSON |

## Ethics Rules (The Challenge Constraint)

The Ethics Logic Gate is a **synchronous pure function** — same inputs always produce the same output. It cannot be bypassed.

| Rule | Type | What It Blocks |
|---|---|---|
| `PRIVACY_SENSITIVE_FIELD` | Privacy | Actions on password, cc-number, cc-csc, new-password fields |
| `PRIVACY_PII_SUBMISSION` | Privacy | Messages containing email, phone, or SSN patterns |
| `PRIVACY_FORM_AUTOFILL` | Privacy | Autofill of sensitive form fields |
| `SAFETY_UNLABELED_CONTROL` | Safety | Clicks on controls with no accessible name |
| `CONTEXT_RESTRICTED` | Safety | Execution on chrome:// and extension:// pages |

---

## Quick Start

### Prerequisites
- Node.js 18+
- Google Chrome

### Build
```bash
npm install
npm run build
```

### Load in Chrome
1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist/` folder

### Run Tests
```bash
npm test
```

### Demo Store
```bash
npx serve demo/store
```
Open `http://localhost:3000/` in Chrome.

---

## Voice Commands

| Command | Action |
|---|---|
| "What's on this page?" | Accessibility audit of all interactive elements |
| "Add to cart" | Clicks the Add to Cart button |
| "Tell me about the headset" | Navigates to product detail page |
| "Go to cart" | Navigates to cart page |
| "Checkout" | Proceeds to checkout |
| "Search for school backpack" | Opens Amazon search results |
| "Open Amazon" | Opens amazon.com in a new tab |
| "Meet AllVoice" | Speaks a hardcoded introduction |
| "Go back" | Returns to previous page |

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Alt+Shift+M` | Open AllVoice popup |
| `Alt+Shift+V` | Toggle microphone |
| `Alt+Shift+L` | Open audit log |
| `Alt+Shift+C` | Toggle high contrast mode |
| `Escape` | Close popup, return focus to page |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (strict mode) |
| UI | React 18 |
| Styling | Tailwind CSS (custom high-contrast theme) |
| Build | Vite + CRXJS |
| Extension | Chrome Manifest V3 |
| Voice Input | Web Speech API |
| Voice Output | Chrome TTS API |
| AI | Claude API (intent parsing + response generation) |
| Testing | Vitest (103 tests) |

---

## Project Structure

```
AllVoice/
├── .kiro/
│   ├── specs/allvoice-browser-copilot/    # Requirements, design, tasks
│   ├── steering/                          # 5 steering files
│   └── hooks/                             # 8 agent hooks
├── src/
│   ├── pipeline/
│   │   ├── types.ts                       # Shared pipeline interfaces
│   │   ├── intentParser.ts                # Stage 1: keyword + Claude AI parsing
│   │   ├── ethicsGate.ts                  # Stage 3: mandatory ethics evaluation
│   │   ├── ethicsRules.ts                 # 5 ethics rules
│   │   ├── orchestrator.ts                # Pipeline coordinator
│   │   ├── responseGenerator.ts           # Stage 5: TTS + visual responses
│   │   ├── auditLog.ts                    # Stage 6: structured logging
│   │   └── contextValidator.ts            # Pipeline context validation
│   ├── content/
│   │   ├── browserObserver.ts             # Stage 2: DOM state capture
│   │   ├── safeExecutor.ts                # Stage 4: action execution
│   │   └── contentScript.ts               # Content script entry point
│   ├── background/
│   │   └── serviceWorker.ts               # Service worker entry point
│   ├── popup/
│   │   ├── Popup.tsx                      # Root React component
│   │   ├── voiceCapture.ts                # Web Speech API wrapper
│   │   └── components/                    # VoiceButton, ResponsePanel, etc.
│   └── utils/
│       ├── claudeApi.ts                   # Claude API wrapper
│       └── piiDetector.ts                 # PII pattern detection
├── demo/
│   ├── store/                             # Amazon-style demo store
│   ├── product.html                       # Product demo page
│   ├── chat.html                          # Chat demo page
│   └── architecture.html                  # Architecture diagram
├── tests/unit/                            # 103 unit tests
└── manifest.json                          # Chrome MV3 manifest
```

---

## Kiro Development Workflow

### Spec-Driven Development
- `requirements.md` — 40+ formal requirements with unique IDs
- `design.md` — TypeScript interfaces, Mermaid diagrams, component communication map
- `tasks.md` — 22 task groups tracing back to requirement IDs

### Steering Files (5)
| File | Inclusion | Purpose |
|---|---|---|
| `project-overview.md` | Always | Architecture context, challenge constraint |
| `coding-standards.md` | Always | TypeScript strict, no `any`, ARIA, naming conventions |
| `ethics-gate-guide.md` | Conditional | Ethics evaluation order, rule table, PII patterns |
| `accessibility-checklist.md` | Conditional | 7:1 contrast, focus indicators, ARIA live regions |
| `build-and-test.md` | Manual | Build commands, test commands, verification steps |

### Agent Hooks (8)
| Hook | Trigger | Action |
|---|---|---|
| typecheck-on-save | .ts/.tsx save | `tsc --noEmit` |
| build-after-task | Spec task complete | Full build |
| ethics-gate-review | Ethics file edit | Verify privacy rules still block |
| pipeline-types-guard | types.ts edit | Verify all stages conform |
| a11y-check-components | .tsx save | ARIA, contrast, focus audit |
| auto-code-review | Any source save | Code smells, security, conventions |
| spec-test-generator | Spec task complete | Generate missing unit tests |
| manifest-validation | manifest.json edit | MV3 compliance check |

---

## Accessibility

AllVoice is built for blind and low-vision users. Accessibility is the default, not an option.

- ✅ High-contrast mode (7:1 ratio) ships ON by default
- ✅ All interactive elements have ARIA attributes
- ✅ Every response delivered via Chrome TTS AND visual panel simultaneously
- ✅ Minimum 16px body text, 14px labels
- ✅ 3px focus indicators with 4.5:1 contrast
- ✅ Logical tab order, zero keyboard traps
- ✅ ARIA live regions for dynamic content
- ✅ Escape key closes popup and returns focus to page

---

## Team

- **Aman** — Pipeline architecture, orchestration, Kiro workflow
- **Tejas** — Ethics gate, safety rules, testing
- **Arnav** — UI/accessibility, demo store, voice navigation

---

## License

MIT

---

*Built with [Kiro IDE](https://kiro.dev) for the Kiro Spark Challenge at Arizona State University.*
