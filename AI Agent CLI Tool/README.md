# 🤖 AI Agent CLI Tool

A conversational CLI agent — similar to how Cursor or Windsurf work — where you can chat with the agent directly in the terminal. The agent clones the **Scaler Academy** website by generating a fully working HTML/CSS/JS webpage.

## ✨ Features

- 💬 **Conversational interface** — chat naturally in the terminal
- 🧠 **ReAct reasoning loop** — START → THINK → TOOL → OBSERVE → OUTPUT
- 🛠️ **Built-in tools** — execute shell commands, write/read files, open browser
- 🌐 **Website cloning** — generates a Scaler Academy clone (Header + Hero + Footer)
- ⚡ **Powered by Groq + Llama 3.3 70B** — blazing fast inference

## 📦 Setup

```bash
# Install dependencies
npm install

# Make sure .env has your Groq API key
echo "GROQ_API_KEY=your_key_here" > .env
```

## 🚀 Usage

### Interactive Mode (Chat with the agent)
```bash
npm start
```
Then type instructions like:
```
You ➜  Clone the Scaler Academy website
```

## 💡 Example Instructions

| Instruction | What it does |
|---|---|
| `Clone the Scaler Academy website` | Generates a Scaler clone in `scaler_clone/` |
| `Create a todo app in a folder called my_todo` | Builds a full todo app |
| `What files are in the current directory?` | Runs `ls` and explains the output |

## 🏗️ Project Structure

```
AI Agent CLI Tool/
├── index.js          # Main interactive CLI agent
├── package.json      # Dependencies
├── .env              # Groq API key (not committed)
├── .gitignore
├── README.md
└── index.html        # The Scaler Academy clone
```

## 🔁 How the Agent Loop Works

```
User Input
    │
    ▼
┌─────────┐    ┌─────────┐    ┌──────┐    ┌─────────┐    ┌────────┐
│  START  │ →  │  THINK  │ →  │ TOOL │ →  │ OBSERVE │ →  │ OUTPUT │
└─────────┘    └─────────┘    └──────┘    └─────────┘    └────────┘
                   ↑                           │
                   └───────────────────────────┘
                        (loops until done)
```

## 🎯 Assignment Criteria Met

| Criterion | Status |
|---|---|
| CLI tool that accepts natural language | ✅ |
| Agent reasons and takes actions | ✅ ReAct loop implemented |
| Produces working .html file | ✅ scaler_clone/index.html |
| Agent loops (not one-shot) | ✅ Multi-step THINK → TOOL → OBSERVE |
| Looks like Scaler website | ✅ Dark theme, orange accents, Header/Hero/Footer |
