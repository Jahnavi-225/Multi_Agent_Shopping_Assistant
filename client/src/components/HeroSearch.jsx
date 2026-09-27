import React, { useState } from 'react';
import { Search, Sparkles, Link, Zap, ShieldCheck } from 'lucide-react';

export default function HeroSearch({ onSearch, isLoading }) {
  const [query, setQuery] = useState('');

  const sampleProducts = [
    { label: "Designer Kundan Earrings", icon: "💎" },
    { label: "Silk Kanjeevaram Saree", icon: "🥻" },
    { label: "Cotton Double Bedsheet", icon: "🛏️" },
    { label: "iPhone 15 (128GB)", icon: "📱" },
    { label: "Nike Air Jordan 1", icon: "👟" }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handlePasteDemo = (text) => {
    setQuery(text);
    onSearch(text);
  };

  return (
    <div className="relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
      
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-500/10 dark:bg-indigo-500/20 blur-[100px] pointer-events-none rounded-full" />

      {/* Pill Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-6 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
        <span>Free Multi-Platform Price Intelligence Engine</span>
      </div>

      <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-3xl mx-auto leading-tight">
        Never Overpay. Compare Prices Across <span className="gradient-text">Top E-Commerce Retailers</span>.
      </h1>

      <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
        Paste a product link or search title. Our agentic AI scans <strong>Amazon, Flipkart, Myntra, Reliance & Snapdeal</strong> in seconds to locate the lowest verified price.
      </p>

      {/* Search Box Form */}
      <form onSubmit={handleSubmit} className="mt-8 max-w-2xl mx-auto">
        <div className="glass-card p-2 sm:p-2.5 flex flex-col sm:flex-row items-center gap-2 border-indigo-500/30 focus-within:border-indigo-500 shadow-2xl transition-all">
          
          <div className="flex items-center gap-2 px-3 w-full sm:flex-1">
            <Link className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Paste Amazon/Flipkart URL or enter product name..."
              className="w-full bg-transparent border-none text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-0 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition-all flex-shrink-0"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Searching Retailers...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Compare Prices</span>
              </>
            )}
          </button>

        </div>
      </form>

      {/* Preset Search Chips */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="text-slate-400 flex items-center gap-1 font-medium">
          <Zap className="w-3.5 h-3.5 text-amber-400" /> Popular Demo Searches:
        </span>
        {sampleProducts.map((prod, i) => (
          <button
            key={i}
            onClick={() => handlePasteDemo(prod.label)}
            className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 transition-colors"
          >
            {prod.icon} {prod.label}
          </button>
        ))}
      </div>

      {/* Feature Badges */}
      <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left max-w-3xl mx-auto pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>Real-time Retailer Scan</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>100% Free & Open-Source</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>RAG AI Chatbot Assistant</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>APScheduler Price Tracker</span>
        </div>
      </div>

    </div>
  );
}
