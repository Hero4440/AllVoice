---
inclusion: manual
---

# Build, Test, and Load Instructions

## Build

```bash
npm install
npm run build
```

The Vite + CRXJS plugin outputs a built extension to the `dist/` folder.

## Load in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist/` folder

## Test

```bash
# Run all tests
npm test

# Run unit tests only
npm test -- tests/unit/

# Run property tests only
npm test -- tests/property/

# Run a specific test file
npm test -- tests/unit/ethicsGate.test.ts
```

## Demo Pages

After loading the extension in Chrome:
- Open `demo/product.html` (can be opened as a local file or served)
- Open `demo/chat.html`

These pages provide controlled environments for testing voice commands and the Ethics Logic Gate.

## Key Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Alt+Shift+V` | Toggle microphone |
| `Alt+Shift+L` | Open audit log |
| `Alt+Shift+C` | Toggle high contrast mode |
| `Escape` | Close popup, return focus to page |

## Verifying the Ethics Logic Gate

To demonstrate the mandatory challenge constraint:

1. On `demo/product.html`, say "click unlabeled button" → should be BLOCKED (unlabeled control)
2. On `demo/product.html`, target the password field → should be BLOCKED (sensitive field)
3. On `demo/chat.html`, draft a message containing an email address, then say "send message" → should be BLOCKED (PII)
4. Check the audit log (`Alt+Shift+L`) to verify violations are recorded with rule IDs and timestamps
