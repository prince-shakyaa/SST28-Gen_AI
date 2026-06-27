/**
 * agent.js  –  AI-driven agentic loop
 * =====================================
 * This is the core agent. It works like this:
 *
 *   1. Open browser
 *   2. Ask the LLM what to do (given user task + current page state)
 *   3. Execute the tool the LLM chose
 *   4. Feed new page state back to LLM
 *   5. Repeat until LLM calls done() or max steps reached
 *
 * The LLM (Groq / LLaMA 3.3 70B) is the brain.
 * Playwright is the hands.
 */

require("dotenv").config();
const { chromium } = require("playwright");
const logger       = require("../utils/logger");
const { decide, buildSystemPrompt } = require("./llm");
const {
  take_screenshot,
  navigate_to_url,
  search_bing,
  scroll,
  click_link,
  fill_form_field,
  click_button,
  get_page_state,
  get_search_results,
  sleep,
} = require("./tools");

const MAX_STEPS = 12; // safety limit on LLM iterations

// ─────────────────────────────────────────────────────────────────────────────
// open_browser
// ─────────────────────────────────────────────────────────────────────────────
async function open_browser() {
  logger.step("🚀  Launching browser…");

  const headless = process.env.HEADLESS !== "false";
  const slowMo   = parseInt(process.env.SLOW_MO ?? "80", 10);

  const browser = await chromium.launch({
    headless,
    slowMo,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const context = await browser.newContext({
    viewport:  { width: 1280, height: 800 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/124.0.0.0 Safari/537.36",
    locale:           "en-US",
    extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
  });

  // Hide webdriver fingerprint
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  const page = await context.newPage();
  logger.info("✅  Browser ready");
  return { browser, page };
}

// ─────────────────────────────────────────────────────────────────────────────
// executeTool  –  maps LLM tool name → actual browser action
// ─────────────────────────────────────────────────────────────────────────────
async function executeTool(page, toolName, toolArgs, stepIndex) {
  logger.step(`\n[Step ${stepIndex}] 🔧  ${toolName}(${JSON.stringify(toolArgs)})`);

  switch (toolName) {
    case "search_web":
      return search_bing(page, toolArgs.query);

    case "navigate":
      return navigate_to_url(page, toolArgs.url);

    case "scroll_down":
      return scroll(page, 0, 500);

    case "scroll_up":
      return scroll(page, 0, -500);

    case "click_link":
      return click_link(page, toolArgs.link_text);

    case "fill_form_field":
      return fill_form_field(page, toolArgs.label_hint, toolArgs.value);

    case "click_button":
      return click_button(page, toolArgs.label);

    case "take_screenshot":
      return take_screenshot(page, toolArgs.label || "screenshot");

    case "done":
      return { success: true, done: true, summary: toolArgs.summary };

    default:
      logger.warn(`Unknown tool: ${toolName}`);
      return { success: false, error: `Unknown tool: ${toolName}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// run  –  main entry point
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @param {string} userInput  – anything the user typed
 */
async function run(userInput) {
  logger.step("═".repeat(52));
  logger.step("  🤖  AI Website Automation Agent  —  Starting");
  logger.step("═".repeat(52));
  logger.info(`  Task: "${userInput}"`);

  const startTime = Date.now();
  let browser     = null;
  let page        = null;
  const steps     = [];
  let   results   = [];
  let   summary   = "";

  try {
    ({ browser, page } = await open_browser());

    // Initial state (blank page)
    let messages = buildSystemPrompt(userInput);

    // ── Agentic loop ───────────────────────────────────────────────────────────
    for (let i = 1; i <= MAX_STEPS; i++) {
      // 1. Get current page state for the LLM
      const pageState = await get_page_state(page);
      logger.info(`📄  Page: "${pageState.title}" @ ${pageState.url}`);

      // 2. Ask LLM what to do next
      let decision;
      try {
        decision = await decide(userInput, messages, pageState);
      } catch (llmErr) {
        logger.error(`LLM error: ${llmErr.message}`);
        break;
      }

      messages = decision.updatedMessages;
      const { toolName, toolArgs } = decision;

      // 3. If LLM says done → stop
      if (toolName === "done") {
        summary = toolArgs.summary || "Task complete.";
        logger.step(`\n✅  Agent finished: ${summary}`);
        steps.push({ name: "done", success: true, summary });
        break;
      }

      // 4. Execute the chosen tool
      const result = await executeTool(page, toolName, toolArgs, i);
      steps.push({ name: toolName, args: toolArgs, success: result.success });

      // 5. After a search, also extract structured results
      if (toolName === "search_web") {
        await sleep(1000);
        const extracted = await get_search_results(page, 5);
        if (extracted.success && extracted.results.length) {
          results = extracted.results;
          logger.info(`  📋  Got ${results.length} results from Bing`);
        }
      }


      // Safety: stop if max steps hit
      if (i === MAX_STEPS) {
        logger.warn(`⚠️   Max steps (${MAX_STEPS}) reached`);
        summary = "Reached maximum steps limit.";
      }
    }

  } catch (fatalErr) {
    logger.error(`FATAL: ${fatalErr.message}`);
    summary = `Error: ${fatalErr.message}`;
  } finally {
    if (browser) {
      logger.step("🔒  Closing browser");
      await browser.close();
    }
  }

  const duration   = ((Date.now() - startTime) / 1000).toFixed(2);
  const passed     = steps.filter(s => s.success).length;
  const failed     = steps.filter(s => !s.success).length;

  logger.step(`\n${"═".repeat(52)}`);
  logger.step(`  Done in ${duration}s — ${passed}/${steps.length} steps OK`);
  logger.step("═".repeat(52));

  return { duration, totalSteps: steps.length, passedSteps: passed,
           failedSteps: failed, steps, results, summary };
}

module.exports = { run, open_browser };
