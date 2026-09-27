import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, ArrowRight, ExternalLink, RefreshCw, ShoppingBag } from 'lucide-react';
import { streamChat } from '../services/api';

export default function ChatBot({ onSelectProduct, isFullPage = false }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "👋 Hi! I'm your **Multi-Platform AI Shopping Assistant**. Ask me anything like:\n- *\"Which is cheaper: iPhone 15 or Galaxy S24 Ultra?\"*\n- *\"Show me deals under ₹30,000\"*\n- *\"Is Sony WH-1000XM5 a good buy right now?\"*",
      deep_links: []
    }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  const promptSuggestions = [
    "Which retailer has the lowest price for iPhone 15?",
    "Compare MacBook Air M3 prices across stores",
    "Find headphones deals under ₹30,000",
    "Show max savings for Nike Jordan 1"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSend = (textToSend) => {
    const queryText = textToSend || input;
    if (!queryText.trim() || isStreaming) return;

    // Add user message
    const userMsg = { sender: 'user', text: queryText };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsStreaming(true);

    // Add placeholder AI message for streaming text
    const aiMsgIndex = messages.length + 1;
    setMessages(prev => [...prev, { sender: 'ai', text: '', deep_links: [], isStreaming: true }]);

    streamChat(
      queryText,
      (chunk) => {
        setMessages(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (updated[lastIndex] && updated[lastIndex].sender === 'ai') {
            updated[lastIndex].text += chunk;
          }
          return updated;
        });
      },
      (deep_links) => {
        setMessages(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (updated[lastIndex] && updated[lastIndex].sender === 'ai') {
            updated[lastIndex].deep_links = deep_links;
            updated[lastIndex].isStreaming = false;
          }
          return updated;
        });
        setIsStreaming(false);
      },
      (err) => {
        setIsStreaming(false);
      }
    );
  };

  return (
    <div className={`glass-card flex flex-col ${isFullPage ? 'h-[80vh] max-w-5xl mx-auto' : 'h-[550px] shadow-2xl'}`}>
      
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-indigo-500 flex items-center justify-center">
            <Bot className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <span>Shopping AI Assistant</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-[10px] text-slate-300">RAG Vector Engine • Real-Time Deep-Linking</p>
          </div>
        </div>

        <button
          onClick={() => setMessages([messages[0]])}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Reset Chat Thread"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs sm:text-sm text-left">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              </div>
            )}

            <div className={`max-w-[85%] space-y-2`}>
              <div
                className={`p-3.5 rounded-2xl shadow-sm whitespace-pre-wrap leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/60 rounded-tl-none'
                }`}
              >
                {msg.text}
                {msg.isStreaming && <span className="inline-block w-2 h-4 bg-indigo-500 animate-pulse ml-1" />}
              </div>

              {/* Deep-linking action cards inside AI response */}
              {msg.deep_links && msg.deep_links.length > 0 && (
                <div className="space-y-2 pt-1">
                  {msg.deep_links.map((link, lIdx) => (
                    <div
                      key={lIdx}
                      className="p-3 rounded-xl bg-slate-950/90 text-white border border-indigo-500/40 flex items-center justify-between gap-3 shadow-lg"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <ShoppingBag className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-xs truncate block">{link.title}</span>
                          <span className="text-[10px] text-emerald-400 font-semibold">
                            ₹{link.lowest_price?.toLocaleString()} on {link.best_platform}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {onSelectProduct && (
                          <button
                            onClick={() => onSelectProduct(link.product_id)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] rounded-lg transition-colors flex items-center gap-1"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        <a
                          href={link.url && /^https?:\/\//i.test(link.url) ? link.url : `https://${(link.url || '').replace(/^\/+/, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5 text-white">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        {promptSuggestions.map((prompt, pIdx) => (
          <button
            key={pIdx}
            onClick={() => handleSend(prompt)}
            disabled={isStreaming}
            className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap hover:border-indigo-500 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900 rounded-b-2xl"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI shopping assistant..."
          disabled={isStreaming}
          className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl disabled:opacity-50 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
