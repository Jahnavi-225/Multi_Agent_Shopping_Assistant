import React from 'react';
import ChatBot from '../components/ChatBot';
import { getProductComparison } from '../services/api';

export default function AssistantPage({ setSearchResult, setCurrentView }) {
  const handleSelectProduct = async (productId) => {
    try {
      const res = await getProductComparison(productId);
      if (res.status === 'success' && res.product) {
        setSearchResult(res.product);
        setCurrentView('dashboard');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      <div className="text-center max-w-2xl mx-auto mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          RAG AI Shopping Assistant
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Ask complex shopping questions, request price comparisons across Amazon, Flipkart, Myntra, Reliance & Croma, and click deep links to navigate instantly.
        </p>
      </div>

      <ChatBot onSelectProduct={handleSelectProduct} isFullPage={true} />
    </div>
  );
}
