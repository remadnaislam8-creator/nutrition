"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

interface Message {
  id?: number;
  role: "user" | "bot";
  content: string;
  createdAt?: string;
}

const WELCOME_MESSAGE: Message = {
  role: "bot",
  content: `🥗 أهلاً بك يا بطل! أنا مساعدك الذكي المتخصص في:

💪 **الانتقال من السمنة إلى النحافة**
🍽️ **تنظيم الأكل الصحي** (الطهي بالبخار والابتعاد عن الغازيات)
💊 **المكملات الغذائية** المناسبة للتنشيف

اسألني أي سؤال وسأكون سعيداً بمساعدتك! 🌟`,
};

function formatMessage(text: string) {
  // Convert **bold** to <strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

const QUICK_QUESTIONS = [
  "ما أفضل مكملات التنشيف؟",
  "ما هو نظام الأكل الصحي؟",
  "كيف أتخلص من السمنة؟",
  "ما تمارين حرق الدهون؟",
  "كيف أحسب سعراتي؟",
  "ما فوائد الطهي بالبخار؟",
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("chatSessionId");
      if (stored) return stored;
      const newId = uuidv4();
      sessionStorage.setItem("chatSessionId", newId);
      return newId;
    }
    return uuidv4();
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load previous messages on mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await fetch(`/api/chat?sessionId=${sessionId}`);
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages([
            WELCOME_MESSAGE,
            ...data.messages.map((m: Message) => ({
              role: m.role,
              content: m.content,
            })),
          ]);
        }
      } catch {
        // ignore, show welcome only
      }
    };
    loadMessages();
  }, [sessionId]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const messageText = (text ?? input).trim();
      if (!messageText || loading) return;

      const userMsg: Message = { role: "user", content: messageText };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, message: messageText }),
        });
        const data = await res.json();
        const botMsg: Message = { role: "bot", content: data.reply };
        setMessages((prev) => [...prev, botMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            content: "⚠️ عذراً، حدث خطأ. يرجى المحاولة مجدداً.",
          },
        ]);
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [input, loading, sessionId]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    sessionStorage.removeItem("chatSessionId");
    window.location.reload();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: "url('/images/nutrition-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Chat Container */}
      <div
        className="relative w-full max-w-lg flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ height: "min(700px, 92vh)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{
            background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl shadow-lg">
              🥗
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">
                مستشار التنحيف والتغذية
              </h1>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                <span className="text-green-200 text-xs">متصل الآن</span>
              </div>
            </div>
          </div>
          <button
            onClick={clearChat}
            title="محادثة جديدة"
            className="text-white/70 hover:text-white transition-colors text-sm flex items-center gap-1 bg-white/10 hover:bg-white/20 rounded-full px-3 py-1.5"
          >
            <span>🔄</span>
            <span className="text-xs">جديد</span>
          </button>
        </div>

        {/* Quick Questions Bar */}
        <div
          className="flex gap-2 px-4 py-2.5 overflow-x-auto"
          style={{ backgroundColor: "#e8f5e9", borderBottom: "1px solid #c8e6c9" }}
        >
          {QUICK_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => sendMessage(q)}
              disabled={loading}
              className="whitespace-nowrap text-xs px-3 py-1.5 rounded-full border border-green-600 text-green-800 bg-white hover:bg-green-600 hover:text-white transition-all duration-200 font-medium flex-shrink-0 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto p-4 chat-scroll flex flex-col gap-3"
          style={{ backgroundColor: "#fafafa" }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex message-enter ${
                msg.role === "user" ? "justify-start" : "justify-end"
              }`}
            >
              {msg.role === "bot" && (
                <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-sm ml-2 flex-shrink-0 self-end mb-1">
                  🥗
                </div>
              )}
              <div
                className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "text-white rounded-bl-sm"
                    : "text-green-900 rounded-br-sm"
                }`}
                style={{
                  backgroundColor:
                    msg.role === "user" ? "#2e7d32" : "#e8f5e9",
                  border: msg.role === "bot" ? "1px solid #c8e6c9" : "none",
                  whiteSpace: "pre-line",
                }}
              >
                {formatMessage(msg.content)}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm mr-2 flex-shrink-0 self-end mb-1">
                  👤
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex justify-end items-end gap-2 message-enter">
              <div
                className="px-4 py-3 rounded-2xl rounded-br-sm shadow-sm"
                style={{ backgroundColor: "#e8f5e9", border: "1px solid #c8e6c9" }}
              >
                <div className="flex gap-1.5 items-center">
                  <div className="dot w-2 h-2 rounded-full bg-green-600" />
                  <div className="dot w-2 h-2 rounded-full bg-green-600" />
                  <div className="dot w-2 h-2 rounded-full bg-green-600" />
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-sm">
                🥗
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          className="px-4 py-3 flex items-center gap-3"
          style={{ backgroundColor: "#ffffff", borderTop: "1px solid #e0e0e0" }}
        >
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="btn-glow flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-white font-bold transition-all duration-200 disabled:opacity-40 shadow-md"
            style={{
              background: "linear-gradient(135deg, #2e7d32, #43a047)",
            }}
            title="إرسال"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 rotate-180"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب سؤالك هنا (مثل: ما أفضل مكملات التنشيف؟)..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-full outline-none text-sm text-gray-800 disabled:opacity-60"
            style={{
              border: "1.5px solid #c8e6c9",
              backgroundColor: "#f9fbe7",
              fontFamily: "'Cairo', sans-serif",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#2e7d32")}
            onBlur={(e) => (e.target.style.borderColor = "#c8e6c9")}
          />
        </div>

        {/* Footer */}
        <div
          className="text-center py-2 text-xs"
          style={{ backgroundColor: "#f1f8e9", color: "#558b2f" }}
        >
          🌿 نصائح تغذوية للأغراض التوعوية فقط – استشر طبيبك دائماً
        </div>
      </div>
    </div>
  );
}
