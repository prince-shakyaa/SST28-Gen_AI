/**
 * index.js  –  Interactive CLI entry point
 * =========================================
 * Usage:
 *   node index.js                          ← prompts you interactively
 *   node index.js "best laptops 2024"      ← runs inline
 *   node index.js "https://github.com"     ← visits URL directly
 */

require("dotenv").config();
const readline = require("readline");
const agent    = require("./agent/agent");
const logger   = require("./utils/logger");

// ── Validate API key ──────────────────────────────────────────────────────────
if (!process.env.GROQ_API_KEY) {
  console.error("\n  ❌  GROQ_API_KEY not found in .env\n");
  process.exit(1);
}

// ── Get input ─────────────────────────────────────────────────────────────────
async function getInput() {
  const arg = process.argv.slice(2).join(" ").trim();
  if (arg) return arg;

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    console.log("\n╔══════════════════════════════════════════════╗");
    console.log("║     🤖  AI Website Automation Agent          ║");
    console.log("║     Powered by Groq + LLaMA 3.3 70B         ║");
    console.log("╚══════════════════════════════════════════════╝\n");
    console.log("  Examples:");
    console.log('    • "best electric cars 2024"');
    console.log('    • "who is the CEO of OpenAI"');
    console.log('    • "latest news about AI"');
    console.log('    • "https://github.com"\n');
    rl.question("  What do you want to search/visit?\n  > ", answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  const input = await getInput();
  if (!input) { console.error("  ❌  No input."); process.exit(1); }

  console.log(`\n  🚀  Task: "${input}"\n`);

  const report = await agent.run(input);

  // ── Print results ─────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(52));
  console.log(`  ✅  Steps passed : ${report.passedSteps} / ${report.totalSteps}`);
  console.log(`  ⏱️   Time         : ${report.duration}s`);

  // AI Summary
  if (report.summary) {
    console.log(`\n  🧠  AI Summary:\n`);
    // wrap at 60 chars
    const words = report.summary.split(" ");
    let line    = "     ";
    for (const w of words) {
      if ((line + w).length > 65) { console.log(line); line = "     " + w + " "; }
      else line += w + " ";
    }
    if (line.trim()) console.log(line);
  }

  // Top search results
  if (report.results?.length) {
    console.log(`\n  🔎  Top Results:\n`);
    report.results.slice(0, 5).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.title}`);
      console.log(`     ${r.url}\n`);
    });
  }

  console.log(`  📸  Screenshots  → ./screenshots/`);
  console.log("═".repeat(52) + "\n");

  process.exit(report.failedSteps > 0 && !report.summary ? 1 : 0);
})();
