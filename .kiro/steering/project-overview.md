---
inclusion: always
---

# AllVoice Browser Copilot — Project Overview

AllVoice is a Chrome Extension (Manifest V3) inclusive browser copilot for blind and low-vision users, built for the Kiro Spark Challenge (Ethics frame, Inclusion Guardrail).

## Core Architecture

A six-stage linear pipeline processes voice commands:

1. **Intent_Parser** — keyword-based pattern matching, maps transcripts to structured `Intent` objects
2. **Browser_Observer** — content script that captures DOM state (interactive elements, accessibility info)
3. **Ethics_Logic_Gate** — synchronous pure function that evaluates intents against ethics rules. MANDATORY — cannot be bypassed
4. **Safe_Executor** — executes approved actions on the page DOM. Only runs if ethics gate returns "allow" or "modify"
5. **Response_Generator** — produces spoken (Chrome TTS) and visual (high-contrast panel) feedback
6. **Audit_Log** — persists every pipeline invocation to `chrome.storage.local` as structured JSON

## Tech Stack

- TypeScript (strict mode)
- React 18 (popup UI)
- Tailwind CSS (custom high-contrast theme)
- Vite + CRXJS plugin (build)
- Chrome Manifest V3 (service worker, content scripts)
- Web Speech API (voice input), Chrome TTS API (voice output)

## Extension Architecture Split

| Context | Runs | Responsibilities |
|---|---|---|
| Service Worker | Background | Pipeline orchestration, ethics gate, response generation, audit log, state checkpoint |
| Content Script | Active tab | Browser observation (DOM), safe action execution |
| Popup | Extension popup | Voice capture (Web Speech API), React UI, response display |

Communication uses `chrome.runtime.sendMessage` (popup ↔ service worker) and `chrome.tabs.sendMessage` (service worker ↔ content script).

## The Challenge Constraint

The Ethics Logic Gate is the mandatory Kiro Spark Challenge constraint. It **stops the pipeline** when a privacy rule is violated. The `evaluateEthics()` function is a pure, deterministic function — same inputs always produce the same output. If it returns "block", the Safe_Executor is never called.

## Key File Locations

Refer to #[[file:.kiro/specs/allvoice-browser-copilot/design.md]] for full component designs and interfaces.
Refer to #[[file:.kiro/specs/allvoice-browser-copilot/tasks.md]] for the implementation plan.
