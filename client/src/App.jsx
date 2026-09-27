import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import WatchlistModal from './components/WatchlistModal';
import ChatWidget from './components/ChatWidget';
import Dashboard from './pages/Dashboard';
import AssistantPage from './pages/AssistantPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import { searchProduct, getProductComparison } from './services/api';

function MainAppContent() {
  const { user, setIsAuthModalOpen, pendingAction, setPendingAction } = useAuth();
  const [authView, setAuthView] = useState('landing'); // 'landing' | 'login'
  const [currentView, setCurrentView] = useState('dashboard');
  const [searchResult, setSearchResult] = useState(null);

  // Force document title & favicon update to clear browser tab cache
  useEffect(() => {
    document.title = "ShopWiseAI — Multi-Platform Price Comparison Assistant";
    
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = '/favicon.svg';

    // Parse URL query parameter ?product=<id> for deep linking
    const urlParams = new URLSearchParams(window.location.search);
    const prodParam = urlParams.get('product');
    if (prodParam && user) {
      executeCompare(prodParam);
    }
  }, [user]);

  const executeSearch = async (query) => {
    try {
      const res = await searchProduct(query);
      if (res.status === 'success' && res.product) {
        setSearchResult(res.product);
        if (currentView !== 'dashboard') setCurrentView('dashboard');
        if (res.product.id) {
          window.history.pushState({}, '', `?product=${encodeURIComponent(res.product.id)}`);
        }
      }
    } catch (e) {
      console.error("Global search error:", e);
    }
  };

  const executeCompare = async (productId) => {
    try {
      const res = await getProductComparison(productId);
      if (res.status === 'success' && res.product) {
        setSearchResult(res.product);
        setCurrentView('dashboard');
        window.history.pushState({}, '', `?product=${encodeURIComponent(productId)}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Execute pending query after user logs in
  useEffect(() => {
    if (user && pendingAction) {
      if (pendingAction.type === 'search') {
        executeSearch(pendingAction.query);
      } else if (pendingAction.type === 'compare') {
        executeCompare(pendingAction.productId);
      }
      setPendingAction(null);
    }
  }, [user, pendingAction]);

  const handleGlobalSearch = async (query) => {
    if (!user) {
      setPendingAction({ type: 'search', query });
      setIsAuthModalOpen(true);
      return;
    }
    await executeSearch(query);
  };

  const handleSelectProduct = async (productId) => {
    if (!user) {
      setPendingAction({ type: 'compare', productId });
      setIsAuthModalOpen(true);
      return;
    }
    await executeCompare(productId);
  };

  // 1. Unauthenticated Flow: Landing Page -> Login Page
  if (!user) {
    if (authView === 'login') {
      return (
        <LoginPage
          onBackToHome={() => setAuthView('landing')}
        />
      );
    }
    return (
      <LandingPage
        onGetStarted={() => setAuthView('login')}
      />
    );
  }

  // 2. Authenticated Flow: Full App Dashboard & Assistant
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative">
      
      {/* Top Navigation */}
      <Navbar
        onSearch={handleGlobalSearch}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      {/* Main Routing Views */}
      <main className="flex-1">
        {currentView === 'dashboard' ? (
          <Dashboard searchResult={searchResult} setSearchResult={setSearchResult} />
        ) : (
          <AssistantPage setSearchResult={setSearchResult} setCurrentView={setCurrentView} />
        )}
      </main>

      {/* Bottom-Right Floating AI Assistant Widget */}
      <ChatWidget onSelectProduct={handleSelectProduct} />

      {/* Modals */}
      <AuthModal />
      <WatchlistModal />

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>ShopWiseAI — Multi-Platform Shopping Comparison Engine</p>
          <p className="flex items-center gap-2">
            <span>Supported: Amazon • Flipkart • Myntra • Reliance • Croma • Snapdeal • Meesho • Tata CLIQ • Ajio</span>
          </p>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MainAppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
