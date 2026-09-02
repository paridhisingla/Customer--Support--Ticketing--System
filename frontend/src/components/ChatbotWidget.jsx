import React, { useState } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, Plus, CheckCircle2 } from 'lucide-react';

const KNOWLEDGE_RESPONSES = [
  {
    keywords: ['api', '500', 'error', 'status', 'gateway'],
    answer: "If you are encountering API 500 errors, our engineers monitor server metrics actively. Please make sure your Authorization token is valid. Would you like me to open a Critical Technical Ticket for you?",
    suggestedSubject: "Production API error 500",
    suggestedCategory: "Technical",
  },
  {
    keywords: ['billing', 'invoice', 'charge', 'refund', 'payment', 'card'],
    answer: "Invoices and subscription receipts can be managed in your billing portal. For refund requests or duplicate charges, our finance team reviews them within 6 hours. I can prepare a Billing ticket for you!",
    suggestedSubject: "Billing inquiry regarding recent charge",
    suggestedCategory: "Billing",
  },
  {
    keywords: ['password', 'login', 'sso', '2fa', 'reset', 'auth'],
    answer: "You can reset your password anytime via the Forgot Password link or enable Okta/Google SSO from team settings. Shall we raise an Account Access ticket?",
    suggestedSubject: "Account access and login assistance",
    suggestedCategory: "Account",
  },
];

export const ChatbotWidget = ({ onOpenTicketForm }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "👋 Hi there! I'm DeskBot, your AI Support Assistant. Ask me a question, or let me know what issue you are facing to quickly raise a ticket.",
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: input };
    const query = input.toLowerCase();

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Match FAQ
    setTimeout(() => {
      let matched = null;
      for (const item of KNOWLEDGE_RESPONSES) {
        if (item.keywords.some((kw) => query.includes(kw))) {
          matched = item;
          break;
        }
      }

      if (matched) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: matched.answer,
            action: {
              label: `Create ${matched.suggestedCategory} Ticket`,
              subject: matched.suggestedSubject,
              description: userMsg.text,
            },
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: "I've analyzed your question. To get direct help from our specialist team, click below to open a tracked support ticket with automatic triage!",
            action: {
              label: 'Raise Support Ticket',
              subject: userMsg.text.slice(0, 50),
              description: userMsg.text,
            },
          },
        ]);
      }
    }, 600);
  };

  const handleActionClick = (action) => {
    if (onOpenTicketForm) {
      onOpenTicketForm(action.subject, action.description);
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-full shadow-neon hover:scale-105 transition-all duration-300 group"
        >
          <div className="relative">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950 animate-ping"></span>
          </div>
          <span className="text-sm font-semibold pr-1">Ask AI Support</span>
        </button>
      )}

      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col backdrop-blur-xl overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  DeskBot Assistant
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </h4>
                <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Instant Triage Active
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.action && (
                  <button
                    onClick={() => handleActionClick(msg.action)}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium rounded-xl transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-400" />
                    {msg.action.label}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-slate-950/80 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything or describe your problem..."
              className="flex-1 bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
