```
Building software that refuses to do the wrong thing is harder than building software that does the right thing.

Today I shipped the core pipeline for AllVoice — a Chrome Extension copilot that helps blind and low-vision users navigate the web with voice commands. The six-stage pipeline (Intent Parser, Browser Observer, Ethics Logic Gate, Safe Executor, Response Generator, Audit Log) is now fully implemented in TypeScript with 103 passing tests.

The centerpiece is the Ethics Logic Gate — a synchronous, deterministic pure function that evaluates every voice command against privacy and safety rules before any DOM action executes. It blocks interactions with password fields, payment inputs, and PII-containing messages. If it says "block," the executor never runs. No exceptions, no bypasses.

This is part of the Kiro Spark Challenge (Ethics frame, Inclusion Guardrail), where the constraint is that ethical enforcement isn't optional middleware — it's a mandatory pipeline stage baked into the architecture.

Every pipeline invocation is audit-logged with full traceability: what was said, what was intended, what the ethics gate decided, and what happened. Accessibility is the default — high-contrast 7:1 ratio, ARIA live regions, keyboard-first navigation.

Next up: end-to-end testing on real pages and polishing the demo flow.

#Accessibility #ChromeExtension #EthicsInAI #KiroSparkChallenge #InclusiveDesign
```
