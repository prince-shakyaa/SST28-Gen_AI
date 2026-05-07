"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Send, FileText, Bot, User, Loader2, Plus, Trash2, Github, ExternalLink } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type UploadedFile = {
  name: string;
  id: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Welcome to **NotebookLM Pro**. Upload a document to start a grounded conversation." }
  ]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setFiles([{ name: file.name, id: Date.now().toString() }]);
        setMessages(prev => [...prev, { role: "assistant", content: `Successfully indexed **${file.name}**. I am now ready to answer your questions using this source.` }]);
      } else {
        const err = await res.json();
        setMessages(prev => [...prev, { role: "assistant", content: `Error: ${err.error || "Failed to process document."}` }]);
      }
    } catch (error: any) {
      console.error("Frontend Upload Error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: `❌ Upload failed: ${error.message || "Unknown error"}. Check console for details.` }]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.answer || "No response received." }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: "assistant", content: "I encountered an error while retrieving the answer." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <main className="container">
      <header>
        <div className="logo">NotebookLM Pro</div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <a href="#" className="nav-link" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Documentation</a>
          <Github size={20} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
          <div className="avatar" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', width: '32px', height: '32px', borderRadius: '50%' }}></div>
        </div>
      </header>

      <div className="main-content">
        <aside className="sidebar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SOURCES</h3>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="send-btn" 
              style={{ width: '28px', height: '28px' }}
            >
              <Plus size={14} />
            </button>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            style={{ display: 'none' }} 
            accept=".pdf,.txt,.md"
          />

          <div className="file-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {isUploading && (
              <div className="file-item" style={{ borderColor: 'var(--primary)', opacity: 0.8 }}>
                <Loader2 className="loader" size={16} />
                <span style={{ fontSize: '0.8rem' }}>Analyzing document...</span>
              </div>
            )}

            <AnimatePresence>
              {files.map(file => (
                <motion.div 
                  key={file.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="file-item"
                >
                  <FileText size={16} color="var(--accent)" />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                  <Trash2 size={14} style={{ cursor: 'pointer', opacity: 0.4 }} onClick={() => setFiles([])} />
                </motion.div>
              ))}
            </AnimatePresence>

            {files.length === 0 && !isUploading && (
              <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                <Upload size={20} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Upload PDF or TXT to begin</p>
              </div>
            )}
          </div>

          <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Bot size={14} color="var(--accent)" />
              <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>SYSTEM STATUS</span>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Powered by Groq Llama 3 & LangChain. Retrieval-Augmented Generation enabled.
            </p>
          </div>
        </aside>

        <section className="chat-area">
          <div className="messages">
            {messages.map((msg, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`message ${msg.role}`}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  {msg.role === "assistant" ? <Bot size={18} style={{ marginTop: '4px', color: 'var(--accent)' }} /> : <User size={18} style={{ marginTop: '4px' }} />}
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{msg.content}</div>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="message assistant">
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div className="loader" style={{ width: '12px', height: '12px', borderWidth: '1px' }}></div>
                  <span style={{ opacity: 0.5, fontSize: '0.85rem' }}>NotebookLM is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-wrapper">
            <div className="input-container">
              <input 
                type="text" 
                placeholder={files.length > 0 ? "Ask anything about your document..." : "Please upload a source document first"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={files.length === 0 || isTyping}
              />
              <button 
                className="send-btn" 
                onClick={handleSend}
                disabled={!input.trim() || isTyping || files.length === 0}
              >
                {isTyping ? <Loader2 className="loader" size={18} /> : <Send size={18} />}
              </button>
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
              NotebookLM can make mistakes. Verify important information from your source.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
