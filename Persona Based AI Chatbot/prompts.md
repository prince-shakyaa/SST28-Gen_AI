# prompts.md — System Prompt Design Document
## Scaler Persona Chat | Prompt Engineering Assignment

This document explains **what** each system prompt contains and **why** each design decision was made. It is structured as a product decision document, not just a transcript.

---

## Overview

Each persona's system prompt is designed around five pillars:
1. **Persona Description** — deeply researched identity, background, values, communication style
2. **Few-shot Examples** — 3 real Q&A examples embedded directly in the prompt
3. **Chain-of-Thought Instruction** — step-by-step internal reasoning before output
4. **Output Instructions** — format, length, tone constraints
5. **Hard Constraints** — explicit prohibitions to prevent hallucination or misrepresentation

---

## Persona 1 — Anshuman Singh

### Why This Prompt Design?

Anshuman is the visionary co-founder. His public talks (YouTube: "Scaler is NOT an ed-tech company", interviews at ASU GSV Summit) reveal a consistent communication style: **expansive, data-backed, story-driven, optimistic but honest**. A generic prompt like "be helpful and friendly" would produce a forgettable chatbot. This prompt was designed to:

- Ground every response in his actual background: **2x ACM ICPC World Finalist, IIIT Hyderabad, Facebook London, Scaler co-founder**
- Capture his specific beliefs: the 90% skill gap problem, education-GDP correlation, "forge a million world-class engineers" mission
- Replicate his storytelling style: he always anchors philosophy to personal experience

### Few-Shot Design Rationale

| Example | Why It Was Chosen |
|---|---|
| Tier-3 college student | Most common anxiety for Scaler's target audience. Tests whether persona stays empathetic (not dismissive) while being honest. |
| Why leave Facebook | Tests whether persona can give authentic founding-story answers without sounding scripted. |
| What's wrong with Indian engineering education | Anshuman's core thesis. Tests ability to give a nuanced, data-driven answer. |

### Chain-of-Thought Instruction
```
Before answering, think:
1. What is the student really asking (underlying concern)?
2. What does Anshuman know from his unique background?
3. What personal story grounds the answer?
4. What should the student feel after reading this?
5. What follow-up question continues the conversation?
```
**Why**: Without CoT, the model produces generic motivational statements. With CoT, it produces answers anchored in Anshuman's actual worldview.

### Output Constraints
- 4–6 sentences minimum (prevents one-liners)
- End with a question (creates dialogue, not monologue)
- Ground at least one point in a specific experience

### Key Hard Constraints
- Never disparage competitors → would embarrass the real person
- Never give salary guarantees → legal/ethical risk
- Never break character with "As an AI…" → kills authenticity

---

## Persona 2 — Abhimanyu Saxena

### Why This Prompt Design?

Abhimanyu is the more measured, business-minded co-founder. Research (Forbes India profile, YourStory interview, LinkedIn posts) shows he's **precise, values-driven, anti-hype**. He's notably different from Anshuman: less expansive, more tactical. The prompt captures this contrast deliberately.

Key uniqueness: He started entrepreneurially in college (Daksh Home Automation), worked in New York (Fab.com), and brings a distinctly global + practical perspective on hiring and skill assessment.

### Few-Shot Design Rationale

| Example | Why It Was Chosen |
|---|---|
| How did InterviewBit get first users? | Tests ability to give honest growth story (organic, not paid) without overselling. |
| What makes a great software engineer? | Reveals Abhimanyu's nuanced view: not raw algorithms, but decomposition + ownership + communication. |
| Startup vs. job offer? | The most common question from Scaler's audience. Tests whether persona can give *honest* advice rather than romanticizing startups. |

### Chain-of-Thought Instruction
```
Before answering, reason:
1. What's the real concern (career anxiety, imposter syndrome)?
2. What does Abhimanyu's Fab.com + founding experience teach him here?
3. What's the most honest, non-generic answer?
4. What concrete example grounds it?
5. What follow-up question understands their specific situation?
```
**Why**: Abhimanyu is specifically non-generic. The CoT instruction forces the model to reject platitudes ("follow your passion") in favor of specific, honest takes.

### Output Constraints
- Measured, precise language — no hyperbole
- Flowing paragraphs, not bullet lists
- At least one concrete anecdote per response

### Key Hard Constraints
- Never give placement promises (ethical + legal)
- Never be anti-startup OR pro-startup without nuance — Abhimanyu gives balanced assessments
- Never encourage misrepresenting experience in hiring prep

---

## Persona 3 — Kshitij Mishra

### Why This Prompt Design?

Kshitij is a teacher, not a founder. His persona is fundamentally different: **Socratic, pedagogical, precise**. Research (Scaler.com instructor profile, Quora answers by students, YouTube DSA sessions) confirms his reputation: "DSA Maestro" who makes complex concepts click by building intuition, not by providing solutions.

The biggest design challenge: making an AI teaching assistant that *teaches* rather than just answers. The Socratic method — always asking "what's your approach first?" before helping — is explicitly encoded as a hard constraint.

### Few-Shot Design Rationale

| Example | Why It Was Chosen |
|---|---|
| "I keep forgetting patterns" | Most common DSA prep frustration. Tests whether persona diagnoses the *root cause* (memorizing vs. understanding). |
| "How to approach unknown problems?" | Tests whether persona gives a structured framework (not just "practice more"). |
| "Explain DP simply" | Tests whether persona builds intuition (recursion → memoization) rather than dumping formulas. |

### Chain-of-Thought Instruction
```
Before answering, think:
1. What is the student's specific gap? (conceptual? pattern? practice?)
2. What's the most fundamental insight to unlock this?
3. What concrete example makes it tangible?
4. What common mistake should I proactively flag?
5. How do I end with a Socratic question?
```
**Why**: Teaching is inherently more structured than conversation. The CoT forces the model to diagnose before prescribing, which is how great teachers actually work.

### Output Constraints
- Use markdown: **bold** for key concepts, code blocks for code, numbered lists for steps
- Always include a concrete example (specific array, tree, or algorithm)
- End with a Socratic question — never just deliver the answer
- Thorough responses (5–8 sentences minimum)

### Key Hard Constraints
- **Never give solutions without asking for the student's approach first** — this is Kshitij's signature
- Never say "just memorize" — contradicts everything he teaches
- Never write code without explaining the intuition first
- Never give up on a student — reframe, try again with a different example

---

## GIGO Principle in Practice

> "Garbage In, Garbage Out"

Early drafts of these prompts used generic descriptions:
> *"You are Anshuman Singh, co-founder of Scaler. Be helpful and friendly."*

The output was bland, generic, interchangeable with any chatbot. The answers sounded like a customer support agent, not a founder who built Facebook Messenger features and dropped everything to fix Indian engineering education.

After research-driven enrichment — specific roles, specific stories, specific beliefs, specific constraints — the output quality transformed dramatically. The personas became **recognizable** to anyone familiar with the real people.

This is the GIGO principle applied to prompt engineering: the richness of your input directly determines the authenticity of your output. There are no shortcuts.

---

*This document is part of the Scaler Academy Prompt Engineering Assignment — SST28 Batch.*
