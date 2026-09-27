import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Search, Sparkles, Moon, Sun, Monitor, User, Bell, LogOut, Edit3, Check, Bookmark, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onSearch, currentView, setCurrentView }) {
  const { theme, setTheme } = useTheme();
  const { user, setIsAuthModalOpen, setIsWatchlistOpen, updateDisplayName, logout } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');

  const profileRef = useRef(null);
  const themeRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
      if (currentView !== 'dashboard') setCurrentView('dashboard');
    }
  };

  const handleSaveName = async (e) => {
    e.preventDefault();
    if (nameInput.trim()) {
      await updateDisplayName(nameInput.trim());
      setIsEditingName(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setCurrentView('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-400 p-0.5 shadow-lg group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight gradient-text">ShopWiseAI</span>
            <span className="text-[10px] font-semibold tracking-wider text-emerald-500 uppercase block -mt-1">Free AI Comparison</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl hidden md:block">
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Paste product URL (Amazon, Flipkart...) or product name..."
              className="w-full pl-10 pr-24 py-2 rounded-full text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-full flex items-center gap-1 transition-colors"
            >
              <span>Compare</span>
            </button>
          </div>
        </form>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          
          {/* View Switcher Buttons */}
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              currentView === 'dashboard'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Deals Matrix</span>
          </button>

          {/* Wishlist Header Button */}
          <button
            onClick={() => setIsWatchlistOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            title="Open Saved Wishlist"
          >
            <Bell className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Wishlist</span>
          </button>

          {/* Theme Dropdown Toggle */}
          <div ref={themeRef} className="relative">
            <button
              onClick={() => { setShowThemeMenu(!showThemeMenu); setShowProfileMenu(false); }}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme Mode"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-36 glass-card p-1.5 z-50 text-xs shadow-2xl">
                <button
                  onClick={() => { setTheme('light'); setShowThemeMenu(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" /> Light Mode
                </button>
                <button
                  onClick={() => { setTheme('dark'); setShowThemeMenu(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400" /> Dark Mode
                </button>
                <button
                  onClick={() => { setTheme('system'); setShowThemeMenu(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <Monitor className="w-3.5 h-3.5 text-emerald-400" /> System Mode
                </button>
              </div>
            )}
          </div>

          {/* Auth State Button & User Profile Dropdown (Task 4) */}
          {user ? (
            <div ref={profileRef} className="relative pl-2 border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={() => { setShowProfileMenu(!showProfileMenu); setShowThemeMenu(false); setNameInput(user.name); }}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Open Profile Menu"
              >
                <img src={user.avatar_url} alt={user.name} className="w-7 h-7 rounded-full border border-indigo-500 object-cover" />
                <span className="font-bold text-xs hidden lg:inline max-w-[100px] truncate text-slate-800 dark:text-slate-200">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 glass-card p-3 z-50 text-xs shadow-2xl text-left space-y-3">
                  {/* User Profile Header */}
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
                    <img src={user.avatar_url} alt={user.name} className="w-10 h-10 rounded-full border border-indigo-500 object-cover" />
                    <div className="flex-1 truncate">
                      {!isEditingName ? (
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate block">{user.name}</span>
                          <button
                            onClick={() => setIsEditingName(true)}
                            className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
                            title="Edit Display Name"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleSaveName} className="flex items-center gap-1">
                          <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            className="w-full px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs border border-indigo-500 text-slate-900 dark:text-white focus:outline-none"
                            autoFocus
                          />
                          <button type="submit" className="p-1 text-emerald-500 hover:text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      )}
                      <span className="text-[10px] text-slate-400 truncate block">
                        {user.email || user.phone || 'Verified Account'}
                      </span>
                    </div>
                  </div>

                  {/* Profile Menu Items */}
                  <div className="space-y-1">
                    <button
                      onClick={() => { setIsWatchlistOpen(true); setShowProfileMenu(false); }}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                    >
                      <span className="flex items-center gap-2">
                        <Bookmark className="w-3.5 h-3.5 text-indigo-400" /> Saved Wishlist
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold">View</span>
                    </button>

                    <button
                      onClick={() => { setIsWatchlistOpen(true); setShowProfileMenu(false); }}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                    >
                      <span className="flex items-center gap-2">
                        <Bell className="w-3.5 h-3.5 text-amber-400" /> Price Drop Alerts
                      </span>
                    </button>
                  </div>

                  {/* Explicit Logout Item */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                    <button
                      onClick={() => { logout(); setShowProfileMenu(false); }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-red-500/10 text-red-500 font-bold transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs rounded-full flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all"
            >
              <User className="w-3.5 h-3.5" /> Sign In
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
