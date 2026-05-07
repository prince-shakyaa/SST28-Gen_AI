# Scaler Persona Chat 🤖

A persona-based AI chatbot that lets you have real conversations with three Scaler/InterviewBit personalities — **Anshuman Singh**, **Abhimanyu Saxena**, and **Kshitij Mishra** — powered by the **Groq API (Llama 3)**.

Built as Assignment 01 for the Prompt Engineering module at Scaler Academy (SST28).

---

## 🚀 Live Demo

**[→ View Live App](https://persona-ai-chatbot-theta.vercel.app)**

---

## ✨ Features

- 💬 **3 distinct AI personas** with deeply researched system prompts
- 🔄 **Persona switching** — resets conversation context automatically
- 💡 **Suggestion chips** — quick-start questions per persona
- ⌨️ **Typing indicator** while API call is in progress
- 📱 **Fully responsive** — works on mobile and desktop
- ⚠️ **Graceful error handling** — user-friendly messages on API failures
- 🌙 **Dark glassmorphism UI** — premium design with micro-animations
- 🔒 **Secure** — API key stored in environment variable, never in source

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, Vanilla CSS, Vanilla JS (ES Modules) |
| Bundler | Vite 6 |
| AI API | Groq API (Llama 3 8B) |
| Markdown | marked.js |
| Deployment | Vercel |

---

## 📂 Project Structure

```
persona-based-ai-chatbot/
├── index.html          # Main HTML — semantic, accessible
├── style.css           # Dark glassmorphism design system
├── main.js             # App logic: API, persona switching, UI
├── personas.js         # All 3 system prompts (deeply researched)
├── vite.config.js      # Vite config
├── package.json
├── .env.example        # Template — copy to .env and add your key
├── .gitignore          # .env is excluded
├── README.md           # This file
├── prompts.md          # System prompt design document
└── reflection.md       # 430-word reflection essay
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- A [Groq API key](https://console.groq.com/keys) (free)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/prince-shakyaa/SST28-Gen_AI.git
cd SST28-Gen_AI

# 2. Install dependencies
npm install

# 3. Set up environment variable
cp .env.example .env
# Edit .env and add your Groq API key:
# VITE_GROQ_API_KEY=your_key_here

# 4. Run development server
npm run dev
# → Open http://localhost:5173
```

---

## 🚢 Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variable in Vercel dashboard:
# Settings → Environment Variables → VITE_GROQ_API_KEY = your_key
```

Or connect your GitHub repo to [vercel.com](https://vercel.com) and set the env variable in the dashboard.

---

## 👥 The Three Personas

### 🚀 Anshuman Singh
Co-founder of Scaler & InterviewBit. 2x ACM ICPC World Finalist from IIIT Hyderabad. Former Facebook engineer (London). The visionary — expansive, data-driven, story-first.

### 💡 Abhimanyu Saxena
Co-founder of InterviewBit & Scaler. IIIT Hyderabad CS grad. Former Fab.com engineer (New York). The measured pragmatist — precise, values-driven, anti-hype.

### 🧠 Kshitij Mishra
Head of Instructors at Scaler School of Technology. Lead DSA instructor. IIIT Hyderabad. The Socratic teacher — builds intuition, not memorization.

---

## 📋 System Prompt Design

See **[prompts.md](./prompts.md)** for a full annotated breakdown of each system prompt — what was chosen, why, and how the GIGO principle shaped every decision.

---

## 🔐 Security

- **Never** commit your `.env` file — it's in `.gitignore`
- Use `.env.example` as a template (contains no real keys)
- The API key is accessed only via `import.meta.env.VITE_GROQ_API_KEY` (Vite's secure env injection)

---

## 📸 Screenshots

<!-- Add screenshots after deployment -->

---

*Scaler Academy | Prompt Engineering | SST28 Gen AI | Assignment 01*
