import React, { useState } from 'react';
import { Bot, X, Sparkles, Minimize2 } from 'lucide-react';
import ChatBot from './ChatBot';

export default function ChatWidget({ onSelectProduct }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 text-left">
      {/* Expanded Floating Chat Popover Window */}
      {isOpen ? (
        <div className="w-[360px] sm:w-[420px] h-[550px] shadow-2xl rounded-2xl overflow-hidden glass-card border-indigo-500/40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="relative h-full flex flex-col">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 z-20 transition-colors"
              title="Minimize Chat"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <ChatBot onSelectProduct={(pId) => { setIsOpen(false); onSelectProduct && onSelectProduct(pId); }} />
          </div>
        </div>
      ) : (
        /* Floating Button Idle State */
        <button
          onClick={() => setIsOpen(true)}
          className="group relative p-3.5 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500 text-white shadow-2xl shadow-indigo-500/40 hover:scale-105 transition-all duration-300 flex items-center gap-2"
          title="Open AI Shopping Assistant"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-tight pr-1 hidden group-hover:inline transition-all">
            AI Assistant
          </span>
          <Sparkles className="w-4 h-4 text-emerald-300 animate-spin" />
        </button>
      )}
    </div>
  );
}
