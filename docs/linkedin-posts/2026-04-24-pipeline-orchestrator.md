```
The backbone of an ethical voice pipeline is now wired up.

Just shipped the pipeline orchestrator for AllVoice — a Chrome Extension copilot for blind and low-vision users. The runPipeline() function drives six stages in strict order: Intent Parser → Browser Observer → Ethics Logic Gate → Safe Executor → Response Generator → Audit Log. When the Ethics Gate returns "block," the executor is never called. No exceptions, no bypass.

The orchestrator enforces a 3-second timeout on action execution via Promise.race, handles modified intents from the ethics gate, and ensures every invocation — blocked or not — gets logged for auditability. All pipeline stages communicate through a single PipelineContext object with strict TypeScript interfaces.

This is the core of our Kiro Spark Challenge entry (Ethics frame, Inclusion Guardrail). The architecture ensures that privacy-violating actions are halted before they ever touch the DOM. Next up: content script integration and service worker message routing.

Building with @kirodotdev using spec-driven development.

#Accessibility #ChromeExtension #EthicsInAI #KiroSparkChallenge #InclusiveDesign
```
