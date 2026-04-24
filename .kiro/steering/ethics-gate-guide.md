---
inclusion: fileMatch
fileMatchPattern: "**/ethicsGate*,**/ethicsRules*,**/piiDetector*"
---

# Ethics Logic Gate — Implementation Guide

The Ethics Logic Gate is the core challenge constraint. It must be implemented correctly to satisfy the Kiro Spark Challenge requirements.

## Architecture

`evaluateEthics(intent, browserState, rules?)` is a **synchronous pure function**:
- No async, no side effects, no external state
- Deterministic: same inputs → same output (Requirement 4.9)
- Returns `EthicsDecision` with `decision`, `reason`, `ruleId`, `modifiedIntent`, `privacyViolation`

## Default Rules

| Rule ID | Name | Triggers On | Privacy Violation? |
|---|---|---|---|
| `PRIVACY_SENSITIVE_FIELD` | Sensitive Field Protection | Actions targeting password, `cc-number`, `cc-csc`, `new-password` fields | Yes |
| `PRIVACY_PII_SUBMISSION` | PII Submission Prevention | `send_message`/`confirm_pending` with email, phone, or SSN patterns in content | Yes |
| `SAFETY_UNLABELED_CONTROL` | Unlabeled Control Protection | `click_unlabeled` actions | No |
| `CONTEXT_RESTRICTED` | Restricted Context Enforcement | Execution intents on `chrome://` or `chrome-extension://` pages | No |

## Evaluation Order

1. Iterate all rules checking for "block" decisions — first block wins
2. Then iterate for "modify" decisions — first modify wins
3. Default to "allow" if no rules trigger

## Privacy Violation Handling

When `privacyViolation: true`:
- Pipeline HALTS — Safe_Executor is never called
- Audit_Log records a `privacy_violation_stopped` event with: rule ID, blocked intent, timestamp
- Response_Generator delivers spoken explanation via Chrome TTS

## PII Detection Patterns

The `containsPII()` utility checks for:
- Email: `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`
- Phone: `\b\d{3}[-.]?\d{3}[-.]?\d{4}\b`
- SSN: `\b\d{3}-\d{2}-\d{4}\b`

## Adding New Rules

Create an `EthicsRule` object with:
- `id`: SCREAMING_SNAKE_CASE identifier
- `name`: human-readable name
- `description`: what the rule does
- `evaluate(intent, browserState)`: returns `EthicsDecision | null`

Return `null` to indicate "no opinion". Return a decision object to block, modify, or allow.
Add the rule to the `DEFAULT_RULES` array in `ethicsRules.ts`.
