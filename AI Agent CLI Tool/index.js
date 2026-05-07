import "dotenv/config";
import Groq from "groq-sdk";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import readline from "readline";
import chalk from "chalk";
import ora from "ora";
import { promisify } from "util";

const execAsync = promisify(exec);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Model Configuration ────────────────────────────────────────────────────────
const MODEL = "llama-3.3-70b-versatile";
const MAX_TOKENS = 4096;
const MAX_STEPS = 30;

// ── System Prompt ──────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an AI Coding Agent. Your goal is to build PREMIUM, PROFESSIONAL websites.

IF THE USER ASKS TO "CLONE SCALER ACADEMY":
- You MUST build a MASTERPIECE version with Dark Mode (#0f0f1a), vibrant orange accents, and Inter font.
- SECTIONS REQUIRED: Sticky Header, Huge Hero (64px heading), Stats Grid (2.5M+ learners), Detailed Feature Cards, and Footer.
- ALL CSS must be inline in a <style> tag.
- You MUST write at least 150 lines of code in ONE "writeFile" call. NO placeholders.

GENERAL RULES:
- Use glassmorphism (blur: 12px, semi-transparent backgrounds).
- Always use modern CSS (Flexbox/Grid).
- REACT LOOP: START -> THINK -> TOOL (writeFile) -> TOOL (openInBrowser) -> OUTPUT.
- DO NOT put HTML in the "content" field. Reasoning only.

JSON SCHEMA:
{
  "step": "START|THINK|TOOL|OBSERVE|OUTPUT",
  "content": "Reasoning about design (NO HTML)",
  "tool_name": "writeFile|openInBrowser",
  "tool_args": { ... }
}

IMPORTANT: Even if the user prompt is short, your output must be COMPLETE and PREMIUM.`;

// ── Tool Implementations ───────────────────────────────────────────────────────
const tools = {
  async executeCommand({ cmd }) {
    try {
      const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });
      const out = (stdout + stderr).trim();
      return out || "Command executed successfully (no output).";
    } catch (e) {
      return `ERROR: ${e.message}`;
    }
  },

  async writeFile({ filePath, content }) {
    try {
      const dir = path.dirname(filePath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, content, "utf8");
      return `File written successfully: ${filePath}`;
    } catch (e) {
      return `ERROR writing file: ${e.message}`;
    }
  },

  async readFile({ filePath }) {
    try {
      return fs.readFileSync(filePath, "utf8");
    } catch (e) {
      return `ERROR reading file: ${e.message}`;
    }
  },

  async openInBrowser({ filePath }) {
    try {
      const absPath = path.resolve(filePath);
      const platform = process.platform;
      const cmd =
        platform === "darwin"
          ? `open "${absPath}"`
          : platform === "win32"
          ? `start "${absPath}"`
          : `xdg-open "${absPath}"`;
      await execAsync(cmd);
      return `Opened in browser: ${absPath}`;
    } catch (e) {
      return `ERROR opening browser: ${e.message}`;
    }
  },
};

// ── JSON Extraction ─────────────────────────────────────────────────────────────
function extractJSON(raw) {
  // Find outermost { ... } pair
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.substring(start, end + 1));
  } catch {
    return null;
  }
}

// ── Token Budgeting: trim history if messages get large ────────────────────────
function trimHistory(messages) {
  // Keep system + last 12 messages to stay within context limits
  if (messages.length <= 14) return messages;
  const system = messages.slice(0, 1);
  const rest = messages.slice(-12);
  return [...system, ...rest];
}

// ── Agent Loop ─────────────────────────────────────────────────────────────────
async function runAgent(userInput, messages) {
  messages.push({ role: "user", content: userInput });

  let stepCount = 0;
  let spinner;

  while (stepCount < MAX_STEPS) {
    stepCount++;
    spinner = ora({ text: chalk.dim("Thinking..."), spinner: "dots" }).start();

    // Trim history to avoid token overflow
    const trimmedMessages = trimHistory(messages);

    let raw;
    try {
      const response = await groq.chat.completions.create({
        model: MODEL,
        messages: trimmedMessages,
        temperature: 0.2,
        max_tokens: MAX_TOKENS,
        response_format: { type: "json_object" },
      });
      raw = response.choices[0].message.content.trim();
    } catch (err) {
      spinner.fail(chalk.red(`✖ Groq API Error: ${err.status} ${err.message}`));
      break;
    }

    spinner.stop();

    const parsed = extractJSON(raw);
    if (!parsed) {
      console.log(chalk.yellow(`⚠️  Invalid JSON response. Raw: ${raw.slice(0, 100)}`));
      messages.push({
        role: "user",
        content: "Your last response was not valid JSON. Please respond with exactly one JSON object.",
      });
      continue;
    }

    // Normalize schema
    parsed.step = parsed.step || parsed.action;
    parsed.content = parsed.content || parsed.status || parsed.nextAction;

    // ── Push assistant message (Token Saver: truncate large file content) ──
    let historyContent = JSON.stringify(parsed);
    if (parsed.tool_name === "writeFile" && parsed.tool_args?.content?.length > 300) {
      const truncatedArgs = { ...parsed.tool_args, content: "[HTML/CSS/JS content truncated]" };
      historyContent = JSON.stringify({ ...parsed, tool_args: truncatedArgs });
    }
    messages.push({ role: "assistant", content: historyContent });

    // ── Handle each step ────────────────────────────────────────────────────
    if (parsed.step === "OUTPUT") {
      console.log(chalk.green.bold("\n✅ OUTPUT  ") + chalk.white(parsed.content));
      console.log(chalk.dim("\n─".repeat(55)));
      break;
    } else if (parsed.tool_name || parsed.step === "TOOL") {
      const toolName = parsed.tool_name;
      const toolArgs = parsed.tool_args || {};
      
      let filePath = toolArgs.filePath || toolArgs.filename || toolArgs.path || toolArgs.file;
      if (toolArgs.folder && toolArgs.file) filePath = path.join(toolArgs.folder, toolArgs.file);

      let cmd = toolArgs.cmd || toolArgs.command;
      if (toolArgs.args && Array.isArray(toolArgs.args)) {
        cmd += " " + toolArgs.args.join(" ");
      }
      const finalArgs = { ...toolArgs, filePath, cmd };

      console.log(chalk.yellow(`🔧 TOOL   ${toolName} `) + chalk.dim(JSON.stringify(finalArgs).slice(0, 80)));

      const toolFn = tools[toolName];
      let observeContent;
      if (!toolFn) {
        observeContent = `Tool "${toolName}" does not exist. Available tools: executeCommand, writeFile, readFile, openInBrowser.`;
      } else {
        observeContent = await toolFn(finalArgs);
      }

      console.log(chalk.cyan("👁️  OBSERVE ") + chalk.dim(String(observeContent).slice(0, 150)));

      messages.push({
        role: "user",
        content: JSON.stringify({ step: "OBSERVE", content: observeContent }),
      });
    } else if (parsed.step === "START") {
      console.log(chalk.blue.bold("\n🚀 START  ") + chalk.white(parsed.content));
      messages.push({ role: "user", content: "Proceed to next step." });
    } else if (parsed.step === "THINK") {
      console.log(chalk.magenta("💭 THINK  ") + chalk.white(parsed.content));
      messages.push({ role: "user", content: "Proceed to next step." });
    }

    // Rate-limit safety: 5s delay
    await new Promise(r => setTimeout(r, 5000));
  }

  if (stepCount >= MAX_STEPS) {
    console.log(chalk.red("\n⚠️  Max steps reached. Agent stopped."));
  }
}

// ── Banner ─────────────────────────────────────────────────────────────────────
function printBanner() {
  console.log(chalk.cyan(`
╔══════════════════════════════════════════════════════╗
║           🤖  AI Agent CLI Tool  🤖                  ║
║       Powered by Groq + Llama 3.3 70B                ║
║  Type your instruction or "exit" to quit             ║
╚══════════════════════════════════════════════════════╝
`));
}

// ── Main Interactive Loop ──────────────────────────────────────────────────────
async function main() {
  printBanner();

  const messages = [{ role: "system", content: SYSTEM_PROMPT }];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = () => {
    rl.question(chalk.green.bold("\nYou ➜  "), async (input) => {
      input = input.trim();
      if (!input || input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
        console.log(chalk.cyan("\n👋 Goodbye!\n"));
        rl.close();
        return;
      }

      console.log(chalk.dim("\n─".repeat(55)));
      console.log(chalk.cyan("🤖 Agent starting...\n"));

      await runAgent(input, messages);

      ask();
    });
  };

  ask();
}

main();
