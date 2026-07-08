# LinkedIn Post 1 — The Pipeline with a Conscience

---

What if your software had a conscience?

I built AllVoice — a Chrome Extension copilot that helps blind and low-vision users navigate the web with voice commands. Built for the Kiro Spark Challenge (Ethics frame, Inclusion Guardrail).

Every voice command flows through a six-stage pipeline: Intent Parser → Browser Observer → Ethics Logic Gate → Safe Executor → Response Generator → Audit Log. All TypeScript strict mode, 103 passing tests.

The centerpiece is Stage 3 — the Ethics Logic Gate. A synchronous, deterministic pure function. Same inputs, same output, every time. No network calls, no randomness, no side effects. It enforces five rules:

→ PRIVACY_SENSITIVE_FIELD — blocks actions on password and payment fields
→ PRIVACY_PII_SUBMISSION — catches emails, phone numbers, SSNs before they're sent
→ PRIVACY_FORM_AUTOFILL — prevents unintended disclosure of personal data
→ SAFETY_UNLABELED_CONTROL — refuses to click buttons with no accessible name
→ CONTEXT_RESTRICTED — blocks execution on chrome:// system pages

If any rule returns "block," the Safe Executor never runs. The action dies at the gate. The orchestrator function signature enforces this — you literally cannot call the executor without an ethics decision. It's not middleware you can skip. It's a mandatory pipeline stage.

Every blocked attempt is audit-logged with the rule ID, the reason, and a timestamp. Full traceability from voice command to outcome.

This is what "ethics by design" looks like in code. Not a checkbox. Not a policy document. A function that runs every single time.

#EthicsInAI #Privacy #Accessibility #KiroSparkChallenge #ChromeExtension #TypeScript
