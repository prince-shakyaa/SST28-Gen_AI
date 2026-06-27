# Architecture Document — Website Automation Agent

## 1. Overview

This document explains the design decisions, system architecture, and agent workflow for the Website Automation Agent built for GenAI Assignment 04.

---

## 2. High-Level Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                        index.js                         │
│              (Entry point / bootstrap)                  │
└────────────────────────┬────────────────────────────────┘
                         │ reads input
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    agent/agent.js                       │
│          (Agent loop + step orchestration)              │
│                                                         │
│  open_browser() ──► decide() ──► executeTool() ──►      │
│       ▲                                   │             │
│       └────────── next step ──────────────┘             │
└────────────────────────┬────────────────────────────────┘
                         │ uses
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    agent/llm.js                         │
│        (Groq + LLaMA 3.3 70B Brain)                     │
│                                                         │
│  1. Receives current page state (URL, Title, Text)      │
│  2. Calls appropriate tool via JSON tool calling        │
└────────────────────────┬────────────────────────────────┘
                         │ invokes
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   agent/tools.js                        │
│            (Primitive browser action tools)             │
│                                                         │
│  take_screenshot  │  navigate_to_url  │  click_button   │
│  fill_form_field  │  search_bing      │  scroll         │
│  click_link       │  get_page_state   │                 │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Design Decisions

### 3.1 True Agentic Loop (LLM Orchestration)

Instead of a hardcoded sequence of steps, this agent uses a **true agentic loop**:
1. The script extracts the current page state (URL, title, and cleaned visible text).
2. It sends the user's objective and the page state to an LLM (LLaMA 3.3 70B via Groq).
3. The LLM decides the next logical action (e.g., `navigate`, `scroll_down`, `fill_form_field`).
4. Playwright executes the action.
5. The loop repeats until the LLM calls the `done` tool.

This allows the agent to **dynamically react** to page layouts, pop-ups, search results, and arbitrary user prompts, rather than just solving one hardcoded task.

### 3.2 Robust Form Filling (`fill_form_field`)

Instead of requiring explicit CSS selectors, the `fill_form_field` tool accepts a semantic `label_hint` (e.g., "name", "description"). It uses a multi-strategy approach to locate the input:
1. **Label matching**: Looks for `<label>` tags containing the hint and fills the associated input.
2. **Selector fallback**: Tries fuzzy CSS selectors like `input[placeholder*="name" i]`, `input[name*="name" i]`, and `textarea`.

This makes the agent **resilient to DOM changes** and capable of handling generic websites without prior knowledge of their structure.

### 3.3 Tool Granularity and Composability

Each function in `tools.js` corresponds to a discrete browser primitive. These primitives are exposed to the LLM via a strict JSON schema. This modularity means adding new capabilities (like `double_click` or `press_key`) only requires updating the schema in `llm.js` and adding the implementation in `tools.js`.

### 3.4 Headless vs. Visible Mode

The agent runs headless by default (CI-friendly), but supports `HEADLESS=false` (configured in `.env`) for live demonstrations during the viva. 

### 3.5 Anti-Bot Measures

To avoid being blocked by CAPTCHAs (especially on search engines):
- The agent spoofs its `User-Agent`.
- Overrides `navigator.webdriver` via `addInitScript` so scripts cannot easily detect Playwright.
- Uses Bing for web searches, which is significantly more lenient toward automated tools than Google.

---

## 4. Agent Workflow (Sequence Diagram)

```text
index.js          agent.js             llm.js            Playwright
   │                 │                   │                   │
   │──── run() ─────►│                   │                   │
   │                 │──open_browser()──────────────────────►│
   │                 │                   │                   │
   │                 │◄──────── [ LOOP START ] ──────────────│
   │                 │                   │                   │
   │                 │── get_page_state()───────────────────►│
   │                 │◄─── { url, title, visible_text } ─────│
   │                 │                   │                   │
   │                 │── decide(state)──►│                   │
   │                 │                   │ (LLM Inference)   │
   │                 │◄── tool(args) ────│                   │
   │                 │                   │                   │
   │                 │── executeTool() ─────────────────────►│
   │                 │◄───── success/fail ───────────────────│
   │                 │                   │                   │
   │                 │────────── [ LOOP END ] ──────────────►│
   │                 │                   │                   │
   │                 │ (If tool == 'done')                   │
   │                 │── browser.close()────────────────────►│
   │◄── report ──────│                   │                   │
```

---

## 5. Error Handling Strategy

| Scenario | Handling |
|----------|---------|
| Tool Execution Failure | The tool returns `{ success: false, error: ... }`. The LLM is informed of the failure in the next step and can attempt a different strategy. |
| Element Not Found | `fill_form_field` / `click_link` tries multiple strategies. If all fail, it gracefully returns a failure state rather than crashing. |
| Page Crash / Timeout | Playwright throws an exception, which is caught by the agent loop `try/catch`. The run safely aborts. |
| Unhandled Exceptions | Caught in `index.js`, process exits with code 1. |
| LLM Hallucination | If the LLM returns an invalid tool format, the Groq SDK validates it. `agent.js` catches the error and breaks the loop. |

---

## 6. Technology Choices

| Technology | Reason |
|------------|--------|
| **Node.js** | Native `async/await`, no extra runtime, fast startup |
| **Playwright** | Best-in-class browser automation; auto-waits; reliable selectors |
| **Groq API** | Extremely fast LLaMA inference, reducing the wait time between agent steps |
| **LLaMA 3.3 70B** | Highly capable open-weight model with strong reasoning and tool-calling support |
| **dotenv** | Industry standard for config via `.env` files |

---

## 7. Potential Improvements

- **Visual / Vision Model**: Feed actual page screenshots to a multimodal model (like GPT-4o) to locate elements visually instead of relying on DOM text extraction.
- **Continuous Memory**: Allow the agent to remember facts across sessions by saving summaries to disk.
- **Complex Interactions**: Add support for drag-and-drop or handling multiple browser tabs simultaneously.

---

*Author: Prince Shakya — GenAI Assignment 04*
