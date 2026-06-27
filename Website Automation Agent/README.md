# 🤖 AI Website Automation Agent
> **GenAI Assignment 04** — An intelligent, AI-driven browser automation agent powered by **Groq + LLaMA 3.3 70B** and **Playwright**.

---

## 🧠 How It Actually Works

This is a **real agentic loop** — not a hardcoded script:

```
User types anything
      ↓
LLM (Groq/LLaMA 3.3 70B) decides what to do
      ↓
Playwright executes the browser action
      ↓
Page state (URL + title + text) fed back to LLM
      ↓
LLM decides next action … (loops)
      ↓
LLM calls done() → prints AI summary + results
```

---

## ✅ Real Demo Output

```
> node index.js "who won the FIFA World Cup 2022"

  🚀  Task: "who won the FIFA World Cup 2022"

  🤖  LLM chose: search_web({"query":"FIFA World Cup 2022 winner"})
  ✅  Bing search done
  🤖  LLM chose: done({"summary":"Argentina won the FIFA World Cup 2022"})

  🧠  AI Summary:
     Argentina won the FIFA World Cup 2022

  🔎  Top Results:
  1. 2022 FIFA World Cup final - Wikipedia
  2. Argentina vs France 3-3 | FIFA World Cup Qatar 2022™
  ...

  ⏱️  Done in 6.29s
```

---

## 🚀 Setup

### 1. Install dependencies
```bash
npm install
npx playwright install chromium
```

### 2. Add your API key to `.env`
```bash
echo "GROQ_API_KEY=your_key_here" > .env
echo "HEADLESS=false" >> .env
```

### 3. Run it
```bash
node index.js "your search query or URL"
# or interactive mode:
node index.js
```

---

## 💡 What You Can Search

```bash
node index.js "latest AI news"
node index.js "best laptops under 50000 rupees"
node index.js "who is the PM of India"
node index.js "https://github.com/trending"
node index.js "top 10 programming languages 2024"
```

---

## 📁 Project Structure

```
Website_Automation_Agent/
├── agent/
│   ├── agent.js    # Agentic loop — LLM + tools working together
│   ├── llm.js      # Groq/LLaMA 3.3 70B brain — decides next action
│   └── tools.js    # Browser tools (navigate, search, scroll, form fill)
├── utils/
│   └── logger.js   # Coloured terminal logger
├── .env            # GROQ_API_KEY (never committed)
├── index.js        # Interactive CLI entry point
└── package.json
```

---

## 🛠 Available Browser Tools

| Tool | What it does |
|------|-------------|
| `search_web(query)` | Navigate directly to Bing search results |
| `navigate(url)` | Open any URL |
| `scroll_down / scroll_up` | Scroll the page |
| `click_link(text)` | Click a link by its visible text |
| `fill_form_field(hint, val)`| Intelligently find and fill a form input |
| `click_button(label)` | Click a button by its label |
| `take_screenshot(label)` | Capture current browser view |
| `get_page_state(page)` | Extract URL + title + visible text for LLM |
| `get_search_results(page, n)` | Extract top N result titles + URLs from Bing |

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GROQ_API_KEY` | **required** | Your Groq API key |
| `HEADLESS` | `false` | `true` = no visible window |
| `SLOW_MO` | `80` | ms delay between Playwright actions |

---

## 👤 Author

**Prince Shakya** — GenAI Assignment 04
