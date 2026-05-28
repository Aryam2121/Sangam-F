import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { buildApiUrl } from "../config/api";

const languageLabels = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  hi: "Hindi",
};

const quickPrompts = [
  "Summarize dashboard status",
  "What should I prioritize today?",
  "How can we reduce project delays?",
];

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState("en");
  const [conversation, setConversation] = useState([
    {
      id: "welcome",
      sender: "bot",
      text: "Hello, I am Sangam Assistant. Ask anything about your projects, tasks, and planning.",
      time: new Date().toISOString(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [assistantMode, setAssistantMode] = useState("live");

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const canSend = useMemo(() => message.trim().length > 0 && !loading, [message, loading]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [conversation, loading, isOpen]);

  const pushMessage = (sender, text) => {
    setConversation((prev) => [
      ...prev,
      {
        id: `${sender}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sender,
        text,
        time: new Date().toISOString(),
      },
    ]);
  };

  const sendMessage = async (rawText) => {
    const trimmed = rawText.trim();
    if (!trimmed || loading) return;

    setError("");
    setMessage("");
    pushMessage("user", trimmed);

    setLoading(true);
    try {
      const response = await axios.post(buildApiUrl("/api/assistant/chat"), {
        message: trimmed,
        language,
      });

      const reply = response.data?.reply || "No response from assistant.";
      setAssistantMode(response.data?.mode || "live");
      pushMessage("bot", reply);
    } catch (requestError) {
      const fallback =
        requestError?.response?.data?.error?.message ||
        requestError.message ||
        "Sorry, something went wrong while generating a reply.";
      setError(fallback);
      pushMessage("bot", "I could not process that request right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendMessage(message);
  };

  const handleQuickPrompt = async (prompt) => {
    await sendMessage(prompt);
  };

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  if (!portalTarget) {
    return null;
  }

  return createPortal(
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[10040] bg-slate-950/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-5 right-5 z-[10050] sm:bottom-8 sm:right-8">
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <motion.button
              key="launcher"
              type="button"
              onClick={() => setIsOpen(true)}
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.9 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="group relative h-16 w-16 overflow-hidden rounded-[1.2rem] border border-white/20 bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 text-white shadow-[0_22px_40px_rgba(2,6,23,0.45)]"
              aria-label="Open assistant"
            >
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_45%)]" />
              <span className="relative block text-xl font-bold tracking-tight">AI</span>
            </motion.button>
          ) : (
            <motion.section
              key="panel"
              initial={{ opacity: 0, y: 22, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 22, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-[calc(100vw-1.5rem)] max-w-[24rem] overflow-hidden rounded-[1.3rem] border border-white/15 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100 shadow-[0_28px_60px_rgba(2,6,23,0.7)] sm:max-w-[27rem]"
              role="dialog"
              aria-label="Sangam Assistant"
            >
              <header className="border-b border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.26em] text-cyan-300">Assistant</p>
                    <h2 className="mt-1 text-xl font-semibold text-white">Sangam AI</h2>
                    <p className="mt-1 text-xs text-slate-300">Smart help for infrastructure workflows</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl border border-white/15 bg-white/5 px-2.5 py-1 text-lg leading-none text-slate-300 hover:bg-white/10"
                    aria-label="Close assistant"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <label htmlFor="chatbot-language" className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Language
                  </label>
                  <select
                    id="chatbot-language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="h-9 flex-1 rounded-xl border border-white/10 bg-slate-800/80 px-3 text-sm text-slate-100"
                  >
                    {Object.entries(languageLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <span className="rounded-full border border-cyan-300/25 bg-cyan-400/15 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-cyan-100">
                    {assistantMode === "gemini" ? "Live AI" : "Live Data"}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleQuickPrompt(prompt)}
                      className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[11px] text-cyan-100 hover:bg-cyan-400/20"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </header>

              <div ref={scrollRef} className="h-[19rem] overflow-y-auto bg-slate-950/40 p-4">
                {conversation.map((msg) => (
                  <div
                    key={msg.id}
                    className={`mb-3 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
                        msg.sender === "user"
                          ? "bg-cyan-500 text-slate-950"
                          : "border border-white/10 bg-white/5 text-slate-100"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="mb-3 flex justify-start">
                    <div className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 [animation-delay:220ms]" />
                    </div>
                  </div>
                )}
              </div>

              <footer className="border-t border-white/10 bg-white/[0.03] p-4">
                {error && <p className="mb-2 text-xs text-rose-300">{error}</p>}
                <form className="flex items-center gap-2" onSubmit={handleSubmit}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message"
                    className="h-11 flex-1 rounded-xl border border-white/10 bg-slate-800/80 px-3 text-sm text-slate-100 placeholder-slate-400"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={!canSend}
                    className="h-11 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-4 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Sending" : "Send"}
                  </button>
                </form>
              </footer>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </>,
    portalTarget
  );
};

export default Chatbot;
