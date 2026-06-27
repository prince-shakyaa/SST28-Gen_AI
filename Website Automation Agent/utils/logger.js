/**
 * logger.js
 * =========
 * Lightweight coloured console logger.
 * Outputs to terminal only — no log files created.
 *
 * Levels: DEBUG < INFO < WARN < ERROR < STEP
 */

// ── ANSI colour codes ──────────────────────────────────────────────────────────
const C = {
  RESET: "\x1b[0m",
  DIM:   "\x1b[2m",
  DEBUG: "\x1b[36m",  // cyan
  INFO:  "\x1b[32m",  // green
  WARN:  "\x1b[33m",  // yellow
  ERROR: "\x1b[31m",  // red
  STEP:  "\x1b[35m",  // magenta
};

function write(level, message) {
  const ts   = new Date().toISOString();
  const col  = C[level] ?? C.RESET;
  console.log(`${C.DIM}[${ts}]${C.RESET} ${col}[${level}]${C.RESET} ${message}`);
}

const logger = {
  debug: (msg) => write("DEBUG", msg),
  info:  (msg) => write("INFO",  msg),
  warn:  (msg) => write("WARN",  msg),
  error: (msg) => write("ERROR", msg),
  step:  (msg) => write("STEP",  msg),
  // kept for compatibility — returns empty string now
  getLogFile: () => "",
};

module.exports = logger;
