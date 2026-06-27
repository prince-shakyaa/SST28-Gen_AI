/**
 * tools.js  –  Browser automation primitives
 * ============================================
 * Each function = one browser action.
 * All return { success: boolean, ... } so the agent loop is uniform.
 */

require("dotenv").config();
const fs     = require("fs");
const path   = require("path");
const logger = require("../utils/logger");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** Node-native sleep — never crashes even when page navigates */
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// take_screenshot
// ─────────────────────────────────────────────────────────────────────────────
async function take_screenshot(page, label = "screenshot", dir = "./screenshots") {
  const screenshotDir = path.resolve(dir);
  ensureDir(screenshotDir);
  const ts       = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(screenshotDir, `${label}_${ts}.png`);
  try {
    await page.screenshot({ path: filePath, fullPage: false });
    logger.info(`📸  ${filePath}`);
    return { success: true, filePath };
  } catch (err) {
    logger.error(`take_screenshot: ${err.message}`);
    return { success: false, filePath: null, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// navigate_to_url
// ─────────────────────────────────────────────────────────────────────────────
async function navigate_to_url(page, url, timeout = 30000) {
  try {
    logger.info(`🌐  → ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout });
    await sleep(800);
    logger.info(`✅  Loaded: ${page.url()}`);
    return { success: true, url: page.url() };
  } catch (err) {
    logger.error(`navigate_to_url: ${err.message}`);
    return { success: false, url, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// search_bing  — goes straight to the results URL (no typing needed)
// ─────────────────────────────────────────────────────────────────────────────
async function search_bing(page, query) {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=en`;
  logger.info(`🔍  Bing search: "${query}"`);
  return navigate_to_url(page, url);
}

// ─────────────────────────────────────────────────────────────────────────────
// scroll
// ─────────────────────────────────────────────────────────────────────────────
async function scroll(page, deltaX = 0, deltaY = 500) {
  try {
    await page.mouse.wheel(deltaX, deltaY);
    await sleep(500);
    return { success: true };
  } catch (err) {
    logger.error(`scroll: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// click_link  — finds a link by text (case-insensitive partial match)
// ─────────────────────────────────────────────────────────────────────────────
async function click_link(page, linkText) {
  try {
    logger.info(`🖱️   click_link("${linkText}")`);
    // Playwright's getByText is the most reliable for link text
    const locator = page.getByRole("link", { name: new RegExp(linkText, "i") }).first();
    await locator.click({ timeout: 8000 });
    await sleep(1500);
    return { success: true };
  } catch (err) {
    // fallback: try evaluate
    try {
      await page.evaluate((text) => {
        const links = [...document.querySelectorAll("a")];
        const match = links.find(l =>
          l.textContent.toLowerCase().includes(text.toLowerCase())
        );
        if (match) match.click();
      }, linkText);
      await sleep(1500);
      return { success: true };
    } catch (err2) {
      logger.error(`click_link: ${err2.message}`);
      return { success: false, error: err2.message };
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// click_on_screen  (coordinate click)
// ─────────────────────────────────────────────────────────────────────────────
async function click_on_screen(page, x, y) {
  try {
    await page.mouse.click(x, y);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// double_click  (coordinate double-click)
// ─────────────────────────────────────────────────────────────────────────────
async function double_click(page, x, y) {
  try {
    await page.mouse.dblclick(x, y);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// send_keys  — find element by selector, clear it, type text
// ─────────────────────────────────────────────────────────────────────────────
async function send_keys(page, selector, text, delay = 50) {
  try {
    const el = await page.waitForSelector(selector, { timeout: 8000 });
    await el.click({ clickCount: 3 });
    await el.fill("");
    await el.type(text, { delay });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// press_key
// ─────────────────────────────────────────────────────────────────────────────
async function press_key(page, key) {
  try {
    await page.keyboard.press(key);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// get_page_state  — returns URL, title, and cleaned visible text
//                   This is what gets sent to the LLM as "page state"
// ─────────────────────────────────────────────────────────────────────────────
async function get_page_state(page) {
  try {
    const url   = page.url();
    const title = await page.title();

    // Extract visible text — skip script/style, collapse whitespace
    const text = await page.evaluate(() => {
      const skip = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "HEAD"]);
      function walk(node) {
        if (skip.has(node.nodeName)) return "";
        if (node.nodeType === Node.TEXT_NODE) return node.textContent;
        return [...node.childNodes].map(walk).join(" ");
      }
      return walk(document.body).replace(/\s+/g, " ").trim();
    });

    return { url, title, text };
  } catch (err) {
    return { url: page.url(), title: "unknown", text: "" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// get_search_results  — extract result titles+URLs from Bing results page
// ─────────────────────────────────────────────────────────────────────────────
async function get_search_results(page, limit = 5) {
  try {
    await sleep(1000);
    const results = await page.evaluate((max) => {
      const items = [];
      // Bing: each result is <li class="b_algo"><h2><a href="...">Title</a></h2>
      const resultNodes = document.querySelectorAll("li.b_algo h2 a, #b_results .b_algo h2 a");
      for (const a of resultNodes) {
        const title = a.innerText?.trim();
        const url   = a.href;
        if (title && url && url.startsWith("http")) {
          items.push({ title, url });
          if (items.length >= max) break;
        }
      }
      // Fallback: generic a[href] with h3
      if (items.length === 0) {
        const generic = document.querySelectorAll("a:has(h3)");
        for (const a of generic) {
          const title = a.querySelector("h3")?.innerText?.trim();
          const url   = a.href;
          if (title && url && url.startsWith("http") && !url.includes("bing.com")) {
            items.push({ title, url });
            if (items.length >= max) break;
          }
        }
      }
      return items;
    }, limit);

    logger.info(`🔎  Extracted ${results.length} results`);
    return { success: true, results };
  } catch (err) {
    return { success: false, results: [], error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// get_page_title
// ─────────────────────────────────────────────────────────────────────────────
async function get_page_title(page) {
  try {
    return { success: true, title: await page.title(), url: page.url() };
  } catch (err) {
    return { success: false, error: err.message };
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// fill_form_field  — intelligent form field finder + filler
//   label_hint examples: "username", "name", "bio", "description", "email"
//   Tries multiple selector strategies so it works across different pages.
// ─────────────────────────────────────────────────────────────────────────────
async function fill_form_field(page, label_hint, value) {
  logger.info(`⌨️   fill_form_field("${label_hint}", "${value}")`);

  const hint = label_hint.toLowerCase();

  // Strategy 1: match <label> text, then fill its linked input/textarea
  try {
    const filled = await page.evaluate((hint, value) => {
      const labels = [...document.querySelectorAll("label")];
      const label  = labels.find(l => l.textContent.toLowerCase().includes(hint));
      if (!label) return false;
      const target =
        (label.htmlFor && document.getElementById(label.htmlFor)) ||
        label.querySelector("input, textarea") ||
        label.nextElementSibling;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        target.focus();
        target.value = value;
        target.dispatchEvent(new Event("input",  { bubbles: true }));
        target.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
      return false;
    }, hint, value);

    if (filled) {
      logger.info(`✅  Filled via label match`);
      return { success: true };
    }
  } catch (_) {}

  // Strategy 2: selector-based fallback list
  const selectors = [
    `input[name*="${hint}" i]`,
    `input[id*="${hint}" i]`,
    `input[placeholder*="${hint}" i]`,
    `textarea[name*="${hint}" i]`,
    `textarea[id*="${hint}" i]`,
    `textarea[placeholder*="${hint}" i]`,
    // shadcn-specific placeholders
    hint.includes("name") || hint.includes("user") ? 'input[placeholder*="shadcn" i]' : null,
    hint.includes("bio") || hint.includes("desc")  ? "form textarea"                 : null,
  ].filter(Boolean);

  for (const sel of selectors) {
    try {
      const el = await page.waitForSelector(sel, { timeout: 3000 });
      if (el && await el.isVisible()) {
        await el.click({ clickCount: 3 });
        await el.fill(value);
        logger.info(`✅  Filled via selector: ${sel}`);
        return { success: true };
      }
    } catch (_) {}
  }

  logger.warn(`⚠️   fill_form_field: could not find "${label_hint}" field`);
  return { success: false, error: `Field "${label_hint}" not found` };
}

// ─────────────────────────────────────────────────────────────────────────────
// click_button  — find and click a button by its visible label
// ─────────────────────────────────────────────────────────────────────────────
async function click_button(page, label) {
  logger.info(`🖱️   click_button("${label}")`);
  try {
    const btn = page.getByRole("button", { name: new RegExp(label, "i") }).first();
    await btn.click({ timeout: 8000 });
    await sleep(1000);
    logger.info(`✅  Clicked button: "${label}"`);
    return { success: true };
  } catch (err) {
    // fallback: evaluate
    try {
      await page.evaluate((label) => {
        const btns = [...document.querySelectorAll("button")];
        const match = btns.find(b => b.textContent.toLowerCase().includes(label.toLowerCase()));
        if (match) match.click();
      }, label);
      await sleep(1000);
      return { success: true };
    } catch (err2) {
      logger.error(`click_button: ${err2.message}`);
      return { success: false, error: err2.message };
    }
  }
}

module.exports = {
  take_screenshot,
  navigate_to_url,
  search_bing,
  scroll,
  click_link,
  click_on_screen,
  double_click,
  send_keys,
  press_key,
  fill_form_field,
  click_button,
  get_page_state,
  get_search_results,
  get_page_title,
  sleep,
};
