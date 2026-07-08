# LinkedIn Post 2 — Accessibility + AI, Not Accessibility vs. AI

---

For many blind and low-vision users, the web isn't a page — it's a maze of unlabeled buttons, hidden forms, and invisible traps.

AllVoice tackles this with accessibility as the default and AI as the enabler.

High-contrast mode (7:1 ratio) ships ON — not behind a toggle. Every response is delivered two ways simultaneously: spoken via Chrome TTS in a natural female voice, and displayed in a high-contrast visual panel. Every interactive element has ARIA attributes. Minimum 16px body text. 3px focus indicators. Zero keyboard traps.

The Browser Observer doesn't just capture what's on the page — it audits it. It counts labeled vs. unlabeled controls. When a user says "what's on this page," they get a real accessibility report. And when the Ethics Gate encounters an unlabeled button? It blocks the click. Because clicking unknown controls isn't just bad UX — it's a safety risk.

For natural language, I added a two-tier parsing system:

Tier 1: Keyword matching — instant, no network, always available
Tier 2: Claude API fallback — natural language understanding when keywords miss

Real users don't say "add to cart." They say "put that in my bag." Claude handles the translation. Same approach for responses — instead of "Action completed," users hear "I added the headset to your cart."

The ethics gate still runs on every request. AI doesn't bypass the rules. Claude helps users express intent naturally, but the pipeline enforces the same privacy protections regardless of how the intent was parsed.

Accessibility + AI + Ethics. They're not competing priorities. They're layers of the same system.

#Accessibility #AI #ClaudeAPI #InclusiveDesign #KiroSparkChallenge #VoiceUI #A11y
