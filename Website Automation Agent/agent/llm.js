/**
 * llm.js  –  Groq-powered AI brain for the automation agent
 * ===========================================================
 * This module connects the agent to Groq (LLaMA 3.1 70B).
 * The LLM receives the current page state and decides which
 * browser tool to call next — creating a real agentic loop.
 *
 * Tool-calling flow:
 *   page state → LLM → tool call → execute → new page state → LLM → …
 */

require("dotenv").config();
const Groq   = require("groq-sdk");
const logger = require("../utils/logger");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Model ─────────────────────────────────────────────────────────────────────
const MODEL = "llama-3.3-70b-versatile";

// ─────────────────────────────────────────────────────────────────────────────
// Tool definitions  (JSON schema the LLM can call)
// ─────────────────────────────────────────────────────────────────────────────
const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_web",
      description:
        "Search Bing for any query. Use this when the user wants to find information.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query to look up" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "navigate",
      description: "Open a specific URL in the browser.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "Full URL including https://" },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "scroll_down",
      description: "Scroll the page down to reveal more content.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "scroll_up",
      description: "Scroll the page up.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "click_link",
      description: "Click a link on the page by its visible text.",
      parameters: {
        type: "object",
        properties: {
          link_text: {
            type: "string",
            description: "Visible text of the link to click (partial match OK)",
          },
        },
        required: ["link_text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fill_form_field",
      description:
        "Type text into a form input or textarea on the page. " +
        "Use label_hint to identify the field (e.g. 'username', 'name', 'bio', 'description'). " +
        "Use this to fill Name, Description, or any other form fields.",
      parameters: {
        type: "object",
        properties: {
          label_hint: {
            type: "string",
            description:
              "A hint to identify the field — e.g. 'username', 'name', 'bio', 'description', 'email'",
          },
          value: {
            type: "string",
            description: "The text to type into the field",
          },
        },
        required: ["label_hint", "value"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "click_button",
      description: "Click a button on the page by its visible label text.",
      parameters: {
        type: "object",
        properties: {
          label: {
            type: "string",
            description: "Button text/label to click, e.g. 'Submit', 'Search', 'Login'",
          },
        },
        required: ["label"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "take_screenshot",
      description: "Capture a screenshot of the current browser window and save it.",
      parameters: {
        type: "object",
        properties: {
          label: {
            type: "string",
            description: "A short name for the screenshot, e.g. 'form_filled', 'results'",
          },
        },
        required: ["label"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "done",
      description:
        "Call this when the task is fully complete. Provide a human-readable summary.",
      parameters: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "A clear summary of what was accomplished",
          },
        },
        required: ["summary"],
      },
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// decide  –  send page state to LLM, get back tool call
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @param {string}   userTask   – original user request
 * @param {Object[]} messages   – conversation history
 * @param {Object}   pageState  – { url, title, text }
 * @returns {{ toolName: string, toolArgs: Object, updatedMessages: Object[] }}
 */
async function decide(userTask, messages, pageState) {
  // Append current page state as a new user message
  const stateMsg = {
    role: "user",
    content:
      `Current page:\n` +
      `  URL  : ${pageState.url}\n` +
      `  Title: ${pageState.title}\n` +
      `  Content (first 1200 chars):\n${pageState.text.slice(0, 1200)}\n\n` +
      `What should I do next to complete the task?`,
  };

  const updatedMessages = [...messages, stateMsg];

  logger.info(`🧠  Asking LLM what to do next…`);

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: updatedMessages,
    tools: TOOLS,
    tool_choice: "auto",
    temperature: 0.1,
    max_tokens: 512,
  });

  const msg       = response.choices[0].message;
  const toolCall  = msg.tool_calls?.[0];

  if (!toolCall) {
    logger.warn("LLM returned no tool call — defaulting to done");
    return {
      toolName: "done",
      toolArgs: { summary: msg.content || "Task attempted." },
      updatedMessages: [...updatedMessages, msg],
    };
  }

  const toolName = toolCall.function.name;
  const toolArgs = JSON.parse(toolCall.function.arguments || "{}");

  logger.info(`🤖  LLM chose: ${toolName}(${JSON.stringify(toolArgs)})`);

  // Record assistant message + tool call result placeholder
  const nextMessages = [
    ...updatedMessages,
    msg,  // assistant message with tool_calls
    {
      role:         "tool",
      tool_call_id: toolCall.id,
      content:      "executed",
    },
  ];

  return { toolName, toolArgs, updatedMessages: nextMessages };
}

// ─────────────────────────────────────────────────────────────────────────────
// buildSystemPrompt
// ─────────────────────────────────────────────────────────────────────────────
function buildSystemPrompt(userTask) {
  return [
    {
      role: "system",
      content:
        `You are an intelligent web automation agent powered by Playwright.\n` +
        `Complete the following task using the available browser tools:\n\n` +
        `TASK: "${userTask}"\n\n` +
        `Rules:\n` +
        `- Start with navigate or search_web to reach the right page.\n` +
        `- To fill a form field, call fill_form_field with a label_hint and value.\n` +
        `- After filling all form fields, call click_button to submit the form.\n` +
        `- Use scroll_down if the form or content is not visible yet.\n` +
        `- Call take_screenshot to capture important states.\n` +
        `- Call done() only when the task is fully complete.\n` +
        `- Be efficient — avoid unnecessary steps.\n` +
        `\nCRITICAL: You MUST use the provided JSON tool calling mechanism to execute actions. Do not output raw XML tags like <function=...>.`,
    },
  ];
}

module.exports = { decide, buildSystemPrompt };
