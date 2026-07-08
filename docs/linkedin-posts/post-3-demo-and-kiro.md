# LinkedIn Post 3 — From Spec to Demo in a Weekend

---

"Open Amazon."
"Add the headset to my cart."
"Go to checkout."

Three voice commands. Zero mouse clicks. Full shopping flow completed.

AllVoice is a voice-controlled browser copilot for blind and low-vision users. Six-stage pipeline, five ethics rules, 103 tests, Claude AI integration, full voice navigation. Built with Kiro IDE for the Kiro Spark Challenge.

The demo includes an Amazon-style store with product cards, cart management, and checkout. The ethics gate blocks payment field interaction automatically — because in a voice-controlled world, accidentally reading out your credit card number is a real risk.

Voice commands: "What's on this page?" for accessibility audits. "Add to cart." "Tell me about the headset." "Search for school backpack." "Meet AllVoice" for a spoken introduction. Every action flows through the same pipeline. Every action hits the ethics gate. Every action is audit-logged.

Here's what made building this possible in a weekend:

Kiro's spec-driven development let me define requirements, design the architecture, and break it into tasks before writing code. The spec became the source of truth — every task traced to a requirement, every component had a clear interface.

Steering files kept standards consistent: TypeScript strict mode, no `any` types, ARIA on every element. Hooks automated the feedback loop — type checking on save, builds after task completion, ethics gate review on changes.

Tech stack: TypeScript (strict) · React 18 · Tailwind CSS · Vite + CRXJS · Chrome Manifest V3 · Web Speech API · Chrome TTS · Claude API

The Kiro Spark Challenge pushed me to build something I'm genuinely proud of. Software that helps people who need it most, with ethics enforcement that can't be bypassed.

#KiroSparkChallenge #KiroIDE #Accessibility #EthicsInAI #ChromeExtension #VoiceUI #Demo
