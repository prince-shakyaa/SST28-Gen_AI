/**
 * main.js — Scaler Persona Chat
 *
 * Responsibilities:
 *  - Persona switching (resets conversation, updates UI)
 *  - Gemini API calls with full system prompt injection
 *  - Typing indicator, error handling, suggestion chips
 *  - Auto-resizing textarea, char counter, Enter-to-send
 *  - Markdown rendering via marked.js
 */

import { personas, personaOrder } from './personas.js';
import { marked } from 'marked';

// ─── Marked config ──────────────────────────────────────────────────────────
marked.setOptions({ breaks: true, gfm: true });

// ─── State ───────────────────────────────────────────────────────────────────
let currentPersonaId = 'anshuman';
let conversationHistory = [];   // [{role:'user'|'model', parts:[{text}]}]
let isLoading = false;

// ─── DOM refs ────────────────────────────────────────────────────────────────
const messagesArea     = document.getElementById('messages-area');
const userInput        = document.getElementById('user-input');
const sendBtn          = document.getElementById('send-btn');
const chipsList        = document.getElementById('chips-list');
const clearChatBtn     = document.getElementById('clear-chat-btn');
const errorToast       = document.getElementById('error-toast');
const toastMessage     = document.getElementById('toast-message');
const toastCloseBtn    = document.getElementById('toast-close-btn');
const charCount        = document.getElementById('char-count');
const activeAvatar     = document.getElementById('active-avatar');
const activeName       = document.getElementById('active-name');
const activeRole       = document.getElementById('active-role');
const activeTagline    = document.getElementById('active-tagline');
const chatAvatar       = document.getElementById('chat-avatar');
const chatPersonaName  = document.getElementById('chat-persona-name');

// ─── API ──────────────────────────────────────────────────────────────────────
const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function callGroq(userMessage) {
  const persona = personas[currentPersonaId];

  const requestBody = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: persona.systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ],
    temperature: 0.85,
    top_p: 0.95,
    max_tokens: 1024,
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const msg = errData?.error?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();

  // Extract text from response
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response received from Groq.');

  return text;
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────
function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function createMsgEl(role, content, avatarStyle, avatarText) {
  const wrap = document.createElement('div');
  wrap.className = `message ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.style.cssText = role === 'ai' ? avatarStyle : '';
  avatar.textContent = role === 'ai' ? avatarText : '👤';

  const msgContent = document.createElement('div');
  msgContent.className = 'msg-content';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  if (role === 'ai') {
    bubble.innerHTML = marked.parse(content);
  } else {
    bubble.textContent = content;
  }

  const time = document.createElement('div');
  time.className = 'msg-time';
  time.textContent = getTime();

  msgContent.appendChild(bubble);
  msgContent.appendChild(time);

  wrap.appendChild(avatar);
  wrap.appendChild(msgContent);
  return wrap;
}

function addMessage(role, content) {
  const persona = personas[currentPersonaId];
  const avatarStyle = `background:${persona.gradient}`;
  const el = createMsgEl(role, content, avatarStyle, persona.avatar);
  messagesArea.appendChild(el);
  scrollToBottom();
  return el;
}

function showTypingIndicator() {
  const wrap = document.createElement('div');
  wrap.className = 'message ai typing-msg';
  wrap.id = 'typing-indicator';

  const persona = personas[currentPersonaId];
  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.style.background = persona.gradient;
  avatar.textContent = persona.avatar;

  const bubble = document.createElement('div');
  bubble.className = 'typing-bubble';
  bubble.setAttribute('aria-label', `${persona.name} is typing`);
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.className = 'typing-dot';
    bubble.appendChild(dot);
  }

  wrap.appendChild(avatar);
  wrap.appendChild(bubble);
  messagesArea.appendChild(wrap);
  scrollToBottom();
}

function removeTypingIndicator() {
  document.getElementById('typing-indicator')?.remove();
}

function scrollToBottom() {
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

function showWelcome() {
  const persona = personas[currentPersonaId];
  messagesArea.innerHTML = '';

  const welcome = document.createElement('div');
  welcome.className = 'welcome-msg';
  welcome.innerHTML = `
    <div class="welcome-emoji">${persona.emoji}</div>
    <div class="welcome-name">${persona.name}</div>
    <div class="welcome-desc">
      <strong>${persona.role}</strong><br/>
      ${getWelcomeText(currentPersonaId)}
    </div>
  `;
  messagesArea.appendChild(welcome);
}

function getWelcomeText(id) {
  const texts = {
    anshuman: `Hi there! I'm Anshuman. I co-founded Scaler & InterviewBit to give every engineer the education system they deserve — regardless of their college. Ask me anything about Scaler, your career, building products, or the future of tech education.`,
    abhimanyu: `Hey! Abhimanyu here. From IIIT Hyderabad to Fab.com New York to co-founding InterviewBit and Scaler — I've been in the trenches. Ask me about skills vs. credentials, startup building, hiring, or your career roadmap.`,
    kshitij: `Hey! I'm Kshitij, Head of Instructors at SST and your DSA guide. I don't believe in memorizing solutions — I believe in building intuition. Ask me about any DSA topic, interview prep strategy, or how to actually get better at problem-solving.`,
  };
  return texts[id];
}

function renderChips() {
  const persona = personas[currentPersonaId];
  chipsList.innerHTML = '';
  persona.chips.forEach((text) => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = text;
    chip.setAttribute('role', 'listitem');
    chip.setAttribute('aria-label', `Ask: ${text}`);
    chip.addEventListener('click', () => {
      if (isLoading) return;
      userInput.value = text;
      handleSend();
    });
    chipsList.appendChild(chip);
  });
}

function updatePersonaUI() {
  const persona = personas[currentPersonaId];

  // Sidebar info box
  activeAvatar.style.background = persona.gradient;
  activeAvatar.textContent = persona.avatar;
  activeName.textContent = persona.name;
  activeRole.textContent = persona.role;
  activeTagline.textContent = `"${persona.tagline}"`;

  // Chat header
  chatAvatar.style.background = persona.gradient;
  chatAvatar.textContent = persona.avatar;
  chatPersonaName.textContent = persona.name;

  // Input placeholder
  userInput.placeholder = `Ask ${persona.name.split(' ')[0]} anything…`;

  // Persona buttons
  personaOrder.forEach((id) => {
    const btn = document.getElementById(`persona-btn-${id}`);
    if (btn) {
      btn.classList.toggle('active', id === currentPersonaId);
      btn.setAttribute('aria-selected', id === currentPersonaId ? 'true' : 'false');
    }
  });
}

// ─── Toast ────────────────────────────────────────────────────────────────────
let toastTimer = null;
function showError(msg) {
  toastMessage.textContent = msg;
  errorToast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => errorToast.classList.remove('visible'), 6000);
}

toastCloseBtn.addEventListener('click', () => errorToast.classList.remove('visible'));

// ─── Send Message ─────────────────────────────────────────────────────────────
async function handleSend() {
  const text = userInput.value.trim();
  if (!text || isLoading) return;

  isLoading = true;
  sendBtn.disabled = true;
  userInput.disabled = true;
  // Hide chips after first message
  if (conversationHistory.length === 0) {
    document.getElementById('chips-area').style.display = 'none';
  }

  // Clear welcome if present
  const welcome = messagesArea.querySelector('.welcome-msg');
  if (welcome) welcome.remove();

  // Add user message to UI
  addMessage('user', text);

  userInput.value = '';
  userInput.style.height = 'auto';
  charCount.textContent = '0 / 2000';
  charCount.className = 'char-count';

  // Show typing
  showTypingIndicator();

  try {
    const reply = await callGroq(text);

    // Update conversation history
    conversationHistory.push({ role: 'user',  content: text });
    conversationHistory.push({ role: 'assistant', content: reply });

    removeTypingIndicator();
    addMessage('ai', reply);
  } catch (err) {
    removeTypingIndicator();
    const errMsg = err.message?.includes('API key')
      ? 'Invalid API key. Please check your .env file.'
      : err.message?.includes('quota')
      ? 'API quota exceeded. Please try again later.'
      : err.message || 'Something went wrong. Please try again.';
    showError(errMsg);
    // Show a fallback error message in chat
    addMessage('ai', `⚠️ *I'm having trouble connecting right now.* ${errMsg}\n\nPlease try again in a moment.`);
  } finally {
    isLoading = false;
    sendBtn.disabled = userInput.value.trim().length === 0;
    userInput.disabled = false;
    userInput.focus();
  }
}

// ─── Input handlers ───────────────────────────────────────────────────────────
userInput.addEventListener('input', () => {
  // Auto-resize
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 150) + 'px';

  // Char count
  const len = userInput.value.length;
  charCount.textContent = `${len} / 2000`;
  charCount.className = 'char-count' + (len > 1800 ? ' danger' : len > 1500 ? ' warn' : '');

  // Enable/disable send
  sendBtn.disabled = userInput.value.trim().length === 0 || isLoading;
});

userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) handleSend();
  }
});

sendBtn.addEventListener('click', handleSend);

// ─── Persona switching ────────────────────────────────────────────────────────
personaOrder.forEach((id) => {
  const btn = document.getElementById(`persona-btn-${id}`);
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (id === currentPersonaId) return;
    currentPersonaId = id;
    conversationHistory = [];
    document.getElementById('chips-area').style.display = '';
    updatePersonaUI();
    showWelcome();
    renderChips();
    userInput.focus();
  });
});

// ─── Clear chat ───────────────────────────────────────────────────────────────
clearChatBtn.addEventListener('click', () => {
  conversationHistory = [];
  document.getElementById('chips-area').style.display = '';
  showWelcome();
  renderChips();
});

// ─── Init ─────────────────────────────────────────────────────────────────────
function init() {
  updatePersonaUI();
  showWelcome();
  renderChips();
  userInput.focus();

  // Validate API key at startup
  if (!API_KEY || API_KEY === 'your_groq_api_key_here') {
    showError('No Groq API key found. Add VITE_GROQ_API_KEY to your .env file.');
  }
}

init();
