import React, { useState, useEffect } from 'react';
import { ShoppingBag, Sparkles, TrendingDown, Zap, ArrowRight, BarChart3, Bot, CheckCircle2, Moon, Sun } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

// Lightweight Confetti Particle Burst Component
function PriceConfettiBurst({ shouldReduceMotion }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const symbols = ['₹', '✨', '🏷️', '%', '⚡', '₹'];
    const generated = Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      symbol: symbols[i % symbols.length],
      x: (Math.random() - 0.5) * 160,
      y: -Math.random() * 120 - 40,
      rotation: (Math.random() - 0.5) * 180,
      scale: Math.random() * 0.5 + 0.7,
      delay: Math.random() * 0.3
    }));
    setParticles(generated);
  }, [shouldReduceMotion]);

  if (shouldReduceMotion || particles.length === 0) return null;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, scale: 0.4, rotate: 0 }}
          animate={{
            opacity: [1, 1, 0],
            x: p.x,
            y: p.y,
            scale: p.scale,
            rotate: p.rotation
          }}
          transition={{
            duration: 1.6,
            delay: p.delay,
            ease: [0.16, 1, 0.3, 1]
          }}
          className="absolute text-xs font-bold text-indigo-500 dark:text-emerald-400 select-none shadow-sm"
        >
          {p.symbol}
        </motion.span>
      ))}
    </div>
  );
}

export default function LandingPage({ onGetStarted }) {
  const { theme, setTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  const dealHighlights = [
    {
      title: "Apple iPhone 15 (128 GB)",
      lowestPrice: "₹60,553",
      store: "Amazon",
      originalPrice: "₹63,689",
      savings: "₹3,136",
      dealScore: 94,
      badge: "Best Value"
    },
    {
      title: "Samsung Galaxy S24 Ultra",
      lowestPrice: "₹1,24,990",
      store: "Flipkart",
      originalPrice: "₹1,34,999",
      savings: "₹10,009",
      dealScore: 98,
      badge: "Lowest Ever"
    },
    {
      title: "Sony WH-1000XM5 Headphones",
      lowestPrice: "₹26,990",
      store: "Croma",
      originalPrice: "₹34,990",
      savings: "₹8,000",
      dealScore: 91,
      badge: "Price Drop"
    }
  ];

  const features = [
    {
      icon: <BarChart3 className="w-5 h-5 text-indigo-500" />,
      title: "Multi-Store Comparison Grid",
      desc: "Compare real-time prices across Amazon, Flipkart, Myntra, Croma, Reliance Digital, and Snapdeal."
    },
    {
      icon: <Bot className="w-5 h-5 text-purple-500" />,
      title: "RAG AI Shopping Assistant",
      desc: "Ask conversational questions and get instant recommendations with direct retailer deep links."
    },
    {
      icon: <TrendingDown className="w-5 h-5 text-emerald-500" />,
      title: "30-Day Price Trend Tracking",
      desc: "Visualize historical price fluctuations and buy when deals hit their 30-day historical lowest price."
    },
    {
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      title: "Instant Price Drop Alerts",
      desc: "Set target prices on your favorite items and receive automated notifications when prices crash."
    }
  ];

  // Motion variants respecting reduced-motion
  const heroContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0.05 : 0.12
      }
    }
  };

  const heroItemVariants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0.3 }
        : { type: "spring", stiffness: 280, damping: 22 }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans relative overflow-hidden transition-colors">
      
      {/* Ambient background glow effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-400 p-0.5 shadow-lg">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight gradient-text">ShopWiseAI</span>
              <span className="text-[10px] font-semibold tracking-wider text-emerald-500 uppercase block -mt-1">Smart Price Engine</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Dark/Light Mode"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onGetStarted}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>

        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col lg:flex-row items-center justify-between gap-12 text-left relative z-10">
        
        {/* Left Copy with Staggered Motion Reveal */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={heroContainerVariants}
          className="flex-1 space-y-6 max-w-2xl"
        >
          <motion.div variants={heroItemVariants} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span>AI-Powered Multi-Platform Price Intelligence</span>
          </motion.div>

          <motion.h1
            variants={heroItemVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-slate-900 dark:text-white"
          >
            Never Overpay Online Again. <br />
            <span className="gradient-text">Compare Every Store.</span>
          </motion.h1>

          <motion.p
            variants={heroItemVariants}
            className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal"
          >
            ShopWiseAI scans Amazon, Flipkart, Myntra, Croma, and Reliance Digital in real time. Find verified lowest prices, track 30-day price trends, and let our AI Chatbot discover maximum price-spread savings.
          </motion.p>

          <motion.div variants={heroItemVariants} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2 relative">
            {/* Subtle Confetti Burst anchored near CTA button */}
            <PriceConfettiBurst shouldReduceMotion={shouldReduceMotion} />

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onGetStarted}
              className="px-7 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-500/30 transition-all"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold justify-center sm:justify-start">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>No Credit Card Needed • Free Forever</span>
            </div>
          </motion.div>

          {/* Social Proof Tags */}
          <motion.div variants={heroItemVariants} className="pt-6 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center gap-6 text-xs text-slate-500 font-semibold">
            <div><span className="text-indigo-600 dark:text-indigo-400 font-bold">9+</span> Retailers Indexed</div>
            <div><span className="text-emerald-500 font-bold">100%</span> Verified Lowest Prices</div>
            <div><span className="text-purple-500 font-bold">Real-Time</span> Price History</div>
          </motion.div>
        </motion.div>

        {/* Right Animated Floating Spotlights Demo Cards with Staggered Spring Overshoot */}
        <div className="flex-1 w-full max-w-md lg:max-w-lg space-y-4 relative">
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between"
          >
            <span>Live Deal Score Spotlights</span>
            <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Real-Time Sync
            </span>
          </motion.div>

          {dealHighlights.map((deal, idx) => (
            <motion.div
              key={idx}
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 40, scale: 0.9, rotateX: 10 }
              }
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.3, delay: idx * 0.1 }
                  : {
                      type: "spring",
                      stiffness: 260,
                      damping: 18,
                      delay: 0.25 + idx * 0.15
                    }
              }
              whileHover={
                shouldReduceMotion
                  ? {}
                  : { y: -4, scale: 1.02, transition: { duration: 0.2 } }
              }
              className="p-4 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80 shadow-xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {deal.badge}
                </span>
                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" /> Save {deal.savings}
                </span>
              </div>

              <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate mb-2">{deal.title}</h4>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Lowest Price</span>
                  <span className="font-extrabold text-base text-slate-900 dark:text-white">
                    {deal.lowestPrice} <span className="text-[11px] font-semibold text-slate-400">on {deal.store}</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Deal Score</span>
                  <span className="font-black text-sm text-indigo-600 dark:text-indigo-400">{deal.dealScore}/100</span>
                </div>
              </div>
            </motion.div>
          ))}

        </div>

      </section>

      {/* Features Grid */}
      <section className="bg-slate-100/60 dark:bg-slate-900/40 py-16 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Built for Smart Shoppers
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Everything you need to track price drops, inspect product specs, and find maximum price-spread savings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {features.map((feat, idx) => (
              <motion.div
                key={idx}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={shouldReduceMotion ? {} : { y: -3, transition: { duration: 0.2 } }}
                className="p-6 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80 shadow-md space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {feat.icon}
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{feat.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>ShopWiseAI — Multi-Platform Shopping Comparison Engine</p>
          <p>Amazon • Flipkart • Myntra • Reliance • Croma • Snapdeal • Meesho</p>
        </div>
      </footer>

    </div>
  );
}
